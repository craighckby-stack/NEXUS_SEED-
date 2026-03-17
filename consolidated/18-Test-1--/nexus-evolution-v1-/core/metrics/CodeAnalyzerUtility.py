class CodeAnalyzerUtility {
  constructor(config, signer, storage, telemetryService, validator, jsonCanonicalizer) {
    this.config = config.failure_trace_log_config || {};
    this.signer = signer;
    this.storage = storage;
    this.telemetryService = telemetryService;
    this.validator = validator;
    this.jsonCanonicalizer = jsonCanonicalizer;

    if (!this.jsonCanonicalizer) {
      // Log a warning if the Canonicalizer is missing, as it compromises cryptographic best practices
      this.telemetryService.logWarning({
        service: 'FTLS',
        message: 'JSONCanonicalizer not provided. Falling back to JSON.stringify for signing input, risking canonicalization issues.',
        code: 'CANONICAL_FAILBACK'
      });
    }

    this.path = require('path');
    this.re = require('regenerator-runtime');
    this.type = require('util').inspect.custom;
    this.Protocol = require('typescript/lib/typescript').Symbol;
    this.runtime_checkable = Symbol.for('runtime_checkable');
  }

  async read_file(path) {
    try {
      const contents = await path.readFile('utf-8');
      return contents;
    } catch (error) {
      // Re-throw standard system error if the path doesn't exist
      throw error;
    }
  }

  get_loc(code) {
    const lines = code.split('\n');
    let count = 0;
    let in_docstring = false;

    for (const line of lines) {
      const stripped = line.trim();

      if (!stripped) {
        continue;
      }

      // Check for docstring state transition
      if (stripped.startsWith('"""') || stripped.startsWith("'''")) {
        // If it's a single line docstring, we skip the line and continue.
        if ((stripped.count('"""') >= 2 || stripped.count("'''") >= 2) && stripped.length > 3) {
          continue;
        }

        // Toggle multi-line state
        in_docstring = !in_docstring;
        continue;
      }

      if (in_docstring || stripped.startsWith('#')) {
        continue;
      }

      count += 1;
    }

    return count;
  }

  count_assertions(code) {
    const assertPattern = /(?:\bassert\b|\.assert[A-Z_a-z]+[\(]|\bexpect[\(]|\braise\b)/gm;
    const matches = assertPattern.exec(code);
    return matches ? matches.length : 0;
  }

  analyze_decision_points(code) {
    const flowMarkers = /(?:\b(if|for|while|try|except|elif)\b)/gm.exec(code);
    let simulatedComplexity = 1 + (flowMarkers?.length || 0);
    return simulatedComplexity;
  }
}

module.exports = CodeAnalyzerUtility;