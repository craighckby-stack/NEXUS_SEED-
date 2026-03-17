package persistence

import (
	"context"
	"sync"
	"services/telemetry"
)

// CircularBufferSink implements the telemetry.TelemetrySink interface using a fixed-size in-memory buffer.
// This is used for quick trend analysis and providing historical context (QueryLastN) without an external TSDB dependency.
type CircularBufferSink struct {
	capacity int
	buffer   []telemetry.TelemetryData
	mu       sync.RWMutex
	head     int // Pointer to the next available slot
	count    int // Current number of elements stored
}

// NewCircularBufferSink creates a new in-memory sink with a defined maximum capacity.
func NewCircularBufferSink(capacity int) *CircularBufferSink {
	return &CircularBufferSink{
		capacity: capacity,
		buffer:   make([]telemetry.TelemetryData, capacity),
	}
}

// Record accepts a snapshot of telemetry data and persists it in the buffer.
// If the buffer is full, it overwrites the oldest record.
func (s *CircularBufferSink) Record(ctx context.Context, data telemetry.TelemetryData) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	
	s.buffer[s.head] = data
	s.head = (s.head + 1) % s.capacity
	if s.count < s.capacity {
		s.count++
	}
	return nil
}

// QueryLastN fetches the last N records, ordered from oldest to newest.
func (s *CircularBufferSink) QueryLastN(ctx context.Context, n int) ([]telemetry.TelemetryData, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	
	if n <= 0 {
		return nil, nil
	}
	
	effectiveN := s.count
	if n < effectiveN {
		effectiveN = n
	}
	
	result := make([]telemetry.TelemetryData, effectiveN)
	
	// Calculate the start index (start reading right after the oldest element)
	start := (s.head - effectiveN + s.capacity) % s.capacity
	
	// Read data sequentially, handling wrap-around
	for i := 0; i < effectiveN; i++ {
		index := (start + i) % s.capacity
		result[i] = s.buffer[index]
	}
	
	return result, nil
}

// Close is defined to satisfy the potential use case for external sinks but does nothing for in-memory.
func (s *CircularBufferSink) Close(ctx context.Context) error {
	return nil
}
