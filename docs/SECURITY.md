# Security Policy

## Security Vulnerability Reporting

If you discover a security vulnerability in PNCE CLI, please do not create a public Issue.

### How to Report

Please report security issues through the following methods:

1. **Send email to**: security@example.com
   - Please include `[SECURITY]` prefix in email subject
   - Describe vulnerability details
   - Provide reproduction steps
   - If possible, provide fix suggestions

2. **Or through private channels**:
   - Create GitHub Issue and select "Security vulnerability" type
   - Or contact maintainers through GitHub's security feature

### Report Content

Please try to include the following information:

- Vulnerability type and severity
- Affected versions
- Reproduction steps (detailed steps)
- Potential impact scope
- If known, provide fix suggestions or patches

---

## Supported versions

| version | Supported |
|---------|-----------|
| 0.0.x   | ✅        |
| < 0.0.1 | ❌        |

---

## Security Best Practices

### For Users

1. **Keep PNCE CLI Updated**
   - Regularly update to the latest version
   - Security updates often include important fixes

2. **Token Management**
   - Do not share tokens with others
   - Revoke tokens after use
   - Use environment variables for CI/CD

3. **Config Security**
   - Do not commit configuration files containing sensitive data
   - Use `.gitignore` to exclude sensitive files
   - Regularly review configuration files

4. **Network Security**
   - Use HTTPS when possible
   - Configure secure proxy
   - Verify SSL certificates

### For Developers

1. **Code Review**
   - All code must go through code review
   - Pay special attention to security-related code

2. **Dependency Management**
   - Regularly update dependencies
   - Run `npm audit` to check for vulnerabilities
   - Review dependency changelogs

3. **Input Validation**
   - Validate all user inputs
   - Sanitize file paths
   - Prevent injection attacks

4. **Error Handling**
   - Do not expose sensitive information in error messages
   - Log errors appropriately
   - Use generic error messages for users

---

## Security Features

### Auth

- **OAuth2**: Secure OAuth2 authorization flow
- **Token Encryption**: Tokens encrypted using AES-256-GCM
- **Token Expiration**: Automatic token expiration and refresh

### Data Protection

- **HTTPS**: All API communications use HTTPS
- **Proxy Support**: Support for secure proxy configuration
- **Sensitive Data Filtering**: Sensitive information not logged

### Input Validation

- **Parameter Validation**: All user inputs validated
- **Path Validation**: Prevent directory traversal attacks
- **Command Injection**: Prevent command injection attacks

---

## Vulnerability Response Process

1. **Report Received**
   - Security team receives vulnerability report
   - Acknowledge receipt within 48 hours

2. **Assessment**
   - Evaluate vulnerability severity
   - Determine affected versions
   - Plan fix strategy

3. **Fix Development**
   - Develop fix for vulnerability
   - Test thoroughly
   - Code review

4. **Release**
   - Prepare security release
   - Coordinate disclosure with reporter
   - Publish security advisory

5. **Follow-up**
   - Monitor for related issues
   - Update documentation
   - Communicate with affected users

---

## Security Disclosures

### Past Security Issues

*(No security issues reported yet)*

---

## Contact

- **Security Email**: security@example.com
- **GitHub Security**: https://github.com/hi-giacomo/pnce/security

---

## Acknowledgments

We thank all security researchers who help make PNCE CLI safer by reporting vulnerabilities responsibly.
