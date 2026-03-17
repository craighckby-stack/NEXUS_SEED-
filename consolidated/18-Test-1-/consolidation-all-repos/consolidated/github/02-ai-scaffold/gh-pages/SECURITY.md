# Security Policy

## Supported Versions

Currently supported security updates for the following versions:
* Version 18.x.x

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly.

**Do not**:
* Create a public issue
* Disclose in public forums
* Share with others before disclosure

**Do**:
* Send email to: security@example.com
* Include details of the vulnerability
* Provide steps to reproduce
* Suggest a fix if possible

## Security Best Practices

### Token Management

* Never commit your GitHub token to repository
* Use environment variables for sensitive data
* Rotate tokens regularly
* Use minimum required permissions

### API Keys

* Store API keys securely
* Never expose keys in client-side code
* Use appropriate key restrictions
* Monitor key usage

### Firebase

* Enable security rules
* Use authentication
* Restrict database access
* Monitor suspicious activity

## Security Features

* Token-only authentication
* No local persistence of credentials
* Input sanitization
* HTTPS-only API calls
* Branch isolation for changes

## Disclosure Policy

We will:

* Acknowledge receipt of vulnerability report within 48 hours
* Provide a detailed response within 7 days
* Confirm the vulnerability and its scope
* Notify users of affected versions
* Release a fix as soon as possible
