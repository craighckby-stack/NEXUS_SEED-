self.password_input = TextInput(multiline=False, password=True)
self.login_button = Button(text='Login')
self.register_button = Button(text='Register')
self.login_button.bind(on_press=self.login)
self.register_button.bind(on_press=self.register)

# 1. Authentication Panel Assembly (Formerly login_register_box)
# Using fixed height/size_hint=None control visibility via _toggle_view
self.auth_panel = BoxLayout(orientation='vertical', size_hint_y=None, height=300, spacing=5, padding=10)
self.auth_panel.add_widget(self.username_label) # Assumed defined elsewhere
self.auth_panel.add_widget(self.username_input)
self.auth_panel.add_widget(self.password_label)
self.auth_panel.add_widget(self.password_input)
self.auth_panel.add_widget(self.login_button)
self.auth_panel.add_widget(self.register_button)

# 2. Console Panel Definitions
self.input_label = Label(text='Enter Command:')
self.input_box = TextInput(multiline=False)
self.output_label = Label(text='Output:')
self.output_box = TextInput(multiline=True, readonly=True)
self.input_box.bind(on_text_validate=self.execute_command)

# 3. Console Panel Assembly
self.console_panel = BoxLayout(orientation='vertical', padding=10, spacing=5, size_hint_y=1)
self.console_panel.add_widget(self.input_label)
self.console_panel.add_widget(self.input_box)
self.console_panel.add_widget(self.output_label)
self.console_panel.add_widget(self.output_box)

# 4. Add containers and manage state
self.add_widget(self.auth_panel)
self.add_widget(self.console_panel)

self.command_history = []
self.user_logged_in = False
self._toggle_view() # Initialize view state

def _toggle_view(self):
    """Manages visibility of Auth vs Console panels."""
    # Kivy opacity/height management for hiding widgets in BoxLayout
    if self.user_logged_in:
        self.auth_panel.opacity = 0
        self.auth_panel.height = 0
        self.auth_panel.disabled = True
        self.console_panel.opacity = 1
        self.console_panel.disabled = False
    else:
        self.auth_panel.opacity = 1
        self.auth_panel.height = 300 
        self.auth_panel.disabled = False
        self.console_panel.opacity = 0
        self.console_panel.height = 0
        self.console_panel.disabled = True

def register(self, instance):
    username = self.username_input.text.strip()
    password = self.password_input.text
    
    if not username or not password:
        self.update_output("Username and password cannot be empty.")
        return
    try:
        existing_user = session.query(User).filter_by(username=username).first()
        if existing_user:
            self.update_output(f"User '{username}' already exists.")
            return
        salt, password_hash = hash_password(password)
        new_user = User(username=username, password_hash=password_hash)
        session.add(new_user)
        session.commit()
        self.update_output(f"Registration successful for '{username}'. Please log in.")
        self.username_input.text = ''
        self.password_input.text = ''
    except Exception as e:
        import logging
        logging.exception("Registration failed due to database or hashing error.")
        self.update_output(f"Registration failed due to an internal system error.")

'''
# Command input and output
# Output:
# Registration successful for 'user'. Please log in.
# User 'user' already exists.
# Username and password cannot be empty.
# Registration failed due to an internal system error.
'''