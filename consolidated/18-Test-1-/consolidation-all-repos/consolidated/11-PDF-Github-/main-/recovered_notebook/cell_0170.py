text = None
anomalies = []
financial_data = {}
checksum = None

# --- Step 1: Robots Check (Guard Clause) ---
if not is_allowed_by_robots(pdf_url_corrupted, rp, user_agent):
    logging.warning(f"[ROBOTS] Skipping {pdf_url_corrupted} due to robots.txt")
    write_to_audit_trail("PDF Download Blocked by Robots.txt", {"url": pdf_url_corrupted})

else:
    # --- Step 2: Download ---
    content, status_code, checksum = download_url(pdf_url_corrupted, user_agent=user_agent)

    if status_code != 200 or not content:
        write_to_audit_trail("PDF Download Failed", {"url": pdf_url_corrupted, "status_code": status_code})
        logging.error(f"Download failed for {pdf_url_corrupted}. Status: {status_code}")

    else:
        # --- Step 3: Text Extraction ---
        try:
            text = extract_text_from_pdf(content)
            write_to_audit_trail("PDF Text Extraction Successful", {"url": pdf_url_corrupted, "checksum": checksum})
        except Exception as e:
            text = None # Explicitly fail forward safely
            logging.error(f"Error extracting text from {pdf_url_corrupted} (Checksum: {checksum}): {e}")
            write_to_audit_trail("PDF Text Extraction Failed", {"url": pdf_url_corrupted, "checksum": checksum})

        # --- Step 4/5/6: Processing Chain (only if text is available) ---
        if text:
            try:
                financial_data = extract_financial_data_from_text(text, council_name)
                write_to_audit_trail("Financial Data Extraction", {"url": pdf_url_corrupted, "checksum": checksum})

                # Validation
                if not validate_financial_data(financial_data):
                    logging.warning(f"[VALIDATION] Financial data failed validation for {pdf_url_corrupted}")
                    write_to_audit_trail("Financial Data Validation Failed", {"url": pdf_url_corrupted, "checksum": checksum})
                else:
                    logging.info(f"[VALIDATION] Financial Data Validated for {pdf_url_corrupted}")

                # Anomaly Detection
                anomalies = detect_anomalies(financial_data)
                write_to_audit_trail("Anomaly Detection", {"url": pdf_url_corrupted, "checksum": checksum})

            except Exception as e:
                financial_data = {}
                anomalies = []
                logging.error(f"Critical failure during data processing for {pdf_url_corrupted}: {e}")
                write_to_audit_trail("Financial Data Processing Critical Failure", {"url": pdf_url_corrupted, "checksum": checksum})

        # --- Step 7: Final Structuring and Storage (Only if download succeeded) ---
        pdf_info = {
            'pdf_url': pdf_url_corrupted,
            'checksum': checksum,
            'financial_data': financial_data, 
            'anomalies': anomalies,
            'status_code': status_code,
            'text_extracted': bool(text)
        }

        if anomalies:
            pdf_info['suspicious'] = True
            logging.warning(f"Suspicious PDF: {pdf_url_corrupted} - Anomalies found.")

        if council_name not in all_data:
            all_data[council_name] = {'snapshots': {}}
        if timestamp not in all_data[council_name]['snapshots']:
            all_data[council_name]['snapshots'][timestamp] = []
        
        all_data[council_name]['snapshots'][timestamp].append(pdf_info)