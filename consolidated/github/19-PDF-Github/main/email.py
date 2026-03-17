import os
import uuid
import smtplib
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formatdate
from pathlib import Path
from typing import Dict, Optional
from base64 import b64encode
from enum import Enum
from dataclasses import dataclass
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

@dataclass
class SmtpConfig:
    host: str = 'smtp.gmail.com'
    port: int = 465
    user_email: str = "user@example.com"
    token: str = "oauth_token"
    use_ssl: bool = True

class TrackingStatus(Enum):
    ENABLED = 1
    DISABLED = 2

class EmailBuilder:
    def __init__(self, subject: str, sender: str, recipient: str):
        self.tracking_id = uuid.uuid4()
        self.message = MIMEMultipart('alternative')
        self._html_content = None
        self._text_content = None
        self._tracking_enabled = False

        self.message['Subject'] = subject
        self.message['From'] = sender
        self.message['To'] = recipient

    def add_attachments(self, files: Dict[str, Path]):
        optimized_files = self.optimize_attachments(list(files.values()))
        for file in optimized_files:
            try:
                with open(file, "rb") as f:
                    # Fix: Replaced Unicode quotes with standard ASCII quotes
                    attachment = MIMEApplication(f.read(), Name=os.path.basename(file))
                    attachment['Content-Disposition'] = f'attachment; filename="{os.path.basename(file)}"'
                    self.message.attach(attachment)
            except IOError as e:
                print(f"Warning: Could not read attachment {file}. Error: {e}")

    def optimize_attachments(self, files):
        # AGI potential future implementation: Compression, virus scanning, size limits
        return files

    def set_content(self, html_template: str, text_template: Optional[str] = None):
        # Changed add_html_content to set_content to manage both parts consistently
        self._html_content = self.suggest_content_improvements(html_template)
        self._text_content = text_template

    def suggest_content_improvements(self, html_template: str):
        return html_template

    def enable_tracking(self, status: TrackingStatus = TrackingStatus.ENABLED):
        self._tracking_enabled = (status == TrackingStatus.ENABLED)

    def enable_read_receipt(self):
        # Fix: Replaced Unicode quotes
        self.message['Disposition-Notification-To'] = self.message['From']

    def build_message(self) -> MIMEMultipart:
        final_html = self._html_content

        if self._tracking_enabled and final_html:
            beacon_url = f"https://tracking.server.com/pixel/{self.tracking_id}"
            # Fix: Removed extra closing quote
            pixel = f'<img src="{beacon_url}" width="1" height="1" alt="tracking">'
            
            # Insert pixel before closing body tag
            if '</body' in final_html.lower():
                 final_html = final_html.replace('</body>', pixel + '</body>', 1)
            else:
                final_html += pixel

        if self._text_content:
            self.message.attach(MIMEText(self._text_content, 'plain'))
            
        if final_html:
            self.message.attach(MIMEText(final_html, 'html'))
            
        self.message['Date'] = formatdate(localtime=True)
        return self.message

class EmailService:
    def __init__(self, config: SmtpConfig):
        # Dependency injection of configuration
        self.config = config

    def send_email(self, builder: EmailBuilder):
        try:
            if self.evaluate_security_measures():
                msg = builder.build_message()

                if self.config.use_ssl:
                    server = smtplib.SMTP_SSL(self.config.host, self.config.port)
                else:
                    server = smtplib.SMTP(self.config.host, self.config.port)
                    server.starttls() # Use STARTTLS for standard port if not SSL
                
                with server:
                    server.ehlo()
                    if self.config.user_email and self.config.token:
                        server.login(self.config.user_email, self.config.token)
                        
                    # Use message headers for From/To
                    server.sendmail(msg['From'], msg['To'], msg.as_string())
                    self.log_history(f"Email Sent to {msg['To']} (Tracking ID: {builder.tracking_id})")
                    return True, builder.tracking_id
            else:
                self.log_history("Security Evaluation Failed")
                return False, "Security measures not met"
        except Exception as e:
            self.log_history(f"Error Occurred: {str(e)}")
            return False, str(e)

    def evaluate_security_measures(self):
        # Placeholder logic for security checks (e.g., recipient verification, spam score)
        return True

    def log_history(self, message: str):
        print(message)

class IntegrityMonitor(FileSystemEventHandler):
    def __init__(self, target_dir: str):
        self.target_dir = target_dir
        self.known_hashes = self._generate_hashes()

    def _generate_hashes(self):
        hashes: Dict[str, int] = {}
        for root, _, files in os.walk(self.target_dir):
            for file in files:
                path = os.path.join(root, file)
                try:
                    with open(path, 'rb') as f: # Fix: Replaced Unicode quote
                        hashes[path] = hash(f.read())
                except IOError as e:
                    print(f"Warning: Could not hash file {path}. Error: {e}")
        return hashes

    def on_modified(self, event):
        print(f"File {event.src_path} modified")

    def on_created(self, event):
        print(f"File {event.src_path} created")

    def on_deleted(self, event):
        print(f"File {event.src_path} deleted")

if __name__ == "__main__":
    # Example Usage:
    config = SmtpConfig(user_email="agiv94@sovereign.net", token="secure_key")
    email_svc = EmailService(config)
    
    builder = EmailBuilder(
        subject="Q4 Report Attached",
        sender="agiv94@sovereign.net",
        recipient="team@recipient.com"
    )
    builder.set_content(html_template="<html><body><h1>Report Ready</h1></body></html>")
    builder.enable_tracking()
    
    success, result = email_svc.send_email(builder)
    print(f"Send status: {success}, Result: {result}")

    # File monitoring setup (requires directory to exist)
    # NOTE: Path must be configurable/relative in real production code.
    # target_path = Path("/tmp/email_assets")
    # if target_path.exists():
    #     observer = Observer()
    #     observer.schedule(IntegrityMonitor(str(target_path)), path=str(target_path), recursive=True)
    #     observer.start()
    #     try:
    #         while True:
    #             pass
    #     except KeyboardInterrupt:
    #         observer.stop()
    #     observer.join()
