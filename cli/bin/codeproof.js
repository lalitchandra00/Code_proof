#!/usr/bin/env node
import { runInit } from "../commands/init.js";
import { runCli } from "../commands/run.js";
import { runReportDashboard } from "../commands/reportDashboard.js";
import { runMoveSecret } from "../commands/moveSecret.js";
import { runWhoAmI } from "../commands/whoami.js";
import { runIgnore } from "../commands/ignore.js";
import { runApply } from "../commands/apply.js";
import { runHelp } from "../commands/help.js";
import { logError } from "../utils/logger.js";

const [, , command, ...args] = process.argv;

async function main() {
  // Show help for no command or explicit help flags
  if (!command || command === "-h" || command === "--help" || command === "help") {
    await runHelp();
    return;
  }

  if (command === "init") {
    await runInit({ args, cwd: process.cwd() });
    return;
  }

  if (command === "run") {
    await runCli({ args, cwd: process.cwd() });
    return;
  }

  if (command === "report@dashboard") {
    await runReportDashboard({ args, cwd: process.cwd() });
    return;
  }

  if (command === "move-secret") {
    await runMoveSecret({ args, cwd: process.cwd() });
    return;
  }

  if (command === "ignore") {
    await runIgnore({ args, cwd: process.cwd() });
    return;
  }

  if (command === "apply") {
    await runApply({ args, cwd: process.cwd() });
    return;
  }

  if (command === "whoami") {
    await runWhoAmI();
    return;
  }

  logError(`Unknown command: ${command}`);
  process.exit(1);
}

main().catch((error) => {
  logError(error?.message || String(error));
  process.exit(1);
});
