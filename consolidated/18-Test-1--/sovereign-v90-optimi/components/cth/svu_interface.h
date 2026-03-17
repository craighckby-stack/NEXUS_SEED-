// components/cth/svu_interface.h

#ifndef SVU_INTERFACE_H
#define SVU_INTERFACE_H

#include <stdint.h>
#include <stddef.h>

// Maximum path length defined by the Trust Boundary Registry (TBR)
#define CTH_MAX_PATH_LEN 512

// Enumeration of structural validation error codes
typedef enum {
    SVU_SUCCESS = 0,
    SVU_ERR_SCHEMA_NOT_FOUND,
    SVU_ERR_TYPE_MISMATCH,
    SVU_ERR_RANGE_VIOLATION,
    SVU_ERR_DEPENDENCY_FAIL,
    SVU_ERR_CORRUPTED_STRUCT
} svu_validation_status_t;

// Structure defining the context for a single PDS validation attempt
typedef struct {
    char config_path[CTH_MAX_PATH_LEN]; // Path resolved via TBR
    const void* artifact_data;          // Pointer to data in SCSA
    size_t data_length;                 // Length of artifact data
    svu_validation_status_t status;     // Output status
} svu_validation_context_t;

/**
 * @brief Executes the Layer 2 (L2) Structural Compliance Assurance check.
 * 
 * This function processes the staged artifact against its corresponding PDS.
 * Must adhere strictly to A-V3.1 rigidity requirements.
 * 
 * @param context Pointer to the validation context structure.
 * @return svu_validation_status_t SVU_SUCCESS or specific failure code.
 */
svu_validation_status_t cth_execute_pds_validation(
    svu_validation_context_t* context
);

#endif // SVU_INTERFACE_H