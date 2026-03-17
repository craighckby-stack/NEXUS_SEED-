package governance

// --- Governance Policy Definitions ---

// PolicyConstraint represents a hardware or software requirement for a specific policy level.
type PolicyConstraint struct {
    Key       string `json:"key"`        // e.g., "Hardware.TEE_Support"
    Required  bool   `json:"required"`   // e.g., true
    MinVersion string `json:"min_version,omitempty"` // For versioned constraints
}

// IsolationPolicy defines a specific security posture level (e.g., L5, L3).
type IsolationPolicy struct {
    ID          string             `json:"id"`
    Description string             `json:"description"`
    Constraints []PolicyConstraint `json:"constraints"`
}

// --- System Context Definitions ---

// HardwareContext captures physical device capabilities required for admission.
type HardwareContext struct {
    TEE_Support      bool   `json:"tee_support"`      // Trusted Execution Environment
    SR_IOV_Enabled   bool   `json:"sr_iov_enabled"`   // Single Root I/O Virtualization
    CPUArchitecture  string `json:"cpu_architecture"` 
}

// OSContext captures operating system environment details (stubbed for future expansion).
type OSContext struct {
    KernelVersion string `json:"kernel_version"`
}

// SystemContext aggregates the current operational state of the target platform, checked against policies.
type SystemContext struct {
    Hardware HardwareContext `json:"hardware"`
    OS       OSContext       `json:"os"`
    CPESConfiguration map[string]interface{} `json:"cpes_configuration"` // Configuration and Environment State
}