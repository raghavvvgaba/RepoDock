import type { SandboxAgentInput } from "~/server/sandbox/types";

export function buildAgentUserPrompt(input: SandboxAgentInput) {
  return [
    `Repository: ${input.repoOwner}/${input.repoName}`,
    `Project id: ${input.projectId}`,
    ...(typeof input.issueNumber === "number" && input.issueTitle
      ? [`Issue #${input.issueNumber}: ${input.issueTitle}`]
      : []),
    "",
    "User instruction:",
    input.userInstruction,
    "",
    "When you are done or blocked, return JSON with:",
    '- "status": "completed" or "blocked"',
    '- "message": short user-facing explanation',
    '- "clarificationQuestion": optional follow-up question when blocked',
  ].join("\n");
}
