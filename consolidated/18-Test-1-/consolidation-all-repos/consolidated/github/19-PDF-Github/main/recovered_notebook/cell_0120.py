CRITICAL_THREATS = {
    "wp_admin_disallow": ('Disallow: /wp-admin', 
                          'WordPress admin path disallowed. Confirms standard structure.', 'info'),
    "wildcard_php_disallow": ('Disallow: /*.php', 
                              'Wildcard disallow for .php files. Potentially indicates sensitive file structure protection.', 'medium'),
    "wildcard_disallow_all_star": ('Disallow: *', 
                                   'Wildcard disallow of all paths (`*`). May indicate full site indexing block (maintenance/test site).', 'medium'),
    "wildcard_disallow_all_slash": ('Disallow: /*', 
                                    'Wildcard disallow of all paths (`/*`). Similar to `Disallow: *`.', 'medium'),
}

INFO_CHECKS = {
    "large_robots_txt": (lambda content: len(content) > 10000, 
                         'Unusually large robots.txt file. Potential indicator of overly detailed structure or obfuscation.', 'medium'),
    "allow_directive_present": ('Allow:', 
                                'Allow directives found in robots.txt. Indicates specific paths are being whitelisted.', 'info'),
    "crawl_delay_present": ('Crawl-delay:', 
                            'Crawl-delay directive found. Indicates rate limiting is configured.', 'info'),
}


# General Pattern Scanning
for check_name, (pattern, description, severity) in list(CRITICAL_THREATS.items()) + list(INFO_CHECKS.items()):
    
    # Handle callable patterns (like length check)
    if callable(pattern):
        if pattern(robots_content):
            add_threat(check_name, description, severity=severity)
    elif pattern in robots_content:
        add_threat(check_name, description, severity=severity)


# Sensitive Path Analysis
SENSITIVE_PATHS = ["/backup", "/config", "/adminer.php", "/phpmyadmin", "/.env", "/logs", "/install"]
for path in SENSITIVE_PATHS:
    
    disallow_tag = f"Disallow: {path}"
    allow_tag = f"Allow: {path}"
    
    if disallow_tag in robots_content:
        add_threat('sensitive_path_disallowed', 
                   f'Sensitive path "{path}" disallowed. Confirms path presence and exclusion intent.', 'info')
    
    # CRITICAL SECURITY CHECK: Explicitly allowing a sensitive path
    if allow_tag in robots_content:
        add_threat('sensitive_path_allowed', 
                   f'CRITICAL: Sensitive path "{path}" explicitly allowed. This exposes sensitive internal resources.', 'critical')


# Global Restriction Check (Fixes original User-Agent logic)
# Check for 'User-agent: *' defined with no global Disallow directive.
if "User-agent: *" in robots_content and "Disallow:" not in robots_content:
    add_threat('unrestricted_indexing', 
               'User-agent "*" is defined but NO Disallow directives found globally. Full site indexing is permitted.', 'low_info')


# Output/logs (Retained external dependency structure)
if verbose and threat_indicators:
    log_message(f"Threat Indicators analysis for {site_url}:", "INFO")
    for indicator in threat_indicators:
        log_message(indicator)
