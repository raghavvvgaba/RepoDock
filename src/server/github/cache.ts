import { createHash } from "node:crypto";

function getRepoCacheKey(repoOwner: string, repoName: string) {
  return `${repoOwner.toLowerCase()}/${repoName.toLowerCase()}`;
}

export function getRepoInstallationTag(repoOwner: string, repoName: string) {
  return `github-installation:${getRepoCacheKey(repoOwner, repoName)}`;
}

export function getInstallationTokenTag(installationId: number) {
  return `github-installation-token:${installationId}`;
}

export function getImportRepositoriesTag(tokenHash: string) {
  return `github-import-repos:${tokenHash}`;
}

export function hashGithubImportToken(accessToken: string) {
  return createHash("sha256").update(accessToken).digest("hex");
}
