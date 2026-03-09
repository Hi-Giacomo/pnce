# Contributing Guide

Thank you for your interest and contribution to PNCE CLI!

This document will help you understand how to participate in PNCE CLI development.

## Code of Conduct

- Respect all contributors
- Use clear and inclusive language
- Accept constructive criticism
- Focus on what's best for the community
- Show empathy towards other community members

## How to Contribute

### Report Bugs

If you find a bug, please:

1. First search [Issues](https://github.com/hi-giacomo/pnce/issues) to confirm it hasn't been reported
2. If not reported, create a new Issue, including:
   - Clear title
   - Detailed problem description
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Environment information (Node.js version, OS, PNCE CLI version)
   - Error logs (if any)

### Propose New Features

If you have new feature suggestions:

1. First search [Issues](https://github.com/hi-giacomo/pnce/issues) to confirm it hasn't been proposed
2. If not proposed, create a new Feature Request, including:
   - Feature description
   - Use cases
   - Why this feature is important
   - Possible implementation approach (optional)

### Submit Code

#### Development Environment Setup

```bash
# 1. Fork the repository
# Click the Fork button on GitHub

# 2. Clone your fork
git clone https://github.com/your-username/pnce.git
cd pnce

# 3. Install dependencies
npm install

# 4. Build project
npm run build

# 5. Link local version (optional)
npm link

# 6. Test
pnce --version
pnce --help
```

#### Create Branch

```bash
# Create new branch from main branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-you-fix
```

#### Write Code

- Follow existing code style
- Add necessary comments (especially for complex logic)
- Add JSDoc comments for public APIs
- Ensure code passes TypeScript compilation (`npm run build`)

#### Testing

```bash
# Run build
npm run build

# Local test
npm link
pnce test-command

# Run tests (if any)
npm test
```

#### Commit Code

```bash
# Add modified files
git add .

# Commit (use clear commit messages)
git commit -m "feat: add batch installation feature"
# or
git commit -m "fix: fix token expiration detection issue"

# Commit types:
# feat: new feature
# fix: bug fix
# docs: documentation update
# style: code formatting (doesn't affect functionality)
# refactor: refactoring
# test: test related
# chore: build or tool related
```

#### Push to Your Fork

```bash
git push origin feature/your-feature-name
```

#### Create Pull Request

1. Visit your fork on GitHub
2. Click "New Pull Request"
3. Select your branch
4. Fill in PR template:
   - Clear title
   - Describe your changes
   - Link related issues (if any)
   - Add screenshots (if applicable)
   - Confirm tests pass

## Code Standards

### TypeScript

- Write code in TypeScript
- Follow `tsconfig.json` configuration in the project
- Avoid using `any` type
- Add necessary type definitions

### Code Style

- Use 2-space indentation
- Use single quotes (strings)
- Use semicolons at end of statements
- Follow existing code style

### Naming Conventions

- File names: kebab-case (e.g., `auth.service.ts`)
- Class names: PascalCase (e.g., `AuthService`)
- Functions/variables: camelCase (e.g., `getUserInfo`)
- Constants: UPPER_SNAKE_CASE (e.g., `API_SERVER`)

### Comment Standards

- Add JSDoc comments for all public methods
- Add inline comments for complex logic
- Use Chinese comments (since this is a Chinese project)

```typescript
/**
 * Get user information
 * @param userId - User ID
 * @returns User info object
 */
async function getUser(userId: string): Promise<UserInfo> {
  // Implementation code
}
```

## Documentation

If your changes affect user-visible features:

- Update README.md
- Update CHANGELOG.md (using correct format)
- Update relevant command documentation
- Add usage examples

## Release Process

PNCE CLI uses Semantic Versioning:

- **MAJOR**: Incompatible API changes
- **MINOR**: Backwards-compatible functionality additions
- **PATCH**: Backwards-compatible bug fixes

Release steps (for maintainers only):

```bash
# 1. Update version number
npm version patch  # or minor, major

# 2. Update CHANGELOG.md

# 3. Build project
npm run build

# 4. Test
npm pack --dry-run

# 5. Publish
npm publish

# 6. Push tags
git push --tags
```

## Community

- GitHub: https://github.com/hi-giacomo/pnce
- Issues: https://github.com/hi-giacomo/pnce/issues
- Discussions: https://github.com/hi-giacomo/pnce/discussions

## License

By contributing code, you agree that your contributions will be released under the [MulanPSL2](http://license.coscl.org.cn/MulanPSL2) license.

---

**Thank you for your contribution!** 🎉
