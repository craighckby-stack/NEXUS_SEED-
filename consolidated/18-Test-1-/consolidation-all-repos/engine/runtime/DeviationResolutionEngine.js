/**
 * DeviationResolutionEngine
 * Consumes governance_deviation_resolution_matrix.json to determine and execute the appropriate resolution protocol.
 * Uses a priority queue for rule matching to ensure high-priority protocols are checked first.
 */
class DeviationResolutionEngine {
  constructor(resolutionMatrix) {
    this.matrix = resolutionMatrix;
    this.rules = resolutionMatrix.deviation_rules.sort((a, b) => b.priority_rank - a.priority_rank);
    this.protocols = resolutionMatrix.protocols;
  }

  /**
   * Matches incident context against defined rules.
   * @param {object} incident - The detected deviation event object (severity, type, source_tag).
   * @returns {object|null} The necessary resolution protocol details, or null if no match.
   */
  resolve(incident) {
    for (const rule of this.rules) {
      const { match_condition, resolution } = rule;
      
      // 1. Severity Check
      const severityMatch = match_condition.severity.includes(incident.severity);
      if (!severityMatch) continue;

      // 2. Type Regex Check
      const typeRegexMatch = new RegExp(match_condition.type_regex).test(incident.type);
      if (!typeRegexMatch) continue;

      // 3. Source Tag Check (Assumes incident source includes one of the required tags)
      const sourceTagMatch = match_condition.source_tag.some(tag => incident.source_tag.includes(tag));
      if (!sourceTagMatch) continue;

      // All conditions met: Return the structured protocol
      const protocol = this.protocols[resolution.protocol_id];
      return { ...resolution, ...protocol };
    }
    return null; // No applicable rule found
  }

  executeResolution(resolutionDetails, incident) {
    console.log(`Executing strategy: ${resolutionDetails.strategy} for incident ID: ${incident.id}`);
    // Implementation details for action execution (e.g., triggering HardHalt utility) goes here
    // Must include timeout and fallback handling defined in the protocol.
  }
}

module.exports = DeviationResolutionEngine;
