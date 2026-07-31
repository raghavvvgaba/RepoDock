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
  it("builds a project-scoped workspace prompt", () => {
    const prompt = buildAgentUserPrompt(baseInput);

    expect(prompt).toContain("Repository: example/repodock");
    expect(prompt).toContain("Project id: project-1");
    expect(prompt).toContain("Add a health-check endpoint");
    expect(prompt).not.toContain("Issue #");
  });
});
