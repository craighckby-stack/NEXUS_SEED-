package config

import (
	"testing"
	"time"
)

func TestTelemetryConfig_Validate(t *testing.T) {
	// Test case setup
	tests := []struct {
		name    string
		config  *TelemetryConfig
		wantErr bool
	}{
		{
			name:    "Valid Configuration",
			config:  DefaultTelemetryConfig(),
			wantErr: false,
		},
		{
			name: "Invalid Monitor Interval",
			config: &TelemetryConfig{
				Enabled: false,
				MonitorInterval: 0, 
				GATM: GATMConfig{S9LatencyThreshold: 1 * time.Second, ResourceLoadThreshold: 0.5, MaxBreaches: 1},
			},
			wantErr: true,
		},
		{
			name: "Invalid Resource Load (Negative)",
			config: &TelemetryConfig{
				MonitorInterval: 5 * time.Second,
				GATM: GATMConfig{S9LatencyThreshold: 1 * time.Second, ResourceLoadThreshold: -0.1, MaxBreaches: 1},
			},
			wantErr: true,
		},
		{
			name: "Invalid S9 Latency (Zero)",
			config: &TelemetryConfig{
				MonitorInterval: 5 * time.Second,
				GATM: GATMConfig{S9LatencyThreshold: 0, ResourceLoadThreshold: 0.5, MaxBreaches: 1},
			},
			wantErr: true,
		},
		{
			name: "Invalid Max Breaches (Zero)",
			config: &TelemetryConfig{
				MonitorInterval: 5 * time.Second,
				GATM: GATMConfig{S9LatencyThreshold: 1 * time.Second, ResourceLoadThreshold: 0.5, MaxBreaches: 0},
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.config.Validate()
			if (err != nil) != tt.wantErr {
				t.Errorf("Validate() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestDefaultTelemetryConfig(t *testing.T) {
	cfg := DefaultTelemetryConfig()
	if err := cfg.Validate(); err != nil {
		t.Errorf("DefaultTelemetryConfig should always be valid, but got error: %v", err)
	}
}