# Contributing to PSR Governance

Thank you for your interest in contributing to PSR Governance! This document provides guidelines and instructions for contributing to the project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

---

## 🤝 Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

---

## 🚀 Getting Started

### Prerequisites

- Python 3.8 or higher
- Git
- A GitHub account

### Setting Up Development Environment

```bash
# 1. Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/psr-governance.git
cd psr-governance

# 2. Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install with development dependencies
pip install -e ".[dev]"

# 4. Run tests to verify setup
python -m psr_governance.test_vectors
```

---

## 🔄 Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Your Changes

- Write clean, documented code
- Add tests for new functionality
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run all tests
python -m psr_governance.test_vectors
python -m psr_governance.chaos_suite
python -m psr_governance.regression_framework

# Run linting
pylint src/psr_governance/
black src/
isort src/

# Security scan
bandit -r src/psr_governance/
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat: add new chaos scenario for memory stress"
```

Use conventional commit messages:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Test additions/changes
- `refactor:` Code refactoring
- `chore:` Maintenance tasks

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then go to GitHub and create a pull request.

---

## 📥 Pull Request Process

### PR Description Template

When submitting a PR, include:

- **Description**: What does this PR do?
- **Motivation**: Why is this change needed?
- **Changes**: List of major changes
- **Testing**: How was this tested?
- **Breaking Changes**: Any breaking changes?

### PR Checklist

- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Code follows style guidelines
- [ ] All tests pass locally
- [ ] PR description is complete

---

## 📐 Coding Standards

### Python Style Guide

- Follow PEP 8
- Use type hints where appropriate
- Maximum line length: 100 characters
- Use meaningful variable and function names

### Code Organization

```python
# 1. Imports (standard, third-party, local)
import sys
from typing import Dict, List

from .flux_node import FluxNode

# 2. Constants
MAX_ITERATIONS = 1000

# 3. Classes
class MyClass:
    """Class docstring."""
    
    def __init__(self):
        """Constructor."""
        pass
    
    def public_method(self):
        """Public method docstring."""
        pass
    
    def _private_method(self):
        """Private method docstring."""
        pass

# 4. Functions
def public_function():
    """Function docstring."""
    pass
```

### Documentation

```python
def example_function(param1: int, param2: str) -> Dict[str, Any]:
    """
    Brief description of function.
    
    Args:
        param1: Description of param1
        param2: Description of param2
    
    Returns:
        Dict description
    
    Raises:
        ValueError: When param1 is negative
    
    Example:
        >>> example_function(5, "test")
        {'result': 'success'}
    """
    pass
```

---

## 🧪 Testing Guidelines

### Test Structure

```python
def test_specific_scenario() -> Tuple[FluxNode, Dict]:
    """
    Brief test description.
    
    Returns:
        Tuple of node and metrics
    """
    node = FluxNode("test")
    
    # Setup
    for i in range(10):
        node.interact(i, "setup")
    
    # Test action
    result = node.interact("test", "test_context")
    
    # Assertions
    assert result['processed'] is not None
    assert node.metrics.total_interactions > 0
    
    # Return for validation
    return node, {
        'interactions': node.metrics.total_interactions
    }
```

### Test Categories

1. **Unit Tests**: Test individual components
2. **Integration Tests**: Test component interaction
3. **Chaos Tests**: Test under extreme conditions
4. **Regression Tests**: Verify no performance degradation

### Performance Budgets

Always document expected performance:

```python
# Expected: < 200ms, < 5000 function calls
# Budget: evolution_cycle
```

---

## 📚 Documentation

### Types of Documentation

1. **Code Documentation**: Docstrings, comments
2. **User Documentation**: README, guides
3. **API Documentation**: Function/method docs
4. **Architecture Documentation**: Design decisions

### Documentation Principles

- Start with user's perspective
- Use clear, concise language
- Provide examples
- Keep documentation in sync with code

---

## ❓ Questions?

- Check existing [Issues](https://github.com/craighckby-stack/psr-governance/issues)
- Create a new issue for questions
- Join discussions on PRs

---

## 🙏 Recognition

All contributors will be listed in the project's CONTRIBUTORS file and acknowledged in release notes.

Thank you for contributing to PSR Governance! 🛡️
