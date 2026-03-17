import logging
import queue
import threading
from logging.handlers import QueueHandler, QueueListener
from typing import Optional


class AsyncLogHandler(QueueHandler):
    """
    A handler that pushes logs into a queue, processed asynchronously by a listener.
    This prevents the main application thread from blocking on IO operations (e.g., writing to disk/network).
    """
    
    # Shared queue for all async log handlers across the system
    LOG_QUEUE = queue.Queue(-1)
    
    def __init__(self, target_handler: logging.Handler, listener: Optional[QueueListener] = None):
        super().__init__(self.LOG_QUEUE)
        
        # If a listener is not provided, initialize and start a new one
        if listener is None:
            self.listener = self._initialize_listener(target_handler)
        else:
            self.listener = listener
            
        if not self.listener.is_alive():
            self.listener.start()
            
    @classmethod
    def _initialize_listener(cls, target_handler: logging.Handler) -> QueueListener:
        """Create and configure the QueueListener using a dedicated thread."""
        listener = QueueListener(
            cls.LOG_QUEUE,
            target_handler, 
            respect_handler_level=True
        )
        # Rename thread for clarity in system logs/debugging
        listener._thread.name = "LogListenerThread"
        return listener

    def stop_listener(self):
        """Stops the QueueListener thread safely. Should be called during graceful shutdown."""
        if self.listener.is_alive():
            self.listener.stop()

# Usage Example Setup:
# from src.core.utils.structured_logger import JsonFormatter
# 
# # 1. Define the actual IO handler (e.g., streaming to console)
# console_handler = logging.StreamHandler()
# console_handler.setFormatter(JsonFormatter())
# 
# # 2. Wrap it in the Async handler
# async_handler = AsyncLogHandler(console_handler)
# 
# # 3. Pass the async_handler to get_structured_logger in the main bootstrap file.
# # Remember to call async_handler.stop_listener() when the application exits.
