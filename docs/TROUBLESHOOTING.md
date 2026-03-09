# PNCE CLI Troubleshooting Guide

This document provides troubleshooting steps and solutions for common problems.

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Authentication Issues](#authentication-issues)
3. [Network Connection Issues](#network-connection-issues)
4. [Module Management Issues](#module-management-issues)
5. [Configuration Issues](#configuration-issues)
6. [Performance Issues](#performance-issues)
7. [Other Issues](#other-issues)

---

## Installation Issues

### Issue: Command not found after installation

**Symptoms:**
```bash
$ pnce --version
zsh: command not found: pnce
```

**Troubleshooting Steps:**

1. Check if global installation succeeded:

```bash
npm list -g pnce
# or
yarn global list | grep pnce
```

2. Check npm global path:

```bash
npm config get prefix
# Output like: /usr/local
```

3. Ensure global path is in PATH:

```bash
echo $PATH | grep -o "/usr/local"
```

**Solutions:**

Add npm global path to PATH:

**Bash (`~/.bashrc`):**
```bash
export PATH="$PATH:$(npm config get prefix)/bin"
```

**Zsh (`~/.zshrc`):**
```bash
export PATH="$PATH:$(npm config get prefix)/bin"
```

Reload configuration after executing:
```bash
source ~/.bashrc  # or source ~/.zshrc
```

### Issue: Installation failed, permission denied

**Symptoms:**
```bash
npm install -g pnce
npm ERR! code EACCES
npm ERR! errno -13
npm ERR! Error: EACCES: permission denied
```

**Solutions:**

**Solution 1: Use sudo (not recommended)**
```bash
sudo npm install -g pnce
```

**Solution 2: Configure npm permissions (recommended)**
```bash
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm install -g pnce
```

**Solution 3: Use nvm to manage Node.js (best)**
```bash
nvm install node
nvm use node
npm install -g pnce
```

---

## Authentication Issues

### Issue: Browser doesn't open when logging in

**Troubleshooting Steps:**

1. Check if default browser is installed:

```bash
# macOS
which open
# Linux
which xdg-open
# Windows
where start
```

2. Check if port is occupied:

```bash
# macOS/Linux
lsof -i :3001
# Windows
netstat -ano | findstr :3001
```

**Solutions:**

1. Specify a different port:

```bash
pnce login --port 8080
```

2. Manually open authorization link:

```bash
pnce login --print-url
# Copy the URL from output and open in browser
```

### Issue: Logged in successfully but command still shows not logged in

**Troubleshooting Steps:**

1. Check if configuration file exists:

```bash
cat ~/.pnce/config.json
```

2. Check token field:

```bash
cat ~/.pnce/config.json | grep token
```

**Solutions:**

1. Re-login:

```bash
pnce logout
pnce login
```

2. Clear configuration and re-login:

```bash
rm -rf ~/.pnce
pnce login
```

### Issue: Token expired prematurely

**Symptoms:** Token expiration message even after just logging in

**Troubleshooting Steps:**

1. Check if system time is correct:

```bash
date
```

2. Check token expiration time:

```bash
cat ~/.pnce/config.json | grep tokenExpiresAt
```

**Solutions:**

1. Calibrate system time
2. Re-login

---

## Network Connection Issues

### Issue: Network error or connection timeout

**Symptoms:**
```
Error: Network Error
Error: timeout of 30000ms exceeded
```

**Troubleshooting Steps:**

1. Check network connection:

```bash
ping pnce.example.com
```

2. Check server address configuration:

```bash
pnce config
```

3. Test port connectivity:

```bash
# macOS/Linux
nc -zv pnce.example.com 3000
# Windows
telnet pnce.example.com 3000
```

**Solutions:**

1. Check and modify server address:

```bash
pnce init
# Enter correct server address in wizard
```

2. Configure proxy:

```json
// ~/.pnce/config.json
{
  "useProxy": true,
  "proxyUrl": "http://127.0.0.1:7890"
}
```

3. Increase timeout:

```json
{
  "downloadTimeout": 600000,
  "uploadTimeout": 1200000
}
```

### Issue: SSL certificate error

**Symptoms:**
```
Error: self signed certificate
Error: unable to verify the first certificate
```

**Solutions:**

1. Configure CA certificate (trusted environment only):

```bash
export NODE_TLS_REJECT_UNAUTHORIZED=0
```

2. Or specify certificate file:

```bash
export NODE_EXTRA_CA_CERTS=/path/to/ca.pem
```

---

## Module Management Issues

### Issue: Module installation failed

**Troubleshooting Steps:**

1. Check if module name is correct:

```bash
pnce search module-name
```

2. Check login status:

```bash
pnce whoami
```

3. Enable detailed logs:

```bash
export PNCE_LOG_LEVEL=debug
pnce install module-name
```

4. Check disk space:

```bash
df -h
```

5. Check target directory permissions:

```bash
ls -la ./modules
```

**Solutions:**

1. Re-login
2. Check and correct module name
3. Check disk space
4. Check target directory permissions
5. Use `--verbose` for detailed errors

### Issue: Slow module download speed

**Troubleshooting Steps:**

1. Test network speed:

```bash
curl -o /dev/null http://pnce.example.com/test
```

2. Check concurrency settings:

```bash
cat ~/.pnce/config.json | grep maxConcurrentDownloads
```

**Solutions:**

1. Configure proxy
2. Adjust concurrent download count:

```json
{
  "maxConcurrentDownloads": 5
}
```

3. Use offline cache (if downloaded before)

### Issue: Module upload failed

**Troubleshooting Steps:**

1. Check if `module.config.json` exists and is valid:

```bash
cat module.config.json
```

2. Check module directory structure:

```bash
ls -la
```

3. Check module size:

```bash
du -sh .
```

**Solutions:**

1. Ensure `module.config.json` exists and format is correct
2. Check if module size exceeds limit
3. Check upload timeout setting

---

## Configuration Issues

### Issue: Configuration file not taking effect

**Troubleshooting Steps:**

1. Check configuration file path:

```bash
echo ~/.pnce/config.json
cat ~/.pnce/config.json
```

2. Check if JSON format is correct:

```bash
python3 -m json.tool ~/.pnce/config.json
# or
jq . ~/.pnce/config.json
```

3. Check environment variables:

```bash
env | grep PNCE
```

**Solutions:**

1. Validate JSON format
2. Check if environment variables override configuration
3. Use `pnce config` to view actual configuration used

### Issue: Configuration file corrupted

**Symptoms:**
```bash
pnce config
Error: Unexpected token ...
```

**Solutions:**

1. Delete configuration file:

```bash
rm ~/.pnce/config.json
```

2. Run configuration wizard again:

```bash
pnce init
```

---

## Performance Issues

### Issue: CLI slow response

**Troubleshooting Steps:**

1. Check system resource usage:

```bash
top  # or htop
```

2. View detailed logs:

```bash
export PNCE_LOG_LEVEL=debug
pnce <command> --verbose
```

**Solutions:**

1. Disable unnecessary cache:

```bash
export PNCE_NO_CACHE=true
```

2. Clear cache:

```bash
pnce cache clean
```

3. Adjust log level to `warn` or `error`

---

## Other Issues

### Issue: Log files too large

**Troubleshooting Steps:**

1. Check log directory:

```bash
du -sh ~/.pnce/logs/
```

**Solutions:**

1. Delete old logs:

```bash
find ~/.pnce/logs/ -name "*.log" -mtime +7 -delete
```

2. Configure log level to reduce output

### Issue: Cannot uninstall

**Troubleshooting Steps:**

1. Check global installation path:

```bash
npm config get prefix
```

**Solutions:**

Manually delete related files:

```bash
rm -rf $(npm config get prefix)/bin/pnce
rm -rf $(npm config get prefix)/lib/node_modules/pnce
```

---

## Get More Help

If the above solutions don't solve your problem, please:

1. Collect the following information:
   - PNCE CLI version: `pnce --version`
   - Node.js version: `node --version`
   - Operating system: `uname -a`
   - Error message (using `--verbose`)

2. Submit issue report at [GitHub Issues](https://github.com/hi-giacomo/pnce/issues)

3. View log files:
   ```
   ~/.pnce/logs/
   ```

---

## Related Resources

- [Quick Start Guide](./QUICKSTART.md)
- [FAQ](./FAQ.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Contributing Guide](./CONTRIBUTING.md)
