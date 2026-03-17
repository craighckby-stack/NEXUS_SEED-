# Troubleshooting Guide

## Common Issues

### 1. GitHub Authentication Failed

**Symptoms:**
- "401 Unauthorized" errors
- Token not working

**Solutions:**
1. Verify token is valid: https://github.com/settings/tokens
2. Ensure `repo` permission is checked
3. Regenerate token if expired
4. Check for extra spaces in token input

### 2. Evolution Branch Creation Failed

**Symptoms:**
- Cannot create branch
- "Ref already exists" errors

**Solutions:**
1. Delete existing branch manually
2. Check repository permissions
3. Verify branch name doesn't conflict
4. Check for protected branch rules

### 3. AI API Errors

**Symptoms:**
- "API key invalid" errors
- Code analysis not working

**Solutions:**
1. Verify API key is correct
2. Check API key hasn't expired
3. Ensure sufficient quota
4. Check API service status

### 4. File Upload Errors

**Symptoms:**
- Files not being updated
- "413 Payload Too Large"

**Solutions:**
1. Reduce file count per cycle
2. Exclude large files (node_modules, etc.)
3. Check GitHub file size limits (100MB per file)
4. Use .gitignore patterns

### 5. Browser Compatibility Issues

**Symptoms:**
- Application not loading
- UI broken

**Solutions:**
1. Clear browser cache
2. Try different browser (Chrome, Firefox, Edge, Safari)
3. Check JavaScript is enabled
4. Verify browser version meets requirements

### 6. Firebase Connection Issues

**Symptoms:**
- Evolution history not saving
- "Permission denied" errors

**Solutions:**
1. Verify Firebase configuration in `index.html`
2. Check Firestore rules allow writes
3. Ensure Firebase project exists
4. Check network connectivity

### 7. Evolution Taking Too Long

**Symptoms:**
- Single cycle > 5 minutes
- Application appears frozen

**Solutions:**
1. Reduce number of files per cycle
2. Reduce total cycle count
3. Check network speed
4. Verify AI API response times

## Getting Help

If issues persist:

1. Check [Documentation](README.md)
2. Search [Existing Issues](https://github.com/craighckby-stack/ai-scaffold/issues)
3. Create [New Issue](https://github.com/craighckby-stack/ai-scaffold/issues/new)
4. Check [FAQ](FAQ.md)

## Diagnostic Information

When reporting issues, include:

- Browser name and version
- Operating system
- Error messages (from console)
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
