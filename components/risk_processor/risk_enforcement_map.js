/**
 * risk_enforcement_map.js
 * Pre-processes config/atm_risk_levels.json into an efficient, indexable structure
 * used by the ATM execution pathway for high-frequency risk assessment.
 */

import config from 'config/atm_risk_levels.json';

let enforcementMap = new Map();

/**
 * Generates a Map optimized for O(1) lookup based on the risk ID.
 * @returns {Map<string, object>}
 */
export const initializeEnforcementMap = () => {
  if (enforcementMap.size > 0) return enforcementMap;
  
  // Process standard risk levels
  config.risk_levels.forEach(levelConfig => {
    enforcementMap.set(levelConfig.id, levelConfig);
  });

  // Add default/fallback behavior
  if (config.default_behavior) {
      Object.keys(config.default_behavior).forEach(key => {
          enforcementMap.set(key, config.default_behavior[key]);
      });
  }
  
  console.log('ATM Enforcement Map Initialized.');
  return enforcementMap;
};

export const getRiskProfile = (riskId) => {
    return enforcementMap.get(riskId) || enforcementMap.get('P4_INFO');
};
