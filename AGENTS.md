# SyncApp Agent Guide

## Repository Shape

SyncApp is an npm-workspaces monorepo orchestrated by Turborepo:

- `client/`: Next.js App Router frontend deployed from Vercel with root directory `client`.
- `server/`: Express + TypeScript API deployed from Vercel with root directory `server`.
- `mobile/`: Expo Router React Native app for iOS, Android, and web.
- `docs/`: Architecture, deployment, data, flows, and feature documentation.

Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for ownership boundaries and [README.md](README.md) for setup and environment links.

## Runtime And Package Management

- Use Node.js `>=24.21.0` and npm workspaces from the repository root.
- Install with `npm install`; use workspace flags or run commands from the package directory when the command is package-specific.
- Do not create or commit real `.env` files, credentials, build output, `node_modules`, or generated native folders. Use the existing `*.example` files.
- Treat `client/` and `server/` as independent Vercel projects. A command that works from the repository root may not work when Vercel runs from a package root.
- Do not suppress Expo or TypeScript compatibility checks with environment-variable bypasses when the dependency/configuration issue can be fixed directly.

## Validation Commands

Run the narrowest relevant check first, then widen as needed:

- Root: `npm run check`, `npm run build`, `npm run audit:all`
- Client: `npm run typecheck --workspace client`, `npm run lint --workspace client`, `npm run build --workspace client`
- Server: `npm run typecheck --workspace server`, `npm run build --workspace server`
- Mobile: `cd mobile && npm run typecheck`, `cd mobile && npx expo-doctor`, `cd mobile && npx tsc --noEmit -p tsconfig.json`

The mobile package currently has no lint script. Do not invent one as part of an unrelated change.

## Code Conventions

- Preserve existing TypeScript strictness, path aliases, response shape, and public API contracts.
- Keep user-facing strings in the relevant constants/messages module where that pattern exists.
- Reuse existing components, hooks, theme colors, and design tokens before adding new primitives.
- Keep API calls in the package API client and business logic in the established hooks/services/controllers layers.
- Server requests use strict Zod validation and return `{ success: true, data? }` or `{ success: false, error }`.
- For mobile editor work, preserve `useEditorState` as the persistence/publishing boundary. The editor UX is documented in [docs/ux/mobile-editor-flow.md](docs/ux/mobile-editor-flow.md), [docs/ux/mobile-editor-jtbd.md](docs/ux/mobile-editor-jtbd.md), and [docs/ux/mobile-editor-journey.md](docs/ux/mobile-editor-journey.md).

## High-Risk Areas

- Expo packages must be aligned with the installed Expo SDK using `npx expo install --fix`; do not independently upgrade React Native modules across SDK generations.
- Mobile TypeScript inherits Expo’s config from the workspace layout; verify `mobile/tsconfig.json` resolves the installed Expo package before changing aliases.
- Vercel builds use the app directory as the working/root directory. Avoid `typeRoots` or relative dependency paths that only work from the monorepo root.
- Credentials for publishing platforms are encrypted by the server. Never log, expose, or commit credential values.
- Publishing and scheduled publishing are externally visible operations. Add explicit confirmation and preserve partial-failure/retry behavior.

## Documentation

Link to existing documentation instead of copying it into new instructions:

- [System flows](docs/SYSTEM_FLOWS.md)
- [Database schema](docs/DATABASE_SCHEMA.md)
- [Features](docs/FEATURES.md)
- [Vercel environment setup](docs/VERCEL_ENV.md)
- [Mobile agent notes](mobile/AGENTS.md)
