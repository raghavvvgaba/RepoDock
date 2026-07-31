# Architecture

This file explains the high-level structure of the app. 

## Product Shape

RepoDock's primary flow is now repository-to-workspace:

1. A user signs in.
2. The user connects GitHub.
3. The user imports a repository as a project.
4. The app opens one persistent project workspace and conversation.
5. The user starts or reconnects to the project's E2B sandbox.
6. The user gives the agent a free-form task and reviews streamed activity, changed files, and the Git diff.

## Frontend Structure

Frontend screens live under [src/app](../src/app), especially:

- [src/app/(auth)](../src/app/%28auth%29)
  RepoDock-native Better Auth email/password screens.
- [src/app/(app)](../src/app/%28app%29)
  Signed-in product screens.

Important screens:

- [src/app/(app)/dashboard/page.tsx](../src/app/%28app%29/dashboard/page.tsx)
  Main signed-in dashboard.
- [src/app/(app)/projects/new/page.tsx](../src/app/%28app%29/projects/new/page.tsx)
  Repository import flow.
- [src/app/(app)/projects/[id]/page.tsx](../src/app/%28app%29/projects/%5Bid%5D/page.tsx)
  Primary project workspace with agent chat, sandbox controls, and change review.
- [src/app/(app)/projects/[id]/issues/page.tsx](../src/app/%28app%29/projects/%5Bid%5D/issues/page.tsx)
  Temporary compatibility redirect to the project workspace.
- [src/app/(app)/projects/[id]/issues/[issueNumber]/page.tsx](../src/app/%28app%29/projects/%5Bid%5D/issues/%5BissueNumber%5D/page.tsx)
  Temporary compatibility redirect to the project workspace.

Reusable UI lives under [src/components](../src/components).

## API Structure

Backend HTTP handlers live under [src/app/api](../src/app/api).

Main route groups:

- [src/app/api/auth](../src/app/api/auth)
  Better Auth session and credential endpoints.
- [src/app/api/github](../src/app/api/github)
  GitHub connect, callback, disconnect, and import-session routes.
- [src/app/api/projects/route.ts](../src/app/api/projects/route.ts)
  Project listing and import creation.
- [src/app/api/projects/[id]/sandbox](../src/app/api/projects/%5Bid%5D/sandbox)
  Project-level sandbox lifecycle, free-form agent, preview check, and Git changes routes.
## Server Modules

Important backend modules:

- [src/server/auth](../src/server/auth)
  Better Auth configuration plus the provider-neutral app session boundary.
- [src/server/github](../src/server/github)
  GitHub auth, repository import, pull-request, and connection helpers.
- [src/server/sandbox](../src/server/sandbox)
  Sandbox provider contract, route helpers, registry logic, access checks, and agent tooling.
- [src/server/workspace-chat.ts](../src/server/workspace-chat.ts)
  Persistent project workspace conversation and messages.
- [src/server/ai](../src/server/ai)
  AI provider abstraction used by the project-scoped agent.

## Authentication

Better Auth stores users, credential accounts, and sessions in PostgreSQL
through Prisma. Server components call the app-owned auth helpers under
`src/server/auth`; route handlers perform the same session check before
ownership queries. The signed-in app layout redirects unauthenticated page
requests to `/sign-in`, while JSON and sandbox routes return `401`.

GitHub connection is a separate post-login OAuth flow. Its short-lived import
token is encrypted with `GITHUB_IMPORT_SESSION_SECRET`, not the authentication
secret.

## Sandbox Architecture

The sandbox layer has two levels of state:

### 1. Durable session registry

Stored in Prisma through the `SandboxSession` model and managed by [src/server/sandbox/session-registry.ts](../src/server/sandbox/session-registry.ts).

This layer stores:

- app `sessionId`
- E2B `sandboxId`
- `projectId`
- `userId`
- `previewUrl`
- `startedAt`
- `lastHeartbeatAt`
- `isStopped`

Purpose:

- survive server restarts
- validate sandbox ownership
- restore a sandbox when the in-memory session object is gone

### 2. Live in-memory E2B session

Managed under [src/server/sandbox/providers/e2b](../src/server/sandbox/providers/e2b).

Purpose:

- hold the currently connected E2B sandbox object
- track logs and preview state while the server process is alive
- provide fast access during active use

If the live in-memory session disappears, the app can restore from the durable Prisma row using `sandboxId`.

## Chat Persistence

The primary project workspace uses:

- `ProjectWorkspace`
- `WorkspaceMessage`

Each project has at most one workspace row. Messages persist the free-form project conversation.

## Documentation Boundaries

Use the docs like this:

- [README.md](../README.md)
  Quick start, setup, commands, and repo overview.
- [docs/database.md](database.md)
  Prisma model explanations.
- [docs/architecture.md](architecture.md)
  Frontend/API/sandbox system overview.
