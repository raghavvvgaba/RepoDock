import "dotenv/config";

import { Template, defaultBuildLogger } from "e2b";

import {
  OPENCODE_VERSION,
  opencodeSpikeTemplate,
} from "./template.opencode-spike";

const TEMPLATE_NAME = "gabatools/repodock-opencode-spike";

async function main() {
  const build = await Template.build(opencodeSpikeTemplate, TEMPLATE_NAME, {
    cpuCount: 2,
    memoryMB: 2048,
    onBuildLogs: defaultBuildLogger(),
  });

  console.log(
    `Built E2B template ${build.name ?? TEMPLATE_NAME} with OpenCode ${OPENCODE_VERSION}`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
