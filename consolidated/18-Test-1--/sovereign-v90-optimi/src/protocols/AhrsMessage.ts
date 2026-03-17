/**
 * @file AhrsMessage.ts
 * @description Strongly typed interface and validator for the AHRS_v1 protocol.
 * AHRS (Attitude and Heading Reference System) provides critical motion data.
 */

// --- Utility Types for Vectors/Quaternions ---

/** A 3-element vector: [X, Y, Z] */
export type Vector3 = [number, number, number];

/** A 4-element quaternion: [w, x, y, z] */
export type Quaternion = [number, number, number, number];


// --- Protocol Interfaces ---

interface AhrsHeader {
    seq: number;       // Monotonic sequence number (unsigned integer)
    ts_ns: number;     // Timestamp in nanoseconds (unsigned integer, typically 64-bit)
    frame_id: string;  // Reference coordinate frame (e.g., 'base_link')
}

interface AhrsData {
    orientation: Quaternion;         // Orientation: [w, x, y, z] Quaternion (unitless)
    angular_velocity: Vector3;       // Angular velocity: [rad/s] X, Y, Z
    linear_acceleration: Vector3;    // Linear acceleration: [m/s^2] X, Y, Z
    
    // Optional diagnostics/status field (typically an unsigned integer)
    calibration_status?: number; 
}

export interface AhrsMessage {
    header: AhrsHeader;
    data: AhrsData;
}


// --- Validator Implementation ---

/**
 * Helper to check if an array is a tuple of numbers of a specific length, 
 * ensuring all elements are finite numbers.
 */
function isNumericTuple(arr: unknown, length: number): arr is Array<number> {
    if (!Array.isArray(arr) || arr.length !== length) {
        return false;
    }
    // Ensure all elements are numbers and finite (no NaN, Infinity)
    return arr.every(item => typeof item === 'number' && Number.isFinite(item));
}

/**
 * Validates a potential AhrsMessage against the protocol specification.
 * Uses a Type Predicate to allow TypeScript to narrow the type upon successful validation.
 * @param msg The object to validate (input type set to 'unknown' for safety)
 * @returns True if the object conforms to AhrsMessage structure and content constraints.
 */
export function validateAhrsMessage(msg: unknown): msg is AhrsMessage {
    if (typeof msg !== 'object' || msg === null) return false;
    
    const potentialMsg = msg as Partial<AhrsMessage>;

    // 1. Check top level structure
    if (!potentialMsg.header || typeof potentialMsg.header !== 'object' || potentialMsg.header === null ||
        !potentialMsg.data || typeof potentialMsg.data !== 'object' || potentialMsg.data === null) {
        return false;
    }

    const h = potentialMsg.header;
    // 2. Check Header structure: Expecting non-negative integers for time/sequence
    if (typeof h.seq !== 'number' || !Number.isInteger(h.seq) || h.seq < 0 ||
        typeof h.ts_ns !== 'number' || !Number.isInteger(h.ts_ns) || h.ts_ns < 0 ||
        typeof h.frame_id !== 'string' || h.frame_id.length === 0) {
        return false;
    }
    
    const d = potentialMsg.data;
    // 3. Check Data structure (using robust tuple validation)
    
    // Quaternions (4 elements)
    if (!isNumericTuple(d.orientation, 4)) return false;
    
    // Vectors (3 elements)
    if (!isNumericTuple(d.angular_velocity, 3)) return false;
    if (!isNumericTuple(d.linear_acceleration, 3)) return false;

    // Optional calibration status check (if present, must be a non-negative integer)
    if (d.calibration_status !== undefined) {
        if (typeof d.calibration_status !== 'number' || !Number.isInteger(d.calibration_status) || d.calibration_status < 0) {
            return false;
        }
    }

    // All checks pass
    return true;
}