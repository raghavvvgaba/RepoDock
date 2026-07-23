import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  projectWorkspaceFindFirst: vi.fn(),
  projectWorkspaceUpsert: vi.fn(),
  transaction: vi.fn(),
  workspaceMessageCreate: vi.fn(),
  workspaceMessageDeleteMany: vi.fn(),
  workspaceMessageFindMany: vi.fn(),
}));

vi.mock("~/server/db", () => ({
  db: {
    $transaction: mocks.transaction,
    projectWorkspace: {
      findFirst: mocks.projectWorkspaceFindFirst,
      upsert: mocks.projectWorkspaceUpsert,
    },
    workspaceMessage: {
      create: mocks.workspaceMessageCreate,
      deleteMany: mocks.workspaceMessageDeleteMany,
      findMany: mocks.workspaceMessageFindMany,
    },
  },
}));

const {
  clearWorkspaceMessages,
  getOrCreateProjectWorkspace,
  getWorkspaceMessages,
} = await import("~/server/workspace-chat");

describe("project workspace chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("upserts one workspace by project id", async () => {
    mocks.projectWorkspaceUpsert.mockResolvedValueOnce({ id: "workspace-1" });

    await getOrCreateProjectWorkspace({
      projectId: "project-1",
      userId: "user-1",
    });

    expect(mocks.projectWorkspaceUpsert).toHaveBeenCalledWith({
      create: { projectId: "project-1", userId: "user-1" },
      update: {},
      where: { projectId: "project-1" },
    });
  });

  it("loads durable messages in creation order", async () => {
    mocks.workspaceMessageFindMany.mockResolvedValueOnce([
      {
        body: "Inspect the repository",
        id: "message-1",
        role: "user",
        tone: null,
      },
    ]);

    await expect(getWorkspaceMessages("workspace-1")).resolves.toEqual([
      {
        body: "Inspect the repository",
        id: "message-1",
        role: "user",
        tone: undefined,
      },
    ]);
    expect(mocks.workspaceMessageFindMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "asc" },
      where: { workspaceId: "workspace-1" },
    });
  });

  it("clears only the owned project workspace messages", async () => {
    mocks.projectWorkspaceFindFirst.mockResolvedValueOnce({ id: "workspace-1" });
    mocks.workspaceMessageDeleteMany.mockResolvedValueOnce({ count: 3 });

    await expect(
      clearWorkspaceMessages({ projectId: "project-1", userId: "user-1" }),
    ).resolves.toEqual({ deletedCount: 3 });
    expect(mocks.projectWorkspaceFindFirst).toHaveBeenCalledWith({
      select: { id: true },
      where: { projectId: "project-1", userId: "user-1" },
    });
    expect(mocks.workspaceMessageDeleteMany).toHaveBeenCalledWith({
      where: { workspaceId: "workspace-1" },
    });
  });

  it("treats a missing workspace as an empty clear", async () => {
    mocks.projectWorkspaceFindFirst.mockResolvedValueOnce(null);

    await expect(
      clearWorkspaceMessages({ projectId: "project-1", userId: "user-1" }),
    ).resolves.toEqual({ deletedCount: 0 });
    expect(mocks.workspaceMessageDeleteMany).not.toHaveBeenCalled();
  });
});
