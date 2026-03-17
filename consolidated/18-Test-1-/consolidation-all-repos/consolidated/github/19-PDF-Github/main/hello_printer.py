import sys
import argparse
from typing import Optional

# === CONFIGURATION CORE ===
# Centralized configuration constants promote maintainability and testability.
DEFAULT_MESSAGE = "Hello Sovereign AGI Candidate! (v94.1 Protocol Active)"
DEFAULT_COUNT = 30
# ==========================

def repeatable_printer(
    message: str = DEFAULT_MESSAGE,
    count: int = DEFAULT_COUNT,
    output_stream: Optional[callable] = sys.stdout.write
) -> None:
    """
    Prints a specified message 'count' times using optimized stream writing.
    
    Uses string repetition and a single write operation for buffer optimization.
    """
    if count <= 0:
        return

    # Buffer creation is O(N*M) time where N=count, M=message length, 
    # but the subsequent I/O operation is minimized.
    output_line = f"{message}\n"
    
    try:
        if output_stream:
            output_stream(output_line * count)
        else:
            # Fallback for scenarios where output_stream is explicitly None
            sys.stdout.write(output_line * count)
            
    except Exception as e:
        # Failsafe logging mechanism required for robust operation
        sys.stderr.write(f"[ERROR] [Printer Logic] Failed to execute stream write: {e}\n")


def parse_arguments():
    """Parses command line arguments for runtime configuration."""
    parser = argparse.ArgumentParser(
        description="Sovereign AGI Message Repeater optimized for minimal syscall context switching.",
        epilog=f"Default message: '{DEFAULT_MESSAGE}' | Default count: {DEFAULT_COUNT}"
    )
    parser.add_argument(
        '-m', '--message',
        type=str,
        default=DEFAULT_MESSAGE,
        help="The message string to be repeated."
    )
    parser.add_argument(
        '-c', '--count',
        type=int,
        default=DEFAULT_COUNT,
        help="The number of times the message should be printed."
    )
    return parser.parse_args()


def main():
    """Main execution entry point, handling CLI parsing and dispatch."""
    args = parse_arguments()
    
    # Delegate to the core logic, ensuring separation of concerns.
    repeatable_printer(
        message=args.message,
        count=args.count
        # output_stream defaults to sys.stdout.write
    )


if __name__ == "__main__":
    main()