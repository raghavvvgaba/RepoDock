import "dotenv/config";

import { randomUUID } from "node:crypto";

import { Sandbox } from "e2b";

const TEMPLATE_NAME = "gabatools/repodock-opencode-spike";
const PROJECT_DIR = "/home/user/repo";
const OPENCODE_PORT = 4096;
const PROBE_FILE = "PHASE1_OPENCODE_PROBE.txt";
const PROBE_CONTENT = "RepoDock OpenCode Phase 1 verified.";

type OpenCodeSession = {
  id: string;
};

type OpenCodeSessionStatus = {
  type: string;
};

function requireEnv(name: "E2B_API_KEY" | "OPENROUTER_API_KEY" | "OPENROUTER_MODEL") {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required for the OpenCode feasibility check.`);
  }

  return value;
}

function normalizeSandboxUrl(host: string) {
  return host.startsWith("http://") || host.startsWith("https://")
    ? host
    : `https://${host}`;
}

async function waitForOpenCode(baseUrl: string, authorization: string) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < 30_000) {
    try {
      const response = await fetch(`${baseUrl}/global/health`, {
        headers: { Authorization: authorization },
        signal: AbortSignal.timeout(4_000),
      });

      if (response.ok) {
        return (await response.json()) as {
          healthy: boolean;
          version: string;
        };
      }
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error("OpenCode did not become healthy within 30 seconds.");
}

async function verifyServerProtection(baseUrl: string) {
  const response = await fetch(`${baseUrl}/global/health`, {
    signal: AbortSignal.timeout(4_000),
  });

  if (response.status !== 401) {
    throw new Error(
      `OpenCode server accepted an unauthenticated health request (${response.status}).`,
    );
  }
}

async function requestJson<T>(
  baseUrl: string,
  authorization: string,
  path: string,
  init?: RequestInit,
) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok) {
    const details = (await response.text()).slice(0, 500);
    throw new Error(
      `OpenCode ${init?.method ?? "GET"} ${path} failed (${response.status}): ${details}`,
    );
  }

  return (await response.json()) as T;
}

async function waitForSessionIdle(
  baseUrl: string,
  authorization: string,
  sessionId: string,
) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < 30_000) {
    const statuses = await requestJson<
      Record<string, OpenCodeSessionStatus>
    >(baseUrl, authorization, "/session/status");
    const status = statuses[sessionId];

    if (!status || status.type === "idle") {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error("OpenCode session did not become idle within 30 seconds.");
}

async function main() {
  requireEnv("E2B_API_KEY");
  const openRouterApiKey = requireEnv("OPENROUTER_API_KEY");
  const openRouterModel = requireEnv("OPENROUTER_MODEL");
  const serverPassword = randomUUID();
  let sandbox: Sandbox | undefined;

  try {
    sandbox = await Sandbox.create(TEMPLATE_NAME, {
      envs: {
        OPENROUTER_API_KEY: openRouterApiKey,
        OPENCODE_SERVER_PASSWORD: serverPassword,
      },
      timeoutMs: 10 * 60_000,
    });

    await sandbox.commands.run(`mkdir -p ${PROJECT_DIR}`, {
      cwd: "/home/user",
      timeoutMs: 10_000,
    });

    await sandbox.commands.run(
      [
        "git init",
        'git config user.email "phase1@repodock.local"',
        'git config user.name "RepoDock Phase 1"',
        'printf "# RepoDock OpenCode probe\\n" > README.md',
        "git add README.md",
        'git commit -m "Initial probe repository"',
      ].join(" && "),
      { cwd: PROJECT_DIR, timeoutMs: 30_000 },
    );

    await sandbox.files.write(
      `${PROJECT_DIR}/opencode.json`,
      JSON.stringify(
        {
          $schema: "https://opencode.ai/config.json",
          permission: {
            "*": "deny",
            apply_patch: "allow",
            edit: "allow",
            glob: "allow",
            grep: "allow",
            list: "allow",
            read: "allow",
            write: "allow",
          },
        },
        null,
        2,
      ),
    );

    const versionResult = await sandbox.commands.run("opencode --version", {
      cwd: PROJECT_DIR,
      timeoutMs: 10_000,
    });

    await sandbox.commands.run(
      `nohup opencode serve --hostname 0.0.0.0 --port ${OPENCODE_PORT} </dev/null >/tmp/repodock-opencode.log 2>&1 & echo $!`,
      {
        cwd: PROJECT_DIR,
        timeoutMs: 10_000,
      },
    );

    const baseUrl = normalizeSandboxUrl(sandbox.getHost(OPENCODE_PORT));
    const authorization = `Basic ${Buffer.from(
      `opencode:${serverPassword}`,
    ).toString("base64")}`;
    const health = await waitForOpenCode(baseUrl, authorization);
    await verifyServerProtection(baseUrl);
    await sandbox.commands.run("git status --short --untracked-files=normal", {
      cwd: PROJECT_DIR,
      timeoutMs: 30_000,
    });
    const session = await requestJson<OpenCodeSession>(
      baseUrl,
      authorization,
      "/session",
      {
        body: JSON.stringify({ title: "RepoDock Phase 1 probe" }),
        method: "POST",
      },
    );

    await requestJson(
      baseUrl,
      authorization,
      `/session/${session.id}/message`,
      {
        body: JSON.stringify({
          model: {
            modelID: openRouterModel,
            providerID: "openrouter",
          },
          parts: [
            {
              type: "text",
              text: `Create ${PROBE_FILE} with exactly this single line and no other content: ${PROBE_CONTENT.trim()}`,
            },
          ],
        }),
        method: "POST",
      },
    );
    await waitForSessionIdle(baseUrl, authorization, session.id);

    const writtenContent = await sandbox.files.read(
      `${PROJECT_DIR}/${PROBE_FILE}`,
    );
    const gitStatus = await sandbox.commands.run(
      "git status --short --untracked-files=normal",
      {
        cwd: PROJECT_DIR,
        timeoutMs: 30_000,
      },
    );

    if (writtenContent !== PROBE_CONTENT) {
      throw new Error(
        `OpenCode wrote unexpected probe content: ${JSON.stringify(writtenContent)}`,
      );
    }

    if (!gitStatus.stdout.includes(`?? ${PROBE_FILE}`)) {
      throw new Error("The OpenCode probe file was not visible in Git status.");
    }

    console.log(
      JSON.stringify(
        {
          binaryVersion: versionResult.stdout.trim(),
          fileContentVerified: true,
          gitChangeVisible: true,
          health,
          model: openRouterModel,
          serverProtected: true,
          sessionCreated: Boolean(session.id),
          template: TEMPLATE_NAME,
        },
        null,
        2,
      ),
    );
  } finally {
    await sandbox?.kill({ requestTimeoutMs: 30_000 });
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
