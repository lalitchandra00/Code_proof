import fs from "fs";
import path from "path";
import readline from "readline";
import { ensureGitRepo, getGitRoot } from "../utils/git.js";
import { getDefaultExcludes } from "../utils/files.js";
import { logInfo, logWarn } from "../utils/logger.js";
import { ensureEnvFile, readEnvKeys, appendEnvEntries } from "../utils/envManager.js";
import { backupFileOnce, extractSecretValueFromLine, replaceSecretInFile } from "../utils/fileRewriter.js";
import { resolveFeatureFlags, isVerbose } from "../core/featureFlags.js";
import { reportFeatureDisabled, warnExperimentalOnce } from "../core/safetyGuards.js";
import { readLatestReport } from "../reporting/reportReader.js";

const TEST_PATH_HINTS = [
  "test",
  "tests",
  "__tests__",
  "spec",
  "example",
  "examples",
  "sample",
  "samples",
  "mock",
  "mocks"
];

function isTestLike(filePath) {
  const normalized = filePath.toLowerCase();
  return TEST_PATH_HINTS.some((hint) => normalized.includes(path.sep + hint));
}

function isIgnoredPath(filePath, excludes) {
  const segments = filePath.split(path.sep).map((segment) => segment.toLowerCase());
  for (const segment of segments) {
    if (excludes.has(segment)) {
      return true;
    }
  }
  return false;
}

function confirmProceed(message) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(message, (answer) => {
      rl.close();
      resolve(String(answer).trim().toLowerCase() === "y");
    });
  });
}

