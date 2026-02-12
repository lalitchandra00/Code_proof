// CLI output formatting helpers
// Provides consistent, professional-grade output formatting

const DIVIDER = "─".repeat(50);

/**
 * Log informational message
 */
function logInfo(message) {
  console.log(`[codeproof] ${message}`);
}

/**
 * Log success message (for completed actions)
 */
function logSuccess(message) {
  console.log(`[codeproof] ✓ ${message}`);
}

/**
 * Log warning message
 */
function logWarning(message) {
  console.warn(`[codeproof] ⚠ ${message}`);
}

/**
 * Log error message
 */
function logError(message) {
  console.error(`[codeproof] ✗ ${message}`);
}

/**
 * Print a section header with dividers
 * Usage: sectionHeader("Initializing CodeProof")
 */
function sectionHeader(title) {
  console.log(DIVIDER);
  console.log(title.padStart(title.length + Math.floor((DIVIDER.length - title.length) / 2)));
  console.log(DIVIDER);
}

/**
 * Print structured output block (like a code block)
 */
function formatBlock(content) {
  const lines = content.split("\n");
  lines.forEach((line) => {
    if (line.trim()) {
      console.log(`  ${line}`);
    } else {
      console.log("");
    }
  });
}

/**
 * Print a key-value pair with alignment
 */
function logKeyValue(key, value, indent = 2) {
  const spaces = " ".repeat(indent);
  console.log(`${spaces}${key.padEnd(20)} ${value}`);
}

/**
 * Print an unordered list
 */
function logList(items, indent = 2) {
  const spaces = " ".repeat(indent);
  items.forEach((item) => {
    console.log(`${spaces}• ${item}`);
  });
}

export { logInfo, logSuccess, logWarning, logError, sectionHeader, formatBlock, logKeyValue, logList, DIVIDER };
