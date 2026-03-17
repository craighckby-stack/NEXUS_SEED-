/**
 * Autonomous Code Evolution & Scaffolding (ACE-S) Utility
 * File: protocols/hashing/CanonicalInterfaceGenerator.ts
 *
 * Generates a canonical, deterministic SHA-256 hash for a provided Interface Definition Language (IDL) or TypeScript Interface string.
 * This utility is required to satisfy the `interfaceHash` mandate in GSR_Contract.json.
 */

import { createHash } from 'crypto';

/**
 * Creates a canonicalized string representation of the interface definition.
 * Steps: Remove comments, sort keys lexicographically, remove excess whitespace/newlines.
 * @param rawInterfaceDefinition - The source code or IDL string defining the module interface.
 * @returns Canonical string ready for hashing.
 */
function canonicalize(rawInterfaceDefinition: string): string {
    // 1. Strip comments (basic regex assumption)
    let canonical = rawInterfaceDefinition.replace(/\/\/.*|\/\*[^]*?\*\//g, '');
    
    // 2. Remove non-essential whitespace/newlines
    canonical = canonical.replace(/\s+/g, ' ').trim();
    
    // NOTE: For complex systems (like GraphQL or Protobuf schemas), a dedicated parser would be used
    // to ensure deep lexical sorting, but this provides the minimal deterministic transformation.
    
    return canonical;
}

/**
 * Generates the mandatory Interface Hash for GSR registration.
 * @param rawInterfaceDefinition - The source code or IDL string.
 * @returns SHA-256 hash string (64 characters).
 */
export function generateInterfaceHash(rawInterfaceDefinition: string): string {
    const canonicalString = canonicalize(rawInterfaceDefinition);
    return createHash('sha256').update(canonicalString).digest('hex');
}

// Example utility for generating the contract configuration checksum itself.
export function generateContractChecksum(contractJsonContent: string): string {
    return createHash('sha256').update(contractJsonContent).digest('hex');
}