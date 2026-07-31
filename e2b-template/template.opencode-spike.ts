import { Template } from "e2b";

export const OPENCODE_VERSION = "1.18.4";

export const opencodeSpikeTemplate = Template()
  .fromBaseImage()
  .aptInstall(["ripgrep"])
  .npmInstall(`opencode-ai@${OPENCODE_VERSION}`, { g: true });
