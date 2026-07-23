# Project Workspace Phase 1

## Status

Implemented on 2026-07-22.

This document is subordinate to [01-product-boundary.md](01-product-boundary.md). If the two documents conflict, the product boundary wins.

## Objective

Move RepoDock's primary experience from an issue-centric contribution flow to one persistent, agent-first workspace per imported repository.

After opening a project, an engineer should be able to start or reconnect to its cloud sandbox, give the agent a free-form coding task, follow the agent's activity, inspect the resulting changes, and continue the conversation without first selecting or creating a GitHub issue.

Phase 1 should prove this project-level workflow by reusing the current sandbox and agent foundations. It is not a full IDE or an agent-runtime rewrite.

## Target User Flow

1. The engineer signs in and imports a GitHub repository.
2. The engineer opens the project at `/projects/[id]`.
3. RepoDock loads the repository's persistent workspace.
4. The engineer starts or reconnects to the project's E2B sandbox.
5. The engineer enters an arbitrary coding instruction.
6. RepoDock streams bounded agent activity and the final response.
7. The engineer reviews changed files and a basic diff.
8. When a preview is available, the engineer can open it in a new tab.
9. The engineer can send a follow-up instruction in the same persisted conversation.

GitHub issues may remain available as optional context, but they must not be the entry point or identity of the workspace.

## Phase 1 Product Contract

### One workspace per imported repository

- `/projects/[id]` becomes the project workspace rather than an issue browser.
- The existing ownership rule remains authoritative: only the owning Clerk user may access the project, its sandbox, or its conversation.
- A project has one active cloud sandbox, matching the current `SandboxSession.projectId` uniqueness constraint.
- A project has one durable Phase 1 conversation. Multiple workspaces or task threads are deferred.
- Refreshing the page or reconnecting after a server restart should restore durable chat and sandbox registry state when the underlying E2B sandbox is still available.

### Workspace header

The workspace header should expose:

- repository owner and name
- current sandbox status
- start, stop, and reconnect/recovery controls
- an external GitHub repository link
- an external preview link when a preview is ready

The current `Project` model does not store a branch or default-branch value. Phase 1 must not display invented branch state. A branch indicator can be added after it is backed by sandbox Git state or persisted repository metadata.

### Agent conversation and activity

The main interaction is a free-form coding-task composer, not an issue form.

The workspace should:

- require a live, owned sandbox before starting an agent run
- send the exact user instruction without appending an issue number or fabricated issue context
- stream the current bounded progress messages and replace them with the canonical final response
- persist the user instruction and final assistant response
- support follow-up instructions in the same conversation
- preserve clear blocked, failed, and completed states

Agent progress is transient UI state. User messages and final assistant messages are durable product state.

### Changes review

The engineer should be able to inspect:

- the list of changed repository-relative files
- a basic textual Git diff
- empty, loading, error, and refresh states

Phase 1 is review-only. Editing files directly in the browser is deferred.

Diff and changed-file reads must validate project and sandbox ownership on the server and preserve the existing repository-relative path protections.

### Preview

Phase 1 should expose preview availability and an `Open preview` action that opens the E2B preview in a new tab.

An embedded browser pane is not required for this milestone. The existing preview detection, restart, and recovery behavior can be reused behind the external-link experience.

## Initial Layout

Use a focused two-region workspace:

```text
+------------------------------------------------------------------+
| Repository | Workspace status | Sandbox controls | Preview link  |
+--------------------------------+---------------------------------+
| Agent conversation and         | Changes                         |
| streamed activity              | - Changed files                 |
|                                | - Diff                          |
|                                |                                 |
| Free-form task composer        |                                 |
+--------------------------------+---------------------------------+
```

The exact proportions are an implementation detail. On narrower screens the changes region may stack or use a drawer, but a separate mobile-specific product experience is out of scope.

## Current Foundation to Reuse

### Reuse directly

- Project ownership and loading from `src/server/projects.ts`.
- Project-level sandbox lifecycle routes under `src/app/api/projects/[id]/sandbox`.
- Durable sandbox registry and restore behavior in `src/server/sandbox/session-registry.ts` and `src/server/sandbox/ownership.ts`.
- E2B lifecycle, preview, command, file, and diff operations under `src/server/sandbox`.
- SSE framing and bounded progress behavior from the current issue agent route and `IssueChatWorkspace`.
- Existing chat primitives such as `AIChat` and `ChatInputBox`.
- Existing workspace layout and sandbox-status components as extraction references.

### Adapt before reuse

- `src/app/(app)/projects/[id]/page.tsx` currently renders repository issues and must become the workspace entry point.
- `IssueChatWorkspace`, `IssuePreviewPane`, `IssueSandboxStatusPanel`, and `IssueWorkspaceLayout` contain reusable behavior but issue-specific names, copy, props, and assumptions. Extract or rename only where needed for the project workspace; do not keep issue terminology in the new surface.
- The current agent route under `projects/[id]/issues/[issueNumber]/sandbox/agent` fetches an issue, rejects missing issue access, and injects issue context. Phase 1 needs a project-level agent route that validates the project sandbox without fetching an issue.
- Chat helpers and routes are keyed by `projectId + issueNumber`. They need a project-workspace persistence path.
- The current changed-file and diff operations exist as server tools, but there is no complete project-level review UI/API contract yet.

