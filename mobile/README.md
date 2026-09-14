# SyncApp Mobile (Expo)

iOS-first React Native app for SyncApp — full feature parity with the web client, using the same REST API.

## Prerequisites

- macOS with **Xcode 15+** (for iOS Simulator and device builds)
- Node.js 20+
- CocoaPods (installed automatically by Expo when running native builds)
- SyncApp server running locally or use production API

## App icon

Brand icons (purple sync mark) live in `assets/images/`. The checked-in assets are the source of truth for the app icon.

## Setup

```bash
# From repo root
npm run install:mobile

# Configure API URL
cp mobile/.env.example mobile/.env
```

### Environment

| Variable                   | Description                        |
| -------------------------- | ---------------------------------- |
| `EXPO_PUBLIC_API_BASE_URL` | API base URL (must include `/api`) |

**Examples:**

- iOS Simulator + local server: `http://localhost:9000/api`
- Physical device + local server: `http://<your-mac-lan-ip>:9000/api`
- Production: `https://sync-app-server.vercel.app/api`

Ensure the server binds to `0.0.0.0` when testing from a physical device.

## Run

This project targets **Expo SDK 57** (React Native, React 19, New Architecture enabled). You can test on physical devices via **Expo Go**, a **direct preview APK (Android)**, or a **local development build (iOS/Android)**.

### Target Platforms

- **iOS Deployment Target**: `26.0` (iOS 26 baseline configured in `mobile/config/iosDefaults.ts`, `app.config.ts`, and `eas.json`).
- **Android Target**: **Android 16** (API Level `36`: `compileSdkVersion: 36`, `targetSdkVersion: 36`, `minSdkVersion: 24` via `config/ios.ts`).

### Testing on Device Without Apple or Google Developer Subscriptions

You do **not** need a paid Apple Developer Program or Google Play Console account to test SyncApp on physical devices:

#### 1. Android Direct APK (Download & Install)

Build a standalone `.apk` using EAS Build that can be downloaded and installed directly on any Android device:

```bash
cd mobile
eas build --profile preview --platform android
```

Once the build completes on Expo's cloud, scan the terminal QR code or open the download URL on your Android device to install the APK directly.

#### 2. Physical iPhone with Free Apple ID (USB Build)

Build and install directly to a connected iPhone using Xcode's free personal provisioning:

1. On the iPhone: Enable **Developer Mode** (Settings → Privacy & Security → Developer Mode).
2. On Mac: Sign in with your free Apple ID in Xcode (Settings → Accounts).
3. Connect iPhone via USB and run:

   ```bash
   npm run ios:device
   npm run start:dev-client
   ```

#### 3. Physical iPhone with Expo Go (Quickest)

1. Install **Expo Go** from the App Store on the iPhone (same Wi‑Fi as your Mac).
2. Set API URL in `mobile/.env` (use Mac LAN IP, e.g. `http://192.168.x.x:9000/api`).
3. From repo root:

   ```bash
   npm run dev:mobile
   ```

4. Scan the QR code with the **Camera** app → open in **Expo Go**.

### iOS Production Build Settings (Xcode / App Store)

Native settings live in config files and are applied automatically during Expo prebuild:

| Setting | Default | Config source |
| --- | --- | --- |
| Minimum iOS (deployment target) | **26.0** (iOS 26) | `IOS_DEPLOYMENT_TARGET` or `config/iosDefaults.ts` |
| Android compileSdkVersion | **36** (Android 16) | `config/ios.ts` via `expo-build-properties` |
| Android targetSdkVersion | **36** (Android 16) | `config/ios.ts` via `expo-build-properties` |
| Device family | **iPhone only** | `IOS_SUPPORTS_TABLET=true` for iPad |
| New Architecture | **enabled** | `newArchEnabled` in `app.config.ts` |

```bash
# Force regenerate native project from app.config
IOS_REGEN=1 npm run ios:device
# or
npm run ios:prebuild

# Release build on device (TestFlight-style)
npm run ios:release

# EAS App Store / Production build
eas build --platform ios --profile production
```

Compile with the **latest Xcode SDK** on your Mac. `IOS_DEPLOYMENT_TARGET` is the **minimum OS on user devices**, not the SDK version.

