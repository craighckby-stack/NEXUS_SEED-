/**
 * config/ErrorCodes.js
 * Nexus Core Error Registry & Diagnostic Mapping
 */

export const NexusErrorCodes = {
  // System Lifecycle Errors
  INIT_FAILURE: "ERR_NEXUS_001",
  BOOT_STALL: "ERR_NEXUS_002",
  SHUTDOWN_INTERRUPTED: "ERR_NEXUS_003",

  // DNA & Evolution Errors
  DNA_CORRUPTION: "ERR_GROG_101",
  SIPHON_TIMEOUT: "ERR_GROG_102",
  SYNTHESIS_REJECTION: "ERR_GROG_103",
  SATURATION_DEPLETED: "ERR_GROG_104",

  // Network & Repository Errors
  GITHUB_AUTH_FAILED: "ERR_REPO_201",
  PROXY_UNREACHABLE: "ERR_REPO_202",
  PUSH_CONFLICT: "ERR_REPO_203",

  // Verification Errors
  HETM_MISMATCH: "ERR_VERIFY_301",
  FIBER_NODE_ORPHANED: "ERR_VERIFY_302",
  SCHEDULER_DESYNC: "ERR_VERIFY_303"
};

export const ErrorDiagnostics = {
  [NexusErrorCodes.DNA_CORRUPTION]: {
    severity: "CRITICAL",
    message: "Architectural DNA signature mismatch detected during synthesis.",
    recovery: "Initiate manual repository scan and force DNA re-siphon."
  },
  [NexusErrorCodes.BOOT_STALL]: {
    severity: "MAJOR",
    message: "System boot sequence stalled at NexusCore initialization.",
    recovery: "Check environment variables and restart dev server."
  },
  [NexusErrorCodes.HETM_MISMATCH]: {
    severity: "MODERATE",
    message: "Temporal mutation verification failed for target fiber nodes.",
    recovery: "Review HETM_Verifier logs and adjust strategy parameters."
  }
};

/**
 * Diagnostic utility for Nexus Core.
 */
export class NexusDiagnostic {
  static resolve(code) {
    return ErrorDiagnostics[code] || {
      severity: "UNKNOWN",
      message: "An undocumented error has occurred in the Nexus Core.",
      recovery: "Consult the GrogBrain logs for raw trace data."
    };
  }
}
