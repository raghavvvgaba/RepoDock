# Project Workspace Phase 1

## Status

Implemented and manually verified in July 2026.

This document records the delivered Phase 1 boundary. [01-product-boundary.md](01-product-boundary.md) remains authoritative for product direction.

## Delivered Workflow

An authenticated engineer can:

1. import a GitHub repository
2. open its project workspace at `/projects/[id]`
3. start or reconnect to the project's E2B sandbox
4. give the agent a free-form coding task without selecting an issue
5. observe streamed progress and a final response
6. refresh and continue the durable project conversation
7. inspect changed files and a textual Git diff
8. open the sandbox preview externally
9. stop the sandbox deliberately

GitHub issues remain available as an optional secondary workflow at `/projects/[id]/issues`.

## Implemented Architecture

### Workspace and persistence

- Each imported project has at most one `ProjectWorkspace` and one active `SandboxSession`.
- `WorkspaceMessage` stores the durable project conversation independently of issue chat.
- Existing projects lazily create their workspace row; new imports create it with the project.
- Ownership is validated from the authenticated user through the project on the server.

### Agent execution

- `POST /api/projects/[id]/sandbox/agent` accepts a live `sessionId` and free-form `instruction`.
- Project runs include repository context without fabricated issue context.
- Optional issue runs use the same agent with issue number and title supplied as additional context.
- The client handles `progress`, `final`, and `error` SSE events through shared agent-chat helpers.
- User instructions and final completed, blocked, or failed responses are durable; progress updates are transient.

### Sandbox and review

- Project-level start, stop, session restore, heartbeat, preview check, and preview restart routes share the existing E2B provider.
- `GET /api/projects/[id]/sandbox/changes` returns changed files and an inspectable diff.
- Git status uses NUL-delimited porcelain output, and untracked files are included through safely quoted `git diff --no-index` calls.
- Combined diff output is capped at 1 MiB and reports truncation to the UI.
- Preview availability is exposed through an external link rather than an embedded browser.

## Verification

The implementation is covered by focused workspace persistence, agent context, SSE chat, and Git changes tests. The repository verification gates are:

```bash
pnpm test
pnpm typecheck
pnpm build
```

The Prisma migration `20260722090000_add_project_workspaces` must be applied to each target database before project import or workspace loading.

## Deferred

- editable file explorer or browser editor
- interactive terminal
- embedded preview
- multiple workspaces or parallel agents per project
- complete branch, commit, push, and pull-request controls in the primary workspace
- model selection and advanced agent settings
- team collaboration
- replacement of the current custom agent runtime
- removal of the optional issue workflow
