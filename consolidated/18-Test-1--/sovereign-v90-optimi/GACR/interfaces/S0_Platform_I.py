from abc import ABC, abstractmethod
from typing import Dict, Any, List, Set, Optional

class S0_Platform_I(ABC):
    """
    S0_Platform_I: Abstract Interface for the AGI Kernel's underlying computational platform.
    Ensures recursive abstraction and separation of concerns between the AGI logic
    and the environment execution layer.
    """

    @abstractmethod
    def load_config(self, path: str) -> Dict[str, Any]:
        """
        Loads and validates configuration settings required by the kernel.
        Must handle dynamic reloading for self-optimization loops.
        """
        raise NotImplementedError

    @abstractmethod
    def read_file_content(self, file_path: str) -> str:
        """
        Retrieves the current content of a specific file for analysis (Code Analysis step).
        Essential for comprehension and evolution generation.
        """
        raise NotImplementedError

    @abstractmethod
    def execute_task(self, task_descriptor: Dict[str, Any]) -> Any:
        """
        Executes an arbitrary computational task (e.g., LLM inference, code generation,
        or API interaction), ensuring efficient resource management.
        """
        raise NotImplementedError

    @abstractmethod
    def get_repository_tree(self, root_path: str) -> List[str]:
        """
        Provides a comprehensive list of all files in the repository (2,300+ file awareness).
        Critical input for the Navigator System's strategic selection protocol.
        """
        raise NotImplementedError

    @abstractmethod
    def update_file(self, file_path: str, new_content: str) -> bool:
        """
        Writes evolved content back to the repository, handling both modification and creation.
        Essential for recursive self-improvement (Commit step).
        """
        raise NotImplementedError

    @abstractmethod
    def create_emergent_file(self, category: str, filename: str, content: str) -> Optional[str]:
        """
        Handles the specific protocol for creating a file within the designated 
        '/emergent/[category]/[filename]' structure, returning the full path if successful.
        Crucial for achieving autonomous capability development and adherence to the Emergence Protocol.
        """
        raise NotImplementedError

    @abstractmethod
    def track_navigator_state(self, blacklist: Set[str], cycle_num: int) -> None:
        """
        Persists the current state of the Navigator System, including the Blacklist
        and cycle number, for resilient state management and learning retention.
        """
        raise NotImplementedError
    
    @abstractmethod
    def log_cycle_data(self, cycle_data: Dict[str, Any]) -> None:
        """
        Persists learning retention data and metrics, foundational for the Memory system.
        (Includes tracking evolution history and stagnation markers).
        """
        raise NotImplementedError

    @abstractmethod
    def get_system_metrics(self) -> Dict[str, float]:
        """
        Retrieves real-time resource utilization and performance metrics for optimization.
        """
        raise NotImplementedError