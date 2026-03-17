/**
 * @file AhrsCodec.ts
 * @description Provides efficient binary serialization and deserialization 
 *              (encoding/decoding) utilities for AhrsMessage.
 * 
 * NOTE: This codec assumes a fixed binary structure (Little Endian):
 * Offset (Bytes) | Field Type      | Description
 * ---------------|-----------------|------------------------------------------------
 * 0              | Uint32          | Header.seq
 * 4              | Float64         | Header.ts_ns (due to standard JS 'number' type)
 * 12             | String (32 bytes)| Header.frame_id (Fixed length, padded with zeros)
 * 44             | Float64[4]      | Data.orientation (w, x, y, z)
 * 76             | Float64[3]      | Data.angular_velocity (X, Y, Z)
 * 100            | Float64[3]      | Data.linear_acceleration (X, Y, Z)
 * 124            | Uint8           | Data.calibration_status (0 if undefined)
 * 125            | -               | Total Buffer Size
 */

import { AhrsMessage, Quaternion, Vector3 } from './AhrsMessage';

// Total fixed size for the binary buffer (125 bytes)
const BUFFER_SIZE = 125;
const FRAME_ID_LENGTH = 32; // Fixed bytes for frame_id string

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8');

// Helper to write a numerical tuple into the DataView
function writeTuple(view: DataView, offset: number, tuple: Vector3 | Quaternion): number {
    for (const value of tuple) {
        view.setFloat64(offset, value, true); // Little Endian
        offset += 8; 
    }
    return offset; 
}

// Helper to read a numerical tuple from the DataView
function readTuple<T extends number[]>(view: DataView, offset: number, length: number): { data: T, nextOffset: number } {
    const data: number[] = [];
    for (let i = 0; i < length; i++) {
        data.push(view.getFloat64(offset, true)); // Little Endian
        offset += 8;
    }
    return { data: data as T, nextOffset: offset };
}

/**
 * Encodes an AhrsMessage into a fixed-size binary ArrayBuffer.
 */
export function encodeAhrsMessage(msg: AhrsMessage): ArrayBuffer {
    const buffer = new ArrayBuffer(BUFFER_SIZE);
    const view = new DataView(buffer);
    let offset = 0;

    // === Header ===
    view.setUint32(offset, msg.header.seq, true); offset += 4;
    view.setFloat64(offset, msg.header.ts_ns, true); offset += 8;

    // frame_id (fixed length 32 bytes, ASCII/UTF-8)
    const frameIdBuffer = encoder.encode(msg.header.frame_id);
    const writeLength = Math.min(frameIdBuffer.length, FRAME_ID_LENGTH);
    new Uint8Array(buffer).set(frameIdBuffer.subarray(0, writeLength), offset);
    offset += FRAME_ID_LENGTH; // Skip the reserved space

    // === Data ===
    offset = writeTuple(view, offset, msg.data.orientation);
    offset = writeTuple(view, offset, msg.data.angular_velocity);
    offset = writeTuple(view, offset, msg.data.linear_acceleration);

    // calibration_status (Uint8, 0 if missing)
    view.setUint8(offset, msg.data.calibration_status ?? 0); offset += 1;
    
    // Sanity check
    if (offset !== BUFFER_SIZE) {
        console.warn(`AHRS encoding finished at ${offset} bytes, expected ${BUFFER_SIZE}`);
    }
    
    return buffer;
}

/**
 * Decodes an ArrayBuffer back into an AhrsMessage.
 */
export function decodeAhrsMessage(buffer: ArrayBuffer): AhrsMessage {
    if (buffer.byteLength !== BUFFER_SIZE) {
        throw new Error(`Invalid buffer size for AhrsMessage decoding: expected ${BUFFER_SIZE}, got ${buffer.byteLength}`);
    }

    const view = new DataView(buffer);
    let offset = 0;

    // === Header ===
    const seq = view.getUint32(offset, true); offset += 4;
    const ts_ns = view.getFloat64(offset, true); offset += 8;

    // frame_id
    const frameIdBytes = new Uint8Array(buffer, offset, FRAME_ID_LENGTH);
    const frameId = decoder.decode(frameIdBytes).replace(/\u0000+$/g, ''); // Remove null padding
    offset += FRAME_ID_LENGTH;

    // === Data ===
    const { data: orientation, nextOffset: o1 } = readTuple<Quaternion>(view, offset, 4);
    offset = o1;
    const { data: angular_velocity, nextOffset: o2 } = readTuple<Vector3>(view, offset, 3);
    offset = o2;
    const { data: linear_acceleration, nextOffset: o3 } = readTuple<Vector3>(view, offset, 3);
    offset = o3;

    // calibration_status
    const calibration_status_raw = view.getUint8(offset);
    const calibration_status = calibration_status_raw === 0 ? undefined : calibration_status_raw;
    
    return {
        header: { seq, ts_ns, frame_id: frameId },
        data: {
            orientation,
            angular_velocity,
            linear_acceleration,
            calibration_status
        }
    };
}