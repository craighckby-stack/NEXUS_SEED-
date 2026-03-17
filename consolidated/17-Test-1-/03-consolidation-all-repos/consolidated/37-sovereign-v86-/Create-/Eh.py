import base64
import datetime
import time
import re
from typing import Any, Dict, List, Optional, Callable
from enum import Enum

# --- ENUMS AND CONSTANTS ---

class Status(str, Enum):
    """Sovereign Engine status."""
    IDLE = 'IDLE'
    INDEXING = 'INDEXING'
    PROCESSING = 'PROCESSING'
    COMPLETE = 'COMPLETE'
    ABORTED = 'ABORTED'
    ERROR = 'ERROR'

class ActionType(str, Enum):
    """Recognized state mutations."""
    SET_VALUE = 'SET_VALUE'
    TOGGLE_LIVE = 'TOGGLE_LIVE'
    ACKNOWLEDGE = 'ACKNOWLEDGE'
    SET_STATUS = 'SET_STATUS'
    UPDATE_METRICS = 'UPDATE_METRICS'
    MARK_COMPLETE = 'MARK_COMPLETE'

# --- CONFIGURATION ---
CONFIG = {
    'APP_ID': 'sovereign_app',
    'MAX_API_RETRIES': 5,
    'CYCLE_INTERVAL_MS': 500,
    'MAX_FILE_SIZE_BYTES': 1024 * 1024,  # 1MB
    'DEFAULT_MODEL': 'gemini-2.5-flash',
}

PIPELINES = {
    'GENERIC': [
        {'text': 'Refactor this code snippet for modern Python 3 standards, improve clarity, and optimize performance.'},
    ],
}

FILE_EXTENSIONS = {
    'ALL': r'\.py$|\.js$|\.ts$|\.md$|\.json$|\.yaml$',
}

SKIP_PATTERNS = [
    re.compile(r'node_modules'),
    re.compile(r'\.test\.'),
    re.compile(r'dist/'),
]

# --- Utility Functions ---

def parse_repo_path(path: Optional[str]) -> Optional[List[str]]:
    """Parses 'owner/repo' string into a list [owner, repo]."""
    if not path:
        return None
    return list(filter(None, path.strip().split('/', maxsplit=1)))

def decode_base64(content: str) -> str:
    """Decodes base64 content."""
    try:
        return base64.b64decode(content.encode('utf-8')).decode('utf-8')
    except Exception as e:
        raise ValueError(f"Base64 decoding error: {e}")

def encode_base64(content: str) -> str:
    """Encodes string content to base64."""
    return base64.b64encode(content.encode('utf-8')).decode('utf-8')

def safe_doc_id(path: str) -> str:
    """Creates a safe ID string from a file path."""
    return re.sub(r'[\/\\\.]', '_', path).strip('_')

# --- Mock Dependencies (Isolation Layer) ---

class MockDB:
    """Mock Firebase Firestore object."""
    def doc(self, *args):
        return self
    def set(self, *args):
        pass

class AbortSignal:
    """Mocks the signal part of an AbortController."""
    def __init__(self):
        self.aborted: bool = False

class AbortController:
    """Mocks the AbortController for flow control."""
    def __init__(self):
        self.signal: AbortSignal = AbortSignal()

    def abort(self):
        self.signal.aborted = True

# --- Service Definitions ---

class RuntimeContext:
    """Centralized repository for mutable runtime data and control references."""
    def __init__(self):
        self.gh_token: Optional[str] = None
        self.gemini_key: Optional[str] = None
        self.queue: List[str] = []
        self.current_index: int = 0
        self.is_processing: bool = False
        self.abort_controller: Optional[AbortController] = None

