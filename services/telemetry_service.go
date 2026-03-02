// Package telemetry implements the Sovereign Telemetry Service (STS).
// STS provides continuous, real-time observability on systemic health and I/O status,
// necessary for proactive RRP/SIH trigger analysis based on GATM thresholds.
package telemetry

import (
	"context"
	"fmt"
	"math/rand"
	"sync"
	"time"
)

// TelemetryData holds the essential metrics monitored by STS.
type TelemetryData struct {
	Timestamp                time.Time `json:"timestamp"`
	PipelineLatency_S9       float64   `json:"pipeline_latency_s9"`       // Time since last successful S9 Commit (seconds)
	ResourceLoad_Pct         float64   `json:"resource_load_pct"`         // Current CPU/Memory utilization average (0.0 to 1.0)
	IntegrityHashChainStatus string    `json:"hash_chain_status"`       // CRoT integrity anchor status (e.g., "SYNCED", "DIVERGED")
	GATMBreachCount          int       `json:"gatm_breach_count"`       // Consecutive breaches against GATM rules (cumulative)
	IsGATMViolating          bool      `json:"is_gatm_violating"`       // Instantaneous GATM rule breach status
}

// Define Constant Default Values
const (
	defaultInterval    = 5 * time.Second
	defaultLatency     = 1.0  // 1.0 second threshold
	defaultLoad        = 0.8  // 80% load threshold
	defaultMaxBreaches = 5
	// The factor used to damp/decay the cumulative GATM breach count when conditions stabilize.
	defaultDecayFactor = 0.7
)

// STSConfiguration holds adjustable runtime parameters for the Telemetry Service.
type STSConfiguration struct {
	DefaultInterval   time.Duration
	LatencyThreshold  float64 // seconds
	LoadThreshold     float64 // percentage (0.0 - 1.0)
	MaxBreaches       int     // count
	BreachDecayFactor float64 // Damping factor (0.0 - 1.0)
}

// STS provides the mandated monitoring interface.
type STS interface {
	Run(ctx context.Context) error
	Monitor(ctx context.Context, interval time.Duration) <-chan TelemetryData
	GetHealthStatus() TelemetryData
	CheckGATMViolation() bool
}

// TelemetrySource defines the interface for collecting raw system metric data.
// This allows mocking and abstraction of different data ingestion methods (e.g., Kube probes, proprietary APIs).
type TelemetrySource interface {
	Collect(ctx context.Context) (TelemetryData, error)
}

// simulatedTelemetrySource is a temporary data provider for initialization and testing.
type simulatedTelemetrySource struct{}

// Collect simulates fetching metrics from system endpoints.
func (*simulatedTelemetrySource) Collect(ctx context.Context) (TelemetryData, error) {
	// Use seeded time for better simulation realism in production (if time.Now is used to set seed).
	// NOTE: rand is inherently not safe for crypto/concurrent use, but acceptable for simulation.
	newData := TelemetryData{
		Timestamp:                time.Now(),
		PipelineLatency_S9:       rand.Float64() * 1.5, // Simulating 0.0 to 1.5 seconds
		ResourceLoad_Pct:         rand.Float64(),       // Simulating 0.0 to 1.0 load
		IntegrityHashChainStatus: "SYNCED",
	}
	// 10% chance of generating a failure state for simulation
	if rand.Float64() < 0.1 { 
		if rand.Intn(2) == 0 {
			newData.IntegrityHashChainStatus = "DIVERGED"
		} else {
			newData.PipelineLatency_S9 = 2.5 // Artificially high latency
		}
	}

	return newData, nil
}

// sovereignTelemetryService is the concrete, thread-safe implementation of STS.
type sovereignTelemetryService struct {
	cfg    STSConfiguration
	data   TelemetryData
	mu     sync.RWMutex
	source TelemetrySource
}

// NewSovereignTelemetryService initializes the telemetry service.
// It expects configuration parameters crucial for GATM assessment, applying defaults if zero-valued.
func NewSovereignTelemetryService(cfg STSConfiguration, src TelemetrySource) STS {
	// Apply sane defaults if configuration is zero-valued or missing.
	if cfg.DefaultInterval == 0 {
		cfg.DefaultInterval = defaultInterval
	}
	if cfg.LatencyThreshold == 0 {
		cfg.LatencyThreshold = defaultLatency
	}
	if cfg.LoadThreshold == 0 {
		cfg.LoadThreshold = defaultLoad
	}
	if cfg.MaxBreaches == 0 {
		cfg.MaxBreaches = defaultMaxBreaches
	}
	if cfg.BreachDecayFactor == 0 {
		cfg.BreachDecayFactor = defaultDecayFactor
	}

	if src == nil {
		// If no specific source is injected, default to simulation.
		src = &simulatedTelemetrySource{}
	}

	return &sovereignTelemetryService{
		cfg:  cfg,
		source: src,
		// Ensure GATMBreachCount and IsGATMViolating are initialized to 0/false
		data: TelemetryData{IntegrityHashChainStatus: "INITIALIZING"},
	}
}

