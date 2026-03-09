# Changelog

This document records all important changes to PNCE CLI.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [0.0.9] - 2026-03-06

### Security
- ✨ Token encryption storage (using AES-256-GCM)
- 🔒 Remove hardcoded IP addresses, use environment variables for configuration
- 🛡️ Add encryption utility class (CryptoUtil)

### Improvements
- 🔧 Improve environment variable configuration (.env.example)
- 📝 Update documentation structure (move to docs/ directory)

### Fixes
- 🐛 Fix version number inconsistency issue
- 🔐 Fix security issue of plaintext token storage

## [0.0.8] - 2026-03-05

### Optimization

### Optimization
- Implement unified error handling system
- Add Winston-based logging system
- Add progress bar display feature
- Implement parallel download support (3x speed improvement)
- Refactor configuration management system
- Add complete JSDoc comments
- Unify constant management
- Remove all hardcoded values

### Added
- `install-batch` command supports batch installation
- `pnce me` command to view current user information
- Multi-level configuration support (environment variables, project config, user config)
- Automatic token expiration detection
- HTTP request retry mechanism

### Fixes
- Fix all TypeScript compilation errors
- Fix environment variable reading issue
- Fix log initialization error handling

### Improvements
- Improve type safety, remove all `any` types
- Optimize error prompt messages
- Improve API error handling

## [0.0.7] - 2026-03-04

### Added
- Module management commands
- Port management feature
- Module search feature
- Trending module query
- Statistics query

### Improvements
- Optimize download speed
- Improve cache mechanism

## [0.0.6] - 2026-03-03

### Added
- OAuth2 browser login support
- Email/password login support
- User registration feature
- Automatic token management

### Improvements
- Optimize authentication flow
- Improve error prompts

## [0.0.5] - 2026-03-02

### Added
- Module upload feature
- Module download feature
- Module search feature
- Module information query

### Improvements
- Optimize file handling
- Improve compression algorithm

## [0.0.4] - 2026-03-01

### Added
- Initialize service project feature
- Initialize microservice project feature
- Project template system

### Improvements
- Optimize project generation flow
- Add project validation

## [0.0.3] - 2026-02-28

### Added
- Module installation feature
- Dependency management feature
- Configuration management feature

### Fixes
- Fix configuration file reading issue

## [0.0.2] - 2026-02-27

### Added
- Basic command line framework
- Authentication service
- API service

### Improvements
- Optimize command line argument parsing

## [0.0.1] - 2026-02-26

### Added
- Initial version release
- Basic functionality framework
- Core service architecture

---

## Change Type Explanation

- **Added** - New features
- **Changed** - Changes to existing functionality
- **Deprecated** - Features that will be removed soon
- **Removed** - Removed features
- **Fixed** - Bug fixes
- **Security** - Security-related fixes
