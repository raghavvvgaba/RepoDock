# RepoDock

RepoDock is a developer-first cloud coding workspace where engineers and a coding agent work against the same visible repository and E2B environment.

## What It Does

- Connects a user account to GitHub
- Imports a repository into the app as a project
- Opens each imported repository as a persistent agent coding workspace
- Starts or reconnects one shared E2B sandbox per project
- Streams free-form agent work without requiring a GitHub issue
- Shows changed files, inspectable diffs, sandbox logs, and external previews
- Persists project workspace conversations in Postgres through Prisma
- Keeps GitHub issues available as an optional secondary workflow

## Main Flow

1. Sign in with Clerk.
2. Connect GitHub.
3. Import a repository on `/projects/new`.
4. Open `/projects/[id]` to enter the repository workspace.
5. Start or reconnect to the project sandbox and give the agent a free-form task.
6. Review streamed activity, changed files, the Git diff, and the external preview.
7. Optionally browse GitHub issues at `/projects/[id]/issues`.

## Stack

- Next.js App Router
- React
- Clerk
- Prisma + PostgreSQL
- GitHub App / GitHub OAuth
- E2B sandboxes
- OpenRouter for AI edit generation

## Project Structure

- [src/app](src/app)
  App Router pages, layouts, and API routes
- [src/components](src/components)
  UI components for project, issue, and sandbox workflows
- [src/server](src/server)
  Server-side modules for GitHub, sandbox, chat, AI, and database access
- [prisma/schema.prisma](prisma/schema.prisma)
  Prisma data model and relations
- [docs/architecture.md](docs/architecture.md)
  Higher-level frontend, API, and sandbox architecture
- [docs/database.md](docs/database.md)
  Human-readable explanation of the Prisma models

## Prerequisites

- Node.js
- `pnpm`
- PostgreSQL database
- Clerk project credentials
- GitHub App credentials
- E2B API key
- OpenRouter API key if you want AI edit generation enabled

## Environment Variables

The app validates its environment in [src/env.js](src/env.js).

Server-side variables:

- `DATABASE_URL`
- `CLERK_SECRET_KEY`
- `GITHUB_APP_ID`
- `GITHUB_APP_PRIVATE_KEY`
- `GITHUB_APP_CALLBACK_URL`
- `GITHUB_APP_CLIENT_ID`
- `GITHUB_APP_CLIENT_SECRET`
- `GITHUB_APP_INSTALL_URL`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`
- `E2B_API_KEY`
- `E2B_SANDBOX_TEMPLATE`

Client-side variables:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`

## Development

Install dependencies:

```bash
pnpm install
```

Run the app locally at [http://localhost:4000](http://localhost:4000):

```bash
pnpm dev
```

Useful commands:

- `pnpm build`
  Production build. This is the most reliable verification command in this repo.
- `pnpm typecheck`
  Run TypeScript without emitting files.
- `pnpm db:migrate`
  Create and apply Prisma development migrations.
- `pnpm db:generate`
  Regenerate Prisma client types.
- `pnpm db:push`
  Push schema changes without creating a migration.
- `pnpm db:studio`
  Open Prisma Studio.

## Database

The database schema lives in [prisma/schema.prisma](prisma/schema.prisma).

For a human-readable walkthrough of the models and why they exist, see [docs/database.md](docs/database.md).

## Architecture

For the overall app structure, API layout, and sandbox lifecycle, see [docs/architecture.md](docs/architecture.md).

## Tool Contracts

Canonical developer-facing tool contracts live in [docs/tools.md](docs/tools.md).

- [docs/tools.md](docs/tools.md)
  Canonical contracts for sandbox tools, including `search_code`.

## Troubleshooting

- `pnpm build` is more trustworthy than `pnpm typecheck` when `.next/types` is stale.
- Some TypeScript errors in this repo disappear after a successful build regenerates Next artifacts.
- Sandbox state is now persisted per project in Prisma, but the live connected E2B session still lives in memory while the server process is alive.

## Contributing

If you change the Prisma schema, run:

```bash
pnpm db:migrate
```

Before shipping changes, prefer verifying with:

```bash
pnpm build
pnpm typecheck
```
