import type { AIChatMessage } from "~/components/ui/ai-chat";
import { parseSseFrames } from "~/lib/sse";

export type AgentResponse =
  | {
      clarificationQuestion?: string;
      message: string;
      messages?: AIChatMessage[];
      status: "blocked" | "completed";
    }
  | {
      message?: string;
      status: "failed";
    };

type AgentStreamEvent =
  | { message: string; type: "progress" }
  | { result: AgentResponse; type: "final" }
  | { message: string; type: "error" };

const MAX_WORKING_UPDATES = 5;

export function buildAgentWorkingMessage(
  id: string,
  updates: string[],
): AIChatMessage {
  return {
    body: updates.join("\n"),
    id,
    isThinking: true,
    role: "assistant",
    tone: "default",
  };
}

export function appendAgentWorkingUpdate(
  messages: AIChatMessage[],
  workingMessageId: string,
  message: string,
) {
  const trimmedMessage = message.trim();
  if (!trimmedMessage) return messages;

  const existing = messages.find((item) => item.id === workingMessageId);
  const existingUpdates = existing?.body
    ? existing.body.split("\n").filter(Boolean)
    : [];
  const nextMessage = buildAgentWorkingMessage(
    workingMessageId,
    [...existingUpdates, trimmedMessage].slice(-MAX_WORKING_UPDATES),
  );

  return existing
    ? messages.map((item) =>
        item.id === workingMessageId ? nextMessage : item,
      )
    : [...messages, nextMessage];
}

export function removeAgentWorkingMessage(
  messages: AIChatMessage[],
  workingMessageId: string,
) {
  return messages.filter((message) => message.id !== workingMessageId);
}

export function buildAgentFallbackMessage(
  result: Extract<AgentResponse, { status: "blocked" | "completed" }>,
  id: string,
): AIChatMessage {
  return {
    body: result.clarificationQuestion
      ? `${result.message}\n\nClarification needed: ${result.clarificationQuestion}`
      : result.message,
    id,
    role: "assistant",
    tone: result.status === "completed" ? "success" : "warning",
  };
}

export async function readAgentResponse(
  response: Response,
  onProgress: (message: string) => void,
): Promise<AgentResponse> {
  const contentType = response.headers.get("Content-Type") ?? "";

  if (!contentType.includes("text/event-stream")) {
    return (await response.json()) as AgentResponse;
  }

  if (!response.body) {
    throw new Error("The sandbox agent did not return a stream.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parsed = parseSseFrames(buffer);
    buffer = parsed.remaining;

    for (const event of parsed.events) {
      const parsedEvent = JSON.parse(event.data) as AgentStreamEvent;

      switch (parsedEvent.type) {
        case "progress":
          onProgress(parsedEvent.message);
          break;
        case "final":
          return parsedEvent.result;
        case "error":
          return { message: parsedEvent.message, status: "failed" };
      }
    }
  }

  throw new Error("The sandbox agent stream ended before a final response.");
}
