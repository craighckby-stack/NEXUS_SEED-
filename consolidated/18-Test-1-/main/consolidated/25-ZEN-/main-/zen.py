"""
Zen: Self-improving code system.

Core functionality for cross-repository code enhancement.
"""

import os
import sys
import logging
from typing import List, Dict, Optional, Any, Final, Tuple
from dotenv import load_dotenv
from argparse import ArgumentParser, Namespace
import argparse

# Load environment variables early
load_dotenv()

# Assuming core modules provide necessary implementations
from core.evolution import EvolutionEngine
from core.knowledge_base import KnowledgeBase
from core.git_operations import GitManager

# Configure global logger for this module
logger = logging.getLogger(__name__)

# Define required environment variables as a module constant
REQUIRED_ENV_VARS: Final[Tuple[str, str]] = ('GITHUB_TOKEN', 'GEMINI_API_KEY')

def setup_logging(level: int = logging.INFO) -> None:
    """Initializes standard logging configuration."""
    if not logging.root.handlers:
        logging.basicConfig(
            level=level,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            stream=sys.stdout
        )

class ZenConfigError(Exception):
    """Custom exception for configuration related errors."""
    pass

class Zen:
    """
    Main class for Zen self-improvement system.
    Orchestrates cloning, knowledge generation, evolution, and application.
    """
    
    def __init__(
        self,
        target_repo_url: str,
        source_repo_urls: List[str],
        files_to_update: Optional[List[str]] = None,
        branch_name: str = "zen-improvement",
        max_iterations: int = 10,
        safety_checks: bool = True
    ) -> None:
        """
        Initialize Zen system, performing immediate validation.
        """
        if not target_repo_url:
            raise ZenConfigError("Target repository URL cannot be empty.")

        self._target_repo_url: Final[str] = target_repo_url
        self._source_repo_urls: Final[List[str]] = source_repo_urls
        self._files_to_update: Final[Tuple[str, ...]] = tuple(files_to_update) if files_to_update is not None else tuple()
        self._branch_name: Final[str] = branch_name
        self._max_iterations: Final[int] = max_iterations
        self._safety_checks: Final[bool] = safety_checks
        
        # --- Dependency Initialization ---
        self._git_manager: Final[GitManager] = GitManager()
        self._knowledge_base: Final[KnowledgeBase] = KnowledgeBase()
        self._evolution_engine: Final[EvolutionEngine] = EvolutionEngine(
            max_iterations=max_iterations,
            safety_checks=safety_checks
        )
        
        # Perform configuration validation immediately
        self._validate_environment()
    
    def _validate_environment(self) -> None:
        """Validate required environment variables are set."""
        
        missing = [var for var in REQUIRED_ENV_VARS if not os.getenv(var)]
        
        if missing:
            raise ZenConfigError(
                f"Missing required environment variables: {', '.join(missing)}"
            )
            
    def _cleanup(self, local_paths: List[str]) -> None:
        """Utility to ensure temporary directories are removed."""
        if not local_paths:
            return

        logger.debug(f"Attempting cleanup for {len(local_paths)} temporary local repositories.")
        try:
            self._git_manager.cleanup_local_paths(local_paths)
            logger.debug("Cleanup successful.")
        except Exception as e:
            logger.warning(f"Failed to clean up temporary paths: {e}")
    
    def run(self) -> Dict[str, Any]:
        """
        Execute complete Zen improvement cycle.
        
        Flow: Clone -> Build Knowledge -> Generate Improvements -> Apply -> Cleanup.
        
        Returns:
            Dictionary with results and statistics
        """
        logger.info("Starting Zen improvement cycle...")
        
        all_local_paths: List[str] = []
        
        repo_urls_to_clone: Final[List[str]] = self._source_repo_urls + [self._target_repo_url]
        total_repos: Final[int] = len(repo_urls_to_clone)
        
        result: Dict[str, Any] = {
            'success': False, 
            'repositories_analyzed': total_repos, 
            'improvements_applied': 0,
            'files_targeted': len(self._files_to_update) or 'All',
            'target_path': None
        }

        try:
            cloned_paths = self._git_manager.clone_repositories(repo_urls_to_clone)
            all_local_paths = cloned_paths 
            
            if len(cloned_paths) != total_repos:
                raise RuntimeError("GitManager failed to clone all specified repositories.")

            target_path: Final[str] = cloned_paths[-1]
            source_paths: Final[List[str]] = cloned_paths[:-1]
            result['target_path'] = target_path 

            logger.info(f"Target repository cloned locally: {target_path}")
            
            if source_paths:
                self._knowledge_base.build(source_paths)
                logger.debug(f"Knowledge base built from {len(source_paths)} repositories.")
            
            improvements = self._evolution_engine.generate_improvements(
                knowledge_base=self._knowledge_base,
                target_local_path=target_path,
                files_to_target=list(self._files_to_update) 
            )
            
            if not improvements:
                logger.info("No improvements generated. Cycle finished successfully.")
                result['success'] = True
                result['improvements_generated'] = 0
                return result

            commit_msg: Final[str] = f"Zen Improvement: Applied {len(improvements)} generated changes."
            
            applied_details = self._git_manager.apply_improvements(
                local_repo_path=target_path,
                improvements=improvements,
                branch_name=self._branch_name,
                commit_message=commit_msg
            )
            
            result.update({
                'improvements_generated': len(improvements),
                'improvements_applied': len(applied_details),
                'new_branch': self._branch_name,
                'success': True
            })
            
            logger.info(f"Zen cycle successfully completed. Applied {result['improvements_applied']} changes.")
            return result
            
        except ZenConfigError as e:
            logger.critical(f"Configuration Error: {e}")
            result['error'] = f"Configuration Error: {str(e)}"
            return result
            
        except Exception as e:
            logger.exception("Zen cycle failed due to an unexpected operational error.")
            result['error'] = f"Operational failure: {type(e).__name__}: {str(e)}"
            return result
            
        finally:
            self._cleanup(all_local_paths)


