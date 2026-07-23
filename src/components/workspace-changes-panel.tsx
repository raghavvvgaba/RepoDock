"use client";

import { useCallback, useEffect, useState } from "react";
import { FileCode2, LoaderCircle, RefreshCw, TriangleAlert } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import type { SandboxChangesSnapshot } from "~/server/sandbox/types";

type ChangesResponse =
  | { changes: SandboxChangesSnapshot; ok: true }
  | { error: string; ok: false };

type WorkspaceChangesPanelProps = {
  changesAction: string;
  refreshToken: number;
  sessionId: string | null;
};

const statusStyles = {
  added: "border-emerald-500/30 text-emerald-600",
  conflicted: "border-red-500/30 text-red-600",
  deleted: "border-red-500/30 text-red-600",
  modified: "border-amber-500/30 text-amber-600",
  renamed: "border-cyan-500/30 text-cyan-600",
  untracked: "border-blue-500/30 text-blue-600",
} as const;

export function WorkspaceChangesPanel({
  changesAction,
  refreshToken,
  sessionId,
}: WorkspaceChangesPanelProps) {
  const [snapshot, setSnapshot] = useState<SandboxChangesSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"files" | "diff">("files");

  const loadChanges = useCallback(async () => {
    if (!sessionId) {
      setSnapshot(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const url = new URL(changesAction, window.location.origin);
      url.searchParams.set("sessionId", sessionId);
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
      });
      const result = (await response.json()) as ChangesResponse;

      if (!response.ok || !result.ok) {
        throw new Error(result.ok ? "changes_unavailable" : result.error);
      }

      setSnapshot(result.changes);
    } catch {
      setError("Repository changes could not be read from the workspace.");
    } finally {
      setIsLoading(false);
    }
  }, [changesAction, sessionId]);

  useEffect(() => {
    void loadChanges();
  }, [loadChanges, refreshToken]);

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-muted/10">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-background px-3">
        <div className="flex h-full items-end gap-1">
          {(["files", "diff"] as const).map((view) => (
            <button
              className={cn(
                "relative h-full px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground",
                activeView === view &&
                  "text-foreground after:absolute after:inset-x-2 after:bottom-0 after:h-px after:bg-foreground",
              )}
              key={view}
              onClick={() => setActiveView(view)}
              type="button"
            >
              {view === "files" ? `Changed files${snapshot ? ` · ${snapshot.files.length}` : ""}` : "Diff"}
            </button>
          ))}
        </div>
        <Button
          className="h-7 w-7 rounded-none p-0"
          disabled={!sessionId || isLoading}
          onClick={() => void loadChanges()}
          type="button"
          variant="ghost"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
          <span className="sr-only">Refresh changes</span>
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {!sessionId ? (
          <EmptyState
            detail="Start the cloud workspace to inspect its Git working tree."
            title="No active workspace"
          />
        ) : isLoading && !snapshot ? (
          <div className="flex h-full items-center justify-center gap-2 text-xs text-muted-foreground">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Reading Git state
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center">
            <TriangleAlert className="h-5 w-5 text-destructive" />
            <p className="text-xs text-destructive">{error}</p>
            <Button onClick={() => void loadChanges()} size="sm" variant="outline">
              Retry
            </Button>
          </div>
        ) : !snapshot || snapshot.files.length === 0 ? (
          <EmptyState
            detail="Agent and human edits will appear here as soon as the working tree changes."
            title="Working tree clean"
          />
        ) : activeView === "files" ? (
          <div className="divide-y divide-border">
            {snapshot.files.map((file) => (
              <div className="flex items-start gap-3 px-4 py-3" key={`${file.status}:${file.path}`}>
                <FileCode2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="break-all font-mono text-[11px] text-foreground">
                    {file.path}
                  </p>
                  {file.previousPath ? (
                    <p className="mt-1 break-all font-mono text-[10px] text-muted-foreground">
                      from {file.previousPath}
                    </p>
                  ) : null}
                </div>
                <Badge
                  className={cn(
                    "rounded-none bg-transparent text-[9px] uppercase tracking-wider",
                    statusStyles[file.status],
                  )}
                  variant="outline"
                >
                  {file.status}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="min-h-full bg-[#0b0d10] text-[#d7dae0]">
            {snapshot.truncated ? (
              <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-[10px] text-amber-300">
                Diff truncated at 1 MiB. Use the repository workspace for the complete output.
              </div>
            ) : null}
            <pre className="overflow-x-auto whitespace-pre p-4 font-mono text-[11px] leading-5">
              {snapshot.diff || "No textual diff is available for these changes."}
            </pre>
          </div>
        )}
      </div>
    </section>
  );
}

function EmptyState({ detail, title }: { detail: string; title: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center border border-dashed border-border bg-background">
        <FileCode2 className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="text-xs font-medium text-foreground">{title}</p>
      <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-muted-foreground">
        {detail}
      </p>
    </div>
  );
}
