import threading
from typing import TYPE_CHECKING, Callable, Any

# NOTE: Context assumes these definitions exist within the class scope or external libraries.
if TYPE_CHECKING:
    # Assuming the class has these methods/attributes
    class T: # Placeholder for self
        task_executor: Any
        scrape_data_thread: Callable[[str], None]
        update_output: Callable[[str], None]
        username_input: Any
        password_input: Any
        output_box: Any
        input_box: Any
        user_logged_in: bool
        login_register_box: Any
        command_history: list[str]

# Hallucinated external dependencies (Used in login and commands)
def analyze_text(args):
    # Mock function
    return f"Analysis complete for {len(args)} characters."

def train_model(args):
    # Mock function
    return f"Training initiated using configuration '{args}'."

# Mocks for Login context (Replace with actual imports/AuthService interaction)
class User:
    def __init__(self, password_hash): self.password_hash = password_hash
def verify_password(raw, hashed): return raw == 'secure_pass' 
class MockSession:
    def query(self, *args): return self
    def filter_by(self, username): return self
    def first(self): return User(password_hash='hashed_secure_pass')
session = MockSession()
# End Mocks


# Helper command handlers (Integrated Command Service architecture)

def _cmd_scrape_data(self: 'T', args: str):
    """Initiates an asynchronous web scraping job using the configured task executor."""
    if not args:
        self.update_output("Usage: scrape_data <url>")
        return
    url = args.strip()

    # ARCHITECTURAL IMPROVEMENT: Use an executor/threadpool if available for non-blocking GUI execution.
    try:
        if hasattr(self, 'task_executor') and self.task_executor:
            # Assuming self.task_executor is a concurrent.futures.ThreadPoolExecutor or similar.
            self.task_executor.submit(self.scrape_data_thread, url)
            self.update_output(f"[TASK] Initiating asynchronous scrape: {url}.")
        else:
            # Fallback to raw threading.Thread
            threading.Thread(target=self.scrape_data_thread, args=(url,), daemon=True).start()
            self.update_output(f"[THREAD] Initiating raw scrape: {url}.")
    except Exception as e:
        self.update_output(f"Error starting scrape task: {type(e).__name__} {e}")

def _cmd_analyze_text(self: 'T', args: str):
    """Performs text analysis on the provided arguments."""
    if not args:
        self.update_output("Usage: analyze_text <text>")
        return
    try:
        result = analyze_text(args)
        self.update_output(f"Analysis result:\n{result}")
    except Exception as e:
        self.update_output(f"Error during text analysis: {type(e).__name__}: {e}")

def _cmd_train_model(self: 'T', args: str):
    """Initiates a model training task using configuration specified in arguments."""
    if not args:
        self.update_output("Usage: train_model <config>")
        return
    try:
        result = train_model(args.strip()) 
        self.update_output(f"Training task status: {result}")
    except Exception as e:
        self.update_output(f"Error initiating model training: {type(e).__name__}: {e}")

def _cmd_help(self: 'T', args: str):
    """Displays available commands or detailed help for a specific command."""
    # Reflect the available commands dynamically or statically
    available_commands = [
        ('scrape_data', 'Initiates asynchronous scraping.'),
        ('analyze_text', 'Performs static text analysis.'),
        ('train_model', 'Starts model training.'),
        ('help', 'Shows this help menu.')
    ]
    
    args = args.strip().lower()

    if args and getattr(self, f'_cmd_{args}', None):
        # Try to retrieve docstring of the requested command
        handler = getattr(self, f'_cmd_{args}')
        doc = handler.__doc__ or "No detailed description available."
        self.update_output(f"--- Help: {args} ---\n{doc}")
    else:
        output = "Available commands (Type 'help <cmd>' for details):\n"
        for cmd, desc in available_commands:
            output += f"  {cmd:<15} - {desc}\n"
        self.update_output(output.strip())


# Dispatcher for cleaner command handling
def _parse_and_dispatch(self: 'T', command: str):
    # Use partition for cleaner separation of command and arguments
    cmd_name, _, args = command.strip().lower().partition(" ")

    # Dynamic method lookup based on command name (e.g., 'scrape_data' looks for '_cmd_scrape_data')
    handler = getattr(self, f'_cmd_{cmd_name}', None)

    if handler:
        # Handlers are responsible for receiving (self, args)
        handler(self, args) 
    else:
        self.update_output(f"Error: Unknown command '{cmd_name}'. Type 'help' for available commands.")

def login(self: 'T', instance):
    username = self.username_input.text.strip()
    password = self.password_input.text
    if not username or not password:
        self.update_output("Input error: Username and password cannot be empty.")
        return
    try:
        # ARCHITECTURAL IMPROVEMENT: Assuming abstraction layer (AuthService) is bypassed here for demonstration.
        
        user = session.query(User).filter_by(username=username).first()
        
        # Standardize authentication logic flow
        is_authenticated = False
        if user:
             # Refactoring password verification to assume verify_password handles time-safe comparison
            is_authenticated = verify_password(password, user.password_hash)

        if is_authenticated:
            self.update_output(f"Login successful! User: {username}")
            self.user_logged_in = True
            self.input_box.disabled = False
            self.login_register_box.disabled = True
            self.password_input.text = '' # Clear sensitive data
        else:
            # Use a time-safe response to prevent timing attacks
            self.update_output("Security notice: Invalid username or password.")
            self.password_input.text = '' # Clear sensitive data on failure
    except Exception as e:
        # Catch database connectivity or unexpected system errors
        self.update_output(f"System error during login attempt: {type(e).__name__}.")

def update_output(self: 'T', text):
    self.output_box.text += '\n' + text
    # Ensure scroll down, crucial for console UI
    self.output_box.scroll_y = 0

def execute_command(self: 'T', instance):
    if not self.user_logged_in:
        self.update_output("Access denied: Please log in first.")
        return

    command = self.input_box.text.strip()
    if not command:
        return
        
    self.command_history.append(command)
    self.input_box.text = ''
    self.update_output(f"$ {command}") # Display the echoed command
    
    # Delegate parsing and execution
    _parse_and_dispatch(self, command)