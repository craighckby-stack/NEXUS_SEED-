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

// IntegrityStatus represents the state of the Core Root of Trust (CRoT) integrity hash chain.
type IntegrityStatus string

const (
	IntegritySynced           IntegrityStatus = "SYNCED"
	IntegrityDiverged         IntegrityStatus = "DIVERGED"
	IntegrityInitializing     IntegrityStatus = "INITIALIZING"
	IntegrityCollectionFailed IntegrityStatus = "COLLECTION_FAILED" // Status indicating telemetry source ingestion failure
)

// TelemetryData holds the essential metrics monitored by STS.
// Field names standardized to idiomatic Go camelCase for consistency.
type TelemetryData struct {
	Timestamp                time.Time       `json="timestamp"`
	PipelineLatencyS9        float64         `json="pipeline_latency_s9"`       // Time since last successful S9 Commit (seconds)
	ResourceLoadPct          float64         `json="resource_load_pct"`         // Current CPU/Memory utilization average (0.0 to 1.0)
	IntegrityHashChainStatus IntegrityStatus `json="hash_chain_status"`       // CRoT integrity anchor status
	GATMBreachCount          int             `json="gatm_breach_count"`       // Consecutive breaches against GATM rules (cumulative)
	IsGATMViolating          bool            `json="is_gatm_violating"`       // Instantaneous GATM rule breach status
}

// Default Configuration Constants
const (
	defaultIntervalDuration  = 5 * time.Second
	defaultLatencyThreshold  = 1.0  // 1.0 second threshold
	defaultLoadThreshold     = 0.8  // 80% load threshold
	defaultMaxBreaches       = 5
	defaultDecayFactor       = 0.7  // Damping factor for GATM breach count
)

// STSConfiguration holds adjustable runtime parameters for the Telemetry Service.
type STSConfiguration struct {
	Interval          time.Duration
	LatencyThreshold  float64 
	LoadThreshold     float64 
	MaxBreaches       int     
	BreachDecayFactor float64 
}

// applyDefaults ensures all required configuration parameters have safe values.
func (cfg *STSConfiguration) applyDefaults() {
	if cfg.Interval == 0 {
		cfg.Interval = defaultIntervalDuration
	}
	if cfg.LatencyThreshold == 0 {
		cfg.LatencyThreshold = defaultLatencyThreshold
	}
	if cfg.LoadThreshold == 0 {
		cfg.LoadThreshold = defaultLoadThreshold
	}
	if cfg.MaxBreaches == 0 {
		cfg.MaxBreaches = defaultMaxBreaches
	}
	if cfg.BreachDecayFactor == 0 {
		cfg.BreachDecayFactor = defaultDecayFactor
	}
}

// STS provides the mandated monitoring interface.
type STS interface {
	Run(ctx context.Context) error
	Monitor(ctx context.Context, interval time.Duration) <-chan TelemetryData
	GetHealthStatus() TelemetryData
	CheckGATMViolation() bool
}

// TelemetrySource defines the interface for collecting raw system metric data.
type TelemetrySource interface {
	Collect(ctx context.Context) (TelemetryData, error)
}

// TelemetrySink defines the interface for persisting system data for historical analysis and trend detection.
type TelemetrySink interface {
	Record(ctx context.Context, data TelemetryData) error
}

// dummySink implements TelemetrySink without doing anything, used when no persistence component is injected.
type dummySink struct{}

func (*dummySink) Record(ctx context.Context, data TelemetryData) error { return nil }

// simulatedTelemetrySource is a temporary data provider.
type simulatedTelemetrySource struct{/*...*/}

