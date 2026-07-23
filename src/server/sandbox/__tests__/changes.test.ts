import { beforeEach, describe, expect, it, vi } from "vitest";

const { runRawCommandMock } = vi.hoisted(() => ({
  runRawCommandMock: vi.fn(),
}));

vi.mock("~/server/sandbox/provider", () => ({
  sandboxProvider: {
    runRawCommand: runRawCommandMock,
  },
}));

import { getSandboxChanges, parseGitStatus } from "../changes";

describe("parseGitStatus", () => {
  it("parses modified, untracked, deleted, and renamed paths", () => {
    expect(
      parseGitStatus(
        [
          " M src/app/page.tsx",
          "?? src/new file.ts",
          " D src/old.ts",
          "R  src/new-name.ts",
          "src/old-name.ts",
          "",
        ].join("\0"),
      ),
    ).toEqual([
      { path: "src/app/page.tsx", status: "modified" },
      { path: "src/new file.ts", status: "untracked" },
      {
        path: "src/new-name.ts",
        previousPath: "src/old-name.ts",
        status: "renamed",
      },
      { path: "src/old.ts", status: "deleted" },
    ]);
  });
});

describe("getSandboxChanges", () => {
  beforeEach(() => {
    runRawCommandMock.mockReset();
  });

  it("returns a clean snapshot without running a diff", async () => {
    runRawCommandMock.mockResolvedValueOnce({
      command: "git status",
      exitCode: 0,
      stderr: "",
      stdout: "",
    });

    await expect(getSandboxChanges("session-1")).resolves.toEqual({
      diff: "",
      files: [],
      truncated: false,
    });
    expect(runRawCommandMock).toHaveBeenCalledTimes(1);
  });

  it("includes tracked and safely quoted untracked diffs", async () => {
    runRawCommandMock
      .mockResolvedValueOnce({
        command: "git status",
        exitCode: 0,
        stderr: "",
        stdout: " M src/app/page.tsx\0?? src/it's-new.ts\0",
      })
      .mockResolvedValueOnce({
        command: "git diff",
        exitCode: 0,
        stderr: "",
        stdout: "diff --git a/src/app/page.tsx b/src/app/page.tsx\n",
      })
      .mockResolvedValueOnce({
        command: "git diff --no-index",
        exitCode: 1,
        stderr: "",
        stdout: "diff --git a/src/it's-new.ts b/src/it's-new.ts\n",
      });

    const result = await getSandboxChanges("session-1");

    expect(result.files).toEqual([
      { path: "src/app/page.tsx", status: "modified" },
      { path: "src/it's-new.ts", status: "untracked" },
    ]);
    expect(result.diff).toContain("src/app/page.tsx");
    expect(result.diff).toContain("src/it's-new.ts");
    expect(runRawCommandMock).toHaveBeenLastCalledWith({
      command: "git diff --no-index --binary -- /dev/null 'src/it'\\''s-new.ts'",
      sessionId: "session-1",
    });
  });
});