def parse_args() -> Namespace:
    """Parse command line arguments."""
    parser = ArgumentParser(
        description='Zen: Self-improving code system. Orchestrates knowledge synthesis and code evolution.',
        formatter_class=argparse.RawTextHelpFormatter
    )
    
    parser.add_argument(
        '--target', 
        required=True, 
        help='Target repository URL (e.g., https://github.com/user/project)'
    )
    parser.add_argument(
        '--sources', 
        nargs='+', 
        required=True, 
        help='Space-separated list of source repository URLs for knowledge extraction'
    )
    parser.add_argument(
        '--files', 
        nargs='*', 
        default=None, 
        help='Optional: Specific files (paths relative to target repo root) to focus updates on.'
    )
    parser.add_argument(
        '--branch', 
        default='zen-improvement', 
        help='Name for the new git branch created with improvements (default: zen-improvement)'
    )
    parser.add_argument(
        '--max-iterations', 
        type=int, 
        default=10, 
        help='Maximum number of evolution iterations (default: 10)'
    )
    parser.add_argument(
        '--no-safety', 
        action='store_true', 
        help='Disable safety checks (e.g., static analysis, test execution) during evolution.'
    )
    
    return parser.parse_args()

def main() -> None:
    """Command-line interface for Zen."""
    setup_logging()
    args = parse_args()
    
    try:
        zen = Zen(
            target_repo_url=args.target,
            source_repo_urls=args.sources,
            files_to_update=args.files,
            branch_name=args.branch,
            max_iterations=args.max_iterations,
            safety_checks=not args.no_safety
        )
        
        result = zen.run()
        
        target_path_output = result.get('target_path')
        
        if result['success']:
            print("-" * 40)
            print(f"✅ Zen completed successfully!")
            print(f"   Analyzed repositories: {result['repositories_analyzed']}")
            print(f"   Improvements applied: {result['improvements_applied']}")
            if target_path_output:
                 print(f"   Local changes saved at: {target_path_output}")
            if result.get('new_branch'):
                 print(f"   Created branch: {result['new_branch']}")
            print("-" * 40)
        else:
            print("-" * 40, file=sys.stderr)
            print(f"❌ Zen failed: {result.get('error', 'Unknown error')}", file=sys.stderr)
            print("-" * 40, file=sys.stderr)
            sys.exit(1)

    except ZenConfigError as e:
        logger.critical(f"Startup Failure (Configuration): {e}")
        sys.exit(1)
    except Exception as e:
        logger.critical(f"Critical error during execution startup: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()