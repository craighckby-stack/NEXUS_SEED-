import hashlib
import json
from pathlib import Path
from datetime import datetime, timezone
# from security import SignerService # Assumed External Dependency

# --- Centralized Integrity Configuration Interface (Assumed) ---
# Placeholder if config/IntegrityPaths.py is not yet generated
try:
    from config.IntegrityPaths import IntegrityPaths
except ImportError:
    class IntegrityPaths:
        TBR_FILE = Path("config/TBR.json")
        POLICY_MANIFEST_SIG = Path("manifest/G0-Policy_Manifest.sig")
        HASH_ALGORITHM = "SHA-512"


# --- Custom Exception Hierarchy ---
class ManifestIntegrityError(Exception): pass
class ConfigurationError(ManifestIntegrityError): pass
class HashingError(ManifestIntegrityError): pass
class SigningError(ManifestIntegrityError): pass


class PMGGenerator:
    """
    Policy Manifest Generator (PMG) calculates the deterministic aggregate
    system integrity hash (M-Hash) and generates the signed baseline manifest ($T_{0}$).
    """
    
    CHUNK_SIZE = 4096
    
    def __init__(self, tbr_path: Path = IntegrityPaths.TBR_FILE, 
                 output_path: Path = IntegrityPaths.POLICY_MANIFEST_SIG):
        self.tbr_path = tbr_path
        self.output_path = output_path
        self.hash_algorithm = IntegrityPaths.HASH_ALGORITHM

    def _load_tbr(self) -> list[Path]:
        """Loads the list of critical file paths to be hashed from TBR."""
        
        if not self.tbr_path.exists():
            raise ConfigurationError(f"TBR file not found: {self.tbr_path}")
            
        try:
            with self.tbr_path.open('r') as f:
                data = json.load(f)
                critical_path_strings = data.get("critical_paths", [])
                
                # Convert string paths to resolved Path objects for robustness
                return [Path(p).resolve() for p in critical_path_strings]
                
        except json.JSONDecodeError as e:
            raise ConfigurationError(f"Invalid TBR structure: JSON decode error in {self.tbr_path}: {e}")
        except Exception as e:
            raise ConfigurationError(f"Failed to load TBR configuration: {e}")

    def generate_aggregate_hash(self, file_paths: list[Path]) -> str:
        """Calculates the deterministic aggregate hash (M-Hash) based on sorted artifact content."""
        
        sha = hashlib.new(self.hash_algorithm.lower()) # Flexible algorithm instantiation
        
        # Stability Requirement: Paths must be sorted lexicographically by their string representation
        sorted_paths = sorted(file_paths, key=str)
        
        for path in sorted_paths:
            if not path.exists():
                # Use resolved path for debug visibility
                raise HashingError(f"TBR referenced critical file missing: {path.name} (Resolved: {path})")
            
            try:
                # Hash file content in blocks (binary mode)
                with path.open('rb') as f:
                    while chunk := f.read(self.CHUNK_SIZE):
                        sha.update(chunk)
            except IOError as e:
                raise HashingError(f"I/O error while reading file {path}: {e}")
                
        return sha.hexdigest()

    def _construct_manifest_data(self, critical_files: list[Path], m_hash: str) -> dict:
        """Constructs the core manifest data dictionary, standardizing the timestamp."""
        
        # Use ISO format with Zulu time (Z suffix) for secure, standard timestamp
        timestamp = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
        
        manifest_data = {
            "version": "3.0",
            "timestamp": timestamp,
            "hash_algorithm": self.hash_algorithm,
            "artifact_count": len(critical_files),
            "m_hash": m_hash
        }
        return manifest_data

    def _sign_and_package(self, manifest_data: dict) -> dict:
        """Handles signing and packages the final manifest structure."""
        
        # 1. Standardize JSON input string for deterministic signature generation
        # Mandate sort_keys=True and specific separators for reliable signing integrity
        data_to_sign = json.dumps(manifest_data, sort_keys=True, separators=(',', ':'))
        
        # signature = SignerService.get_instance("GOV_KEY_STORE").sign(data_to_sign) # Integration Point
        signature = "GOVERNANCE_SIGNATURE_PLACEHOLDER_V94_1" 
        
        final_manifest = {
            "metadata": manifest_data,
            "signature": signature
        }
        return final_manifest

    def create_baseline(self):
        """Orchestrates the integrity baseline manifest generation."""
        print(f"\n[PMG] Starting $T_{{0}}$ Manifest generation (v3.0).")
        
        critical_files = self._load_tbr()
        m_hash = self.generate_aggregate_hash(critical_files)
        
        manifest_data = self._construct_manifest_data(critical_files, m_hash)
        final_manifest = self._sign_and_package(manifest_data)
        
        # Ensure output directory exists using pathlib
        self.output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Use indent=2 for readability, and sort_keys=True to guarantee deterministic file structure
        with self.output_path.open('w') as f:
            json.dump(final_manifest, f, indent=2, sort_keys=True)
            
        print(f"[PMG] SUCCESS: Manifest created for {len(critical_files)} artifacts at {self.output_path}.")
            

def main():
    """Main execution function, handling top-level orchestration and failure exit."""
    try:
        generator = PMGGenerator()
        generator.create_baseline()
    except ManifestIntegrityError as e:
        print(f"[PMG] CRITICAL FAILURE: {type(e).__name__}: {e}")
        exit(1)
    except Exception as e:
        print(f"[PMG] UNEXPECTED SYSTEM FAILURE: {type(e).__name__}: {e}")
        exit(1)


if __name__ == "__main__":
    main()
