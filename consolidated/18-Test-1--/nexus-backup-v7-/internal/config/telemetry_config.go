package config

import (
	"errors"
	"time"
)

// GATMConfig defines the parameters necessary for the Generalized Anomaly Threshold Model (GATM).
type GATMConfig struct {
	// S9LatencyThreshold specifies the maximum acceptable S9 Commit latency.
	// Use time.Duration for idiomatic Go time representation.
	S9LatencyThreshold  time.Duration `json:"s9_latency_threshold" yaml:"s9_latency_threshold"`
	
	// ResourceLoadThreshold specifies the max allowed Resource Load (0.0 to 1.0).
	ResourceLoadThreshold float64       `json:"resource_load_threshold" yaml:"resource_load_threshold"`
	
	// MaxBreaches is the threshold for persistent breaches before RRP/SIH escalation.
	MaxBreaches           int           `json:"max_breaches" yaml:"max_breaches"`
}

// TelemetryConfig defines the generalized configuration necessary for STS operation.
type TelemetryConfig struct {
	Enabled         bool          `json:"enabled" yaml:"enabled"`
	MonitorInterval time.Duration `json:"monitor_interval" yaml:"monitor_interval"`

	GATM GATMConfig `json:"gatm" yaml:"gatm"` // Configuration for the Generalized Anomaly Threshold Model

	MetricsEndpoint string `json:"metrics_endpoint" yaml:"metrics_endpoint"` // Source for raw metrics collection
}

// Validate ensures that the telemetry configuration is sound before use.
func (c *TelemetryConfig) Validate() error {
	if c.MonitorInterval <= 0 {
		return errors.New("telemetry: monitor interval must be positive")
	}

	if c.GATM.ResourceLoadThreshold <= 0.0 || c.GATM.ResourceLoadThreshold > 1.0 {
		return errors.New("gatm: resource load threshold must be between (0.0, 1.0]")
	}
	if c.GATM.S9LatencyThreshold <= 0 {
		return errors.New("gatm: S9 latency threshold must be positive")
	}
	if c.GATM.MaxBreaches <= 0 {
		return errors.New("gatm: maximum breaches must be positive")
	}

	return nil
}

// DefaultTelemetryConfig returns a sensible, predefined default configuration.
func DefaultTelemetryConfig() *TelemetryConfig {
	return &TelemetryConfig{
		Enabled: true,
		MonitorInterval: 5 * time.Second,
		MetricsEndpoint: "http://system.monitord:9090/metrics",
		GATM: GATMConfig{
			S9LatencyThreshold: 800 * time.Millisecond, // 0.8 seconds
			ResourceLoadThreshold: 0.95,
			MaxBreaches: 5,
		},
	}
}

// LoadTelemetryConfig loads the configuration for the STS.
// This function now uses defaults and performs mandatory validation.
func LoadTelemetryConfig() (*TelemetryConfig, error) {
	cfg := DefaultTelemetryConfig()
	
	// In production, external loading utility (YAML/Env/Consul) would override 'cfg' here.

	if err := cfg.Validate(); err != nil {
		// If validation fails even on defaults, something is fundamentally wrong.
		return nil, errors.New("invalid telemetry configuration: " + err.Error())
	}
	return cfg, nil
}