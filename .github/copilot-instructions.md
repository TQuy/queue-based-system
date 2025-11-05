# Copilot Instructions for media-prototype-2

## Project Overview
This is a TypeScript Express.js server prototype with ESM modules and strict type checking. The project uses modern TypeScript configurations and follows a minimal but extensible architecture pattern.

## Architecture & Patterns

### Module System
- **ESM-first**: Project uses `"type": "module"` in `package.json`
- **Import style**: Use `import`/`export` syntax, avoid `require()`
- **Type imports**: Explicitly import types with `import type { ... }`

### TypeScript Configuration
- **Strict typing**: `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` are enabled
- **Module resolution**: Uses `"module": "nodenext"` for Node.js ESM compatibility
- **Path aliases**: Use `@/*` for `src/*` imports (configured in `tsconfig.json`)
- **Output**: Compiles to `dist/` directory with source maps and declarations

### Express.js Patterns
- **Type annotations**: Always type Express handlers with `Request`, `Response`, `Application`
- **App structure**: Single `index.ts` entry point pattern (expandable to modules)

## Development Workflow

### Key Commands
```bash
npm run dev        # Development server with nodemon + ts-node
npm run build      # Compile TypeScript to dist/
npm start          # Run compiled JavaScript from dist/
```

### File Structure Conventions
- `src/index.ts` - Main application entry point
- Use `@/` alias for imports from `src/` directory
- TypeScript compiles to `dist/` (not tracked in git)

### Development Patterns
- **Hot reload**: Use `npm run dev` for development (nodemon watches `src/`)
- **Type safety**: Leverage strict TypeScript settings - handle undefined array access
- **Module imports**: Always use explicit file extensions where required by ESM

## Adding New Features

### Route Handlers
```typescript
// Follow this pattern for new routes
app.get("/api/example", (req: Request, res: Response) => {
  // Implementation
});
```

### New Dependencies
- Add to `dependencies` for runtime packages
- Add to `devDependencies` for build/dev tools
- Install types separately (e.g., `@types/package-name`)

## Important Notes
- Project uses Express 5.x (latest major version)
- ESM modules require careful attention to import/export syntax
- TypeScript config prioritizes safety over convenience (strict settings)
- No testing framework currently configured

## Coding Style
- Use functional programming if possible, but can switch to hybrid approach between OOP and functional programming if closure is hard to comprehend, and having a explicit state is better.
- We will try to split code into three layers: `Controller`, `Service` and finally `Utility`. The `Utility` layer hold the re-usable, pure functions such as function to calculate fibonacci number.
- Don't update the path alias `@/*` to `../*` in files that are not test files