### iOS Simulator (first time)

```bash
npm run ios          # build & install on simulator
npm run dev:mobile        # Expo Go (default)
npm run start:dev-client  # custom SyncApp dev build
```

### Force Expo Go mode

```bash
npm run start:go
# or: cd mobile && npm run start:go
```

## Troubleshooting

### “Incompatible with Expo Go”

**Cause:** Metro was started for the wrong client, or dependencies are not on SDK 57.

**Fix:**

```bash
cd mobile && rm -rf node_modules ios android && npm install && npx expo install --fix
npm run dev:mobile   # from repo root — opens SDK 57 Expo Go QR
```

If you need a custom dev build: `npm run ios:device` then `npm run start:dev-client`.

**Note:** True iOS 26 Liquid Glass (`expo-glass-effect`) requires SDK 56+. On SDK 54, glass UI uses **blur** fallback automatically.

### Bundle identifier cannot be registered

`com.syncapp.mobile` is reserved or already used on your Apple team. Use your own ID:

```bash
# mobile/.env
IOS_BUNDLE_IDENTIFIER=com.yourname.syncapp
```

Then:

```bash
IOS_REGEN=1 npm run ios:device
```

### `No development build` for this project is installed

You ran `npm run dev:mobile` and pressed `i` before installing the native app.

**Fix:** Run `npm run ios` once. That runs `expo prebuild`, installs CocoaPods, builds with Xcode, and installs SyncApp on the simulator.

If CocoaPods is missing, Expo will try to install it (via gem or Homebrew). You can also install manually:

```bash
brew install cocoapods
# or: sudo gem install cocoapods
```

Then re-run `npm run ios`.

### `pod install` failed — `certificate verify failed (unable to get local issuer certificate)`

Ruby/CocoaPods can't find CA certificates (common with Homebrew Ruby + system Ruby mix).

**Fix:** project scripts already wrap iOS builds with `scripts/with-certs.sh`. Run:

```bash
npm run ios
# or manually:
cd mobile && npm run pod:install
```

If it still fails, add to your `~/.zshrc`:

```bash
export SSL_CERT_FILE="$HOME/homebrew/etc/ca-certificates/cert.pem"
export CURL_CA_BUNDLE="$SSL_CERT_FILE"
```

Then `source ~/.zshrc` and retry.

**Note:** Don't paste Expo's error line (`pod install ... exited with non-zero code: 1`) into the terminal — that's output, not a command.

### `Sending "reload" to all React Native apps failed`

Metro is running but no app is connected. Open SyncApp on the simulator, or run `npm run ios` to install it.

## Features

- **Auth**: Login, register, SecureStore persistent sessions, automatic restore.
- **Dashboard**: Article feed, status filtering (All, Draft, Published), pull-to-refresh, destructive delete confirmation.
- **Futuristic Content Studio**: Mobile-optimized Word / Gutenberg-style drafting experience with live reading preview, block insertion drawer, and dynamic autosave.
- **Multi-Platform Syndication**: Authenticated-only target channels (Medium, DEV.to, WordPress, LinkedIn).
- **AI Copilot**: Reversible Before/After diff reviews (Enhance, Professional Tone, Fix Grammar, Shorten, Expand), keyword drafting, and cover image generation.
- **Settings**: Encrypted credentials manager for Medium, DEV.to, WordPress, and LinkedIn OAuth.
- **Profile**: Account management and password updates.
- **Analytics**: Publishing performance metrics and distribution charts.
- **Admin**: User roles and status governance.

## Content Studio & Mobile Editor Architecture

The editor (`mobile/src/components/editor/`) is built around modular, decoupled components conforming to modern mobile UX specifications:

