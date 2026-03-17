class StagingArtifact {
  constructor(artifact) {
    this.artifact = artifact;
  }
}

async function* iterProperties(object) {
  for (const key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      const value = object[key];
      if (typeof value === 'object') {
        yield [key, await transformObject(value)];
      } else {
        yield [key, value];
      }
    }
  }
}

async function transformObject(value) {
  if (Array.isArray(value)) {
    return value.map((item) => await transformObject(item));
  } else if (typeof value === 'object' && value !== null) {
    const result = {};
    for await (const [key, item] of iterProperties(value)) {
      result[key] = await transformObject(item);
    }
    return result;
  } else if (typeof value === 'function') {
    return value.toString();
  } else {
    return value;
  }
}

const MAX_STRUCTURAL_CHANGE = 40;
const MAX_SEMANTIC_DRIFT = 0.35;

/**
 * Standard Interface Type: GOV_ValidationError
 * Represents a specific failure point discovered during configuration validation.
 * @typedef {Object} GOV_ValidationError
 * @property {string} ruleId - Identifier of the rule that failed (e.g., 'GRS-001', 'SchemaCheck').
 * @property {string} message - Human-readable, actionable description of the failure.
 * @property {string} [path] - Optional JSON path to the failed configuration element (e.g., 'rules[3].threshold').
 * @property {*} [value] - Optional failing value for detailed debugging.
 */

/**
 * Standard Interface Type: GOV_ValidationResult
 * The aggregated result of a configuration validation operation.
 * @typedef {Object} GOV_ValidationResult
 * @property {boolean} isValid - True if the configuration passed all checks.
 * @property {GOV_ValidationError[]} errors - Array of detailed errors if validation failed (empty array if isValid is true).
 */

interface ConfigValidatorInterface {
  validate(config: object): Promise<GOV_ValidationResult>;
}

interface StagingArtifactInterface {
  write_artifact(artifact: StagingArtifactInterface): void;
  get_latest_hash(): string;
  get_artifact(csr_hash: string): object | null;
}

class PersistenceAdapter implements StagingArtifactInterface {
  write_artifact(artifact: StagingArtifactInterface): void {
    // implements write_artifact logic
  }

  get_latest_hash(): string {
    // implements get_latest_hash logic
  }

  get_artifact(csr_hash: string): object | null {
    // implements get_artifact logic
  }
}

class PersistenceValidator {
  async validate(persistenceAdapter: PersistenceAdapter): Promise<GOV_ValidationResult> {
    try {
      const latestHash = await persistenceAdapter.get_latest_hash();
      const artifact = await persistenceAdapter.get_artifact(latestHash);
      if (artifact !== null) {
        return {
          isValid: true,
          errors: [],
        };
      } else {
        throw new Error('No artifact found');
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [
          {
            ruleId: 'validation',
            message: 'Validation error',
          },
        ],
      };
    }
  }
}

// implement IPersistenceAdapter
async function _getStructuralChange(newAdapter: PersistenceAdapter, oldAdapter: PersistenceAdapter): Promise<number> {
  const newArtifact = newAdapter.get_artifact(oldAdapter.get_latest_hash());
  const oldArtifact = oldAdapter.get_artifact(oldAdapter.get_latest_hash());

  if (newArtifact === null || oldArtifact === null) {
    return MAX_STRUCTURAL_CHANGE; // Default to MAX value.
  }

  const [newKeys, oldKeys] = await Promise.all([
    iterateProperties(newArtifact),
    iterateProperties(oldArtifact),
  ]);

  const removedKeys = newKeys.filter((key) => !oldKeys.includes(key));
  const addedKeys = oldKeys.filter((key) => !newKeys.includes(key));

  return Math.min(
    Math.round((removedKeys.length / Object.keys(newArtifact).length) * MAX_STRUCTURAL_CHANGE),
    Math.round((addedKeys.length / Object.keys(oldArtifact).length) * MAX_STRUCTURAL_CHANGE)
  );
}

async function iterateProperties(obj) {
  const result = [];
  for await (const [key, value] of iterProperties(obj)) {
    result.push(key);
  }
  return result;
}

async function semanticDrift(newAdapter: PersistenceAdapter, oldAdapter: PersistenceAdapter): Promise<number> {
  try {
    const newLatestHash = await newAdapter.get_latest_hash();
    const newArtifact = await newAdapter.get_artifact(newLatestHash);
    const oldArtifact = await oldAdapter.get_artifact(oldAdapter.get_latest_hash());

    if (newArtifact === null || oldArtifact === null) {
      return 0; // default to 0 drift if either artifact not found.
    }

    const { transformedNewArtifact, transformedOldArtifact } = await transformObject({
      new: newArtifact,
      old: oldArtifact,
    });

    if (JSON.stringify(transformedNewArtifact) !== JSON.stringify(transformedOldArtifact)) {
      return 1; // If new and old artifact differ, then drift occurs.
    } else {
      return 0; // If new and old artifact are identical, then no drift occurs.
    }
  } catch (error) {
    return 0;
  }
}

async function isWithinDriftThreshold(newAdapter: PersistenceAdapter, oldAdapter: PersistenceAdapter): Promise<boolean> {
  return semanticDrift(newAdapter, oldAdapter) < MAX_SEMANTIC_DRIFT;
}

async function isStructuralChangeWithinThreshold(newAdapter: PersistenceAdapter, oldAdapter: PersistenceAdapter): Promise<boolean> {
  const change = await _getStructuralChange(newAdapter, oldAdapter);
  return change < MAX_STRUCTURAL_CHANGE;
}

async function isWithinSaturationThreshold(newAdapter: PersistenceAdapter, oldAdapter: PersistenceAdapter): Promise<boolean> {
  return (await isWithinDriftThreshold(newAdapter, oldAdapter)) && (await isStructuralChangeWithinThreshold(newAdapter, oldAdapter));
}

async function validateConfig(config: object) {
  if (await isWithinSaturationThreshold(newAdapter, oldAdapter)) {
    const validator = new PersistenceValidator();
    return validator.validate(newAdapter);
  } else {
    throw new Error('Configuration change exceeds saturation threshold');
  }
}