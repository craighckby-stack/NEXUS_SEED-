import subprocess
import json

class IntegrityHandlerExecutor:
    """Manages and securely executes RIMP integrity handlers."""

    def __init__(self, handler_map):
        self.handlers = {h['ref_id']: h for h in handler_map['handlers']}

    def execute_local_script(self, ref_id, context):
        handler = self.handlers.get(ref_id)
        if not handler or handler['action']['type'] != 'LOCAL_EXECUTION':
            raise ValueError('Invalid handler or type.')

        action = handler['action']
        cmd = [action['path']] + [self._template_param(p, context) for p in action['parameters']]

        try:
            result = subprocess.run(cmd, timeout=action.get('timeout_ms', 5000) / 1000.0, capture_output=True, check=True, text=True)
            return {'status': 'success', 'stdout': result.stdout, 'stderr': result.stderr}
        except subprocess.CalledProcessError as e:
            return {'status': 'error', 'reason': 'Script failed', 'code': e.returncode, 'output': e.stderr}
        except subprocess.TimeoutExpired:
            return {'status': 'error', 'reason': 'Execution timed out'}

    def _template_param(self, param, context):
        # Simple substitution logic for ${ctx.key}
        if param.startswith('${ctx.') and param.endswith('}'):
            key = param[6:-1]
            return str(context.get(key, 'UNKNOWN'))
        return param

# Note: Other execution types (API calls, config patches) require dedicated methods (e.g., execute_remote_api).