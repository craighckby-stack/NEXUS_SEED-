robots_threats = analyze_robots_txt(robots_content, site_url, verbose_mode)
threat_indicators = list(robots_threats)
sitemap_urls = [] # Initialize for scope and eventual JSON output

# Ensure initial threat indicators from robots.txt are tagged immediately for persistence
for ti in threat_indicators:
    if 'source_type' not in ti:
        ti['source_type'] = 'robots.txt'

# Update description based on robots.txt threats found
if threat_indicators:
    description += f". Found {len(threat_indicators)} Robots.txt indicators."

# Set default success status, updated upon analysis completion or failure
robots_status = "Processing"
writable_status = "Unchecked"

try:
    # 1. Network/I/O Intensive Analysis Chain (Protected)
    sitemap_urls = parse_sitemap_from_robots(robots_content, site_url, verbose_mode)

    sitemap_threat_count = 0
    for sitemap_url in sitemap_urls:
        # analyze_sitemap performs I/O, critical it is inside the try block
        sitemap_threats = analyze_sitemap(sitemap_url, site_url, verbose_mode)
        if sitemap_threats:
            sitemap_threat_count += len(sitemap_threats)
            # Hallucination: Tag sitemap threats immediately before aggregation
            for threat in sitemap_threats:
                if 'source_type' not in threat:
                    threat['source_type'] = 'sitemap'
                threat_indicators.append(threat)

    if sitemap_threat_count > 0:
        description += f". Found {sitemap_threat_count} sitemap threats."
    
    # Update success status
    robots_status = "Analysis Complete"
    writable_status = "Standard"

    # 2. Architectural Refactor: Persistence must occur after all aggregation
    if threat_indicators:
        
        # Streamline persistent memory initialization
        if 'threat_indicators' not in persistent_memory:
             persistent_memory['threat_indicators'] = {}
        if site_url not in persistent_memory['threat_indicators']:
            persistent_memory['threat_indicators'][site_url] = []

        for ti in threat_indicators:
            # Store findings robustly as historical records
            persistent_memory['threat_indicators'][site_url].append({
                'description': ti['description'],
                'source': "Sovereign AGI Analyzer v94.1",
                'details': ti.get('details'),
                'timestamp': timestamp,
                # Use the pre-tagged source_type for persistence
                'source_type': ti.get('source_type', 'unknown_source') 
            })

except requests.exceptions.RequestException as e:
    robots_status = f"Request Error: {e.__class__.__name__}"
    description = f"Error fetching or processing sitemap resource: {e}"
    writable_status = "Partial Failure: Unavailable"
    # Do not clear threat_indicators, as robots.txt threats were successfully analyzed.
    log_message(f"Request Error during sitemap processing for {site_url}: {e}", "ERROR")
    
except Exception as e:
    robots_status = "Unexpected Error"
    description = f"Unexpected error processing analysis chain: {e}"
    writable_status = "Error State"
    threat_indicators = [] # Full analysis chain compromised, clear aggregate findings
    log_message(f"Unexpected error processing {site_url}: {e}", "CRITICAL")

# --- Final Logging and Persistence (Always executed) ---

if site_url not in robots_log:
    robots_log[site_url] = []
robots_log[site_url].append({
    'timestamp': timestamp,
    'status': robots_status,
    'description': description,
    'writable': writable_status,
    # Log summary of indicators for efficiency
    'threat_indicators_summary': [t['description'] for t in threat_indicators]
})
save_robots_log(robots_log)
save_persistent_memory(persistent_memory)

if json_output:
    import os, json
    from urllib.parse import urlparse
    output_filename = f"{urlparse(site_url).netloc.replace('.', '_')}.json"
    output_file_path = os.path.join(OUTPUT_FOLDER, output_filename)
    try:
        with open(output_file_path, "w") as f:
            json.dump({
                'site_url': site_url,
                'timestamp': timestamp,
                'status': robots_status,
                'description': description,
                'writable_status': writable_status,
                'sitemap_urls_found': sitemap_urls,
                'threat_count': len(threat_indicators),
                'threat_indicators': threat_indicators # Full details for verbose output
            }, f, indent=4)
    except Exception as e:
         log_message(f"Error writing JSON output for {site_url}: {e}", "WARNING")