# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2026-04-11

### Added
- **AI Integration Config**: Direct support for `GOOGLE_CREDENTIALS_JSON` environment variable, enabling secure Google Vertex AI and Imagen authentication in serverless environments (e.g. Vercel) without risking `.json` file exposure.
- **Documentation**: New `docs/PROJECT_SYNOPSIS.md` outlining the core architecture and structure.
- **Rich Interface**: Full-featured editor interface, sidebars, integrated inline AI rewriting capabilities, and dynamic SEO scoring.

### Changed
- **Architectural Migration:** Migrated the entire frontend application foundation from Vite to Next.js to leverage SSR, simplified routing, and powerful proxy/rewrite features.
- **Server Deployment**: Extensively refactored the backend structure to achieve first-class support for Vercel Serverless Function deployments (`vercel.json` rewrites and middleware adjustments).
- **API Proxy**: Standardized the frontend Next.js proxy configuration (`next.config.ts`) to cleanly seamlessly bridge `/api/*` requests to the backend server.
- **Default AI Model**: Changed the default fallback AI model from `gemini-2.5-flash` to `gemini-3-flash-preview` system-wide.
- **Database**: Simplified MongoDB database connection lifecycle logic.
- **Health Checks**: Appended real-time status emojis (✅, ❌, ⚠️) to `health` endpoint responses for highly readable logging.

### Fixed
- **Google Cloud Auth**: Added automatic extraction of `GOOGLE_CLOUD_PROJECT` ID directly from parsed JSON credentials, removing configuration overhead.
- **Dependency Issues**: Downgraded `uuid` to `9.0.0` and integrated `@types/uuid` to fix types integration crashes.
