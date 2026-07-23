import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity,
  ChevronLeft,
  Clock,
  ExternalLink,
  MessageSquare,
  ShieldAlert,
  Terminal,
} from "lucide-react";

import { AppShell } from "~/components/app-shell";
import { CreateIssueDialog } from "~/components/create-issue-dialog";
import { ProjectIssuesRefreshOnReturn } from "~/components/project-issues-refresh-on-return";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { env } from "~/env";
import { getAuth } from "~/server/auth/session";
import { getProjectIssuesPageData } from "~/server/projects";

type ProjectIssuesPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectIssuesPage({ params }: ProjectIssuesPageProps) {
  const { userId } = await getAuth();
  const { id } = await params;
  const projectData = await getProjectIssuesPageData(userId!, id);

  if (projectData.notFound) notFound();

  const { issuesResult, project } = projectData;

  return (
    <AppShell compactHeader description="" title="Repository issues">
      <ProjectIssuesRefreshOnReturn projectId={project.id} />
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
          <div className="flex items-center gap-3">
            <Button asChild className="h-9 rounded-none px-3 text-xs" variant="outline">
              <Link href={`/projects/${project.id}`}>
                <ChevronLeft className="mr-1.5 h-4 w-4" />
                Workspace
              </Link>
            </Button>
            <div>
              <h1 className="text-base font-semibold">
                {project.repoOwner}/{project.repoName}
              </h1>
              <p className="text-xs text-muted-foreground">GitHub issue browser</p>
            </div>
          </div>
          {issuesResult.status === "ok" ? (
            <CreateIssueDialog projectId={project.id} />
          ) : null}
        </div>

        {issuesResult.status === "missing_access" ? (
          <Alert variant="destructive" className="rounded-none border-amber-500/20 bg-amber-500/10 text-amber-500">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>GitHub access required</AlertTitle>
            <AlertDescription className="mt-3 space-y-3">
              <p>The GitHub App installation is missing or revoked for this repository.</p>
              <Button asChild className="h-9 rounded-none text-xs">
                <a href={env.GITHUB_APP_INSTALL_URL} rel="noreferrer" target="_blank">
                  Grant repository access
                </a>
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {issuesResult.status === "error" ? (
          <Alert variant="destructive" className="rounded-none">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>GitHub sync failed</AlertTitle>
            <AlertDescription>
              Repository metadata is preserved, but the issue feed is unavailable.
            </AlertDescription>
          </Alert>
        ) : null}

        {issuesResult.status === "ok" && issuesResult.issues.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed border-border py-16 text-center">
            <Terminal className="mb-3 h-7 w-7 text-muted-foreground/40" />
            <p className="text-sm font-medium">No open issues</p>
            <p className="mt-1 text-xs text-muted-foreground">
              The project workspace remains available without an issue.
            </p>
          </div>
        ) : null}

        {issuesResult.status === "ok" && issuesResult.issues.length > 0 ? (
          <div className="grid gap-px border border-border bg-border">
            {issuesResult.issues.map((issue) => (
              <article className="group flex flex-col gap-4 bg-card p-5 transition-colors hover:bg-muted/40 md:flex-row md:items-center" key={issue.id}>
                <Link className="min-w-0 flex-1" href={`/projects/${project.id}/issues/${issue.number}`}>
                  <div className="mb-3 flex items-center gap-2">
                    <Badge className="rounded-none border-emerald-500/20 bg-emerald-500/10 text-emerald-600">
                      Open
                    </Badge>
                    <span className="font-mono text-[10px] text-muted-foreground">#{issue.number}</span>
                  </div>
                  <h2 className="text-sm font-semibold group-hover:text-primary">{issue.title}</h2>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5" />{issue.author}</span>
                    <span className="flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5" />{issue.comments} replies</span>
                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />Updated {new Date(issue.updatedAt).toLocaleDateString()}</span>
                  </div>
                </Link>
                <Button asChild className="h-8 rounded-none px-3 text-xs" variant="outline">
                  <a href={issue.url} rel="noreferrer" target="_blank">
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                    GitHub
                  </a>
                </Button>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
