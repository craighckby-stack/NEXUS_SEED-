#!/usr/bin/env python3

import json
import sys
from typing import Dict, Any, List, TypedDict

# --- System Constants and Types ---

class Axioms:
    GAX_I = "GAX I (Utility Efficacy)"
    GAX_II = "GAX II (Contextual Validity)"
    GAX_III = "GAX III (Constraint Integrity)"

class Severities:
    CRITICAL = "Critical: Policy Violation"
    HIGH = "High: Environmental Mismatch"
    MEDIUM = "Medium: Performance Debt"

# Define structures for strict typing of outputs
class Candidate(TypedDict):
    axiom: str
    artifact: str
    trace: str
    severity: str

class AnalysisReport(TypedDict):
    status: str
    gsep_stage: str
    root_cause_candidates: List[Candidate]

# --- DSE Integrity Analyzer ---

class DSEAnalyzer:
    def __init__(self, artifacts_path: str, logs_path: str):
        self.candidates: List[Candidate] = []
        self.report_status = "SUCCESS_NO_HALT_EVIDENCE" 

        self.artifacts = self._load_data(artifacts_path)
        self.logs = self._load_data(logs_path)
        self.initial_stage = self.artifacts.get('last_stage', 'UNKNOWN')

    def _load_data(self, file_path: str) -> Dict[str, Any]:
        """Loads JSON data from a file path, raising exceptions on failure."""
        try:
            with open(file_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            raise FileNotFoundError(f"Required input file not found: {file_path}")
        except json.JSONDecodeError:
            raise ValueError(f"Failed to decode JSON from file: {file_path}")

    def _check_gax_iii(self):
        """Checks for GAX III (Constraint Integrity). High priority failure."""
        if not self.artifacts.get('CSR_VALID', True):
            trace = self.logs.get('MPAM', 'N/A')
            self.candidates.append({
                "axiom": Axioms.GAX_III,
                "artifact": "CSR (Configuration Snapshot Receipt)",
                "trace": trace,
                "severity": Severities.CRITICAL
            })
            self.report_status = "FAILURE_GAX_III"

    def _check_gax_ii(self):
        """Checks for GAX II (Contextual Validity). Medium priority failure."""
        if self.artifacts.get('ECVM_PERMISSIBLE') != True:
            trace = self.logs.get('SGS', 'N/A')
            self.candidates.append({
                "axiom": Axioms.GAX_II,
                "artifact": "ECVM (Execution Context Validation Map)",
                "trace": trace,
                "severity": Severities.HIGH
            })
            # Only set status if a higher priority GAX hasn't already been identified
            if not self.report_status.startswith("FAILURE_GAX_III"):
                self.report_status = "FAILURE_GAX_II"


    def _check_gax_i(self):
        """Checks for GAX I (Utility Efficacy). Low priority failure."""
        min_omega = self.artifacts.get('OMEGA_MIN', 1)
        current_temm = self.artifacts.get('TEMM_VALUE', 0)

        if current_temm < min_omega:
            trace = self.logs.get('ADTM', 'N/A')
            self.candidates.append({
                "axiom": Axioms.GAX_I,
                "artifact": "TEMM (Transition Efficacy Measure)",
                "trace": trace,
                "severity": Severities.MEDIUM
            })
            # Only update status if no other failure has been marked.
            if self.report_status == 'SUCCESS_NO_HALT_EVIDENCE':
                self.report_status = "FAILURE_GAX_I"


    def run_analysis(self) -> AnalysisReport:
        """Executes RCA by running ordered GAX checks, returning the report."""
        
        # Rule evaluation ordered by critical priority
        self._check_gax_iii()
        self._check_gax_ii()
        self._check_gax_i()

        # Final status determination if files loaded successfully
        if self.report_status == "SUCCESS_NO_HALT_EVIDENCE" and self.candidates:
             # Indicates system halted, files existed, but the rules found no match
             self.report_status = "FAILURE_UNCORRELATED"
        
        # If no candidates found and system ran successfully, report success
        if not self.candidates and self.report_status != "FAILURE_UNCORRELATED":
            self.report_status = "SUCCESS_SYSTEM_CLEAN"

        return {
            "status": self.report_status,
            "gsep_stage": self.initial_stage,
            "root_cause_candidates": self.candidates
        }

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: ./dse_integrity_analyzer.py <artifacts.json> <logs.json>")
        sys.exit(1)
    
    artifacts_path = sys.argv[1]
    logs_path = sys.argv[2]

    print("--- DSE INTEGRITY HALT RCA ---")
    
    try:
        analyzer = DSEAnalyzer(artifacts_path, logs_path)
        report = analyzer.run_analysis()
        
        print(json.dumps(report, indent=4))
        
        if report['root_cause_candidates']:
            print("\n*** Action Required: Execute RRP based on detected failure conditions. ***")
        else:
            print("\n*** Analysis Complete: No immediate GAX violations detected. Requires human review or dynamic rule injection. ***")

    except (FileNotFoundError, ValueError) as e:
        print(f"FATAL ERROR: {e}")
        sys.exit(1)
