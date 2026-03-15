# PNCE CLI FAQ

This document answers common questions during the use of PNCE CLI.

## installation and Config

### Q1: Command not found after installation?

**A:** Ensure the global installation path is in the system's PATH environment variable.

check npm global path:

```bash
npm config get prefix
```

Add the output path (e.g., `/usr/local`) to your PATH.

### Q2: How to uninstall PNCE CLI?

**A:** Run the following commands:

```bash
npm uninstall -g pnce
# or
yarn global remove pnce
```

### Q3: How to upgrade to the latest version?

**A:** Run the following commands:

```bash
npm update -g pnce
# or
yarn global upgrade pnce
```

## Auth and Login

### Q4: Browser doesn't open when logging in?

**A:** Try the following methods:

1. check if a browser is installed
2. Manually visit the authorization page and copy the callback URL
3. Use `--port` parameter to specify a different port:

```bash
pnce login --port 8080
```

### Q5: What to do if the token expires?

**A:** Token validity is typically 24 hours. You need to re-login after expiration:

```bash
pnce login
```

### Q6: How to use in CI/CD environment?

**A:** Set token via environment variable:

```bash
export PNCE_TOKEN=your_token_here
pnce install <module>
```

Or set token in configuration file.

## Module Management

### Q7: How to view installed modules?

**A:** Run the following command:

```bash
pnce list
```

### Q8: How to install a specific version of a module?

**A:** Use `@` symbol to specify version:

```bash
pnce install module-name@1.0.0
pnce install module-name@latest
```

### Q9: How to uninstall installed modules?

**A:** Simply delete the module directory:

```bash
rm -rf ./modules/module-name
```

### Q10: How to publish private modules?

**A:** Ensure you are logged in, then run:

```bash
pnce upload
```

Private modules usually require appropriate permissions.

### Q11: Permission error when uploading module?

**A:** check the following:

1. If logged in: `pnce login`
2. If you have upload permission
3. If `module.config.json` configuration is correct

### Q12: How to lock module versions?

**A:** Use version locking feature:

```bash
pnce lock module-name@1.0.0
```

This creates a version lock file to ensure the team uses the same version.

## Config

### Q13: What is the configuration file priority?

**A:** Priority from high to low:

1. Environment variables
2. Project config (`./.pnce/config.json`)
3. User config (`~/.pnce/config.json`)
4. Default config

### Q14: How to switch between different configuration environments?

**A:** Use configuration profile feature:

```bash
# Save current configuration as a profile
pnce profile save prod

# Switch to specified profile
pnce profile use prod

# List all profiles
pnce profile list
```

### Q15: How to configure proxy?

**A:** Set in configuration file:

```json
{
  "useProxy": true,
  "proxyUrl": "http://127.0.0.1:7890"
}
```

Or use environment variable:

```bash
export PNCE_PROXY_URL=http://127.0.0.1:7890
```

### Q16: What are the log levels?

**A:** Supports the following log levels:

- `error`: Show only errors
- `warn`: Show warnings and errors
- `info`: Show general information (default)
- `debug`: Show debug information

Setting method:

```bash
export PNCE_LOG_LEVEL=debug
# or set in configuration file
```

## Performance and Cache

### Q17: How to clear cache?

**A:** Run the following command:

```bash
pnce cache clean
```

### Q18: How to disable cache?

**A:** Use environment variable:

```bash
export PNCE_NO_CACHE=true
```

Or set in configuration file:

```json
{
  "enableCache": false
}
```

### Q19: Slow upload/download speed?

**A:** Try the following methods:

1. check network connection
2. Configure proxy (if applicable)
3. Adjust timeout (set `downloadTimeout` and `uploadTimeout` in config file)

## Troubleshooting

### Q20: What to do when getting "Network Error"?

**A:** check:

1. If network connection is normal
2. If server address is correct
3. If proxy configuration is correct
4. If firewall is blocking the connection

### Q21: What to do when getting "Module doesn't exist"?

**A:** Confirm:

1. Module name spelling is correct
2. Logged in to the correct registry
3. Module is actually published to the registry

Use search command to confirm:

```bash
pnce search module-name
```

### Q22: How to view detailed error information?

**A:** Use `--verbose` option:

```bash
pnce install module-name --verbose
```

Or set log level to debug:

```bash
export PNCE_LOG_LEVEL=debug
```

## Advanced Features

### Q23: How to use offline?

**A:** Offline mode requires:

1. Install required modules in advance and enable cache
2. Use cached modules for development

PNCE CLI will automatically use cached modules.

### Q24: How to batch install multiple modules?

**A:** Create a dependency list file, then install one by one:

```bash
for module in module1 module2 module3; do
  pnce install $module
done
```

### Q25: How to customize module installation path?

**A:** Use `-d` option:

```bash
pnce install module-name -d /custom/path
```

Or set `outputDir` in configuration file.

## Development and Debugging

### Q26: How to enable debug mode?

**A:** Set log level to debug:

```bash
export PNCE_LOG_LEVEL=debug
```

### Q27: How to view log files?

**A:** Log file location:

```
~/.pnce/logs/
```

Saved by date.

### Q28: How to report bugs?

**A:** Visit [GitHub Issues](https://github.com/hi-giacomo/pnce/issues) to submit bug reports, please include:

- PNCE CLI version
- Node.js version
- Operating system
- Error message
- Steps to reproduce

## Others

### Q29: Which operating systems does PNCE CLI support?

**A:** Supports:

- macOS (Darwin)
- Linux
- Windows

### Q30: What is the minimum Node.js version requirement?

**A:** Requires Node.js >= 18.0.0

### Q31: How to get more help?

**A:**

- View documentation: [https://github.com/hi-giacomo/pnce](https://github.com/hi-giacomo/pnce)
- Submit Issue: [https://github.com/hi-giacomo/pnce/issues](https://github.com/hi-giacomo/pnce/issues)
- View source code: [https://github.com/hi-giacomo/pnce](https://github.com/hi-giacomo/pnce)

---

Still have questions? Welcome to submit an Issue or join the discussion!