class AppState:
    """Manages the centralized application state using a controlled dispatch pattern."""
    def __init__(self):
        self.state = {
            'isLive': False,
            'isIndexed': False,
            'isAcknowledged': False,
            'status': Status.IDLE,
            'targetRepo': 'owner/repo',
            'selectedModel': CONFIG['DEFAULT_MODEL'],
            'activePath': '',
            'metrics': {'mutations': 0, 'errors': 0, 'progress': 0},
            'logs': [],
        }
        self.user = {'uid': 'user123'}
        self.log_fn: Callable[[str, str], None] = self.create_logger()

    def create_logger(self) -> Callable[[str, str], None]:
        """Provides a centralized logging utility function."""
        def add_log(msg: str, log_type: str = "info"):
            self.log(msg, log_type)
            print(f"[LOG {log_type.upper():<5}] {datetime.datetime.now().strftime('%H:%M:%S')}: {msg}")
        return add_log

    def log(self, msg: str, log_type: str):
        """Internal logging handler for state storage."""
        timestamp = datetime.datetime.now().strftime('%H:%M:%S')
        self.state['logs'].append({'msg': msg, 'type': log_type, 'timestamp': timestamp})

    def dispatch(self, action: Dict[str, Any]):
        """Applies state changes based on action type."""
        try:
            action_type = ActionType(action.get('type'))
        except ValueError:
            self.log_fn(f"Unknown action type received: {action.get('type')}", 'error')
            return

        if action_type == ActionType.SET_VALUE:
            self.set_value(action)
        
        elif action_type == ActionType.TOGGLE_LIVE:
            self.toggle_live()

        elif action_type == ActionType.ACKNOWLEDGE:
            self.acknowledge()

        elif action_type == ActionType.SET_STATUS:
            self.set_status(action)

        elif action_type == ActionType.UPDATE_METRICS:
            self.update_metrics(action)

        elif action_type == ActionType.MARK_COMPLETE:
            self.mark_complete()

    def set_value(self, action: Dict[str, Any]):
        """Sets a state value."""
        key = action.get('key')
        if key in self.state:
            self.state[key] = action.get('value')

    def toggle_live(self):
        """Toggles the isLive flag."""
        self.state['isLive'] = not self.state['isLive']

    def acknowledge(self):
        """Acknowledges the application state."""
        self.state['isAcknowledged'] = True

    def set_status(self, action: Dict[str, Any]):
        """Sets the application status."""
        status_value = action.get('value')
        if status_value in Status.__members__.values():
            self.state['status'] = status_value
            if 'path' in action:
                self.state['activePath'] = action['path']

    def update_metrics(self, action: Dict[str, Any]):
        """Updates the application metrics."""
        metrics = self.state['metrics']
        metrics['mutations'] += action.get('m', 0)
        metrics['errors'] += action.get('e', 0)
        if 'progress' in action:
            metrics['progress'] = action['progress']

    def mark_complete(self):
        """Marks the application as complete."""
        self.state['isLive'] = False
        self.state['status'] = Status.COMPLETE

# --- Core Logic Functions ---

def call_gemini_api(
    content_prompt: str,
    persona_text: Dict[str, str],
    model_id: str,
    api_key: Optional[str],
    retry_count: int = 0,
) -> str:
    """Placeholder for AI API interaction with retry logic."""
    if not api_key:
        raise PermissionError("API Key is required for AI processing.")

    if retry_count >= CONFIG['MAX_API_RETRIES']:
        raise ConnectionError("Exhausted maximum API retry attempts.")

    abort_controller = context.abort_controller
    delay_s = 2 ** retry_count

    try:
        if abort_controller and abort_controller.signal.aborted:
            raise TimeoutError("Processing aborted by user.")

        time.sleep(delay_s)

        response_suffix = f"Length={len(content_prompt)}"
        processed_content = f"// Refactored version based on: {persona_text['text'][:20]}... {response_suffix}"
        return processed_content

    except TimeoutError as te:
        raise te
    except Exception as e:
        if retry_count < CONFIG['MAX_API_RETRIES'] - 1:
            context.log_fn(f"API call failed ({type(e).__name__}). Retrying in {delay_s:.1f}s.", "warn")
            return call_gemini_api(content_prompt, persona_text, model_id, api_key, retry_count + 1)
        
        raise ConnectionError(f"API call failed after {retry_count + 1} attempts.") from e

def process_file(
    file_path: str,
    owner: str,
    repo: str,
    token: Optional[str],
    api_key: Optional[str],
    model_id: str,
) -> Dict[str, Any]:
    """Handles fetching, AI processing, and simulated external writes."""
    if not token or not api_key:
        raise PermissionError("Missing authentication tokens (GitHub/Gemini).")

    mock_content = "def old_function():\n    return 1 + 1"
    content = decode_base64(encode_base64(mock_content))

    context.dispatch({'type': ActionType.SET_STATUS, 'value': Status.PROCESSING, 'path': file_path})

    persona = PIPELINES['GENERIC'][0]
    processed = call_gemini_api(content, persona, model_id, api_key)

    if processed and processed != content and len(processed.strip()) > 5:
        mock_set_doc_history(file_path, app_state.user['uid'])
        return {'status': 'MUTATED', 'file_path': file_path}

    return {'status': 'SKIPPED', 'file_path': file_path}

# --- Control Functions ---

