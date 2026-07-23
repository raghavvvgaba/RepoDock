import { db } from "~/server/db";

export type WorkspaceChatMessage = {
  body: string;
  id: string;
  role: "assistant" | "system" | "user";
  tone?: "default" | "error" | "success" | "warning";
};

type NewWorkspaceChatMessage = Omit<WorkspaceChatMessage, "id">;

function toWorkspaceChatMessage(message: {
  body: string;
  id: string;
  role: string;
  tone: string | null;
}): WorkspaceChatMessage {
  return {
    body: message.body,
    id: message.id,
    role: message.role as WorkspaceChatMessage["role"],
    tone: message.tone
      ? (message.tone as NonNullable<WorkspaceChatMessage["tone"]>)
      : undefined,
  };
}

export async function getOrCreateProjectWorkspace(input: {
  projectId: string;
  userId: string;
}) {
  return db.projectWorkspace.upsert({
    create: {
      projectId: input.projectId,
      userId: input.userId,
    },
    update: {},
    where: {
      projectId: input.projectId,
    },
  });
}

export async function getWorkspaceMessages(workspaceId: string) {
  const messages = await db.workspaceMessage.findMany({
    orderBy: {
      createdAt: "asc",
    },
    where: {
      workspaceId,
    },
  });

  return messages.map(toWorkspaceChatMessage);
}

export async function appendWorkspaceMessages(
  workspaceId: string,
  messages: NewWorkspaceChatMessage[],
) {
  const createdMessages = await db.$transaction(
    messages.map((message) =>
      db.workspaceMessage.create({
        data: {
          body: message.body,
          role: message.role,
          tone: message.tone,
          workspaceId,
        },
      }),
    ),
  );

  return createdMessages.map(toWorkspaceChatMessage);
}

export async function clearWorkspaceMessages(input: {
  projectId: string;
  userId: string;
}) {
  const workspace = await db.projectWorkspace.findFirst({
    select: {
      id: true,
    },
    where: {
      projectId: input.projectId,
      userId: input.userId,
    },
  });

  if (!workspace) {
    return { deletedCount: 0 };
  }

  const result = await db.workspaceMessage.deleteMany({
    where: {
      workspaceId: workspace.id,
    },
  });

  return { deletedCount: result.count };
}
