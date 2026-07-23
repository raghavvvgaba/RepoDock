import { NextResponse } from "next/server";

import { getAuth } from "~/server/auth/session";
import { getOwnedProject } from "~/server/projects";
import { clearWorkspaceMessages } from "~/server/workspace-chat";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { userId } = await getAuth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const project = await getOwnedProject(id, userId);

  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const result = await clearWorkspaceMessages({
    projectId: project.id,
    userId,
  });

  return NextResponse.json({
    deletedCount: result.deletedCount,
    ok: true,
  });
}