def run_cycle():
    """The core loop driver, managing file iteration."""
    if not app_state.state['isLive'] or context.is_processing or app_state.state['status'] != Status.PROCESSING or not app_state.state['isIndexed']:
        return

    context.is_processing = True

    if context.current_index >= len(context.queue):
        context.log_fn("Job Queue Empty. Cycle Finished.", "success")
        context.dispatch({'type': ActionType.MARK_COMPLETE})
        context.is_processing = False
        return

    file_path_to_process = context.queue[context.current_index]

    try:
        repo_path = parse_repo_path(app_state.state['targetRepo'])
        if not repo_path:
            raise ValueError("Invalid repository path configured.")
        owner, repo = repo_path

        result = process_file(
            file_path_to_process,
            owner,
            repo,
            context.gh_token,
            context.gemini_key,
            app_state.state['selectedModel'],
        )

        if result['status'] == 'MUTATED':
            context.log_fn(f"MUTATED: {file_path_to_process.split('/')[-1]}", "success")
            context.dispatch({'type': ActionType.UPDATE_METRICS, 'm': 1})
        else:
            context.log_fn(f"CLEAN (Skipped): {file_path_to_process.split('/')[-1]}", "info")

    except TimeoutError:
        context.dispatch({'type': ActionType.SET_STATUS, 'value': Status.ABORTED})
        context.log_fn("Processing cycle aborted by user.", "warn")
    except Exception as e:
        context.log_fn(f"FAULT on {file_path_to_process}: {type(e).__name__}: {e}", "error")
        context.dispatch({'type': ActionType.UPDATE_METRICS, 'e': 1})
    finally:
        context.current_index += 1
        total = len(context.queue)
        
        new_progress = min(100, round((context.current_index / total) * 100)) if total > 0 else app_state.state['metrics']['progress']

        context.dispatch({
            'type': ActionType.UPDATE_METRICS,
            'progress': new_progress
        })

        context.is_processing = False
        if not app_state.state['isLive']:
            context.dispatch({'type': ActionType.SET_STATUS, 'value': Status.IDLE})
        elif app_state.state['status'] != Status.ABORTED:
            context.dispatch({'type': ActionType.SET_STATUS, 'value': Status.PROCESSING})

def start_cycle_timer():
    """Starts the simulation of the periodic processing cycle."""
    if not app_state.state['isLive']:
        return
    
    context.log_fn(f"Starting processing cycle...", "info")
    run_cycle()

def handle_main_button():
    """Simulates the primary UI interaction button (Start/Stop/Index)."""
    state = app_state.state

    if state['isLive']:
        context.dispatch({'type': ActionType.TOGGLE_LIVE})
        context.log_fn("Stopping cycle...", "info")
        if context.abort_controller:
            context.abort_controller.abort()
        return

    if state['isIndexed']:
        context.dispatch({'type': ActionType.TOGGLE_LIVE})
        context.current_index = 0 
        context.abort_controller = AbortController() 
        start_cycle_timer()
        return

    repo_path = parse_repo_path(state['targetRepo'])
    if not repo_path or not context.gh_token or not context.gemini_key:
        context.log_fn("Configuration Incomplete: Check Repo Path, GitHub Token, and Gemini Key.", "error")
        return

    context.dispatch({'type': ActionType.SET_STATUS, 'value': Status.INDEXING})
    context.abort_controller = AbortController() 

    try:
        mock_tree = [
            {'type': 'blob', 'path': 'Eh.py', 'size': 1000},
            {'type': 'blob', 'path': 'src/main.js', 'size': 500},
            {'type': 'blob', 'path': 'README.md', 'size': 2000},
            {'type': 'blob', 'path': 'config/settings.json', 'size': 100},
            {'type': 'blob', 'path': 'data/ignore_me.log', 'size': 0},
            {'type': 'blob', 'path': 'node_modules/package.js', 'size': 10000}, 
            {'type': 'blob', 'path': 'test/test_util.py', 'size': 150},
        ]

        context.queue = [
            f['path'] for f in mock_tree
            if f['type'] == 'blob'
            and 0 < f['size'] < CONFIG['MAX_FILE_SIZE_BYTES']
            and not any(p.search(f['path']) for p in SKIP_PATTERNS)
            and re.search(FILE_EXTENSIONS['ALL'], f['path'])
        ]

        context.current_index = 0
        context.dispatch({'type': ActionType.SET_VALUE, 'key': 'isIndexed', 'value': True})
        context.log_fn(f"Indexing Complete. Found {len(context.queue)} processable files.", "success")

        context.dispatch({'type': ActionType.TOGGLE_LIVE})
        start_cycle_timer()

    except Exception as e:
        context.log_fn(f"Index Error: {e}", "error")
        context.dispatch({'type': ActionType.SET_STATUS, 'value': Status.IDLE})
    finally:
        if not state['isLive']:
            context.dispatch({'type': ActionType.SET_STATUS, 'value': Status.IDLE})

def initialize_system():
    """Simulates the application startup sequence."""
    if not app_state.state['isAcknowledged']:
        context.dispatch({'type': ActionType.ACKNOWLEDGE})
        context.gh_token = "mock_gh_token_123"
        context.gemini_key = "mock_gemini_key_456"
        
        if not app_state.state['isAcknowledged']:
            initialize_system()
            return

    print("\n--- Sovereign Engine Mock Initialized ---")
    context.log_fn(f"Ready to process target: {app_state.state['targetRepo']}", "info")


if __name__ == '__main__':
    initialize_system()
    
    print("\n--- Simulating Start/Index ---")
    handle_main_button() 
    
    print("\n--- Simulating Further Cycles ---")
    for i in range(1, 6):
        if app_state.state['isLive']:
            print(f"\n--- Cycle {i} ---")
            run_cycle()
        else:
            break

    print("\n--- Final State ---")
    print(f"Status: {app_state.state['status'].value}")
    print(f"Metrics: {app_state.state['metrics']}")