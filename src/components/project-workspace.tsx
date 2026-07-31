"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ExternalLink, Github } from "lucide-react";

import { ProjectChatWorkspace } from "~/components/project-chat-workspace";
import { SandboxStatusPanel } from "~/components/sandbox-status-panel";
import { Button } from "~/components/ui/button";
import { WorkspaceChangesPanel } from "~/components/workspace-changes-panel";
import type { AIChatMessage } from "~/components/ui/ai-chat";

type ProjectWorkspaceProps = {
  initialMessages: AIChatMessage[];
  project: {
    id: string;
    repoName: string;
    repoOwner: string;
  };
};

export function ProjectWorkspace({
  initialMessages,
  project,
}: ProjectWorkspaceProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [changesRefreshToken, setChangesRefreshToken] = useState(0);
  const sandboxAction = `/api/projects/${project.id}/sandbox`;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto border border-border bg-background shadow-[0_18px_60px_rgba(0,0,0,0.08)] xl:overflow-hidden">
      <div className="flex shrink-0 flex-col border-b border-border bg-background xl:flex-row xl:items-center">
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-3 xl:w-[42%] xl:border-b-0 xl:border-r">
          <Button asChild className="h-8 w-8 rounded-none p-0" variant="ghost">
            <Link href="/projects">
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Back to projects</span>
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Github className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <p className="truncate text-xs font-semibold">
                {project.repoOwner}/{project.repoName}
              </p>
            </div>
            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Project workspace
            </p>
          </div>
          <Button asChild className="h-8 w-8 rounded-none p-0" variant="ghost">
            <a
              href={`https://github.com/${project.repoOwner}/${project.repoName}`}
              rel="noreferrer"
              target="_blank"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="sr-only">Open repository on GitHub</span>
            </a>
          </Button>
        </div>
        <div className="flex min-h-14 min-w-0 flex-1 items-center px-3">
          <SandboxStatusPanel
            checkPreviewAction={`${sandboxAction}/check-preview`}
            heartbeatAction={`${sandboxAction}/heartbeat`}
            onSessionIdChange={setSessionId}
            projectId={project.id}
            restartPreviewAction={`${sandboxAction}/restart-preview`}
            sessionAction={`${sandboxAction}/session`}
            startAction={`${sandboxAction}/start`}
            stopAction={`${sandboxAction}/stop`}
          />
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[42%_58%]">
        <div className="flex min-h-[420px] min-w-0 flex-col border-b border-border xl:min-h-0 xl:border-b-0 xl:border-r">
          <ProjectChatWorkspace
            agentAction={`${sandboxAction}/agent`}
            clearChatAction={`/api/projects/${project.id}/workspace/chat`}
            initialMessages={initialMessages}
            onRunFinished={() => setChangesRefreshToken((token) => token + 1)}
            sessionId={sessionId}
          />
        </div>
        <div className="flex min-h-[360px] min-w-0 flex-col xl:min-h-0">
          <WorkspaceChangesPanel
            changesAction={`${sandboxAction}/changes`}
            refreshToken={changesRefreshToken}
            sessionId={sessionId}
          />
        </div>
      </div>
    </div>
  );
}
