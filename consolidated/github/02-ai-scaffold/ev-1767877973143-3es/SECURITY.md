# Security Policy

## Supported Versions and Maintenance Window

We provide active security support for the two most recent Major Stable Releases (N and N-1). We strongly encourage users to upgrade to the latest stable release line for the quickest patching cycles.

Currently supported versions for security updates:
* **Major Release 18.x.x (Active Support):** Receiving all critical, high, and moderate security fixes.
* **Major Release 17.x.x (Maintenance Support):** Receiving only critical and high severity fixes.

Versions older than N-1 are considered End-of-Life (EOL) and will not receive security updates.

## Reporting a Vulnerability

We appreciate the responsible disclosure of security vulnerabilities. Following the guidelines below ensures rapid triage and remediation.

**Do Not Publicly Disclose:**
* Do not create public issues, pull requests, or discuss the vulnerability in public forums or social media before the official advisory release.

**Required Submission Protocol:**
1.  **Secure Contact:** Send an encrypted email to: `security@example.com`
2.  **PGP Encryption (Highly Recommended):** Use our public PGP key to secure communication.
    *   **Key ID:** `0xDEADBEEF`
    *   **Fingerprint:** `4E7F 3B1A C2D9 E9F8 F0A1 18B3 03D6 4C7D 9A20 1F3A`
    *   *Note: Key is available on common keyservers.*
3.  **Content:**
    *   A detailed Proof of Concept (PoC) demonstrating the vulnerability.
    *   Clear steps to reproduce the issue (including configuration and payloads).
    *   Define the affected version(s) and component scope.
    *   A CVSS score estimate, if possible.

## Security Best Practices (For Contributors)

To maintain a secure product, contributors must adhere to the following principles:

### A. Credential and Secret Management

*   **Zero Tolerance for Hardcoding:** Never commit secrets, API keys, or tokens directly into the repository, even in development branches.
*   **Environment Variables:** Use dedicated, segmented, and encrypted environment variable stores for sensitive data.
*   **Rotation:** Implement automated secret rotation for tokens, keys, and certificates on a scheduled basis (minimum quarterly).
*   **Least Privilege:** All service accounts and deployed infrastructure components must operate under the Principle of Least Privilege (PoLP).

### B. Secure Development Lifecycle (SDLC)

*   **Input Validation & Sanitization:** Enforce strict, schema-based input validation on the server side. Use context-aware output encoding (escaping) for all data displayed to users.
*   **Dependency Auditing:** Utilize continuous automated dependency scanning (e.g., Snyk, Dependabot) to proactively identify and patch known vulnerabilities (CVEs) in third-party libraries.
*   **Branch Protection:** Enforce mandatory code review (minimum two approvals) and pass automated security tests (SAST/DAST) before merging to protected branches (main/release).
*   **Configuration Hardening:** Use security headers (CSP, HSTS, X-Frame-Options) and configure services to disable insecure defaults (e.g., disabling directory listing, disabling TLS 1.0/1.1).

## Security Features Summary

*   **Authentication:** Strong, time-limited, token-only authentication mechanisms (e.g., JWT, OAuth).
*   **Data Handling:** No local or client-side persistence of user credentials or sensitive PII.
*   **Transport Security:** Strict adherence to HTTPS-only API calls, requiring TLS 1.2+ with modern cipher suites.
*   **Access Control:** Strict, centralized authorization checks (Role-Based Access Control/RBAC) on all critical API endpoints.

## Vulnerability Disclosure and Resolution Policy

We commit to the following Service Level Agreements (SLAs) upon successful receipt of a valid security report:

| Milestone | Target Response Time | Action |
| :--- | :--- | :--- |
| **Acknowledgement** | Within 24 hours | Automated receipt confirmation. |
| **Triage & Validation** | Within 48 hours | Human confirmation and initial severity assignment. |
| **Scope Confirmation** | Within 7 business days | Detailed response, confirming the vulnerability and its technical scope. |

**Time to Fix (TTF) Targets Post-Triage:**

*   **Critical/High Severity (CVSS 7.0+):** Fix released within 7 calendar days.
*   **Medium Severity (CVSS 4.0 - 6.9):** Fix scheduled for the next minor release (typically 14-30 days).
*   **Low Severity (CVSS < 4.0):** Fix included in the next scheduled major/maintenance release.

Once the fix is deployed and confirmed, we will coordinate with the reporter to issue a public advisory and acknowledge their contribution.