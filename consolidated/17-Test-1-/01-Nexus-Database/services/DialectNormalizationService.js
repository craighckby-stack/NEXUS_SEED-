/**
 * Dialect Analysis Normalization Service (DANS)
 * Abstracts lookup, conflict resolution, and caching of dialect/tone mappings.
 */

const mapConfig = require('../config/dial_analysis_map.json');

class DialectNormalizationService {
  constructor() {
    this.lookupMap = this._buildOptimizedMap(mapConfig);
    console.log(`DANS initialized with version ${mapConfig.version}`);
  }

  _buildOptimizedMap(config) {
    const optimizedMap = {};
    const allMappings = [
      ...config.dialect_mappings,
      ...config.tone_and_emotion_indicators,
      ...config.structural_indicators
    ];

    // High-performance hash mapping for direct key lookups
    for (const mapping of allMappings) {
      if (mapping.source_keys) {
        for (const key of mapping.source_keys) {
          optimizedMap[key.toLowerCase()] = mapping;
        }
      }
    }
    
    // Store regex patterns separately for sequential matching if direct hash fails
    this.regexMatchers = config.structural_indicators.filter(m => m.regex);

    return optimizedMap;
  }

  analyze(text) {
    const lowerText = text.toLowerCase();
    let matches = [];

    // 1. Direct Hash Lookup (High Speed)
    if (this.lookupMap[lowerText]) {
      matches.push(this.lookupMap[lowerText]);
    }
    
    // 2. Keyword/Partial Match and Regex Scan (Higher Latency, Higher Recall)
    for (const mappingId in this.lookupMap) {
        if (lowerText.includes(mappingId)) {
            matches.push(this.lookupMap[mappingId]);
        }
    }
    
    for (const regexMapping of this.regexMatchers) {
        const regex = new RegExp(regexMapping.regex, 'i');
        if (regex.test(text)) {
            matches.push(regexMapping);
        }
    }

    // 3. Conflict Resolution (Select highest priority tag)
    if (matches.length > 0) {
        matches.sort((a, b) => b.priority - a.priority);
        return {
            tags: matches.map(m => m.target_tag),
            dominantTag: matches[0].target_tag
        };
    }

    return { tags: [], dominantTag: 'NONE' };
  }
}

module.exports = new DialectNormalizationService();
