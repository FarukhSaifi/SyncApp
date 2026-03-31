# SyncApp Project Synopsis

## Overview

SyncApp is a full-stack content syndication platform designed to help users write once and publish across multiple blogging platforms. It combines authoring, publishing, user management, and AI-assisted content generation in a single workflow. The project targets creators and teams that maintain content across channels such as Medium, DEV.to, and WordPress.

At its core, SyncApp reduces operational overhead in content distribution. Instead of switching tools for writing, editing, credential handling, and publishing, users can manage the complete lifecycle from one dashboard.

## Product Goals

- Centralize post authoring and management in one application
- Enable multi-platform publishing from a single source post
- Provide secure credential management for third-party publishing APIs
- Improve writing speed and consistency through AI-assisted generation
- Support both regular users and administrators via role-based access

## Key User Capabilities

### Authentication and Profile

- Register and log in with JWT-based authentication
- Persist authenticated state in the client app
- View and update profile information
- Change account password
- Access role-aware navigation and protected routes

### Post Authoring and Lifecycle Management

- Create and edit posts with rich-text tooling
- Save drafts and update published posts
- Add post metadata (tags, canonical URL, cover image)
- View post health/status indicators in dashboard lists
- Export posts as MDX for portable usage

### Multi-Platform Syndication

- Publish posts to Medium
- Publish posts to DEV.to
- Publish posts to WordPress
- Publish to all supported platforms in one action
- Track publish state and unpublish by platform where applicable

### AI-Assisted Workflow

- Generate outlines from topic prompts
- Expand outlines into draft content
- Generate image prompts and AI images
- Use generated assets to accelerate content completion

### Integrations and Settings

- Save and update platform-specific API credentials
- View active/inactive connection state by platform
- Manage integration settings inside the same dashboard

### Admin Features

- Access dedicated users management interface
- Search and filter users with pagination
- Create, edit, and delete user accounts
- Update user roles and verification state

## High-Level Technical Architecture

SyncApp is split into two major applications:

### Client Application (`client`)

- Next.js App Router + React + TypeScript
- Route groups:
  - `app/(auth)` for login/register
  - `app/(dashboard)` for authenticated product pages
- Shared providers for auth, theme, and toast notifications
- API abstraction layer using Axios-based client utilities
- Domain-oriented UI organization:
  - Reusable common components
  - Dashboard/editor/user-management-specific components

### Server Application (`server`)

- Node.js + Express + TypeScript + Mongoose
- Route-driven modular API under `/api`
- Layered backend organization:
  - routes -> controllers -> services -> models/utils
- Core middleware:
  - CORS, Helmet, rate limiting, auth guards, error handling
- Domain modules:
  - auth, posts, credentials, publish, users, mdx, ai

## Core System Flows

### 1) Authoring to Publishing Flow

1. User authenticates and enters dashboard
2. User creates or edits a post in the editor
3. User optionally uses AI tools for outline/draft/image generation
4. User saves draft and updates metadata
5. User publishes to one or multiple platforms
6. User monitors publish status in dashboard

### 2) Integration Setup Flow

1. User opens settings page
2. User provides platform credentials
3. Credentials are stored securely via backend service
4. Publish actions use stored credentials to send content to external APIs

### 3) Administration Flow

1. Admin authenticates and navigates to users page
2. Admin searches/filters users and reviews list
3. Admin creates, updates, or deletes users as needed
4. Role and verification changes influence access permissions

## Data Model Summary

Primary entities include:

- **User**: identity, auth fields, profile, role, verification, audit metadata
- **Post**: title, content, slug, status, tags, metadata, publish-state mapping
- **Credential**: platform credential payload and integration state

The model supports an end-to-end writing and syndication lifecycle with role-based operations.

## API Domain Summary

The backend API is organized around functional domains:

- **Auth**: registration, login, current user, profile/password updates
- **Posts**: create/read/update/delete and post metadata handling
- **Credentials**: platform credential management
- **Publish**: platform-specific and multi-platform distribution
- **Users**: admin-only user management operations
- **MDX**: content export
- **AI**: content and image generation endpoints

## Current Project Status

The frontend is actively structured around Next.js App Router patterns. There are signs of ongoing migration/cleanup from an earlier Vite setup, especially in documentation and configuration references. This indicates:

- The primary architecture has moved forward to Next.js
- Some docs/env artifacts may still reflect previous tooling
- Operational code and onboarding docs should be periodically aligned

## Strengths

- Strong product utility for creators publishing across multiple channels
- Unified workflow from drafting through distribution
- Clear frontend/backend separation with modular organization
- Built-in AI enhancement integrated into practical writing tasks
- Role-aware administration and user management already included

## Risks and Improvement Opportunities

- Ensure strict authentication/authorization across all sensitive routes
- Apply request validation consistently across API endpoints
- Harden encryption strategy and credential storage practices
- Improve multi-instance cache consistency for scaled deployments
- Continue cleanup of legacy migration artifacts in docs/configs
- Add stronger automated test coverage for critical end-to-end flows

## Recommended Next Steps

- Complete security hardening pass (route protection + ownership checks)
- Standardize request validation middleware usage
- Finalize migration documentation to match current runtime architecture
- Introduce integration and end-to-end test suites
- Enhance observability for publishing and AI task reliability

## Conclusion

SyncApp is a practical, feature-rich content operations platform centered on cross-platform publishing efficiency. The project already delivers a meaningful end-to-end experience for writers and administrators. With focused hardening, validation consistency, and migration cleanup, it can mature into a robust production-grade syndication system.
