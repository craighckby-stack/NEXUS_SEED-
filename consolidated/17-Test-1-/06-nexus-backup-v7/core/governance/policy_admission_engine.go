package governance

import (
	"encoding/json"
	"fmt"
	"os"
	"strconv"
	"strings"
)

// ConstraintEvaluatorFunc defines the signature for a function that evaluates a specific constraint key.
// It takes the system context and the required policy constraint definition.
// It returns true if satisfied, or an error if evaluation fails.
type ConstraintEvaluatorFunc func(context SystemContext, constraint PolicyConstraint) (bool, error)

// PolicyAdmissionEngine is responsible for ingesting isolation manifests and evaluating workload requests against defined policies.
// Policies are stored as a map for O(1) lookup.
// The ConstraintRegistry allows for dynamic, decoupled constraint evaluation logic.
type PolicyAdmissionEngine struct {
	ManifestPath string
	Policies     map[string]IsolationPolicy
	ConstraintRegistry map[string]ConstraintEvaluatorFunc
}

// manifestWrapper assists in decoding the expected V2.0-POLI-STRUCT schema.
type manifestWrapper struct {
	SchemaVersion string            `json:"schema_version"`
	Policies      []IsolationPolicy `json:"policies"`
}

// evaluateBoolean is a reusable helper for simple boolean checks.
func evaluateBoolean(current bool, requiredStr string) (bool, error) {
	required, err := strconv.ParseBool(requiredStr)
	if err != nil {
		return false, fmt.Errorf("constraint value '%s' is not a valid boolean: %w", requiredStr, err)
	}
	return current == required, nil
}

// evaluateNumeric is a reusable helper for evaluating numerical constraints (e.g., minimum memory, version checks).
// It parses operators like >=, <=, >, <, or = from the required string.
func evaluateNumeric(current int, constraint PolicyConstraint) (bool, error) {
	reqStr := strings.TrimSpace(constraint.Required)
	var op string
	var valStr string

	// Parse operator
	if len(reqStr) >= 2 {
		if reqStr[:2] == ">=" || reqStr[:2] == "<=" || reqStr[:2] == "!=" {
			op = reqStr[:2]
			valStr = reqStr[2:]
		}
	}
	if op == "" && len(reqStr) >= 1 {
		if reqStr[0] == '>' || reqStr[0] == '<' {
			op = reqStr[:1]
			valStr = reqStr[1:]
		} else if reqStr[0] == '=' {
			// Handle simple equality or error on unrecognized single character ops
			op = "="
			valStr = reqStr[1:]
		}
	}
	if op == "" { 
		// If no operator is explicitly found, assume strict equality
		op = "="
		valStr = reqStr
	}

	requiredVal, err := strconv.Atoi(strings.TrimSpace(valStr))
	if err != nil {
		return false, fmt.Errorf("numeric constraint value '%s' (parsed from %s) is not a valid integer: %w", valStr, constraint.Required, err)
	}

	// Perform comparison
	switch op {
	case ">=":
		return current >= requiredVal, nil
	case "<=":
		return current <= requiredVal, nil
	case ">":
		return current > requiredVal, nil
	case "<":
		return current < requiredVal, nil
	case "=", "==":
		return current == requiredVal, nil
	default:
		// Should be unreachable if parsing logic is sound
		return false, fmt.Errorf("unsupported comparison operator '%s' in constraint '%s'", op, constraint.Required)
	}
}


// RegisterConstraint adds an evaluator function for a specific constraint key.
func (pae *PolicyAdmissionEngine) RegisterConstraint(key string, fn ConstraintEvaluatorFunc) {
	pae.ConstraintRegistry[key] = fn
}

// NewPolicyAdmissionEngine loads the manifest and initializes the engine, including the constraint registry.
func NewPolicyAdmissionEngine(path string) (*PolicyAdmissionEngine, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read isolation manifest at %s: %w", path, err)
	}

	var wrapper manifestWrapper
	if err := json.Unmarshal(data, &wrapper); err != nil {
		return nil, fmt.Errorf("failed to parse policy manifest JSON: %w", err)
	}

	if wrapper.SchemaVersion != "V2.0-POLI-STRUCT" {
		// Fixed previously unhandled 'tErrorf' reference.
		return nil, fmt.Errorf("unsupported policy manifest schema version: %s", wrapper.SchemaVersion)
	}

	policyMap := make(map[string]IsolationPolicy)
	for _, policy := range wrapper.Policies {
		policyMap[policy.ID] = policy
	}

	engine := &PolicyAdmissionEngine{
		ManifestPath: path,
		Policies:     policyMap,
		ConstraintRegistry: make(map[string]ConstraintEvaluatorFunc),
	}

	// Initialize and register default evaluators	
	engine.registerDefaultEvaluators()

	return engine, nil
}

// registerDefaultEvaluators sets up the common constraint logic dynamically, decoupling evaluation from the core loop.
// Constraint values (PolicyConstraint.Required) are treated as strings to allow flexible comparison logic.
func (pae *PolicyAdmissionEngine) registerDefaultEvaluators() {

	// Hardware Boolean Evaluators (now using the package function helper)
	pae.RegisterConstraint("Hardware.TEE_Support", func(context SystemContext, constraint PolicyConstraint) (bool, error) {
		return evaluateBoolean(context.Hardware.TEE_Support, constraint.Required)
	})

	pae.RegisterConstraint("Hardware.SR_IOV_Enabled", func(context SystemContext, constraint PolicyConstraint) (bool, error) {
		return evaluateBoolean(context.Hardware.SR_IOV_Enabled, constraint.Required)
	})
	
	// --- Numerical Constraints Registration ---
	// Register evaluator for numerical constraints based on resources (assuming TotalMemoryKB exists in SystemContext.Hardware)
	pae.RegisterConstraint("Resource.MinMemoryKB", func(context SystemContext, constraint PolicyConstraint) (bool, error) {
		// Example usage: constraint.Required might be ">= 4096"
		// Assumes context.Hardware.TotalMemoryKB is available and integer-typed.
		currentMemory := context.Hardware.TotalMemoryKB 
		return evaluateNumeric(currentMemory, constraint)
	})
	
	// Future constraints (e.g., minimum version, required resource level) would be registered here.
}

// EvaluateRequest checks if the requested policy_id can be supported on the target hardware context.
func (pae *PolicyAdmissionEngine) EvaluateRequest(policyID string, context SystemContext) (bool, error) {
	policy, ok := pae.Policies[policyID]
	if !ok {
		return false, fmt.Errorf("requested policy ID '%s' not found in manifest", policyID)
	}

	// Evaluate constraints against the SystemContext using the dynamic registry
	for _, constraint := range policy.Constraints {
		evaluator, found := pae.ConstraintRegistry[constraint.Key]
		if !found {
			// If a mandatory constraint key is unrecognized, admission must fail to ensure integrity.
			return false, fmt.Errorf("unhandled or unsupported constraint key '%s' required by policy %s", constraint.Key, policyID)
		}

		satisfied, err := evaluator(context, constraint)
		if err != nil {
			// Evaluation failed due to malformed constraint definition or unexpected context format
			return false, fmt.Errorf("policy '%s' admission failed during evaluation of constraint '%s': %w", policyID, constraint.Key, err)
		}

		if !satisfied {
			return false, fmt.Errorf("policy '%s' admission failed: constraint '%s' (Required: %s) not met by system context", policyID, constraint.Key, constraint.Required)
		}
	}

	return true, nil
}