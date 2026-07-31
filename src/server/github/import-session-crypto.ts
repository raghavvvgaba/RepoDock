import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

export type GithubImportSessionPayload = {
  accessToken: string;
  expiresAt: number;
};

function createEncryptionKey(secret: string) {
  return createHash("sha256").update(secret).digest();
}

export function encryptGithubImportSession(
  payload: GithubImportSessionPayload,
  secret: string,
) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(
    "aes-256-gcm",
    createEncryptionKey(secret),
    iv,
  );
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [iv, tag, encrypted]
    .map((part) => part.toString("base64url"))
    .join(".");
}

export function decryptGithubImportSession(
  value: string,
  secret: string,
): GithubImportSessionPayload {
  const [ivPart, tagPart, dataPart] = value.split(".");

  if (!ivPart || !tagPart || !dataPart) {
    throw new Error("invalid_import_session");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    createEncryptionKey(secret),
    Buffer.from(ivPart, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataPart, "base64url")),
    decipher.final(),
  ]);

  return JSON.parse(
    decrypted.toString("utf8"),
  ) as GithubImportSessionPayload;
}

export function readGithubImportSessionValue(
  value: string,
  secret: string,
  now = Date.now(),
) {
  try {
    const payload = decryptGithubImportSession(value, secret);
    return payload.expiresAt > now ? payload : null;
  } catch {
    return null;
  }
}
