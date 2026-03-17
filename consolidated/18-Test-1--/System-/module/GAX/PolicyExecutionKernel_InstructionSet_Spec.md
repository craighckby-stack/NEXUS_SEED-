## POLICY EXECUTION KERNEL (PEK) INSTRUCTION SET SPECIFICATION V1.0 (GAX-PCLD/IR)

**Mandate:** The PCLD Intermediate Representation (PCLD-IR) must strictly adhere to this standardized instruction set, designed for maximum determinism, auditability, and minimal attack surface within the Certified Execution Environment (CEE).

### 1.0 CORE DESIGN PRINCIPLES
1.  **Immutability:** Execution must not modify TEDS/TVCR inputs, only process and derive the PRM. 
2.  **No I/O:** Zero external communication or system calls allowed (excluding IVU/MGS interfaces). 
3.  **Finite State:** Guaranteed termination due to RGU enforcement (V3.0 Section 3.0).

### 2.0 PCLD-IR ENVIRONMENT
*   **Registers:** R0 (Result/Accumulator), R1-R7 (General Purpose), SP (Stack Pointer, highly restricted depth).
*   **Memory:** Dedicated, pre-allocated, read-only TEDS/TVCR data buffer. Writable temporary computation scratchpad (size limited by PCLD-IR metadata).

### 3.0 MANDATORY INSTRUCTION SET (Subset Example)

| OpCode | Instruction | Description | Deterministic Cost Units |
|:---|:---|:---|:---:|
| 0x01 | LOAD R_i, [addr] | Loads 64-bit value from data buffer address into Register R_i. | 1 |
| 0x02 | STORE R_i, [tmp_addr] | Stores R_i to temporary scratchpad memory. | 1 |
| 0x10 | ADD R_i, R_j | R_i = R_i + R_j. Fails on overflow (PCIFR trigger). | 1 |
| 0x11 | SUB R_i, R_j | R_i = R_i - R_j. Fails on underflow (PCIFR trigger). | 1 |
| 0x1A | CMP R_i, R_j | Compares registers, setting conditional flags. | 1 |
| 0x20 | JMP.COND label | Conditional jump based on CMP flags. Jumps are restricted to predefined segments (Proof-Carrying Logic boundaries). | 2 |
| 0x80 | HASH.DATA R_i, [addr] | Computes SHA-256 slice of data buffer, storing result in R_i. Used for artifact identification. | N* |
| 0xFF | HALT | Terminates execution and signals MGS for PRM generation. | 0 |

*All arithmetic operations must be defined as overflow/underflow safe (checked arithmetic), triggering a PCIFR on failure.*