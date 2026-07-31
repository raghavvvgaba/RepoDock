import { describe, expect, it } from "vitest";

import { normalizeAuthSession } from "~/server/auth/normalize-session";

const NOW = new Date("2026-07-31T09:00:00.000Z").getTime();

describe("normalizeAuthSession", () => {
  it("returns the provider-neutral authenticated user shape", () => {
    expect(
      normalizeAuthSession(
        {
          session: {
            expiresAt: new Date(NOW + 60_000),
          },
          user: {
            id: "user-1",
            name: "Ada Lovelace",
            email: "ada@example.com",
            image: null,
          },
        },
        NOW,
      ),
    ).toEqual({
      userId: "user-1",
      name: "Ada Lovelace",
      email: "ada@example.com",
      image: null,
    });
  });

  it("returns null when no session exists", () => {
    expect(normalizeAuthSession(null, NOW)).toBeNull();
  });

  it("returns null when the session has expired", () => {
    expect(
      normalizeAuthSession(
        {
          session: {
            expiresAt: new Date(NOW - 1),
          },
          user: {
            id: "user-1",
            name: "Ada Lovelace",
            email: "ada@example.com",
          },
        },
        NOW,
      ),
    ).toBeNull();
  });
});
