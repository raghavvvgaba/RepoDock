"use client";

import { useState } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AIChat, type AIChatMessage } from "~/components/ui/ai-chat";
import { Button } from "~/components/ui/button";
import { ChatInputBox } from "~/components/ui/chat-input-box";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { parseSseFrames } from "~/lib/sse";

type AgentResponse =
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

type ProjectChatWorkspaceProps = {
  agentAction: string;
  clearChatAction: string;
  initialMessages: AIChatMessage[];
  onRunFinished: () => void;
  sessionId: string | null;
};

const MAX_WORKING_UPDATES = 5;
const workingMessageId = "project-working-message";

function buildWorkingMessage(updates: string[]): AIChatMessage {
  return {
    body: updates.join("\n"),
    id: workingMessageId,
    isThinking: true,
    role: "assistant",
    tone: "default",
  };
}

function removeWorkingMessage(messages: AIChatMessage[]) {
  return messages.filter((message) => message.id !== workingMessageId);
}

export function ProjectChatWorkspace({
  agentAction,
  clearChatAction,
  initialMessages,
  onRunFinished,
  sessionId,
}: ProjectChatWorkspaceProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [instruction, setInstruction] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const hasMessages = messages.some((message) => !message.isThinking);

  function pushWorkingUpdate(message: string) {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    setMessages((current) => {
      const existing = current.find((item) => item.id === workingMessageId);
      const existingUpdates = existing?.body
        ? existing.body.split("\n").filter(Boolean)
        : [];
      const nextWorkingMessage = buildWorkingMessage(
        [...existingUpdates, trimmedMessage].slice(-MAX_WORKING_UPDATES),
      );

      return existing
        ? current.map((item) =>
            item.id === workingMessageId ? nextWorkingMessage : item,
          )
        : [...current, nextWorkingMessage];
    });
  }

  async function readAgentStream(response: Response): Promise<AgentResponse> {
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

        if (parsedEvent.type === "progress") {
          pushWorkingUpdate(parsedEvent.message);
        } else if (parsedEvent.type === "final") {
          return parsedEvent.result;
        } else {
          return { message: parsedEvent.message, status: "failed" };
        }
      }
    }

    throw new Error("The sandbox agent stream ended before a final response.");
  }

  async function handleRunAgent() {
    const trimmedInstruction = instruction.trim();

    if (!trimmedInstruction || !sessionId || isRunning) return;

    const userMessage: AIChatMessage = {
      body: trimmedInstruction,
      id: `workspace-user-${Date.now()}`,
      role: "user",
    };

    setIsRunning(true);
    setMessages((current) => [
      ...current,
      userMessage,
      buildWorkingMessage(["Starting workspace run..."]),
    ]);

    try {
      const response = await fetch(agentAction, {
        body: JSON.stringify({ instruction: trimmedInstruction, sessionId }),
        headers: {
          Accept: "text/event-stream, application/json",
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const contentType = response.headers.get("Content-Type") ?? "";
      const result = contentType.includes("text/event-stream")
        ? await readAgentStream(response)
        : ((await response.json()) as AgentResponse);

      if (!response.ok || result.status === "failed") {
        setMessages((current) => [
          ...removeWorkingMessage(current),
          {
            body:
              result.message ??
              "The sandbox agent could not finish this request. The workspace is still intact.",
            id: `workspace-error-${Date.now()}`,
            role: "assistant",
            tone: "error",
          },
        ]);
        return;
      }

      setInstruction("");
      const fallbackAssistant: AIChatMessage = {
        body: result.clarificationQuestion
          ? `${result.message}\n\nClarification needed: ${result.clarificationQuestion}`
          : result.message,
        id: `workspace-assistant-${Date.now()}`,
        role: "assistant",
        tone: result.status === "completed" ? "success" : "warning",
      };
      const nextMessages = result.messages?.length
        ? result.messages
        : [userMessage, fallbackAssistant];

      setMessages((current) => [
        ...removeWorkingMessage(current).filter(
          (message) => message.id !== userMessage.id,
        ),
        ...nextMessages,
      ]);
    } catch {
      setMessages((current) => [
        ...removeWorkingMessage(current),
        {
          body: "The sandbox agent could not finish this request. The workspace is still intact.",
          id: `workspace-error-${Date.now()}`,
          role: "assistant",
          tone: "error",
        },
      ]);
    } finally {
      setIsRunning(false);
      onRunFinished();
    }
  }

  async function handleClearChat() {
    if (!hasMessages || isClearing || isRunning) return;
    setIsClearing(true);

    try {
      const response = await fetch(clearChatAction, {
        headers: { Accept: "application/json" },
        method: "DELETE",
      });

      if (!response.ok) {
        toast.error("Workspace conversation could not be cleared.");
        return;
      }

      setMessages([]);
      setIsClearDialogOpen(false);
      toast.success("Workspace conversation cleared.");
    } catch {
      toast.error("Workspace conversation could not be cleared.");
    } finally {
      setIsClearing(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-border px-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Agent channel
          </p>
          <p className="text-xs text-foreground">
            {sessionId ? "Connected to repository workspace" : "Start the workspace to run the agent"}
          </p>
        </div>
        <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
          <Button
            className="h-7 rounded-none px-2 text-[10px]"
            disabled={!hasMessages || isClearing || isRunning}
            onClick={() => setIsClearDialogOpen(true)}
            type="button"
            variant="ghost"
          >
            {isClearing ? (
              <LoaderCircle className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="mr-1 h-3 w-3" />
            )}
            Clear
          </Button>
          <DialogContent className="rounded-none border-border" showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Clear workspace conversation?</DialogTitle>
              <DialogDescription>
                This removes the saved conversation. Repository files, sandbox state,
                and previews are not changed.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button disabled={isClearing} type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                disabled={isClearing}
                onClick={handleClearChat}
                type="button"
                variant="destructive"
              >
                Clear conversation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <AIChat className="min-h-0 border-0" fullBleed messages={messages}>
        <ChatInputBox
          accessBlocked={!sessionId}
          instruction={instruction}
          isPreparing={isRunning}
          onInstructionChange={setInstruction}
          onPrepareEdit={handleRunAgent}
        />
      </AIChat>
    </div>
  );
}
