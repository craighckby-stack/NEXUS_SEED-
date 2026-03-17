/**
 * @file AhrsMessage.ts
 * @description Strongly typed interface and highly optimized validator for the AHRS_v1 protocol.
 */

interface AHRS_Header {
    seq: number;
    ts_ns: number;
    frame_id: string;
}

interface AHRS_Data {
    orientation: [number, number, number, number]; // [w, x, y, z] Quaternion
    angular_velocity: [number, number, number];    // [rad/s] X, Y, Z
    linear_acceleration: [number, number, number]; // [m/s^2] X, Y, Z
    calibration_status?: number;
}

export interface AhrsMessage {
    header: AHRS_Header;
    data: AHRS_Data;
}

/**
 * Highly optimized internal function to validate a fixed-length vector of numbers.
 * This function uses recursive abstraction for vector structures and minimizes
 * iteration overhead via a standard 'for' loop.
 */
const validateFixedVector = (arr: any, len: number): boolean => {
    if (!Array.isArray(arr) || arr.length !== len) return false;
    
    for (let i = 0; i < len; i++) {
        if (typeof arr[i] !== 'number') {
            return false;
        }
    }
    return true;
};

/**
 * Validates a potential AhrsMessage against the protocol specification.
 * Optimized for computational efficiency via strict short-circuiting logic and
 * abstracting fixed vector validation.
 *
 * @param msg The object to validate
 * @returns True if the object conforms to AhrsMessage structure
 */
export function validateAhrsMessage(msg: any): boolean {
    // 1. Initial quick checks for null/type
    if (typeof msg !== 'object' || msg === null) return false;
    
    const h = msg.header;
    const d = msg.data;

    // 2. Check header and data existence/type
    if (typeof h !== 'object' || h === null || typeof d !== 'object' || d === null) return false;

    // 3. Header validation (Optimized short-circuit chain)
    if (
        typeof h.seq !== 'number' ||
        typeof h.ts_ns !== 'number' ||
        typeof h.frame_id !== 'string'
    ) {
        return false;
    }

    // 4. Data validation (Abstracted vector checks)
    if (
        !validateFixedVector(d.orientation, 4) ||
        !validateFixedVector(d.angular_velocity, 3) ||
        !validateFixedVector(d.linear_acceleration, 3)
    ) {
        return false;
    }
    
    // 5. Optional property check (only check if defined)
    if (d.calibration_status !== undefined && typeof d.calibration_status !== 'number') {
        return false;
    }

    return true;
}