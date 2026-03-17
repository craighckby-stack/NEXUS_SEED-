from typing import Type
from pydantic import BaseModel
import logging
import importlib

logger = logging.getLogger('CSRE.Resolver')

class GovernanceModelResolver:
    """Utility class responsible for abstracting the location and loading of Pydantic Governance Models.
    Decouples CSRE from hardcoded file path dependencies.
    """

    @staticmethod
    def resolve_policy_model(model_name: str, import_path: str, package_root: str = "system.governance") -> Type[BaseModel]:
        """Dynamically loads the specified Pydantic model class from the module path."""
        
        # Construct the full absolute path for importlib
        full_path = f"{package_root}.{import_path.strip('.')}"
        
        try:
            module = importlib.import_module(full_path)
            Model = getattr(module, model_name)
            
            if not issubclass(Model, BaseModel):
                raise TypeError(f"Resolved object '{model_name}' is not a valid Pydantic BaseModel.")
            
            logger.debug(f"Successfully resolved model: {model_name} from {full_path}")
            return Model
            
        except (ImportError, AttributeError, TypeError) as e:
            logger.critical(f"RESOLUTION FAILURE: Could not load required governance model '{model_name}'. Error: {type(e).__name__}")
            # Raise an import error, allowing upstream components (like CSRE) to wrap it in ConfigurationLoadError
            raise ImportError(f"Failed to locate governance model {model_name}: {e}")