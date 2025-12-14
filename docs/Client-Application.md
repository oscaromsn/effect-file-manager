# Client Application

> **Relevant source files**
> * [packages/client/index.html](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/index.html)
> * [packages/client/package.json](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/package.json)
> * [packages/client/src/index.css](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/index.css)

## Purpose and Scope

This document provides an overview of the React-based client application located in `packages/client`. It covers the technology stack, project structure, build configuration, routing architecture, and how the application initializes. For detailed information about specific subsystems, see:

* **UI component library**: [UI Component Library](/lucas-barake/effect-file-manager/7.1-ui-component-library)
* **CSS and theming**: [Styling System](/lucas-barake/effect-file-manager/7.2-styling-system)
* **Form-specific components**: [Form Components](/lucas-barake/effect-file-manager/7.3-form-components)
* **State management patterns**: [State Management with Effect Atoms](/lucas-barake/effect-file-manager/5-state-management-with-effect-atoms)
* **File upload UI**: [Upload UI Component](/lucas-barake/effect-file-manager/4.4-upload-ui-component)

---

## Technology Stack

The client application is built with the following core technologies:

| Technology | Version | Purpose |
| --- | --- | --- |
| **React** | 19.0.0 | UI framework |
| **Vite** | 6.1.0 | Build tool and dev server |
| **TanStack Router** | 1.139.0 | Type-safe file-based routing |
| **TypeScript** | Latest | Type safety |
| **Tailwind CSS** | 4.1.17 | Utility-first styling |
| **Effect-TS** | Latest | Functional programming patterns |
| **@effect-atom/atom-react** | Latest | Reactive state management |
| **@effect/rpc** | Latest | Type-safe RPC client |
| **Radix UI** | Various | Accessible component primitives |
| **Vitest** | 2.0.5 | Unit testing framework |

