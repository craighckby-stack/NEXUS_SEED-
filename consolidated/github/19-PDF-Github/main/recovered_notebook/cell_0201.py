from flask import Flask, request, jsonify

# --- Placeholder Definitions (Hallucinated Context) ---
# Assume 'app' is instantiated Flask application.
# Assume 'session' is the database session object.
# Assume 'User' is the SQLAlchemy model.
# Assume utility functions are defined: verify_password, create_password_hash, 
# scrape_data, analyze_text, train_model, quantum_optimize_features.

# NOTE: Assuming a modern, secure hashing library where verify_password takes (plaintext, hash)


@app.route('/register', methods=['POST'])
def register_user():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'message': 'Username and password are required'}), 400

    # TODO: Add check for existing username here to avoid unique constraint error being the primary rollback trigger
    
    try:
        password_hash = create_password_hash(password) 
        new_user = User(username=username, password_hash=password_hash)
        session.add(new_user)
        session.commit()
        return jsonify({'message': 'Registration successful'}), 201

    except Exception as e:
        session.rollback()
        # Sovereign AGI Log Policy: Detailed internal logging, sanitized external response.
        print(f"[AUTH][REGISTER_FAIL] User {username}: Error Type {type(e).__name__}, Detail: {e}")
        # 500 internal server error might expose too much; if it's a known constraint violation, use 409 Conflict.
        return jsonify({'message': 'Registration failed due to a processing error.'}), 500

@app.route('/login', methods=['POST'])
def login_user():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'message': 'Username and password are required'}), 400
    try:
        user = session.query(User).filter_by(username=username).first()
        
        if user and verify_password(password, user.password_hash):
            # ARCHITECTURAL TODO: Secure Session/Token generation (e.g., JWT) should be initialized here.
            # token = create_auth_token(user.id)
            return jsonify({'message': 'Login successful'}), 200
        else:
            # Use generic message to prevent username enumeration attacks
            return jsonify({'message': 'Invalid credentials'}), 401
    except Exception as e:
        # Log exception details for server monitoring
        print(f"[AUTH][LOGIN_FAIL] User {username}: Error Detail: {e}")
        return jsonify({'message': 'Login failed due to a server error.'}), 500


# --- Command Dispatch Table (Metadata-Driven Governance) ---
# Handlers now include metadata defining execution requirements.

COMMAND_HANDLERS = {
    "scrape_data": {
        "handler": scrape_data, 
        "required": True, 
        "usage": "Usage: scrape_data <url>"
    },
    "analyze_text": {
        "handler": analyze_text, 
        "required": True, 
        "usage": "Usage: analyze_text <text>"
    },
    "train_model": {
        "handler": lambda data: train_model(data or ""), # Handler must accept None/string
        "required": False, 
        "usage": "Usage: train_model [optional_parameters]"
    },
    "quantum_optimize_features": {
        "handler": quantum_optimize_features, 
        "required": True, 
        "usage": "Usage: quantum_optimize_features <QUBO values>"
    },
}

def _extract_command_and_payload(command_string):
    parts = command_string.split(" ", 1)
    cmd = parts[0]
    payload = parts[1] if len(parts) > 1 else None
    return cmd, payload


@app.route('/execute_command', methods=['POST'])
def execute_command_api():
    # ARCHITECTURAL TODO: Implement Auth/Permission check here.
    # if not is_authenticated():
    #     return jsonify({'message': 'Authentication required'}), 403

    data = request.get_json()
    command_string = data.get('command')

    if not command_string:
        return jsonify({'message': 'Command is required'}), 400

    cmd, payload = _extract_command_and_payload(command_string)

    if cmd not in COMMAND_HANDLERS:
        # Policy update: return helpful error
        return jsonify({'output': f"Unknown command: {cmd}."}), 400

    cmd_data = COMMAND_HANDLERS[cmd]
    handler = cmd_data['handler']
    required = cmd_data['required']
    usage = cmd_data['usage']

    # New: Robust input validation using metadata flag
    if required and (payload is None or payload.strip() == ''):
        return jsonify({'output': f"Missing required payload for {cmd}. {usage}"}), 400
        
    try:
        # Pass payload (which might be None or a string) directly to the handler
        result = handler(payload)
        
    except Exception as e:
        # Log exception details and return generic error
        print(f"[COMMAND_EXECUTION_FAIL] Command {cmd}: Error Detail: {e}")
        result = f"Error executing {cmd}: Internal processing failure."
        return jsonify({'output': result}), 500
            
    return jsonify({'output': result}), 200