package system

import (
	"log"
	"os"
	"fmt"
)

// DefaultLogger implements the governance.Logger interface using standard Go log features.
type DefaultLogger struct {
	prefix string
}

func NewDefaultLogger(component string) *DefaultLogger {
	return &DefaultLogger{prefix: fmt.Sprintf("[%s] ", component)}
}

func (l *DefaultLogger) Infof(format string, args ...interface{}) {
	log.New(os.Stdout, l.prefix + "INFO ", log.Ldate|log.Ltime).Printf(format, args...)
}

func (l *DefaultLogger) Errorf(format string, args ...interface{}) {
	log.New(os.Stderr, l.prefix + "ERROR ", log.Ldate|log.Ltime|log.Lshortfile).Printf(format, args...)
}

func (l *DefaultLogger) Warnf(format string, args ...interface{}) {
    log.New(os.Stdout, l.prefix + "WARN ", log.Ldate|log.Ltime).Printf(format, args...)
}