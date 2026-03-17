// Binary validation utilities
export class BinaryValidator {
  static isValidBinaryString(input: string): boolean {
    return /^[01]+$/.test(input);
  }

  static validateBinaryPacket(packet: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check required fields
    if (!packet.id || typeof packet.id !== 'string') {
      errors.push('INVALID_PACKET_ID');
    }
    
    if (!packet.type || !['INPUT', 'OUTPUT', 'METADATA', 'SIGNAL', 'CONTROL'].includes(packet.type)) {
      errors.push('INVALID_PACKET_TYPE');
    }
    
    if (!packet.payload || typeof packet.payload !== 'object') {
      errors.push('INVALID_PACKET_PAYLOAD');
    }
    
    // Validate checksum if present
    if (packet.checksum) {
      const calculatedChecksum = this.generateChecksum(packet.payload);
      if (packet.checksum !== calculatedChecksum) {
        errors.push('CHECKSUM_MISMATCH');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  static validateBinaryUnit(unit: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!unit.id || typeof unit.id !== 'string') {
      errors.push('INVALID_UNIT_ID');
    }
    
    if (!unit.type || !['PROCESSOR', 'ANALYZER', 'VALIDATOR', 'OPTIMIZER'].includes(unit.type)) {
      errors.push('INVALID_UNIT_TYPE');
    }
    
    if (!unit.status || !['ACTIVE', 'INACTIVE', 'ERROR'].includes(unit.status)) {
      errors.push('INVALID_UNIT_STATUS');
    }
    
    // Validate metrics structure
    if (!unit.metrics || typeof unit.metrics !== 'object') {
      errors.push('INVALID_METRICS');
    } else {
      if (typeof unit.metrics.cycles !== 'number' || unit.metrics.cycles < 0) {
        errors.push('INVALID_CYCLES');
      }
      if (typeof unit.metrics.errors !== 'number' || unit.metrics.errors < 0) {
        errors.push('INVALID_ERRORS');
      }
      if (typeof unit.metrics.efficiency !== 'number' || unit.metrics.efficiency < 0 || unit.metrics.efficiency > 1) {
        errors.push('INVALID_EFFICIENCY');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  static validateLogicGate(gate: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!gate.id || typeof gate.id !== 'string') {
      errors.push('INVALID_GATE_ID');
    }
    
    if (!gate.type || !['AND', 'OR', 'NOT', 'XOR', 'NAND', 'NOR'].includes(gate.type)) {
      errors.push('INVALID_GATE_TYPE');
    }
    
    if (!Array.isArray(gate.inputs)) {
      errors.push('INVALID_GATE_INPUTS');
    } else {
      // Validate input values are boolean
      if (!gate.inputs.every(input => typeof input === 'boolean')) {
        errors.push('INVALID_INPUT_VALUES');
      }
      
      // Validate input count based on gate type
      const expectedInputs = gate.type === 'NOT' ? 1 : 2;
      if (gate.inputs.length !== expectedInputs) {
        errors.push(`INVALID_INPUT_COUNT_${expectedInputs}_EXPECTED`);
      }
    }
    
    if (typeof gate.output !== 'boolean') {
      errors.push('INVALID_GATE_OUTPUT');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  static generateChecksum(data: any): string {
    return Buffer.from(JSON.stringify(data)).toString('base64').slice(0, 16);
  }

  static sanitizeBinaryInput(input: string): string {
    // Remove any non-binary characters
    return input.replace(/[^01]/g, '');
  }

  static validateSystemConfig(config: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!config.processingUnits || typeof config.processingUnits !== 'number' || config.processingUnits < 1) {
      errors.push('INVALID_PROCESSING_UNITS');
    }
    
    if (!config.logicGateCount || typeof config.logicGateCount !== 'number' || config.logicGateCount < 1) {
      errors.push('INVALID_LOGIC_GATE_COUNT');
    }
    
    if (!config.maxPacketSize || typeof config.maxPacketSize !== 'number' || config.maxPacketSize < 1) {
      errors.push('INVALID_MAX_PACKET_SIZE');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Binary error codes
export enum BinaryErrorCode {
  INVALID_CHECKSUM = 'B001',
  INVALID_PACKET_ID = 'B002',
  INVALID_PACKET_TYPE = 'B003',
  INVALID_PACKET_PAYLOAD = 'B004',
  INVALID_UNIT_ID = 'B005',
  INVALID_UNIT_TYPE = 'B006',
  INVALID_UNIT_STATUS = 'B007',
  INVALID_METRICS = 'B008',
  INVALID_CYCLES = 'B009',
  INVALID_ERRORS = 'B010',
  INVALID_EFFICIENCY = 'B011',
  INVALID_GATE_ID = 'B012',
  INVALID_GATE_TYPE = 'B013',
  INVALID_GATE_INPUTS = 'B014',
  INVALID_INPUT_VALUES = 'B015',
  INVALID_GATE_OUTPUT = 'B016',
  INVALID_INPUT_COUNT = 'B017',
  PROCESSING_FAILED = 'B018',
  UNIT_NOT_FOUND = 'B019',
  GATE_NOT_FOUND = 'B020',
  SYSTEM_ERROR = 'B021',
  UNKNOWN_ACTION = 'B022'
}

// Binary error messages
export const BinaryErrorMessages: Record<BinaryErrorCode, string> = {
  [BinaryErrorCode.INVALID_CHECKSUM]: 'Packet checksum validation failed',
  [BinaryErrorCode.INVALID_PACKET_ID]: 'Invalid packet identifier',
  [BinaryErrorCode.INVALID_PACKET_TYPE]: 'Invalid packet type specified',
  [BinaryErrorCode.INVALID_PACKET_PAYLOAD]: 'Invalid packet payload structure',
  [BinaryErrorCode.INVALID_UNIT_ID]: 'Invalid binary unit identifier',
  [BinaryErrorCode.INVALID_UNIT_TYPE]: 'Invalid binary unit type',
  [BinaryErrorCode.INVALID_UNIT_STATUS]: 'Invalid binary unit status',
  [BinaryErrorCode.INVALID_METRICS]: 'Invalid metrics structure',
  [BinaryErrorCode.INVALID_CYCLES]: 'Invalid cycle count (must be >= 0)',
  [BinaryErrorCode.INVALID_ERRORS]: 'Invalid error count (must be >= 0)',
  [BinaryErrorCode.INVALID_EFFICIENCY]: 'Invalid efficiency value (must be 0-1)',
  [BinaryErrorCode.INVALID_GATE_ID]: 'Invalid logic gate identifier',
  [BinaryErrorCode.INVALID_GATE_TYPE]: 'Invalid logic gate type',
  [BinaryErrorCode.INVALID_GATE_INPUTS]: 'Invalid gate inputs structure',
  [BinaryErrorCode.INVALID_INPUT_VALUES]: 'Gate inputs must be boolean values',
  [BinaryErrorCode.INVALID_GATE_OUTPUT]: 'Gate output must be boolean',
  [BinaryErrorCode.INVALID_INPUT_COUNT]: 'Invalid number of gate inputs',
  [BinaryErrorCode.PROCESSING_FAILED]: 'Binary processing operation failed',
  [BinaryErrorCode.UNIT_NOT_FOUND]: 'Binary unit not found',
  [BinaryErrorCode.GATE_NOT_FOUND]: 'Logic gate not found',
  [BinaryErrorCode.SYSTEM_ERROR]: 'System-level error occurred',
  [BinaryErrorCode.UNKNOWN_ACTION]: 'Unknown action specified'
};