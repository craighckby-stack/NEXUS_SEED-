# Import necessary libraries
from sqlalchemy import create_engine, Column, Integer, String, Text # Added Text for large content
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import hashlib
import secrets
import requests
from bs4 import BeautifulSoup
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Create a base class for declarative models
Base = declarative_base()

# Define the ScrapedData model
class ScrapedData(Base):
    """
    Model for storing scraped data.
    
    Refactor: Content column type upgraded to Text.
    Attributes:
    id (int): Unique identifier for the scraped data.
    url (str): URL from which the data was scraped.
    content (Text): The scraped content (supports large text).
    """
    __tablename__ = 'scraped_data'
    id = Column(Integer, primary_key=True)
    url = Column(String(512), index=True)
    content = Column(Text)

# Define the User model
class User(Base):
    """
    Model for storing user data.
    
    Architectural Fix: Added 'salt' column for secure password storage.
    """
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    username = Column(String(64), unique=True, nullable=False)
    password_hash = Column(String(128), nullable=False) # SHA256 hash
    salt = Column(String(32), nullable=False) # 16 byte hex salt

# Create an engine to connect to the database
# Using connect_args suitable for SQLite in multi-threaded contexts
engine = create_engine(
    'sqlite:///mia_os.db', 
    connect_args={"check_same_thread": False},
    echo=False
)

# Create all tables in the engine
Base.metadata.create_all(engine)

# Create a configured "Session" class (Factory for session management)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Removed global 'session' variable, sessions must now be instantiated per operation

def hash_password(password: str):
    """
    Hash a password using a newly generated salt.
    
    Returns:
    tuple: (salt, hashed_password)
    """
    salt = secrets.token_hex(16)
    salted_password = salt + password
    hashed_password = hashlib.sha256(salted_password.encode()).hexdigest()
    return salt, hashed_password

def verify_password(password: str, stored_salt: str, stored_hash: str):
    """
    Verify a password against a stored salt and hash.
    """
    salted_password = stored_salt + password
    hashed_password = hashlib.sha256(salted_password.encode()).hexdigest()
    return hashed_password == stored_hash

def register_user(username: str, password: str):
    """Persist a new user to the database using safe session handling."""
    salt, password_hash = hash_password(password)
    new_user = User(username=username, password_hash=password_hash, salt=salt)
    
    db = SessionLocal()
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        logging.info(f"User '{username}' registered successfully.")
        return new_user
    except Exception as e:
        db.rollback()
        if "UNIQUE constraint failed" in str(e):
             logging.warning(f"Registration failed: Username '{username}' already exists.")
        else:
            logging.error(f"Failed to register user {username}: {e}")
        return None
    finally:
        db.close()

def save_scraped_data(url: str, content: str):
    """Persist scraped data to the database using safe session handling."""
    new_data = ScrapedData(url=url, content=content)
    db = SessionLocal()
    try:
        db.add(new_data)
        db.commit()
        db.refresh(new_data)
        logging.info(f"Saved scraped data (ID: {new_data.id}) for URL: {url}")
        return new_data
    except Exception as e:
        db.rollback()
        logging.error(f"Failed to save scraped data: {e}")
        return None
    finally:
        db.close()

def scrape_data(url: str):
    """
    Scrape data from a URL.
    
    Returns:
    str: The scraped text content, or None on request failure.
    """
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')
        # Use whitespace separator and aggressive stripping for clean text extraction
        text_content = soup.get_text(separator=' ', strip=True) 
        logging.info(f"Successfully scraped data from {url}")
        return text_content
    except requests.exceptions.RequestException as e:
        logging.error(f"Error during scraping {url}: {e}")
        return None
    except Exception as e:
        logging.error(f"An unexpected error occurred during scraping {url}: {e}")
        return None

# Example usage
if __name__ == "__main__":
    test_url = "http://example.com"
    
    # 1. Register a user
    print("\n--- Registering User ---")
    user1 = register_user("test_agi", "secure_v94_1_password")
    
    if user1:
        # 2. Verify password
        print("\n--- Verifying Password ---")
        is_verified = verify_password(
            "secure_v94_1_password", user1.salt, user1.password_hash
        )
        print(f"Password verification result: {is_verified}")
    
    # 3. Scrape and persist data
    print("\n--- Scraping Data ---")
    scraped_content = scrape_data(test_url)
    
    if scraped_content:
        print(f"Scraped content length: {len(scraped_content)}")
        save_scraped_data(test_url, scraped_content)
    else:
        print("Scraping failed, skipping persistence.")