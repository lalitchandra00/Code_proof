// ASCII banner for CodeProof CLI
// Professional-grade banner displayed on init and help commands

const BANNER_TEXT = `
 ██████╗ ██████╗ ██████╗ ███████╗██████╗ ██████╗  ██████╗  ██████╗ ███████╗
██╔════╝██╔═══██╗██╔══██╗██╔════╝██╔══██╗██╔══██╗██╔═══██╗██╔════╝ ██╔════╝
██║     ██║   ██║██████╔╝█████╗  ██████╔╝██████╔╝██║   ██║██║  ███╗█████╗  
██║     ██║   ██║██╔═══╝ ██╔══╝  ██╔═══╝ ██╔══██╗██║   ██║██║   ██║██╔══╝  
╚██████╗╚██████╔╝██║     ███████╗██║     ██║  ██║╚██████╔╝╚██████╔╝███████╗
 ╚═════╝ ╚═════╝ ╚═╝     ╚══════╝╚═╝     ╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚══════╝
`;

const TAGLINE = "AI-Powered Pre-Commit Security Enforcement";

/**
 * Display the CodeProof banner with tagline.
 * Used on init and help commands.
 */
export function displayBanner() {
  console.log(BANNER_TEXT);
  console.log(`  ${TAGLINE}\n`);
}

/**
 * Get the banner text for programmatic use.
 */
export function getBannerText() {
  return BANNER_TEXT;
}

/**
 * Get the tagline for programmatic use.
 */
export function getTagline() {
  return TAGLINE;
}
