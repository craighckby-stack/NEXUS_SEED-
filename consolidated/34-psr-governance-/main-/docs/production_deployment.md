# PSR Governance - Production Deployment Guide

Learn how to deploy PSR Governance in production environments with best practices for monitoring, scaling, and reliability.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [CI/CD Integration](#cicd-integration)
- [Monitoring](#monitoring)
- [Scaling Considerations](#scaling-considerations)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## Prerequisites

### System Requirements

- **Python**: 3.10 or higher
- **Memory**: Minimum 4GB RAM (recommended 8GB+ for production)
- **CPU**: Multi-core recommended for concurrent testing
- **Storage**: At least 10GB free for audit logs and baselines

### Recommended Environment

```bash
# Production environment
python3.11
virtualenv or conda environment
systemd or supervisor for process management
```

---

## Installation

### 1. Install PSR Governance

```bash
# Create virtual environment
python -m venv /opt/psr-governance/venv
source /opt/psr-governance/venv/bin/activate

# Install with production dependencies
pip install psr-governance

# Or install from source with development dependencies
git clone https://github.com/craighckby-stack/psr-governance.git
cd psr-governance
pip install -e ".[dev]"
```

### 2. Verify Installation

```bash
python -c "from psr_governance import FluxNode, PERFORMANCE_BUDGETS; print('✓ Installation successful')"
```

### 3. Set Up Directory Structure

```bash
/opt/psr-governance/
├── venv/
├── baselines/           # Performance baselines
├── reports/             # Test reports
├── audit-logs/          # Audit trail archives
└── config/
    ├── budgets.yaml     # Custom performance budgets
    └── settings.yaml    # Governance settings
```

---

## Configuration

### Environment Variables

Configure PSR Governance using environment variables:

```bash
# Governance mode
export PSR_MODE=validate  # baseline | validate | enforce

# Baseline directory
export PSR_BASELINE_DIR=/opt/psr-governance/baselines

# Report directory
export PSR_REPORT_DIR=/opt/psr-governance/reports

# Audit log directory
export PSR_AUDIT_DIR=/opt/psr-governance/audit-logs

# Verbosity
export PSR_VERBOSE=1
```

### Custom Performance Budgets

Create `config/budgets.yaml`:

```yaml
# config/budgets.yaml
performance_budgets:
  evolution_cycle:
    max_latency_ms: 200
    max_function_calls: 5000

  ml_model_training:
    max_latency_ms: 5000
    max_memory_mb: 2048
    max_object_delta: 10000000

  infrastructure_scaling:
    max_latency_ms: 100
    max_cost_delta: 50.0
```

Load custom budgets in your code:

```python
import yaml
from psr_governance.regression_framework import PERFORMANCE_BUDGETS

with open('/opt/psr-governance/config/budgets.yaml') as f:
    custom_budgets = yaml.safe_load(f)

PERFORMANCE_BUDGETS.update(custom_budgets['performance_budgets'])
```

### Governance Settings

Create `config/settings.yaml`:

```yaml
# config/settings.yaml
governance:
  mode: enforce

  thresholds:
    structural: 30
    functional: 5
    emergent: 8

  audit:
    retention_days: 90
    max_entries: 10000
    archive_enabled: true

  baselines:
    auto_update: false
    update_interval: 7  # days
    min_samples: 5
```

---

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/psr-governance.yml
name: PSR Governance Gates

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  governance:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install Dependencies
        run: |
          pip install psr-governance
          pip install -r requirements.txt

      - name: Run Static Analysis
        run: |
          python -m pylint src/
          python -m mypy src/

      - name: Run Functional Tests
        run: |
          python -m pytest tests/ -v

      - name: Run Chaos Scenarios
        env:
          PSR_MODE: validate
        run: |
          python -m psr_governance.chaos_suite

      - name: Run Performance Regression Tests
        env:
          PSR_MODE: validate
          REGRESSION_MODE: validate
        run: |
          python -m psr_governance.regression_framework

      - name: Upload Reports
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: psr-governance-reports
          path: reports/
```

### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - test
  - govern

governance:
  stage: govern
  image: python:3.11

  script:
    - pip install psr-governance
    - export PSR_MODE=validate
    - python -m psr_governance.chaos_suite
    - export REGRESSION_MODE=validate
    - python -m psr_governance.regression_framework

  artifacts:
    paths:
      - reports/
    expire_in: 7 days

  only:
    - merge_requests
    - main
```

### Jenkins Pipeline

```groovy
// Jenkinsfile
pipeline {
    agent any

    stages {
        stage('Install') {
            steps {
                sh 'pip install psr-governance'
            }
        }

        stage('Static Analysis') {
            steps {
                sh 'python -m pylint src/'
            }
        }

        stage('Governance Tests') {
            environment {
                PSR_MODE = 'validate'
            }
            steps {
                sh 'python -m psr_governance.regression_framework'
                sh 'python -m psr_governance.chaos_suite'
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'reports/**', fingerprint: true
        }
    }
}
```

---

## Monitoring

### Key Metrics to Monitor

```python
from psr_governance import FluxNode
from psr_governance.regression_framework import PERFORMANCE_BUDGETS

# Monitor these metrics in production
metrics_to_track = {
    # Evolution metrics
    'total_interactions': 'Number of system interactions',
    'structural_transitions': 'List→Set migrations',
    'functional_transitions': 'Strategy pattern changes',
    'emergent_behaviors': 'Dynamic methods spawned',

    # Performance metrics
    'evolution_latency_ms': 'Time per evolution cycle',
    'memory_delta': 'Memory consumption change',
    'object_delta': 'Object count change',

    # Governance metrics
    'budget_violations': 'Performance budget violations',
    'regressions_detected': 'Performance regressions',
    'rollbacks_triggered': 'Automated rollbacks executed'
}
```

### Prometheus Integration

```python
from prometheus_client import Counter, Histogram, Gauge
from psr_governance import FluxNode

# Define Prometheus metrics
evolution_counter = Counter(
    'psr_evolution_total',
    'Total number of evolutions',
    ['type']
)

evolution_latency = Histogram(
    'psr_evolution_duration_seconds',
    'Evolution latency in seconds'
)

budget_violations = Counter(
    'psr_budget_violations_total',
    'Total budget violations',
    ['budget_name']
)

# Instrument FluxNode
class MonitoredFluxNode(FluxNode):
    def interact(self, data, context):
        with evolution_latency.time():
            result = super().interact(data, context)

            # Track evolutions
            if result.get('mutations_triggered'):
                for mutation in result['mutations_triggered']:
                    evolution_counter.labels(type=mutation).inc()

            return result
```

### Grafana Dashboard

Create a Grafana dashboard to visualize governance metrics:

```json
{
  "dashboard": {
    "title": "PSR Governance Metrics",
    "panels": [
      {
        "title": "Evolution Rate",
        "targets": [
          {
            "expr": "rate(psr_evolution_total[5m])"
          }
        ]
      },
      {
        "title": "Evolution Latency",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, psr_evolution_duration_seconds)"
          }
        ]
      },
      {
        "title": "Budget Violations",
        "targets": [
          {
            "expr": "rate(psr_budget_violations_total[5m])"
          }
        ]
      }
    ]
  }
}
```

### Alerting Rules

Set up alerting for critical issues:

```yaml
# Prometheus alerting rules
groups:
  - name: psr_governance
    rules:
      - alert: HighBudgetViolationRate
        expr: rate(psr_budget_violations_total[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High budget violation rate detected"

      - alert: EvolutionLatencyHigh
        expr: histogram_quantile(0.95, psr_evolution_duration_seconds) > 1
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: "Evolution latency exceeding SLA"

      - alert: ExcessiveStructuralEvolution
        expr: rate(psr_evolution_total{type="structural"}[1h]) > 10
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "Excessive structural evolution detected"
```

---

## Scaling Considerations

### Multi-Process Deployment

Run governance tests in parallel for faster feedback:

```python
from concurrent.futures import ProcessPoolExecutor
from psr_governance import IntegratedTestRunner

def run_test_parallel(test_name, test_func, budget_name):
    """Run governance test in separate process."""
    runner = IntegratedTestRunner(mode='enforce')
    runner.run_test(test_func, test_name, budget_name)
    return test_name

# Parallel execution
with ProcessPoolExecutor(max_workers=4) as executor:
    futures = [
        executor.submit(run_test_parallel, f"test_{i}", test_func, budget_name)
        for i in range(4)
    ]

    for future in futures:
        result = future.result()
        print(f"✓ {result} completed")
```

### Distributed Baseline Storage

Store baselines in distributed storage:

```python
import boto3
from psr_governance.regression_framework import PerformanceBaseline

class S3BaselineStorage(PerformanceBaseline):
    def __init__(self, bucket_name, s3_prefix='baselines/'):
        self.s3 = boto3.client('s3')
        self.bucket = bucket_name
        self.prefix = s3_prefix

    def save(self, test_name, metrics):
        import json
        key = f"{self.prefix}{test_name}.json"
        self.s3.put_object(
            Bucket=self.bucket,
            Key=key,
            Body=json.dumps(metrics).encode()
        )

    def load(self, test_name):
        import json
        key = f"{self.prefix}{test_name}.json"
        response = self.s3.get_object(Bucket=self.bucket, Key=key)
        return json.loads(response['Body'].read().decode())
```

### Horizontal Scaling

For large-scale deployments, consider:

1. **Region-specific baselines**: Account for regional latency differences
2. **Environment-specific budgets**: Dev, staging, production may have different SLAs
3. **Service-specific governance**: Different budgets for different microservices

```python
# Environment-specific configuration
CONFIG = {
    'dev': {
        'max_latency_ms': 500,
        'max_memory_mb': 4096
    },
    'staging': {
        'max_latency_ms': 300,
        'max_memory_mb': 2048
    },
    'production': {
        'max_latency_ms': 200,
        'max_memory_mb': 1024
    }
}

env = os.getenv('ENVIRONMENT', 'dev')
PERFORMANCE_BUDGETS['custom'] = CONFIG[env]
```

---

## Troubleshooting

### Common Issues

#### 1. Baseline Not Found

**Symptom**:
```
KeyError: 'baseline_test'
```

**Solution**:
```bash
# Run in baseline mode first
export REGRESSION_MODE=baseline
python -m psr_governance.regression_framework
```

#### 2. Performance Budget Violation

**Symptom**:
```
✗ Budget violation: duration_ms exceeds max 200
```

**Solutions**:
```python
# Option 1: Optimize code
# Profile and optimize slow sections

# Option 2: Adjust budget
PERFORMANCE_BUDGETS['evolution_cycle']['max_latency_ms'] = 300

# Option 3: Change test scope
# Reduce data size or iteration count
```

#### 3. Memory Exhaustion

**Symptom**:
```
MemoryError: Unable to allocate array
```

**Solutions**:
```python
# Option 1: Limit iterations
for i in range(100):  # Instead of 1000
    node.interact(data, context)

# Option 2: Enable garbage collection
import gc
gc.collect()

# Option 3: Use streaming/batch processing
# Process data in chunks instead of all at once
```

#### 4. Audit Trail Overflow

**Symptom**:
```
Retrieval time exceeds budget
```

**Solutions**:
```python
# Option 1: Configure audit retention
node.config.audit_max_entries = 1000

# Option 2: Implement pagination
def get_audit_history_paginated(page=0, page_size=100):
    history = node.get_evolution_history()
    start = page * page_size
    end = start + page_size
    return history[start:end]
```

### Debug Mode

Enable verbose output for debugging:

```python
import logging

logging.basicConfig(level=logging.DEBUG)

from psr_governance import FluxNode, IntegratedTestRunner

node = FluxNode('debug-test')
runner = IntegratedTestRunner(mode='validate', verbose=True)
```

---

## Best Practices

### 1. Start with Baseline Mode

Always establish baselines before enforcing:

```bash
# First deployment
export REGRESSION_MODE=baseline
python -m psr_governance.regression_framework

# Subsequent deployments
export REGRESSION_MODE=validate
python -m psr_governance.regression_framework

# Production deployment
export REGRESSION_MODE=enforce
python -m psr_governance.regression_framework
```

### 2. Version Control Baselines

Commit baselines to version control:

```bash
# Add baseline to git
git add baselines/
git commit -m "Add performance baseline for v1.0.0"

# Tag version
git tag v1.0.0-baseline
git push origin v1.0.0-baseline
```

### 3. Regular Chaos Testing

Schedule weekly chaos tests:

```bash
# Add to crontab
0 0 * * 0 cd /opt/psr-governance && /opt/psr-governance/venv/bin/python -m psr_governance.chaos_suite
```

### 4. Monitor Trends

Track performance over time, not just snapshot values:

```python
from datetime import datetime, timedelta

def analyze_trends(test_name, days=30):
    """Analyze performance trends over time."""
    baselines = []
    for day in range(days):
        date = datetime.now() - timedelta(days=day)
        baseline = load_baseline(f"{test_name}_{date.strftime('%Y-%m-%d')}")
        baselines.append(baseline)

    # Calculate trend
    recent_avg = sum(b['duration_ms'] for b in baselines[:7]) / 7
    previous_avg = sum(b['duration_ms'] for b in baselines[7:14]) / 7
    trend = (recent_avg - previous_avg) / previous_avg * 100

    print(f"Performance trend: {trend:+.1f}%")

    if trend > 10:
        print("⚠️  Performance degrading - investigate")
```

### 5. Automated Rollback

Configure automatic rollback on violations:

```yaml
# config/settings.yaml
governance:
  mode: enforce
  rollback_on_violation: true
  rollback_command: "kubectl rollout undo deployment/my-app"
```

### 6. Graduated Rollout

Phase in governance enforcement:

```python
# Phase 1: Monitor only (2 weeks)
runner = IntegratedTestRunner(mode='baseline')

# Phase 2: Validate only (2 weeks)
runner = IntegratedTestRunner(mode='validate')

# Phase 3: Enforce (production)
runner = IntegratedTestRunner(mode='enforce')
```

---

## Example Production Deployment

Complete production deployment script:

```bash
#!/bin/bash
# deploy.sh

set -e

echo "🚀 Deploying with PSR Governance..."

# Activate virtual environment
source /opt/psr-governance/venv/bin/activate

# Load configuration
export PSR_MODE=validate
export PSR_BASELINE_DIR=/opt/psr-governance/baselines
export PSR_REPORT_DIR=/opt/psr-governance/reports

# Run governance tests
echo "🔍 Running governance tests..."
python -m psr_governance.regression_framework

# Check exit code
if [ $? -ne 0 ]; then
    echo "❌ Governance tests failed"
    exit 1
fi

# Run chaos scenarios
echo "⚡ Running chaos scenarios..."
python -m psr_governance.chaos_suite

# Deploy if all tests pass
echo "✅ All tests passed, deploying..."
# Your deployment commands here

# Update baseline if needed
if [ "$UPDATE_BASELINE" = "true" ]; then
    echo "📊 Updating baseline..."
    export REGRESSION_MODE=baseline
    python -m psr_governance.regression_framework
fi

echo "✨ Deployment complete!"
```

---

## Need Help?

- [GitHub Issues](https://github.com/craighckby-stack/psr-governance/issues)
- [Architecture Guide](architecture.md)
- [Chaos Engineering Guide](chaos_guide.md)
- [API Reference](api_reference.md)

---

**Ready for production?** 🚀

Follow this guide to ensure your self-modifying systems remain safe, performant, and auditable in production.
