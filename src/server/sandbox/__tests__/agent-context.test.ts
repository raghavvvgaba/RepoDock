import { describe, expect, it } from "vitest";

import { buildAgentUserPrompt } from "../agent-context";

const baseInput = {
  projectId: "project-1",
  repoName: "repodock",
  repoOwner: "example",
  sessionId: "session-1",
  userInstruction: "Add a health-check endpoint",
};

describe("buildAgentUserPrompt", () => {
  it("builds project workspace prompts without fabricated issue context", () => {
    const prompt = buildAgentUserPrompt(baseInput);

    expect(prompt).toContain("Repository: example/repodock");
    expect(prompt).toContain("Add a health-check endpoint");
    expect(prompt).not.toContain("Issue #");
  });

  it("preserves issue context for the inherited issue workspace", () => {
    const prompt = buildAgentUserPrompt({
      ...baseInput,
      issueNumber: 42,
      issueTitle: "Add health endpoint",
    });

    expect(prompt).toContain("Issue #42: Add health endpoint");
  });
});
