# Troubleshooting Guide: Evolution Engine

This guide provides solutions for common issues encountered while using the evolution engine.

## Common Issues and Solutions

### 1. GitHub Authentication Failures

| Symptom | Description |
| :--- | :--- |
| **`401 Unauthorized`** | The Personal Access Token (PAT) is incorrect or lacks necessary permissions. |
| **Token not working** | Token may be expired, revoked, or contains extra whitespace. |

**Solutions:**

1.  **Token Verification:** Check the token's status and expiration date at [GitHub Settings/Tokens](https://github.com/settings/tokens).
2.  **Scope Check:** Ensure the PAT includes the minimum required scope: **`repo`**.
3.  **Input Cleanup:** Verify that no leading or trailing spaces are included when inputting the token.
4.  **Regeneration:** If the token is suspect, revoke the old one and generate a new PAT immediately.

---

### 2. Evolution Branch Creation Failures

| Symptom | Description |
| :--- | :--- |
| **`Ref already exists`** | The temporary evolution branch already exists and is blocking the creation process. |
| **Cannot create branch** | Insufficient permissions or branch protection rules are active. |

**Solutions:**

1.  **Manual Deletion:** If the branch is conflicting, manually delete the existing evolution branch from the repository.
2.  **Permission Check:** Ensure the authenticated GitHub user/token has write access to the target repository.
3.  **Branch Protection:** Review GitHub repository settings for protected branch rules that might prohibit automated creation or pushing.
4.  **Naming Conflict:** Verify that the generated branch name (e.g., `ai-evolution-cycle-X`) does not conflict with long-standing branches.

---

### 3. AI API Errors (OpenAI, etc.)

| Symptom | Description |
| :--- | :--- |
| **`API key invalid`** | The provided API key is rejected by the service provider. |
| **Analysis incomplete** | Requests are failing due to quota limits or model unavailability. |

**Solutions:**

1.  **Key Accuracy:** Double-check that the API key is copied correctly and matches the required format (e.g., `sk-xxxxxxxx`).
2.  **Quota and Billing:** Ensure the associated account has sufficient credit or a valid subscription, and check current usage against limits.
3.  **Model Availability:** Verify that the requested model (e.g., GPT-4) is enabled for your API key.
4.  **Service Status:** Check the external API provider's status page (e.g., OpenAI Status) for known outages or degraded performance.

---

### 4. File Commit/Upload Errors

| Symptom | Description |
| :--- | :--- |
| **`413 Payload Too Large`** | The total size of files staged for commit exceeds limits. |
| **Files not updated** | The system fails to push changes to GitHub. |

**Solutions:**

1.  **Reduce Cycle Size:** Decrease the number of files selected for analysis and update in a single evolution cycle.
2.  **Exclusion Filters:** Ensure large, static, or temporary files (`node_modules`, `dist`, images > 1MB) are correctly excluded using `.gitignore` patterns or explicit configuration settings.
3.  **GitHub Limits:** Note the GitHub hard limit of 100MB per individual file. Files exceeding this must be managed using Git LFS.

---

### 5. Performance Issues (Evolution Taking Too Long)

| Symptom | Description |
| :--- | :--- |
| **Cycle > 5 minutes** | The application appears frozen or is taking excessive time to receive a response. |
| **Slow Processing** | General sluggishness during the analysis phase. |

**Solutions:**

1.  **Optimize Input Size:** The primary bottleneck is often the AI response time. Drastically reduce the scope (lines of code/file count) provided to the API per cycle.
2.  **Network Speed:** Verify your local network connection speed, as large file uploads/downloads impact performance.
3.  **Monitor Latency:** Check the current latency reported by the AI service provider; high latency will directly impact cycle time.
4.  **System Resources:** If running locally, ensure the host machine has adequate memory and CPU to handle file processing and networking tasks.

---

### 6. Configuration & Environment Issues

| Issue | Potential Cause |
| :--- | :--- |
| **Browser UI Broken** | Cache or outdated browser version. |
| **Firebase connection** | Incorrect configuration or security rules. |

**Solutions:**

*   **Browser:** Clear browser cache, hard refresh (`Ctrl+Shift+R` or `Cmd+Shift+R`), or test the application in a different modern browser (Chrome, Firefox, Edge, Safari).
*   **Firebase:**
    *   Verify the Firebase configuration snippet (API keys, Project ID) is correct in your application code (e.g., `index.html`).
    *   Review Firestore Security Rules to ensure the application has the necessary read/write permissions for evolution history tracking.

## Getting Help and Diagnostics

If the common solutions do not resolve your issue, please gather the following diagnostic information before creating a support ticket or issue.

### Required Diagnostic Information

When reporting an issue, please include the following data points:

1.  **Environment Details:**
    *   Operating System (e.g., Windows 11, macOS Sonoma).
    *   Browser Name and Version (e.g., Chrome 120.0.6099.199).
2.  **Steps to Reproduce (STR):** A concise, numbered list detailing exactly how to trigger the issue.
3.  **Error Messages:** Copy and paste the full text of any errors appearing in the browser's Developer Console (`F12`).
4.  **Expected vs. Actual Behavior:** Clearly state what you expected to happen versus what actually occurred.
5.  **Screenshots/Recordings:** Visual documentation of the error or UI issue, if applicable.
6.  **Configuration Check:** Confirm which API provider and model you are currently using.

### Resources

1.  Check the primary [Documentation](README.md).
2.  Search [Existing Issues](https://github.com/craighckby-stack/ai-scaffold/issues) to see if others have encountered the same problem.
3.  Create a [New Issue](https://github.com/craighckby-stack/ai-scaffold/issues/new) for personalized support.
4.  Review the [FAQ](FAQ.md) for quick answers.