import { describe, expect, it } from "vitest";

import {
  decryptGithubImportSession,
  encryptGithubImportSession,
  readGithubImportSessionValue,
} from "~/server/github/import-session-crypto";

const SECRET = "test-secret-that-is-at-least-32-characters";

describe("GitHub import session encryption", () => {
  it("round-trips an encrypted import session", () => {
    const payload = {
      accessToken: "github-token",
      expiresAt: Date.now() + 60_000,
    };

    const encrypted = encryptGithubImportSession(payload, SECRET);

    expect(decryptGithubImportSession(encrypted, SECRET)).toEqual(payload);
  });

  it("rejects a tampered encrypted value", () => {
    const encrypted = encryptGithubImportSession(
      {
        accessToken: "github-token",
        expiresAt: Date.now() + 60_000,
      },
      SECRET,
    );
    const tampered = `${encrypted.slice(0, -1)}${
      encrypted.endsWith("a") ? "b" : "a"
    }`;

    expect(readGithubImportSessionValue(tampered, SECRET)).toBeNull();
  });

  it("rejects an expired import session", () => {
    const now = Date.now();
    const encrypted = encryptGithubImportSession(
      {
        accessToken: "github-token",
        expiresAt: now - 1,
      },
      SECRET,
    );

    expect(readGithubImportSessionValue(encrypted, SECRET, now)).toBeNull();
  });
});
