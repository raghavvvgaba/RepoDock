import "server-only";

import { sandboxProvider } from "~/server/sandbox/provider";
import type {
  SandboxChangedFile,
  SandboxChangesSnapshot,
} from "~/server/sandbox/types";

const MAX_DIFF_BYTES = 1024 * 1024;
const STATUS_COMMAND = "git status --porcelain=v1 -z --untracked-files=all";
const TRACKED_DIFF_COMMAND = "git diff --no-ext-diff --binary HEAD -- .";

function shellQuote(value: string) {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

function mapStatus(code: string): SandboxChangedFile["status"] {
  if (code === "??") return "untracked";
  if (code.includes("U") || code === "AA" || code === "DD") {
    return "conflicted";
  }
  if (code.includes("R")) return "renamed";
  if (code.includes("D")) return "deleted";
  if (code.includes("A") || code.includes("C")) return "added";
  return "modified";
}

export function parseGitStatus(output: string): SandboxChangedFile[] {
  const fields = output.split("\0");
  const files: SandboxChangedFile[] = [];

  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index];

    if (!field) continue;

    const code = field.slice(0, 2);
    const path = field.slice(3);
    const status = mapStatus(code);

    if (status === "renamed") {
      const previousPath = fields[index + 1];
      index += 1;
      files.push({
        path,
        ...(previousPath ? { previousPath } : {}),
        status,
      });
      continue;
    }

    files.push({ path, status });
  }

  return files.sort((left, right) => left.path.localeCompare(right.path));
}

function assertSuccessfulCommand(
  result: Awaited<ReturnType<typeof sandboxProvider.runRawCommand>>,
  fallback: string,
) {
  if (result.exitCode === 0 || typeof result.exitCode === "undefined") return;
  throw new Error(result.stderr.trim() || result.stdout.trim() || fallback);
}

function capDiff(diff: string) {
  const bytes = Buffer.from(diff, "utf8");

  if (bytes.byteLength <= MAX_DIFF_BYTES) {
    return { diff, truncated: false };
  }

  return {
    diff: bytes.subarray(0, MAX_DIFF_BYTES).toString("utf8"),
    truncated: true,
  };
}

export async function getSandboxChanges(
  sessionId: string,
): Promise<SandboxChangesSnapshot> {
  const statusResult = await sandboxProvider.runRawCommand({
    command: STATUS_COMMAND,
    sessionId,
  });
  assertSuccessfulCommand(statusResult, "Unable to inspect sandbox changes.");

  const files = parseGitStatus(statusResult.stdout);

  if (files.length === 0) {
    return { diff: "", files, truncated: false };
  }

  const trackedDiff = await sandboxProvider.runRawCommand({
    command: TRACKED_DIFF_COMMAND,
    sessionId,
  });
  assertSuccessfulCommand(trackedDiff, "Unable to read the sandbox diff.");

  const diffParts = [trackedDiff.stdout.trimEnd()].filter(Boolean);

  for (const file of files) {
    if (file.status !== "untracked") continue;

    const result = await sandboxProvider.runRawCommand({
      command: `git diff --no-index --binary -- /dev/null ${shellQuote(file.path)}`,
      sessionId,
    });

    if (
      result.exitCode !== 0 &&
      result.exitCode !== 1 &&
      typeof result.exitCode !== "undefined"
    ) {
      throw new Error(
        result.stderr.trim() || `Unable to read the diff for ${file.path}.`,
      );
    }

    if (result.stdout.trim()) diffParts.push(result.stdout.trimEnd());
  }

  return {
    ...capDiff(diffParts.join("\n\n")),
    files,
  };
}
