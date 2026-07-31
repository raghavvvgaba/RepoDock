import { describe, expect, it } from "vitest";

import {
  DEFAULT_AUTH_CALLBACK_URL,
  getSignInPath,
  sanitizeAuthCallbackUrl,
} from "~/lib/auth-redirect";

describe("sanitizeAuthCallbackUrl", () => {
  it("keeps local application paths", () => {
    expect(sanitizeAuthCallbackUrl("/projects/project-1?tab=changes")).toBe(
      "/projects/project-1?tab=changes",
    );
  });

  it.each([
    undefined,
    null,
    "",
    "projects",
    "https://example.com/projects",
    "//example.com/projects",
  ])("rejects unsafe callback value %s", (value) => {
    expect(sanitizeAuthCallbackUrl(value)).toBe(
      DEFAULT_AUTH_CALLBACK_URL,
    );
  });

  it("uses a caller-provided local fallback", () => {
    expect(sanitizeAuthCallbackUrl("https://example.com", "/")).toBe("/");
  });
});

describe("getSignInPath", () => {
  it("omits the redundant default callback URL", () => {
    expect(getSignInPath("/projects")).toBe("/sign-in");
  });

  it("preserves non-default local callback URLs", () => {
    expect(getSignInPath("/projects/project-1")).toBe(
      "/sign-in?callbackURL=%2Fprojects%2Fproject-1",
    );
  });
});
