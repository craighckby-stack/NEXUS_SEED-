// Package cel_host defines the interface for loading custom functions into the CEL runtime.
package cel_host

import (
	"context"
	"github.com/google/cel-go/cel"
	"github.com/google/cel-go/common/types"
	"github.com/google/cel-go/interpreter"
)

// HostFunctionRegistry defines the standardized interface for resolving custom CEL functions
// whose definitions are listed in the cel_runtime_config.json.
type HostFunctionRegistry interface {
	// RegisterFunctions takes a CEL environment and adds the necessary extension functions
	// based on the provided configuration/metadata.
	RegisterFunctions(envOptions []cel.EnvOption, runtimeConfig RuntimeConfiguration) ([]cel.EnvOption, error)

	// ExecuteCustomFunction handles the dispatch and execution of a specific named function.
	// This implementation ensures that function implementations are sandboxed or executed
	// safely, respecting defined cost limits.
	ExecuteCustomFunction(ctx context.Context, name string, args []interpreter.PrerecordedData) (types.Val, error)
}

// RuntimeConfiguration is a structure reflecting the `available_functions` block from the config.
type RuntimeConfiguration struct {
	AvailableFunctions []struct {
		Name string
		ImplementationRef string
		CostFactor int
	}
}