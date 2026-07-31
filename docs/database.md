# Database

This project uses Prisma with PostgreSQL. The authoritative schema lives in [prisma/schema.prisma](../prisma/schema.prisma). This file explains the intent behind the current models.

## Source Of Truth

- Model definitions: [prisma/schema.prisma](../prisma/schema.prisma)
- Migration history: [prisma/migrations](../prisma/migrations)
- Prisma client setup: [src/server/db.ts](../src/server/db.ts)

## Current Models

### `User`

Represents an authenticated app user.

Important fields:

- `id`
  Primary key. Comes from the auth system.
- `email`
  Unique user email.
- `githubUsername`
  Optional connected GitHub username.
- `githubConnected`
  Whether GitHub has been connected for the user.

Relations:

- `projects`
  Repositories imported by this user.
- `sandboxSessions`
  Project sandbox sessions owned by this user.
- `projectWorkspaces`
  Persistent repository workspaces owned by this user.

### `Project`

Represents one imported GitHub repository for one user.

Important fields:

- `id`
  App-level project id.
- `repoOwner`
  GitHub repository owner.
- `repoName`
  GitHub repository name.
- `userId`
  Owner of the imported project.

Constraint:

- `@@unique([userId, repoOwner, repoName])`
  Prevents the same user from importing the same repository more than once.

Relations:

- `sandboxSessions`
  Sandbox registry rows for this project.
- `workspace`
  The project's optional one-to-one persistent coding workspace.

### `ProjectWorkspace`

Represents the durable agent workspace for one imported repository.

Important fields:

- `projectId`
  Unique project relation. This enforces one workspace per imported repository.
- `userId`
  Owner used for direct server-side ownership checks.

Relations:

- `messages`
  The durable free-form conversation for the project workspace.

The row is created with new projects and lazily upserted for projects imported before this model existed.

### `WorkspaceMessage`

Represents one durable user, assistant, or system message in a project workspace.

Index:

- `@@index([workspaceId, createdAt])`
  Supports loading a workspace conversation in chronological order.

Workspace messages are the durable conversation history for the project workspace.

### `SandboxSession`

Represents the durable registry row for one project sandbox.

Important fields:

- `sessionId`
  App-level sandbox session id used by routes and UI.
- `sandboxId`
  E2B sandbox id used for reconnecting after memory loss.
- `projectId`
  The project that owns the sandbox.
- `userId`
  The user that owns the sandbox.
- `previewUrl`
  Current preview URL for the sandbox app.
- `lastHeartbeatAt`
  Last time the session was touched.
- `startedAt`
  Real sandbox start time.
- `isStopped`
  Lightweight stop marker instead of a full lifecycle enum.

Constraint:

- `projectId @unique`
  The app currently allows one sandbox row per project.

Why it exists:

- Sandbox ownership should survive server restarts.
- The app should be able to restore a live E2B sandbox from persisted metadata.

## Design Notes

### Why the schema file is the source of truth

`schema.prisma` is where Prisma models are defined and mapped to database tables. The app and generated Prisma client both depend on it, so model changes should start there.

### Why this file exists too

The schema file is authoritative, but it is not the best place to explain product intent, tradeoffs, or higher-level relationships in prose. This document exists for that.

### Where to document future model decisions

- Put actual model changes in [prisma/schema.prisma](../prisma/schema.prisma)
- Put migration history in [prisma/migrations](../prisma/migrations)
- Put explanation and reasoning in this file
