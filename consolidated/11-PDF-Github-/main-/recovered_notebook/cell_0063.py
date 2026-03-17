# Cell 0063: Refactored Notebook Script (Robust GitHub Interaction - Class based)

import os
import logging
from typing import Optional
from github import Github, GithubException, Repository, UnknownObjectException

# Set up logging configuration
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class GitHubClient:
    """Handles authentication and common operations with the GitHub API, encapsulating the Github object."""

    def __init__(self, github_token: str):
        if not github_token:
            raise ValueError("GitHub token must be provided.")
        try:
            logging.info("Initializing GitHub connection...")
            # Store the PyGithub instance
            self._g = Github(github_token)
        except Exception as e:
            logging.critical(f"Failed to initialize GitHub client: {e}")
            raise RuntimeError("GitHub client initialization failed.") from e

    def get_repo(self, repo_owner: str, repo_name: str) -> Optional[Repository]:
        """
        Retrieves a repository object robustly.
        """
        full_repo_name = f"{repo_owner}/{repo_name}"
        
        try:
            logging.info(f"Retrieving repository: {full_repo_name}")
            repo = self._g.get_repo(full_repo_name)
            logging.info("Repository retrieved successfully.")
            return repo

        except UnknownObjectException:
            logging.error(f"Error 404: Repository '{full_repo_name}' not found or access denied (404/401).")
            return None
        except GithubException as e:
            # Catch rate limit errors, permission issues, etc.
            status_code = getattr(e, 'status', 'N/A')
            logging.error(f"GitHub API Error accessing {full_repo_name} (Status: {status_code}): {e}")
            return None
        except Exception as e:
            logging.critical(f"An unexpected system error occurred during repository access: {e}")
            return None


def print_github_repo_info(repo: Repository):
    """
    Print GitHub repository information, including details like stars and language.
    """
    logging.info("--- Repository Details ---")
    logging.info(f"Name: {repo.full_name}")
    logging.info(f"Owner: {repo.owner.login}")
    logging.info(f"ID: {repo.id}")
    # Use optional attribute access for potentially missing data (like language for certain repos)
    logging.info(f"Stars: {repo.stargazers_count}")
    logging.info(f"Language: {repo.language if repo.language else 'N/A'}")
    logging.info(f"URL: {repo.html_url}")
    logging.info("--------------------------")


# Example usage
if __name__ == "__main__":
    # Load credentials and repository details from environment variables
    github_token = os.environ.get("GITHUB_TOKEN")
    repo_owner = os.environ.get("REPO_OWNER", "PyGithub") 
    repo_name = os.environ.get("REPO_NAME", "PyGithub")   
    
    if not github_token:
        logging.error("FATAL: GITHUB_TOKEN environment variable not set. Cannot proceed.")
    else:
        try:
            # Initialize the client
            client = GitHubClient(github_token)
            
            # Get repository object
            repo = client.get_repo(repo_owner, repo_name)
            
            # Print repository information
            if repo:
                print_github_repo_info(repo)
            else:
                logging.warning("Could not retrieve repository info due to previous errors.")
        except (ValueError, RuntimeError):
             # Handled during client initialization
            pass