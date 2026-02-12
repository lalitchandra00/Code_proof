import path from "path";
import fs from "fs";
import { ensureGitRepo, getGitRoot } from "../utils/git.js";
import { logInfo, logSuccess, logWarn } from "../utils/logger.js";
import { detectProjectType } from "../utils/projectType.js";
import { installPreCommitHook } from "../hooks/preCommit.js";
import { showWelcomeScreen } from "../ui/welcomeScreen.js";
import { displayBanner } from "../ui/banner.js";
import { getClientId } from "../core/identity.js";
import { randomUUID } from "crypto";



export async function runInit({ cwd }) {
  // Display banner at the start of initialization
  displayBanner();
  
  logInfo("Initializing CodeProof...");

  getClientId();
  
  ensureGitRepo(cwd);
  logSuccess("Git repository detected.");
  
  const gitRoot = getGitRoot(cwd);
  logInfo(`Project root: ${gitRoot}`);

  const projectType = detectProjectType(gitRoot);
  logInfo(`Detected project type: ${projectType}`);

  const configPath = path.join(gitRoot, "codeproof.config.json");
  // Avoid overwriting user configuration to keep init idempotent.
  if (fs.existsSync(configPath)) {
    let updated = false;
    try {
      const raw = fs.readFileSync(configPath, "utf8");
      const existing = JSON.parse(raw);
      if (!existing.projectId) {
        existing.projectId = randomUUID();
        updated = true;
        fs.writeFileSync(configPath, JSON.stringify(existing, null, 2) + "\n", "utf8");
      }
    } catch {
      logWarn("Config already exists but could not be updated.");
    }

    if (updated) {
      logSuccess("Added projectId to codeproof.config.json");
    } else {
      logWarn("Config already exists. Skipping creation.");
    }
  } else {
    const config = {
      projectId: randomUUID(),
      projectType,
      scanMode: "staged",
      enforcement: "enabled",
      features: {
        reporting: true,
        integration: false,
        aiEscalation: false,
        secretRemediation: false
      },
      integration: {
        enabled: false,
        endpointUrl: ""
      },
      severityRules: {
        block: [],
        warn: [],
        allow: []
      }
    };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf8");
    logSuccess("Created codeproof.config.json");
  }

  try {
    const raw = fs.readFileSync(configPath, "utf8");
    const existing = JSON.parse(raw);
    if (!existing.enforcement) {
      existing.enforcement = "enabled";
      fs.writeFileSync(configPath, JSON.stringify(existing, null, 2) + "\n", "utf8");
      logSuccess("Added enforcement=enabled to codeproof.config.json");
    }
  } catch {
    logWarn("Unable to update enforcement in codeproof.config.json.");
  }

  installPreCommitHook(gitRoot);
  logSuccess("Pre-commit hook installed.");

  logSuccess("CodeProof initialization complete.");

  let scanMode = "staged";
  try {
    const configRaw = fs.readFileSync(configPath, "utf8");
    const parsed = JSON.parse(configRaw);
    if (parsed?.scanMode) {
      scanMode = String(parsed.scanMode).toLowerCase();
    }
  } catch {
    // UX: welcome message should never fail init; fall back to defaults for display.
  }

  showWelcomeScreen({
    projectType,
    scanMode,
    configPath
  });
}