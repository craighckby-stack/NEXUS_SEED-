package governance

import (
	"encoding/json"
	"fmt"
	"os"
	"strconv"
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
	// Generic evaluator for mandatory boolean hardware flags
	boolEvaluator := func(current bool, requiredStr string) (bool, error) {
		required, err := strconv.ParseBool(requiredStr)
		if err != nil {
			return false, fmt.Errorf("constraint value '%s' is not a valid boolean: %w", requiredStr, err)
		}
		return current == required, nil
	}

	pae.RegisterConstraint("Hardware.TEE_Support", func(context SystemContext, constraint PolicyConstraint) (bool, error) {
		return boolEvaluator(context.Hardware.TEE_Support, constraint.Required)
	})

	pae.RegisterConstraint("Hardware.SR_IOV_Enabled", func(context SystemContext, constraint PolicyConstraint) (bool, error) {
		return boolEvaluator(context.Hardware.SR_IOV_Enabled, constraint.Required)
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