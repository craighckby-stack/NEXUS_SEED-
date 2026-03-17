"""
PSR Governance Framework
========================

A production-ready framework for governing self-modifying systems.

Ensures that adaptive AI, ML models, and infrastructure
remain safe, performant, and auditable as they evolve.
"""

from .flux_node import FluxNode
from .performance_gate import PerformanceGate, PerformanceMetrics
from .regression_framework import (
    IntegratedTestRunner, 
    PerformanceBaseline,
    PERFORMANCE_BUDGETS
)

__version__ = "1.0.0"
__author__ = "Craig Huckerby"

__all__ = [
    "FluxNode",
    "PerformanceGate",
    "PerformanceMetrics",
    "IntegratedTestRunner",
    "PerformanceBaseline",
    "PERFORMANCE_BUDGETS",
]
