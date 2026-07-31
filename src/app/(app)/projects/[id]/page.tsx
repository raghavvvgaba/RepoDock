import { notFound } from "next/navigation";

import { AppShell } from "~/components/app-shell";
import { ProjectWorkspace } from "~/components/project-workspace";
import { requireCurrentAuth } from "~/server/auth/session";
import { getProjectWorkspacePageData } from "~/server/projects";

type ProjectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const { userId } = await requireCurrentAuth(`/projects/${id}`);
  const workspaceData = await getProjectWorkspacePageData(userId, id);

  if (workspaceData.notFound) {
    notFound();
  }

  return (
    <AppShell
      compactHeader
      contentWidth="full"
      fullHeight
      title={`${workspaceData.project.repoOwner}/${workspaceData.project.repoName}`}
    >
      <ProjectWorkspace
        initialMessages={workspaceData.messages}
        project={workspaceData.project}
      />
    </AppShell>
  );
}
