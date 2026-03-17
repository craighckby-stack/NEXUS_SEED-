```python
def extract_report_data(soup):
    """Extracts report data from the given BeautifulSoup object."""
    reports = []
    for div in soup.find_all("div", class_="report-item"):
        link = div.find("a")["href"]
        report_type = div.find("span", class_="report-type").text.strip()
        title = div.find("h3").text.strip()
        report = {
            "type": report_type,
            "title": title,
            "link": get_absolute_url(link),
            "text": None
        }
        reports.append(report)
    return {"reports": reports}

def process_ato_reports(verbose=False):
    """Scrapes and processes reports from the ATO website."""
    reports_soup = scrape_reports_page(ATO_REPORTS_PAGE_URL, verbose=verbose)
    if not reports_soup:
        log_message("Failed to scrape the ATO reports page. Exiting.", "ERROR")
        return
    extracted_data = extract_report_data(reports_soup)
    # Download and extract text from PDFs
    for report in extracted_data["reports"]:
        if report["type"] == "pdf":
            downloaded_pdf_path = download_pdf(report["link"], ATO_OUTPUT_FOLDER)
            if downloaded_pdf_path:
                report["text"] = extract_text_from_pdf(downloaded_pdf_path)
    # Save the extracted data to a JSON file
    output_file_path = os.path.join(ATO_OUTPUT_FOLDER, "ato_reports.json")
    try:
        with open(output_file_path, "w") as f:
            json.dump(extracted_data, f, indent=4)
        log_message(f"Extracted ATO data saved to {output_file_path}", "INFO")
    except Exception as e:
        log_message(f"Error saving ATO data to {output_file_path}: {e}", "ERROR")

def main():
    parser = argparse.ArgumentParser(description="Robots.txt Analyzer - Hardcore Edition.")
    parser.add_argument("-v", "--verbose", action="store_true", help="Enable verbose output")
    parser.add_argument

try:
    return soup
except requests.exceptions.RequestException as e:
    log_message(f"Error during request (attempt {attempt + 1}/{MAX_RETRIES}): {e}")
    time.sleep(RETRY_DELAY)
except Exception as e:
    log_message(f"An unexpected error occurred: {e}", "ERROR")
    time.sleep(RETRY_DELAY)
    return None

'''
# Example output/logs:
# Extracted ATO data saved to /path/to/ato_reports.json
# Error saving ATO data to /path/to/ato_reports.json: Permission denied
# Failed to scrape the ATO reports page. Exiting.
'''
```