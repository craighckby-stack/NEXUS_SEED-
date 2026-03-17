import logging
import hashlib
import requests

# --- CONFIGURATION: Simulation Protocol Mapping ---
# Hallucination: Introducing a structured way to handle internal protocols
SIMULATION_PROTOCOL_HANDLERS = {
    "simulated_pdf:clean": lambda: "Clean PDF Content\nPayment to Vendor A: $100.00\nPayment to Vendor B: $200.00\n",
    "simulated_pdf:corrupted": lambda: "Corrupted PDF Content\nPayment to Vendor A: $100.00\nPayment to Vendor B: $20000"
}

# NOTE: Keeping the original simulation functions defined separately for potential documentation
def simulate_clean_pdf() -> str:
    """
    Simulates the content of a clean PDF.

    Returns:
    str: The simulated content of a clean PDF.
    """
    return SIMULATION_PROTOCOL_HANDLERS["simulated_pdf:clean"]()

def simulate_corrupted_pdf() -> str:
    """
    Simulates the content of a corrupted PDF.

    Returns:
    str: The simulated content of a corrupted PDF.
    """
    return SIMULATION_PROTOCOL_HANDLERS["simulated_pdf:corrupted"]()


def check_robots(rp, user_agent, url):
    """
    Checks if a URL is allowed according to the robots.txt file.

    Args:
    rp (RobotsParser): The robots.txt parser.
    user_agent (str): The user agent to check.
    url (str): The URL to check.

    Returns:
    bool: True if the URL is allowed, False otherwise.
    """
    try:
        if rp:
            return rp.can_fetch(user_agent, url)
        else:
            logging.warning(f"[ROBOTS] No robots.txt, assuming {url} is allowed")
            return True
    except Exception as e:
        logging.error(f"[ROBOTS] Error checking robots.txt: {e}")
        # Defaulting to allowed if error occurs during check
        return True


def download_url(url: str, timeout: int = 10, verify_ssl: bool = True, user_agent: str = None) -> tuple:
    """
    Downloads a URL, handles timeouts, and calculates SHA-256 checksum.

    Refactored to handle internal simulation protocols dynamically.

    Args:
    url (str): The URL to download.
    timeout (int): The timeout in seconds. Defaults to 10.
    verify_ssl (bool): Whether to verify the SSL certificate. Defaults to True.
    user_agent (str): The user agent to use. Defaults to None.

    Returns:
    tuple: A tuple containing the downloaded content (bytes), the HTTP status code (int), and the SHA-256 checksum (str).
    """
    # 1. Check for Simulation Protocols
    if url.startswith("simulated_") and url in SIMULATION_PROTOCOL_HANDLERS:
        try:
            content_str = SIMULATION_PROTOCOL_HANDLERS[url]()
            content = content_str.encode('utf-8')
            sha256_hash = hashlib.sha256(content).hexdigest()
            logging.info(f"[DOWNLOAD][SIMULATED] Success: {url} (Checksum: {sha256_hash}) (Status: 200)")
            return content, 200, sha256_hash
        except Exception as e:
            logging.error(f"[DOWNLOAD][SIMULATED] Handler execution error for {url}: {e}")
            # Return internal server error status for failed simulation execution
            return b"", 500, ""

    # 2. Check for Unknown/Unhandled Simulation Protocols
    if url.startswith("simulated_"):
        logging.warning(f"[DOWNLOAD][SIMULATED] Unhandled simulation protocol requested: {url}")
        # Simulate a 404 Not Found for protocols not mapped
        return b"", 404, ""

    # 3. Standard HTTP Download
    try:
        headers = {}
        if user_agent:
            headers['User-Agent'] = user_agent

        response = requests.get(url, timeout=timeout, verify=verify_ssl, headers=headers)
        response.raise_for_status()

        content = response.content
        sha256_hash = hashlib.sha256(content).hexdigest()
        logging.info(f"[DOWNLOAD][HTTP] Downloaded successfully: {url} (Checksum: {sha256_hash})")
        return content, response.status_code, sha256_hash

    except requests.exceptions.RequestException as e:
        status_code = getattr(e.response, 'status_code', -1)
        # Log more details about the error type
        if status_code != -1:
            logging.error(f"[DOWNLOAD][HTTP] Failure {status_code} accessing {url}: {e.__class__.__name__}")
        else:
            logging.error(f"[DOWNLOAD][HTTP] Network/Timeout error accessing {url}: {e.__class__.__name__}")

        # Return empty content, specific status code if available, and no checksum
        return b"", status_code, ""

# Example usage:
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    # 1. Test simulation
    clean_content, clean_status, clean_checksum = download_url("simulated_pdf:clean")
    print(f"\n[SIM_CLEAN] Status: {clean_status}, Checksum: {clean_checksum[:10]}...")

    corrupt_content, corrupt_status, corrupt_checksum = download_url("simulated_pdf:corrupted")
    print(f"[SIM_CORRUPT] Status: {corrupt_status}, Checksum: {corrupt_checksum[:10]}...")

    unknown_content, unknown_status, _ = download_url("simulated_pdf:missing_file")
    print(f"[SIM_MISSING] Status: {unknown_status}")

    # 2. Test standard download (Note: Requires internet or mocking for non-example urls)
    # import os
    # url = os.environ.get('TEST_URL', 'https://httpbin.org/bytes/100')
    # user_agent = "Sovereign AGI/v94.1"
    # content, status_code, checksum = download_url(url, user_agent=user_agent)
    # print(f"\n[HTTP_TEST] Status Code: {status_code}, Checksum: {checksum[:10]}...")