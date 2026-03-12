# VelociTS Examples

This folder contains practical, runnable examples demonstrating various features and use cases of the VelociTS template engine.

## Running Examples

Run any example directly with npm scripts:

```bash
# Run all examples
npm run examples

# Or run individual examples
npm run example:basic      # Basic VTL usage
npm run example:utils      # Utility registration
npm run example:email      # Email template generation
npm run example:report     # Report generation
npm run example:config     # Configuration file generation
```

## TypeScript Best Practices

These examples follow modern TypeScript best practices:

1. **Direct TypeScript Execution**: Examples run directly using [`tsx`](https://github.com/privatenumber/tsx) - no compilation step needed during development
2. **Package Imports**: Examples import from the package name (`velocits`) rather than relative paths, showing users how they would actually use the library
3. **Type Safety**: Full TypeScript type checking with strict mode enabled
4. **ESM Modules**: Modern ES module syntax throughout

This approach provides:
- Faster development iteration (no build step for examples)
- Clearer, more realistic code samples
- Better developer experience
- Production-ready import patterns

## Examples Overview

### 1. Basic Usage (`01-basic-usage.ts`)

Demonstrates fundamental VTL features:
- Variable interpolation
- Conditionals (`#if/#else`)
- Loops (`#foreach`)
- Loop helpers (`$foreach.count`, `$foreach.hasNext`)
- Nested properties
- Method calls
- Variable assignment (`#set`)
- Quiet references (`$!missing`)

**Run:** `npm run example:basic`

### 2. Utility Registration (`02-utility-registration.ts`)

Shows how to register custom utilities in the VTL context:
- Static utility classes (like Java's `Math.class`)
- Instance-based utility objects
- Inline function objects
- Built-in JavaScript objects
- Using utilities in control structures

This is similar to Java Velocity's `context.put()` functionality.

**Run:** `npm run example:utils`

### 3. Email Template Generation (`03-email-template.ts`)

Real-world email generation examples:
- Welcome emails with conditional content
- Order confirmation emails with calculations
- Password reset emails
- Dynamic formatting (dates, currency)

Perfect for:
- Transactional emails
- Notifications
- Marketing emails
- System alerts

**Run:** `npm run example:email`

### 4. Report Generation (`04-report-generator.ts`)

Formatted report and document generation:
- Sales reports with metrics and analytics
- User activity reports
- Performance indicators
- Data formatting and presentation
- Conditional alerts and warnings

Useful for:
- Business reports
- Analytics dashboards
- Performance summaries
- Executive briefings

**Run:** `npm run example:report`

### 5. Configuration File Generation (`05-config-generator.ts`)

DevOps and deployment configuration templates:
- Nginx server configuration
- Docker Compose files
- GitHub Actions workflows
- Dynamic configuration based on environment

Great for:
- Infrastructure as Code
- CI/CD pipelines
- Deployment automation
- Environment-specific configs

**Run:** `npm run example:config`

## Creating Your Own Examples

To add a new example:

1. Create a new `.ts` file in this directory (e.g., `06-my-example.ts`)
2. Import the VelocityEngine: `import { VelocityEngine } from '../dist/index.js';`
3. Write your example code
4. Add an npm script in `package.json`:
   ```json
   "example:myexample": "npm run build && node dist/examples/06-my-example.js"
   ```

## Example Template

```typescript
import { VelocityEngine } from '../dist/index.js';

const engine = new VelocityEngine();

const template = `
Hello, $name!
#if($items.size() > 0)
You have $items.size() items.
#end
`;

const context = {
  name: 'World',
  items: [1, 2, 3]
};

const result = engine.render(template, context);
console.log(result);
```

## Tips

- **Use utility objects** for reusable helper functions
- **Format output** with utility methods (dates, currency, etc.)
- **Test templates** incrementally - start simple, then add complexity
- **Check context data** - make sure all expected variables are provided
- **Handle missing data** - use quiet references (`$!missing`) or conditionals

## Documentation

For complete VTL syntax and API documentation, see the main [README.md](../README.md).

## Questions?

- Check the [tests](../tests/velocity/) for more template examples
- Review the [main documentation](../README.md)
- Open an issue on GitHub