- **`EditorWorkspace.tsx`**: Central orchestrator managing Write, Channels, and Details tabs, pre-flight modal triggers, and autosave coordination.
- **`EditorHeader.tsx`**: Navigation header with live pulsating save status, real-time Word Count & Read Time pill, and readiness score badge.
- **`EditorModeTabs.tsx`**: Segmented switch between **Write**, **Channels**, and **Details** with dynamic destination count indicator.
- **`WriteTab.tsx`**: Dual-mode canvas supporting both structured raw markdown writing and a live magazine-style article preview with cover banner management.
- **`FormattingAccessoryBar.tsx`**: Sticky formatting bar providing 1-tap block drawer access, markdown stylers (Bold, Italic, H1, H2, Quotes, Code Blocks, Checklists, Links), and AI Copilot trigger.
- **`BlockInserterSheet.tsx`**: Categorized block insertion palette (Text, Lists, Code & Embeds, Media).
- **`VisualBlockPreview.tsx`**: Live block renderer featuring typography hierarchy, styled quotes, syntax-themed code cards, and interactive checklists.
- **`AiCopilotSheet.tsx`**: Slide-up AI copilot studio featuring 1-tap presets and **reversible Before vs. After diff review** (Accept & Replace, Append to Story, Discard).
- **`ChannelsTab.tsx`**: Authenticated publishing channels manager (Medium, DEV.to, WordPress, LinkedIn) with live readiness pills, dedicated LinkedIn post editor with real-time character counter (`x/1300`), and destination feed mockup preview.
- **`DetailsTab.tsx`**: Interactive tag chips, quick 1-tap scheduling presets ("In 4 Hours", "Tomorrow AM", "In 3 Days"), and SEO metadata fields (Canonical URL & Meta Description).
- **`ReviewPublishSheet.tsx`**: Pre-flight launch validation sheet verifying readiness checklist, target platforms, and dispatch execution.

## Authenticated Multi-Channel Publishing

Publishing targets are strictly governed by platform authentication status:

- **Introspection**: `useEditorState` loads credentials from `/api/credentials` and automatically reloads when the editor gains focus.
- **Target Filtering**: Only platforms with saved, active credentials appear in the Channels tab and pre-flight sheet. Platforms without credentials cannot be selected or targeted.
- **Zero-Channel Empty State**: If no platforms have been connected yet, an empty-state banner provides an instant shortcut to the Settings screen.
- **LinkedIn Studio**: The LinkedIn adaptation studio is displayed conditionally only when LinkedIn is connected.

## EAS Build (Direct Testing & App Stores)

### 1. Standalone Direct Android Testing (No Google Account Required)

Build a downloadable APK for direct installation on physical Android phones:

```bash
cd mobile
eas build --profile preview --platform android
```

Download the resulting `.apk` file directly to your phone.

### 2. Physical iOS Testing (Free Apple ID or TestFlight)

- **Local Dev Build**: Connect iPhone via USB and run `npm run ios:device` with Xcode personal provisioning.
- **Ad-hoc Device Build**: `eas build --profile development-device --platform ios`
- **TestFlight / Production**: `eas build --profile production --platform ios`

### EAS Configuration Notes

- The mobile package specifies `"packageManager": "npm@11.13.0"` in `mobile/package.json` to prevent EAS from erroneously defaulting to Yarn with frozen lockfiles.
- Build profiles in `mobile/eas.json` set `EAS_NO_FROZEN_LOCKFILE: "1"`.

## Project structure

```
mobile/
├── app/                      # Expo Router navigation routes
│   ├── (auth)/               # Login & register screens
│   ├── (tabs)/               # Tab screens (Dashboard, Analytics, Users, Settings)
│   ├── editor/               # Post creation, editing, cover image generator
│   └── profile/              # User profile & credentials
├── src/
│   ├── components/
│   │   ├── editor/           # Modular content studio components (10 dedicated modules)
│   │   ├── skeletons/        # Loading skeleton placeholders
│   │   └── ui/               # Core atomic UI primitives (Button, Card, Input, etc.)
│   ├── constants/            # Design tokens, messages, routes, platform definitions
│   ├── contexts/             # ThemeContext (dark/light/system)
│   ├── hooks/                # useEditorState, usePosts, useToast, useTabBarInset, …
│   ├── screens/              # Screen orchestrators (EditorScreen, GenerateImageScreen)
│   ├── services/             # apiClient with retry & token refresh
│   └── types/                # Strict TypeScript contracts & domain models
├── config/                   # ios.js, iosDefaults.js (SDK 57, iOS 26, Android 16)
├── app.config.ts             # Dynamic Expo configuration
└── eas.json                  # Multi-profile EAS build configurations
```

Path aliases: `@/` → project root; `@constants`, `@components/*`, `@hooks/*` mirror the web client.
