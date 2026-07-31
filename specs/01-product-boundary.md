# RepoDock Product Boundary

## Status

This document defines the product boundary for RepoDock. It is the reference point for product and architecture decisions in this repository.

The original application and its documents remain useful historical context, but their non-technical-user assumptions do not define this product.

## Product Definition

RepoDock is a cloud-native agent coding tool for software engineers.

It gives engineers a remote development workspace where a mature coding agent can inspect a repository, make changes, run commands, verify its work, and help move those changes through Git and GitHub workflows.

The product should provide engineers with visibility and control. It should not hide technical details merely to make the experience feel simpler.

## Target User

The primary user is a software engineer who:

- understands repositories, branches, commits, pull requests, terminals, and development environments
- wants an agent to perform meaningful coding work in a cloud sandbox
- expects to inspect what the agent is doing and intervene when necessary
- values speed and automation without giving up technical control

This product is not primarily designed for non-technical users making small, guided contributions.

## Core Principles

### 1. Developer-first, not abstraction-first

Technical concepts should use their real names and remain accessible. The interface may organize complexity, but it should not remove useful information or replace it with vague status messages.

### 2. Mature agent over custom-agent research

Building and maintaining a custom coding-agent loop is not a product requirement.

We may replace the current custom agent with a more mature agent runtime. The product's value should come from the complete cloud coding experience: environment orchestration, context, controls, observability, review, and delivery—not from owning every part of the underlying agent loop.

### 3. Visibility by default

Engineers should be able to inspect relevant technical state, including:

- agent actions and tool calls
- command and terminal output
- changed files and diffs
- build, test, lint, and preview results
- errors and diagnostic logs
- Git branch and working-tree state
- sandbox and environment status

The UI can provide summaries, but summaries must not be the only available view.

### 4. Explicit user control

The user should be able to control important actions such as:

- selecting the repository and branch
- starting, stopping, or recreating the cloud workspace
- approving or restricting consequential agent actions
- running commands and verification workflows
- reviewing and editing changes before submission
- committing, pushing, and creating a pull request
- choosing models or agent settings when the underlying runtime supports them

### 5. Agent and human share the workspace

The product is not only a chat box that eventually returns a pull request. The engineer and agent should work against the same visible repository and environment, with shared access to files, terminal state, previews, diffs, and Git operations.

## Foundation We Can Reuse

The fork may retain and evolve useful parts of the original application, including:

- authentication and user accounts
- GitHub App integration and repository import
- project and repository persistence
- cloud sandbox provisioning and lifecycle management
- repository cloning and environment setup
- application previews
- pull-request integration
- chat/session persistence
- commit, push, and pull-request infrastructure

Reuse is an implementation advantage, not a product constraint. Existing flows should be changed or removed when they conflict with the developer-first direction.

## Expected Product Surface

The central experience should evolve toward a cloud development workspace that brings together:

- repository and file navigation
- agent conversation and activity
- terminal access and command output
- application preview
- changed-files and diff review
- build, test, lint, and diagnostic results
- branch, commit, push, and pull-request controls
- cloud workspace status and lifecycle controls

The exact layout is not fixed by this document. The boundary is that these capabilities should feel like parts of one engineering workspace rather than isolated simplified actions.

## Explicitly Out of Scope

Unless this boundary is intentionally revised, we are not optimizing for:

- a non-technical contribution flow
- hiding Git, terminal, environment, or diagnostic concepts from the user
- limiting the product to small frontend edits
- preserving the current custom agent solely because it was built in-house
- a one-click black-box flow where users cannot inspect intermediate work
- keeping existing UI or architecture when it prevents developer control
- building a full local IDE replacement in the first version
- broad team, enterprise, or collaboration features before the single-engineer workflow is strong

## Decision Filter

When considering a feature or architecture change, ask:

1. Does this help a software engineer complete real coding work in a cloud environment?
2. Does it give the engineer useful visibility or control?
3. Does it strengthen the shared agent-and-human workspace?
4. Are we reusing an old flow because it is genuinely useful, or only because it already exists?
5. Could a mature external agent handle this better than expanding the custom agent?

If a proposed feature mainly serves the original non-technical contribution experience, it should not be carried into this fork by default.

## Initial Success Definition

An engineer can connect a repository, launch a cloud workspace, ask a mature coding agent to complete a meaningful task, inspect the agent's actions and outputs, intervene or run commands when needed, review the resulting diff, verify the change, and deliberately commit, push, or open a pull request.

That end-to-end engineering workflow is the product foundation. Features beyond it should be evaluated after this experience is dependable.