export async function runMoveSecret({ args, cwd }) {
  // Check for --yes flag to skip confirmation (for testing/CI)
  const autoConfirm = args?.includes("--yes") || args?.includes("-y");
  // Boundary: remediation reads reports only and must not depend on analysis state.
  ensureGitRepo(cwd);
  const gitRoot = getGitRoot(cwd);
  const configPath = path.join(gitRoot, "codeproof.config.json");
  let config = {};
  try {
    const raw = fs.readFileSync(configPath, "utf8");
    config = JSON.parse(raw);
  } catch {
    config = {};
    logWarn("Unable to read codeproof.config.json. Using safe defaults.");
  }
  const features = resolveFeatureFlags(config);
  const verbose = isVerbose(config);

  if (!features.secretRemediation) {
    reportFeatureDisabled("Secret remediation", verbose, logInfo);
    process.exit(0);
  }

  warnExperimentalOnce("Experimental feature enabled: move-secret.", logWarn);
  
  // Safety: Read latest report with validation
  const reportData = readLatestReport(gitRoot);
  if (!reportData) {
    logWarn("No reports found. Run 'codeproof run' first.");
    process.exit(0);
  }

  // The reportReader returns { report: parsedJSON, reportPath }
  // The parsedJSON has structure: { projectId, clientId, project, report: {...}, ...}
  // So reportData.report.report contains the actual report with findings
  const fullReport = reportData.report;
  const latestReport = fullReport.report || {};
  
  if (!Array.isArray(latestReport.findings)) {
    logWarn("Report has no findings array. Invalid report format.");
    process.exit(1);
  }

  const excludes = getDefaultExcludes();

  const eligible = latestReport.findings.filter((finding) => {
    // Debug logging
    const isSecret = finding.ruleId?.startsWith("secret.");
    if (!isSecret) {
      if (process.env.DEBUG_MOVE_SECRET) logWarn(`Filtered (not secret): ${finding.ruleId}`);
      return false;
    }
    
    // Process findings where severity is "block" OR "high"
    const isHighRisk = finding.severity === "block" || finding.severity === "high";
    if (!isHighRisk) {
      if (process.env.DEBUG_MOVE_SECRET) logWarn(`Filtered (low severity): ${finding.ruleId} severity=${finding.severity}`);
      return false;
    }
    
    if (!finding.filePath || !finding.lineNumber) {
      if (process.env.DEBUG_MOVE_SECRET) logWarn(`Filtered (no path/line): ${finding.ruleId}`);
      return false;
    }

    if (!finding.codeSnippet) {
      if (process.env.DEBUG_MOVE_SECRET) logWarn(`Filtered (no snippet): ${finding.filePath}:${finding.lineNumber}`);
      return false;
    }

    const absolutePath = path.isAbsolute(finding.filePath)
      ? finding.filePath
      : path.join(gitRoot, finding.filePath);

    if (isTestLike(absolutePath)) {
      if (process.env.DEBUG_MOVE_SECRET) logWarn(`Filtered (test-like): ${absolutePath}`);
      return false;
    }

    if (isIgnoredPath(absolutePath, excludes)) {
      if (process.env.DEBUG_MOVE_SECRET) logWarn(`Filtered (ignored path): ${absolutePath}`);
      return false;
    }

    return true;
  });

  if (eligible.length === 0) {
    logInfo("No eligible high-confidence secrets to move.");
    process.exit(0);
  }

  // Safety: secrets are never auto-fixed silently; users must confirm every change.
  logInfo("Eligible secrets preview:");
  for (const finding of eligible) {
    const relative = path.relative(gitRoot, finding.filePath) || finding.filePath;
    logInfo(`- ${relative}:${finding.lineNumber}`);
  }
  logInfo(`Secrets to move: ${eligible.length}`);

  const confirmed = autoConfirm || await confirmProceed("Proceed with moving these secrets? (y/N): ");
  if (!confirmed) {
    logInfo("No changes made.");
    process.exit(0);
  }

  const envPath = ensureEnvFile(gitRoot);
  const existingKeys = readEnvKeys(envPath);
  const newEntries = [];
  const backedUp = new Set();
  let secretIndex = 1;
  let secretsMoved = 0;
  const modifiedFiles = new Set();
  const errors = [];

  for (const finding of eligible) {
    const absolutePath = path.isAbsolute(finding.filePath)
      ? finding.filePath
      : path.join(gitRoot, finding.filePath);

    let lineContent = "";
    try {
      const content = fs.readFileSync(absolutePath, "utf8");
      const lines = content.split(/\r?\n/);
      lineContent = lines[finding.lineNumber - 1] || "";
    } catch (err) {
      errors.push(`${finding.filePath}:${finding.lineNumber} - unable to read file: ${err.message}`);
      continue;
    }

    const expectedSecretValue = extractSecretValueFromLine(lineContent);
    if (!expectedSecretValue) {
      errors.push(`${finding.filePath}:${finding.lineNumber} - unable to extract secret value from line`);
      continue;
    }

    // Avoid key collisions
    while (existingKeys.has(`CODEPROOF_SECRET_${secretIndex}`)) {
      secretIndex += 1;
    }

    const envKey = `CODEPROOF_SECRET_${secretIndex}`;

    // Safety: keep an original copy before any rewrite.
    try {
      backupFileOnce(gitRoot, absolutePath, backedUp);
    } catch (err) {
      errors.push(`${finding.filePath} - backup failed: ${err.message}`);
      continue;
    }

    const result = replaceSecretInFile({
      filePath: absolutePath,
      lineNumber: finding.lineNumber,
      envKey,
      expectedSnippet: finding.codeSnippet,
      expectedSecretValue
    });

    if (!result.updated) {
      errors.push(`${finding.filePath}:${finding.lineNumber} - ${result.reason}`);
      continue;
    }

    newEntries.push({ key: envKey, value: result.secretValue });
    existingKeys.add(envKey);
    secretsMoved += 1;
    secretIndex += 1;
    modifiedFiles.add(absolutePath);

    const relative = path.relative(gitRoot, absolutePath) || absolutePath;
    logInfo(`✓ Updated ${relative}:${finding.lineNumber} → process.env.${envKey}`);
  }

  // Append env entries atomically
  try {
    appendEnvEntries(envPath, newEntries);
  } catch (err) {
    logWarn(`Failed to write .env entries: ${err.message}`);
    errors.push(`env-write: ${err.message}`);
  }

  // Output summary
  logInfo("");
  logInfo("═══════════════════════════════════════════");
  logInfo("Secret Move Summary");
  logInfo("═══════════════════════════════════════════");
  logInfo(`Secrets processed: ${eligible.length}`);
  logInfo(`Secrets moved: ${secretsMoved}`);
  logInfo(`Files modified: ${modifiedFiles.size}`);
  logInfo(`Backup location: ${path.join(gitRoot, ".codeproof-backup")}`);
  
  if (errors.length > 0) {
    logInfo("");
    logWarn(`Errors/Skipped (${errors.length}):`);
    errors.forEach((err) => logWarn(`  - ${err}`));
  }
  
  logInfo("═══════════════════════════════════════════");
}
