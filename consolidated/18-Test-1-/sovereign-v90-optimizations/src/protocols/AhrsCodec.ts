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

/**
 * Interface definition for the extracted binary serialization tool.
 * NOTE: In a real environment, this tool would be imported or injected.
 */
interface IFloat64TupleCodec {
    /** Writes a sequence of Float64 values (8 bytes each, Little Endian). Returns new offset. */
    writeTuple(view: DataView, offset: number, tuple: number[]): number;
    /** Reads a sequence of Float64 values (8 bytes each, Little Endian). Returns data and new offset. */
    readTuple<T extends number[]>(view: DataView, offset: number, length: number): { data: T, nextOffset: number };
}

// Assuming the AGI runtime provides the concrete implementation of this tool.
declare const Float64TupleCodec: IFloat64TupleCodec;

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
    // Use external codec for numerical tuples
    offset = Float64TupleCodec.writeTuple(view, offset, msg.data.orientation);
    offset = Float64TupleCodec.writeTuple(view, offset, msg.data.angular_velocity);
    offset = Float64TupleCodec.writeTuple(view, offset, msg.data.linear_acceleration);

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
    // Use external codec for numerical tuples
    // Declare tuple variables using 'let' to allow sequential assignment while updating 'offset'.
    let orientation: Quaternion;
    let angular_velocity: Vector3;
    let linear_acceleration: Vector3;

    // Read tuples and update offset simultaneously using assignment destructuring
    ({ data: orientation, nextOffset: offset } = Float64TupleCodec.readTuple<Quaternion>(view, offset, 4));
    ({ data: angular_velocity, nextOffset: offset } = Float64TupleCodec.readTuple<Vector3>(view, offset, 3));
    ({ data: linear_acceleration, nextOffset: offset } = Float64TupleCodec.readTuple<Vector3>(view, offset, 3));

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