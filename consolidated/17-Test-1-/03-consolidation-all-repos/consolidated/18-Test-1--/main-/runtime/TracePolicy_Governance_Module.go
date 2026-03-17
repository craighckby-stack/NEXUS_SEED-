package governance

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"
)

// Logger defines the interface required for internal component logging.
type Logger interface {
	Infof(format string, args ...interface{})
	Errorf(format string, args ...interface{})
	Warnf(format string, args ...interface{})
}

// GovernanceState holds the currently enforced configurations, fetched dynamically.
type GovernanceState struct {
	SamplingRates map[string]float64 `json:"sampling_rates"` // Key: Span/Service Name, Value: Sample probability (0.0 - 1.0)
	MaskingRules  []string           `json:"masking_rules"`  // Regular expressions or rule names for data redaction
	LastUpdated   time.Time
	mu            sync.RWMutex // Protects read/write access to policy data
}

// GetPolicies retrieves the current immutable governance state.
func (gs *GovernanceState) GetPolicies() (map[string]float64, []string) {
	gs.mu.RLock()
	defer gs.mu.RUnlock()
	return gs.SamplingRates, gs.MaskingRules
}

// PolicySource defines the contract for fetching remote policy data (Dependency Injection).
type HTTPClient interface {
	Get(ctx context.Context, url string) ([]byte, error)
}

// Concrete HTTP client implementation.
type DefaultHTTPClient struct {
	Client *http.Client
}

// Get performs an HTTP GET request using standard libraries, respecting context cancellation.
func (d *DefaultHTTPClient) Get(ctx context.Context, url string) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := d.Client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("http request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("received non-OK status code (%d) from %s", resp.StatusCode, url)
	}

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	return data, nil
}

// TracePolicyGovernanceModule handles policy fetching, validation, and state storage.
type TracePolicyGovernanceModule struct {
	ConfigURL string
	State     *GovernanceState
	Client    HTTPClient
	Log       Logger
}

// NewTracePolicyGovernanceModule initializes and returns a configured module instance.
func NewTracePolicyGovernanceModule(url string, client HTTPClient, logger Logger) *TracePolicyGovernanceModule {
    if client == nil {
        client = &DefaultHTTPClient{
            Client: &http.Client{Timeout: 5 * time.Second},
        }
    }
    if logger == nil {
        // Fallback for scenarios where a default logger isn't injected, though discouraged
        // In a real system, this would panic or use a NoOp logger.
    }
    return &TracePolicyGovernanceModule{
        ConfigURL: url,
        State:     &GovernanceState{
            SamplingRates: make(map[string]float64),
            MaskingRules:  make([]string, 0),
        },
        Client: client,
        Log:    logger,
    }
}

// FetchAndUpdate attempts to retrieve the latest policies and update the state atomically.
// It includes validation checks for JSON structure integrity.
func (p *TracePolicyGovernanceModule) FetchAndUpdate(ctx context.Context) error {
	policyData, err := p.Client.Get(ctx, p.ConfigURL)
	if err != nil {
		p.Log.Errorf("Error fetching policies from %s: %v", p.ConfigURL, err)
		return fmt.Errorf("policy fetch error: %w", err)
	}

	var newPolicies GovernanceState // Use the main state struct for unmarshaling integrity check

	// Unmarshal and basic structural validation
	if err := json.Unmarshal(policyData, &newPolicies); err != nil {
		p.Log.Warnf("Fetched invalid JSON structure. Retaining previous policies. Error: %v", err)
		return fmt.Errorf("invalid JSON policy structure: %w", err)
	}
    
	// Update state atomically
	p.State.mu.Lock()
	p.State.SamplingRates = newPolicies.SamplingRates
	p.State.MaskingRules = newPolicies.MaskingRules
	p.State.LastUpdated = time.Now()
	p.State.mu.Unlock()
    
    p.Log.Infof("Governance policies updated successfully. Rules: %d, Sampling rates: %d", 
        len(p.State.MaskingRules), len(p.State.SamplingRates))
	return nil
}

// StartPolicyPolling begins the background task to update policies gracefully.
// It executes the initial fetch immediately and then ticks at the specified interval.
func (p *TracePolicyGovernanceModule) StartPolicyPolling(ctx context.Context, interval time.Duration) {
	ticker := time.NewTicker(interval)

    p.Log.Infof("Starting policy governance polling (interval: %v) from %s", interval, p.ConfigURL)

    // Initial fetch to ensure readiness
    if err := p.FetchAndUpdate(ctx); err != nil {
        p.Log.Errorf("Initial policy fetch failed: %v", err)
        // Continue polling loop, assuming eventual consistency will be achieved.
    }
    
	go func() {
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				p.Log.Infof("Governance policy polling stopped gracefully.")
				return
			case <-ticker.C:
				// Use a short, bounded context for the fetch operation, ensuring the loop doesn't block permanently.
                pollCtx, cancel := context.WithTimeout(ctx, interval / 2)
				if err := p.FetchAndUpdate(pollCtx); err != nil {
                    // Specific errors are logged inside FetchAndUpdate.
				}
                cancel() 
			}
		}
	}()
}