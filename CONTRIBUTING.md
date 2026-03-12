# Contributing to Velocits

Thank you for your interest in contributing to Velocits! This document provides guidelines and instructions for contributing to the project.

## Getting Started

### Prerequisites

- Node.js >= 22.0.0
- npm or yarn
- Git

### Setup

1. Fork the repository and clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/velocits.git
   cd velocits
   ```

2. Install dependencies:
   ```bash
   npm ci
   ```

3. Initialize the git submodule for Apache Velocity reference:
   ```bash
   git submodule update --init
   ```

4. Build the project:
   ```bash
   npm run build
   ```

5. Run tests to ensure everything is working:
   ```bash
   npm test
   ```

## Development Workflow

### Making Changes

1. Create a new branch for your feature or fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes in the `src/` directory

3. Build the project:
   ```bash
   npm run build
   ```

4. Run tests to ensure compatibility:
   ```bash
   npm test
   ```

5. For development with auto-rebuild:
   ```bash
   npm run dev
   ```

### Code Style

This project uses TypeScript with strict type checking. Please ensure your code:

- Passes all TypeScript checks (`tsc --noEmit`)
- Follows the existing code style and patterns
- Includes proper type annotations
- Avoids use of `any` unless absolutely necessary
- Has no unused variables or parameters

### Testing

Velocits uses a unique testing approach that compares output with the Apache Velocity Java reference implementation to ensure 100% compatibility.

#### Adding Test Cases

To add a new test case:

1. Use the helper script:
   ```bash
   npm run add-test
   ```
   This will guide you through creating a new test case.

2. Or manually create a directory under `tests/velocity/`:
   ```
   tests/velocity/your-test-name/
     ├── template.vtl   # The Velocity template
     └── input.json     # Context variables as JSON
   ```

3. Run the full Velocity compatibility suite:
   ```bash
   npm run test:velocity
   ```

#### Test Guidelines

- Test cases should focus on specific features or edge cases
- Templates should be minimal and focused
- Input data should cover edge cases (null, empty arrays, etc.)
- All tests must pass against both Java and TypeScript implementations

### Commit Messages

We follow conventional commit messages:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `test:` - Adding or updating tests
- `refactor:` - Code refactoring
- `chore:` - Maintenance tasks

Example:
```
feat: add support for #macro directive
fix: handle null values in foreach loops
docs: update README with new examples
```

## Pull Request Process

1. Ensure all tests pass (`npm test`)
2. Update documentation if needed
3. Create a pull request with a clear description:
   - What problem does it solve?
   - What approach did you take?
   - Are there any breaking changes?
   - Include test results if relevant

4. Link any related issues

5. Wait for code review and address feedback

## Release Process

- Releases are automated from `main` with semantic-release.
- Use conventional commits so the next version is computed correctly:
  - `fix:` produces a patch release
  - `feat:` produces a minor release
  - breaking changes produce a major release
- npm publishing uses GitHub Actions trusted publishing from `.github/workflows/semantic-release.yml`.
- Do not manually edit package versions just to cut a release unless there is a specific maintenance reason.

## What to Contribute

We welcome contributions in these areas:

### High Priority

- **Bug fixes**: Issues with incorrect rendering compared to Java implementation
- **Feature parity**: Missing VTL features (macros, includes, etc.)
- **Performance improvements**: Optimizations that don't break compatibility
- **Test coverage**: New test cases for edge cases

### Medium Priority

- **Documentation**: Improved examples, guides, API docs
- **Developer experience**: Better error messages, tooling improvements
- **Browser compatibility**: Testing and fixes for different browsers

### Low Priority

- **Code quality**: Refactoring for better maintainability
- **Build improvements**: Optimization of build process

## Compatibility Goals

The primary goal of Velocits is **1:1 compatibility with Apache Velocity**. When contributing:

1. **Never break compatibility**: All existing tests must continue to pass
2. **Match Java behavior**: When in doubt, Java implementation is the source of truth
3. **Add comparison tests**: New features should include tests that compare with Java
4. **Document deviations**: If 100% compatibility is impossible, document why

## Project Structure

Understanding the codebase:

- `src/engine.ts` - Main VelocityEngine API
- `src/lexer/` - Tokenization (Chevrotain lexer)
- `src/parser/` - Parsing to AST (Chevrotain parser)
- `src/runtime/` - Template evaluation and execution
- `tools/compare-velocity/` - Test harness for Java comparison
- `tests/velocity/` - Test cases

## Getting Help

- Open an issue for bugs or feature requests
- Join discussions in existing issues
- Ask questions in pull requests

## Code of Conduct

- Be respectful and constructive
- Focus on the code, not the person
- Welcome newcomers and help them learn
- Assume good intentions

## License

By contributing to Velocits, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Velocits! Your efforts help make this library better for everyone.