// checkGATMRules performs the instantaneous Generalized Anomaly Threshold Model (GATM) check.
func (s *sovereignTelemetryService) checkGATMRules(td TelemetryData) bool {
	if td.PipelineLatency_S9 > s.cfg.LatencyThreshold {
		return true
	}
	if td.ResourceLoad_Pct > s.cfg.LoadThreshold {
		return true
	}
	// CRoT integrity anchor violation is high priority
	if td.IntegrityHashChainStatus != "SYNCED" {
		return true
	}
	return false
}

// collectAndProcess fetches metrics, assesses GATM violation status, and updates state atomically.
func (s *sovereignTelemetryService) collectAndProcess(ctx context.Context) error {
	fetchedData, err := s.source.Collect(ctx)
	if err != nil {
		// Inability to collect telemetry data itself should perhaps trigger a mild GATM breach.
		return fmt.Errorf("telemetry collection failed: %w", err)
	}

	isViolated := s.checkGATMRules(fetchedData)

	s.mu.Lock()
	defer s.mu.Unlock()

	// Preserve cumulative count before updating base metrics
	currentBreachCount := s.data.GATMBreachCount

	// Overwrite base metrics with fresh data
	s.data = fetchedData
	
	// Set instantaneous status
	s.data.IsGATMViolating = isViolated

	// Update cumulative breach count logic
	if isViolated {
		s.data.GATMBreachCount = currentBreachCount + 1
	} else if currentBreachCount > 0 {
		// Apply damping factor to the previous count if the system stabilized
		newCount := int(float64(currentBreachCount) * s.cfg.BreachDecayFactor)
		// Ensure count fully resets if decay pushed it below 1, avoiding stale low counts.
		if newCount < 1 {
			s.data.GATMBreachCount = 0
		} else {
			s.data.GATMBreachCount = newCount
		}
	} else {
		s.data.GATMBreachCount = 0
	}

	return nil
}

// Run starts the continuous background monitoring loop, updating internal state.
func (s *sovereignTelemetryService) Run(ctx context.Context) error {
	ticker := time.NewTicker(s.cfg.DefaultInterval)
	defer ticker.Stop()

	// Initial collection before starting the loop
	if err := s.collectAndProcess(ctx); err != nil {
		// Handle initialization failure if required, or continue with default state
		// Since this service is crucial, we allow running even if the first collect fails, 
		// letting the error surface through the monitoring channel if exposed.
	}

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
			s.collectAndProcess(ctx)
		}
	}
}

// GetHealthStatus returns the latest cached TelemetryData snapshot.
func (s *sovereignTelemetryService) GetHealthStatus() TelemetryData {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.data
}

// CheckGATMViolation reports if the persistent breach count exceeds the mandated RRP/SIH escalation threshold.
func (s *sovereignTelemetryService) CheckGATMViolation() bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.data.GATMBreachCount >= s.cfg.MaxBreaches
}

// Monitor starts a temporary, dedicated monitoring stream for external observers.
// Note: This polls the internal state updated by Run(), avoiding unnecessary repeated collection.
func (s *sovereignTelemetryService) Monitor(ctx context.Context, interval time.Duration) <-chan TelemetryData {
	output := make(chan TelemetryData, 1) // Buffered channel for immediate non-blocking send
	ticker := time.NewTicker(interval)

	go func() {
		defer close(output)
		defer ticker.Stop()

		// Send immediate snapshot on start
		s.mu.RLock()
		if s.data.Timestamp.IsZero() { 
			// Ensure initialization has occurred
			// Wait for first collection or use default (implementation choice)
		} else {
			output <- s.data
		}
		s.mu.RUnlock()

		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				s.mu.RLock()
				// Push the latest snapshot, assuming Run() is actively updating it.
				select {
				case output <- s.data:
				// Successfully sent
				default:
					// Non-blocking send failure indicates reader is slow; drop measurement.
				}
				s.mu.RUnlock()
			}
		}
	}()
	return output
}