**Sources:** [packages/client/package.json L15-L56](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/package.json#L15-L56)

---

## Application Entry Point

### HTML Entry

The application starts from a minimal HTML template that loads the React application:

```

```

The HTML contains:

* A `#root` div where React mounts
* A module script loading `/src/main.tsx` as the entry point

**Sources:** [packages/client/index.html L1-L14](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/index.html#L1-L14)

### React Application Bootstrap

The application initialization flow follows this sequence:

```

```

**Sources:** [packages/client/index.html L10-L12](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/index.html#L10-L12)

---

## Project Structure

The client package follows a standard Vite + React structure:

```

```

**Sources:** [packages/client/package.json L1-L57](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/package.json#L1-L57)

---

## Build System Configuration

### Development and Build Scripts

The `package.json` defines several key scripts:

| Script | Command | Purpose |
| --- | --- | --- |
| `dev` | `dotenv -e ../../.env vite` | Start dev server with env vars |
| `build` | `tsc -b && vite build` | Type-check then build for production |
| `preview` | `vite preview` | Preview production build |
| `typecheck` | `tsc --noEmit` | Run TypeScript type checking |
| `tsr:generate` | `tsr generate` | Generate TanStack Router types |
| `postinstall` | `tsr generate` | Auto-generate routes after install |
| `test` | `vitest` | Run unit tests |

The `dev` script uses `dotenv-cli` to load environment variables from the root `.env` file before starting Vite.

**Sources:** [packages/client/package.json L6-L13](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/package.json#L6-L13)

### Build Pipeline

```

```

**Sources:** [packages/client/package.json L6-L13](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/package.json#L6-L13)

---

## Routing Architecture

The application uses **TanStack Router** (v1.139.0), a type-safe file-based routing system. Key characteristics:

### Router Configuration

* **File-based routing**: Routes are defined in `src/routes/` directory
* **Type generation**: The `@tanstack/router-cli` generates TypeScript types from route files
* **Auto-generation**: Route types regenerate on `postinstall` to stay in sync

### Routing Plugin Integration

The build system integrates routing through Vite plugins:

| Plugin | Package | Purpose |
| --- | --- | --- |
| `@tanstack/router-plugin` | 1.136.8 | Vite plugin for router integration |
| `@tanstack/router-cli` | 1.136.17 | CLI for type generation |

**Sources:** [packages/client/package.json L29-L44](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/package.json#L29-L44)

### Route Structure Pattern

```

```

TanStack Router provides:

* Type-safe route parameters
* Type-safe navigation (`navigate`, `Link` components)
* Automatic code splitting per route
* Nested layouts through `__root.tsx`

**Sources:** [packages/client/package.json L29-L44](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/package.json#L29-L44)

---

## Dependency Architecture

### Core Dependencies

The client application has three dependency layers:

**1. React Ecosystem**

```

```

**2. Effect-TS Stack**

```

```

The Effect stack provides:

* `effect`: Core Effect-TS primitives (Effect, Layer, Service)
* `@effect/platform`: Platform-agnostic utilities
* `@effect/platform-browser`: Browser-specific implementations
* `@effect/rpc`: Type-safe RPC client (WebSocket transport)
* `@effect-atom/atom-react`: Reactive state management with React hooks
* `@example/domain`: Shared types and schemas with server

**3. UI Component Libraries**

```

```

**Sources:** [packages/client/package.json L15-L40](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/package.json#L15-L40)

### Utility Dependencies

| Dependency | Version | Purpose |
| --- | --- | --- |
| `browser-image-compression` | 2.0.2 | Client-side image compression |
| `class-variance-authority` | 0.7.1 | Type-safe component variant system |
| `clsx` | 2.1.1 | Conditional class name builder |
| `tailwind-merge` | 3.0.1 | Intelligent Tailwind class merging |
| `tailwindcss-animate` | 1.0.7 | Animation utilities for Tailwind |

**Sources:** [packages/client/package.json L30-L39](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/package.json#L30-L39)

---

## Global Styling Configuration

The application uses a comprehensive CSS-in-CSS approach with Tailwind CSS 4.x. The global stylesheet [packages/client/src/index.css L1-L251](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/index.css#L1-L251)

 defines:

### Theme System

**CSS Variables for Design Tokens**

The application defines semantic color tokens using CSS custom properties:

| Token Category | Variables | Purpose |
| --- | --- | --- |
| Background layers | `--background`, `--background-secondary`, `--background-tertiary` | Layered depth system |
| Text | `--foreground` | Primary text color |
| Components | `--card`, `--popover`, `--input` | UI component surfaces |
| Brand colors | `--primary`, `--secondary`, `--accent` | Interactive elements |
| Feedback colors | `--destructive`, `--success`, `--warning` | Status indicators |
| Borders | `--border`, `--ring` | Component boundaries and focus rings |
| Charts | `--chart-1` through `--chart-5` | Data visualization palette |

These variables are defined in the `:root` selector and mapped to Tailwind color utilities through the `@theme inline` directive.

**Sources:** [packages/client/src/index.css L42-L87](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/index.css#L42-L87)

 [packages/client/src/index.css L89-L129](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/index.css#L89-L129)

### Custom Animations

The stylesheet defines custom keyframe animations:

```

```

These animations are registered as Tailwind utilities:

* `animate-shine`: Gradient shimmer effect
* `animate-collapsible-down`: Smooth collapsible expansion
* `animate-collapsible-up`: Smooth collapsible collapse

**Sources:** [packages/client/src/index.css L3-L40](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/index.css#L3-L40)

### Custom Scrollbar Styling

Cross-browser scrollbar customization is implemented for both Firefox and WebKit browsers:

```

```

The scrollbar configuration provides:

* Thin 8px scrollbars
* Transparent tracks
* Themed thumb colors with hover/active states
* Utility class `.scrollbar-hide` for hiding scrollbars

**Sources:** [packages/client/src/index.css L82-L86](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/index.css#L82-L86)

 [packages/client/src/index.css L207-L250](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/index.css#L207-L250)

### Typography Integration

The `@tailwindcss/typography` plugin is configured with dark mode overrides to ensure prose content (markdown, etc.) respects the dark theme:

* All headings (`h1`-`h6`) use `--color-foreground`
* Links use `--color-primary` with hover opacity
* Code blocks use `--color-muted` background
* Blockquotes use `--color-muted-foreground` with themed borders

**Sources:** [packages/client/src/index.css L131-L205](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/index.css#L131-L205)

---

## Development Tools

### Type Safety

The application leverages TypeScript throughout:

* Vite plugin `vite-tsconfig-paths` enables path aliases from `tsconfig.json`
* TanStack Router generates route types automatically
* Effect-TS provides compile-time guarantees for async operations
* RPC client shares types with server via `@example/domain` package

### Hot Module Replacement

Vite provides fast HMR through:

* `@vitejs/plugin-react-swc`: React Fast Refresh using SWC compiler
* Native ESM-based dev server
* Optimized dependency pre-bundling

**Sources:** [packages/client/package.json L47-L51](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/package.json#L47-L51)

---

## Integration with Monorepo

The client package integrates with the broader monorepo structure:

```

```

**Workspace Protocol Usage:**

The `package.json` uses two workspace dependency patterns:

* `workspace:^`: Versioned workspace dependencies (e.g., `@example/domain`)
* `workspace:*`: Latest workspace versions (for Effect packages shared across monorepo)

**Sources:** [packages/client/package.json L16-L20](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/package.json#L16-L20)

---

## Summary

The client application is a modern React SPA built with:

1. **Vite + React 19**: Fast dev server with native ESM and React Fast Refresh
2. **TanStack Router**: Type-safe file-based routing with automatic type generation
3. **Effect-TS**: Functional patterns for state, services, and async operations
4. **Tailwind CSS 4.x**: Utility-first styling with CSS variables and custom theme
5. **Radix UI**: Accessible primitive components for custom UI library
6. **Monorepo integration**: Shared types with server via `@example/domain` package

The architecture emphasizes type safety, developer experience, and maintainability through generated types, hot module replacement, and Effect-TS patterns. For implementation details of specific subsystems, refer to the child pages under this section.