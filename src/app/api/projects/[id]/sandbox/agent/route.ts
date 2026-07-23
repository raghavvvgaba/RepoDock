import { NextResponse } from "next/server";

import { runSandboxAgent } from "~/server/sandbox/agent";
import { formatSseEvent } from "~/server/sandbox/agent-stream";
import {
  getOwnedSandboxProject,
  readJsonObject,
  readStringField,
  validateProjectSandboxSession,
  type ProjectSandboxRouteContext,
} from "~/server/sandbox/route-helpers";
import {
  appendWorkspaceMessages,
  getOrCreateProjectWorkspace,
  type WorkspaceChatMessage,
} from "~/server/workspace-chat";

export const runtime = "nodejs";
export const maxDuration = 120;

function jsonFailure(message: string, status: number) {
  return NextResponse.json(
    {
      message,
      status: "failed" as const,
    },
    { status },
  );
}

function buildAgentSummary(result: Awaited<ReturnType<typeof runSandboxAgent>>) {
  const clarification = result.clarificationQuestion
    ? `\n\nClarification needed: ${result.clarificationQuestion}`
    : "";

  switch (result.status) {
    case "completed":
      return {
        body: result.message,
        tone: "success" as const,
      };
    case "blocked":
      return {
        body: `${result.message}${clarification}`,
        tone: result.failureCode ? ("error" as const) : ("warning" as const),
      };
    default:
      return {
        body: result.message,
        tone: "error" as const,
      };
  }
}

function createAgentStream() {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array> | undefined;

  const stream = new ReadableStream<Uint8Array>({
    start(streamController) {
      controller = streamController;
    },
  });

  return {
    close() {
      controller?.close();
    },
    send(event: Parameters<typeof formatSseEvent>[0]) {
      controller?.enqueue(encoder.encode(formatSseEvent(event)));
    },
    stream,
  };
}

export async function POST(
  request: Request,
  context: ProjectSandboxRouteContext,
) {
  const access = await getOwnedSandboxProject(request, context);

  if ("response" in access) {
    const status = access.response!.status;
    return status === 401
      ? jsonFailure("Sign in to continue using the sandbox agent.", 401)
      : jsonFailure("This project could not be found.", 404);
  }

  const body = await readJsonObject(request);
  const sessionId = readStringField(body, "sessionId");
  const instruction = readStringField(body, "instruction");

  if (!sessionId) {
    return jsonFailure(
      "Start the sandbox first so RepoDock has a live workspace.",
      400,
    );
  }

  const sessionError = await validateProjectSandboxSession(access, sessionId);

  if (sessionError) {
    return jsonFailure(
      "This sandbox session is no longer available. Start a fresh sandbox and try again.",
      404,
    );
  }

  if (!instruction) {
    return jsonFailure("Add an instruction before starting the sandbox agent.", 400);
  }

  let workspaceId: string;
  let userMessage: WorkspaceChatMessage;

  try {
    const workspace = await getOrCreateProjectWorkspace({
      projectId: access.project.id,
      userId: access.userId,
    });
    const messages = await appendWorkspaceMessages(workspace.id, [
      {
        body: instruction,
        role: "user",
      },
    ]);
    workspaceId = workspace.id;
    userMessage = messages[0]!;
  } catch (error) {
    console.error("Project workspace message persistence failed:", error);
    return jsonFailure("The workspace conversation could not be saved.", 500);
  }

  const agentStream = createAgentStream();

  void (async () => {
    try {
      const result = await runSandboxAgent(
        {
          projectId: access.project.id,
          repoName: access.project.repoName,
          repoOwner: access.project.repoOwner,
          sessionId,
          userInstruction: instruction,
        },
        {
          onProgress(event) {
            agentStream.send(event);
          },
        },
      );
      const summary = buildAgentSummary(result);
      let persistedMessages: WorkspaceChatMessage[] | undefined;

      try {
        const assistantMessages = await appendWorkspaceMessages(workspaceId, [
          {
            body: summary.body,
            role: "assistant",
            tone: summary.tone,
          },
        ]);
        persistedMessages = [userMessage, ...assistantMessages];
      } catch (error) {
        console.error("Project workspace result persistence failed:", error);
      }

      const { failureCode: _failureCode, ...publicResult } = result;

      if (result.status === "failed") {
        agentStream.send({
          message: result.message,
          type: "error",
        });
        return;
      }

      agentStream.send({
        result: {
          ...publicResult,
          ...(persistedMessages ? { messages: persistedMessages } : {}),
        },
        type: "final",
      });
    } catch (error) {
      console.error("Project workspace agent stream failed:", error);

      try {
        await appendWorkspaceMessages(workspaceId, [
          {
            body: "The sandbox agent could not finish this request.",
            role: "assistant",
            tone: "error",
          },
        ]);
      } catch (persistenceError) {
        console.error("Project workspace failure persistence failed:", persistenceError);
      }

      agentStream.send({
        message: "The sandbox agent could not finish this request.",
        type: "error",
      });
    } finally {
      agentStream.close();
    }
  })();

  return new Response(agentStream.stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
    },
  });
}
