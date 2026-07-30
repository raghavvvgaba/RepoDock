import { describe, expect, it } from "vitest";

import type { AIChatMessage } from "~/components/ui/ai-chat";
import {
  appendAgentWorkingUpdate,
  buildAgentFallbackMessage,
  buildAgentWorkingMessage,
  readAgentResponse,
  removeAgentWorkingMessage,
} from "../agent-chat";

describe("agent chat helpers", () => {
  it("keeps only the five most recent progress updates", () => {
    let messages: AIChatMessage[] = [
      buildAgentWorkingMessage("working", ["first"]),
    ];

    for (const update of ["second", "third", "fourth", "fifth", "sixth"]) {
      messages = appendAgentWorkingUpdate(messages, "working", update);
    }

    expect(messages).toEqual([
      buildAgentWorkingMessage("working", [
        "second",
        "third",
        "fourth",
        "fifth",
        "sixth",
      ]),
    ]);
    expect(removeAgentWorkingMessage(messages, "working")).toEqual([]);
  });

  it("builds completed and blocked fallback messages", () => {
    expect(
      buildAgentFallbackMessage(
        { message: "Done", status: "completed" },
        "assistant-1",
      ),
    ).toMatchObject({ body: "Done", id: "assistant-1", tone: "success" });

    expect(
      buildAgentFallbackMessage(
        {
          clarificationQuestion: "Which route?",
          message: "I need more context.",
          status: "blocked",
        },
        "assistant-2",
      ),
    ).toMatchObject({
      body: "I need more context.\n\nClarification needed: Which route?",
      id: "assistant-2",
      tone: "warning",
    });
  });

  it("reads progress and the final result from an SSE response", async () => {
    const encoder = new TextEncoder();
    const response = new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              'event: progress\ndata: {"type":"progress","message":"Reading files"}\n\n',
            ),
          );
          controller.enqueue(
            encoder.encode(
              'event: final\ndata: {"type":"final","result":{"status":"completed","message":"Done"}}\n\n',
            ),
          );
          controller.close();
        },
      }),
      { headers: { "Content-Type": "text/event-stream" } },
    );
    const progress: string[] = [];

    await expect(
      readAgentResponse(response, (message) => progress.push(message)),
    ).resolves.toEqual({ message: "Done", status: "completed" });
    expect(progress).toEqual(["Reading files"]);
  });

  it("reads JSON validation failures without requiring a stream", async () => {
    const response = Response.json(
      { message: "Start the sandbox first.", status: "failed" },
      { status: 400 },
    );

    await expect(readAgentResponse(response, () => undefined)).resolves.toEqual({
      message: "Start the sandbox first.",
      status: "failed",
    });
  });
});