### Preserve temporarily

The existing issue pages and issue-specific routes may remain during Phase 1 for compatibility. They should not be deleted as part of the first workspace slice unless their removal becomes necessary and is agreed separately.

## API Direction

Keep project-workspace operations under `/api/projects/[id]`:

- existing `/sandbox/start`, `/sandbox/stop`, `/sandbox/session`, `/sandbox/heartbeat`, and `/sandbox/restart-preview`
- new project-level `/sandbox/agent` for free-form agent runs
- project-level chat read/clear behavior
- project-level changed-files and diff reads

All routes must:

- authenticate the Clerk user
- load the owned project on the server
- validate that the sandbox session belongs to that user and project
- validate request data at the route boundary
- return actionable errors without leaking credentials or provider internals

The project-level agent route should preserve the current SSE event contract (`progress`, `final`, and `error`) unless a concrete implementation need requires a coordinated contract change.

## Persistence Decision

Phase 1 requires durable project-workspace chat; local storage alone is not sufficient.

The current `ChatSession` schema requires an `issueNumber` and has a unique constraint on `projectId + issueNumber`. Before implementing chat persistence, choose the smallest backward-compatible Prisma change that gives each project exactly one project-workspace conversation while leaving existing issue conversations readable.

The implementation plan must define:

- how a project-workspace chat session is distinguished from an issue chat session
- the uniqueness rule for one project workspace per project
- how existing issue sessions continue to resolve
- the migration and rollback behavior
- corresponding updates to `docs/database.md`

Do not fake project chat by assigning a sentinel issue number. The data model should represent the real product concept.

## Implementation Slices

### Slice 1: Project workspace shell and lifecycle

- Replace the issue-list center of `/projects/[id]` with the workspace shell.
- Show repository identity and sandbox status.
- Reuse project-level start, stop, session restore, heartbeat, and preview recovery.
- Expose preview as an external link.
- Keep an optional route or secondary affordance for the inherited issue list if it is still needed during migration.

Manual check: an imported project opens directly into its workspace and can start, stop, refresh, and reconnect to its sandbox.

### Slice 2: Project-scoped conversation and agent route

- Add the project-workspace persistence model and migration.
- Add project-level chat loading and clearing.
- Add the project-level SSE agent route without issue fetching or issue prompt context.
- Adapt the chat UI for arbitrary instructions and persisted follow-ups.
- Add focused ownership, persistence, and streaming tests.

Manual check: an engineer can request `Add a health-check endpoint`, watch activity, receive a final response, refresh, and continue the same conversation without an issue.

### Slice 3: Changed files and basic diff

- Add owned project-level read endpoints for changed files and diff.
- Add a review panel with changed-files and diff views.
- Refresh review state after an agent run and on explicit user request.
- Add focused route/tool tests for empty output, changes, provider failure, and access denial.

Manual check: after an agent edit, the engineer can identify changed files and inspect the textual diff from the same workspace.

## Explicitly Deferred

- replacing the custom agent runtime
- an editable file explorer or browser editor
- an interactive terminal
- embedded preview as a core workspace pane
- multiple workspaces or parallel agents per project
- complete branch, commit, push, and pull-request controls
- model selection and advanced agent settings
- team collaboration and organization features
- deleting all inherited issue functionality
- a mobile-specific workspace experience

These are valid future capabilities, but including them now would obscure whether the project-level workspace itself is useful.

## Failure and Recovery States

Phase 1 must make these states explicit:

- no sandbox has been started
- sandbox is creating, installing, running, stopped, or failed
- persisted sandbox registry exists but the live E2B session cannot be restored
- preview is unavailable, stale, recovering, or ready
- agent run is active, blocked, failed, or completed
- chat persistence fails after an agent result
- changed-files or diff reads fail independently of chat
- GitHub repository access has been revoked

GitHub issue access must not block the project workspace. Revoked repository access should still be reported where GitHub-backed actions require it.

## Verification

During implementation, run focused tests for each slice first. Before Phase 1 is considered complete, run:

```bash
pnpm test
pnpm typecheck
pnpm build
```

If E2B, GitHub, Clerk, OpenRouter, or database credentials prevent runtime verification, report the exact unverified boundary.

## Completion Criteria

Phase 1 is complete when an authenticated engineer can:

1. import and open a repository directly into `/projects/[id]`
2. start or reconnect to its owned cloud sandbox
3. submit an arbitrary coding task without a GitHub issue
4. observe streamed agent activity and a clear final result
5. refresh and continue the same persisted project conversation
6. inspect changed files and a basic diff
7. open the preview externally when one is available
8. stop the sandbox deliberately

The milestone is not complete if the new UI still depends on an issue number, if project chat disappears on refresh, or if changes are summarized without an inspectable diff.