// Collect simulates fetching metrics from system endpoints.
func (*simulatedTelemetrySource) Collect(ctx context.Context) (TelemetryData, error) {
	newData := TelemetryData{
		Timestamp:                time.Now(),
		PipelineLatencyS9:        rand.Float64() * 1.5,
		ResourceLoadPct:          rand.Float64(),
		IntegrityHashChainStatus: IntegritySynced,
	}
	
	// Simulate failures
	if rand.Float64() < 0.1 { 
		switch rand.Intn(3) {
		case 0:
			newData.IntegrityHashChainStatus = IntegrityDiverged
		case 1:
			newData.PipelineLatencyS9 = 2.5 
		case 2:
			// Simulated collection error
			return TelemetryData{}, fmt.Errorf("simulated API endpoint failure")
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
	sink   TelemetrySink // Integrated Telemetry Persistence
}

// NewSovereignTelemetryService initializes the telemetry service.
// It now accepts an optional TelemetrySink for persistence.
func NewSovereignTelemetryService(cfg STSConfiguration, src TelemetrySource, sink TelemetrySink) STS {
	cfg.applyDefaults() 

	if src == nil {
		src = &simulatedTelemetrySource{}
	}
	if sink == nil {
		sink = &dummySink{}
	}

	return &sovereignTelemetryService{
		cfg:    cfg,
		source: src,
		sink:   sink,
		data: TelemetryData{IntegrityHashChainStatus: IntegrityInitializing},
	}
}

// checkGATMRules performs the instantaneous Generalized Anomaly Threshold Model (GATM) check.
func (s *sovereignTelemetryService) checkGATMRules(td TelemetryData) bool {
	if td.PipelineLatencyS9 > s.cfg.LatencyThreshold {
		return true
	}
	if td.ResourceLoadPct > s.cfg.LoadThreshold {
		return true
	}
	// CRoT integrity anchor violation is high priority
	if td.IntegrityHashChainStatus != IntegritySynced {
		return true
	}
	return false
}

// updateBreachCount applies decay/increment logic to the GATM breach count.
func (s *sovereignTelemetryService) updateBreachCount(isViolated bool, currentCount int) int {
	if isViolated {
		return currentCount + 1
	}

	if currentCount > 0 {
		newCount := int(float64(currentCount) * s.cfg.BreachDecayFactor)
		// Ensure count fully resets if decay pushed it below 1
		if newCount < 1 {
			return 0
		}
		return newCount
	}
	return 0
}

// collectAndProcess fetches metrics, assesses GATM violation status, updates state atomically, and records data.
func (s *sovereignTelemetryService) collectAndProcess(ctx context.Context) {
	fetchedData, err := s.source.Collect(ctx)
	
	s.mu.Lock()
	defer s.mu.Unlock()

	currentBreachCount := s.data.GATMBreachCount
	
	if err != nil {
		// If collection fails, mark the integrity status as degraded.
		
		s.data.Timestamp = time.Now()
		// Note: Previous non-timestamp/count metrics are preserved to reflect the state *before* the failed collection cycle.
		s.data.IntegrityHashChainStatus = IntegrityCollectionFailed 
		
		// Failure to collect data is considered a GATM violation
		s.data.IsGATMViolating = true 
		s.data.GATMBreachCount = currentBreachCount + 1 // Always increment on collection failure
		
		s.sink.Record(ctx, s.data) // Record failure state
		return
	}

	// Successful Collection
	isViolated := s.checkGATMRules(fetchedData)

	// Overwrite base metrics with fresh data
	s.data = fetchedData
	
	// Apply derived metrics logic
	s.data.IsGATMViolating = isViolated
	s.data.GATMBreachCount = s.updateBreachCount(isViolated, currentBreachCount)
	
	// Record the successful snapshot
	s.sink.Record(ctx, s.data)
}

// Run starts the continuous background monitoring loop, updating internal state.
func (s *sovereignTelemetryService) Run(ctx context.Context) error {
	// Initial synchronous collection to seed state and sink
	s.collectAndProcess(ctx) 

	ticker := time.NewTicker(s.cfg.Interval)
	defer ticker.Stop()

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
func (s *sovereignTelemetryService) Monitor(ctx context.Context, interval time.Duration) <-chan TelemetryData {
	// Use the configured interval as default if the caller provided zero.
	if interval == 0 {
		interval = s.cfg.Interval
	}
    
	output := make(chan TelemetryData, 1) 
	ticker := time.NewTicker(interval)

	go func() {
		defer close(output)
		defer ticker.Stop()

		// Initial immediate snapshot (non-blocking)
		s.mu.RLock()
		snapshot := s.data
		s.mu.RUnlock()

		select {
		case output <- snapshot:
		default:
			// Drop initial snapshot if reader is unavailable immediately
		}

		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				s.mu.RLock()
				// Push the latest snapshot
				select {
				case output <- s.data:
				default:
					// Slow reader dropped measurement.
				}
				s.mu.RUnlock()
			}
		}
	}()
	return output
}
