# SyncApp Mobile (Expo)

iOS-first React Native app for SyncApp — full feature parity with the web client, using the same REST API.

## Prerequisites

- macOS with **Xcode 15+** (for iOS Simulator and device builds)
- Node.js 20+
- CocoaPods (installed automatically by Expo when running native builds)
- SyncApp server running locally or use production API

## App icon

Brand icons (purple sync mark) live in `assets/images/`. Regenerate from SVG sources:

```bash
npm run generate:icons   # from repo root, or: cd mobile && npm run generate:icons
```

Sources: `mobile/scripts/icon-source.svg` (edit, then re-run).

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

This project targets **Expo SDK 54** (React Native 0.81, React 19.1). You can use **Expo Go** on a physical iPhone (App Store) or a **development build** for full native control.

### Physical iPhone with Expo Go (quickest)

1. Install **Expo Go** from the App Store on the iPhone (same Wi‑Fi as your Mac).
2. Set API URL in `mobile/.env` (use Mac LAN IP, not `localhost`).
3. From repo root:

```bash
npm run dev:mobile
```

4. Scan the QR code with the **Camera** app → open in **Expo Go**.

For native modules not in Expo Go, use a dev build: `npm run ios:device` and `npm run start:dev-client`.

### Physical iPhone (USB dev build)

1. On the iPhone: **Trust** this Mac, enable **Developer Mode** (Settings → Privacy & Security → Developer Mode), restart if prompted.
2. On the Mac: Xcode installed, signed in with an Apple ID (Xcode → Settings → Accounts).
3. Copy env and set your Mac’s LAN IP if using a local API (not `localhost`):

```bash
cp mobile/.env.example mobile/.env
# EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:9000/api
```

4. Build and install **SyncApp** on the connected iPhone (first time may take several minutes; Xcode may ask for a development team):

```bash
# From repo root
npm run ios:device
```

5. Start Metro for the dev client:

```bash
npm run start:dev-client
```

6. Open the **SyncApp** dev app on the phone (not Expo Go). Shake → **Enter URL manually** if it does not connect automatically.

Optional: copy `mobile/.env.device.example` → `mobile/.env` and set a **unique** `IOS_BUNDLE_IDENTIFIER` if Xcode reports the default ID is unavailable. Then `IOS_REGEN=1 npm run ios:device`.

Optional: set `IOS_REGEN=1` (or `npm run ios:prebuild`) after changing bundle ID or iOS build settings in `app.config.ts` / `config/ios.js`.

Optional: set `APPLE_TEAM_ID` in `mobile/.env` if automatic signing fails (Team ID from [developer.apple.com/account](https://developer.apple.com/account)).

### iOS production build settings (Xcode / App Store)

Native settings are **not** edited in Xcode long-term — they live in config and are applied on every prebuild:

| Setting                         | Default           | Env override                                       |
| ------------------------------- | ----------------- | -------------------------------------------------- |
| Minimum iOS (deployment target) | **26.0** (latest) | `IOS_DEPLOYMENT_TARGET` or `config/iosDefaults.js` |
| Device family                   | **iPhone only**   | `IOS_SUPPORTS_TABLET=true` for iPad                |
| New Architecture                | **enabled**       | `newArchEnabled` in `app.config.ts`                |
| Privacy manifests               | aggregated        | `expo-build-properties`                            |

Expo’s default deployment target is **15.1** (legacy). This project overrides that via `expo-build-properties` so Xcode no longer resets to old device baselines when `ios/` is regenerated.

```bash
# Force regenerate ios/ from app.config (after changing config/ios.js)
IOS_REGEN=1 npm run ios:device
# or
npm run ios:prebuild

# Release build on device (TestFlight-style)
npm run ios:release

# EAS App Store build (uses latest Xcode image)
eas build --platform ios --profile production
```

Compile with the **latest Xcode SDK** on your Mac (iOS 26 SDK when installed). `IOS_DEPLOYMENT_TARGET` is the **minimum OS on user devices**, not the SDK version.

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

**Cause:** Metro was started for the wrong client, or dependencies are not on SDK 54.

**Fix:**

```bash
cd mobile && rm -rf node_modules ios android && npm install && npx expo install --fix
npm run dev:mobile   # from repo root — opens SDK 54 Expo Go QR
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

- Auth (login, register, session restore via SecureStore)
- Dashboard with post list, filters, pull-to-refresh, delete
- Editor with markdown body, save/draft/autosave, AI tools, platform publish
- Settings (Medium, Dev.to, WordPress credentials)
- Profile and password change
- Analytics charts
- Admin users management

## EAS Build (TestFlight / Play Store)

1. From repo root: `npm run install:mobile` (or `cd mobile && npm install`)
2. Log in: `cd mobile && npx eas login` (or `npm run eas:whoami` from root after login)
3. Project is linked via `extra.eas.projectId` in `app.config.ts` (`config/app.js`). Re-link only from **`mobile/`**: `npm run eas:init` from repo root or `npx eas init` inside `mobile` — do not run `eas init` from the monorepo root.
4. Update placeholder Apple IDs in `eas.json` submit config
5. Build:
   - iOS simulator: `eas build --profile development --platform ios`
   - iOS physical device (internal): `eas build --profile development-device --platform ios`
   - iOS TestFlight: `eas build --profile production --platform ios`
   - Android APK: `eas build --profile preview --platform android`
6. Submit to TestFlight: `eas submit --platform ios`

## Project structure

```
mobile/
├── app/              # Expo Router screens
├── src/
│   ├── components/   # Button, Input, Card, PostCard, …
│   ├── constants/    # routes, messages, theme, design tokens (barrel: @constants)
│   ├── contexts/
│   ├── hooks/        # usePosts, useUsers, useEditorState, …
│   ├── screens/      # EditorScreen
│   ├── services/
│   └── types/
├── scripts/          # with-certs.sh (CocoaPods SSL)
├── app.config.ts
└── eas.json
```

Path aliases: `@/` → project root; `@constants`, `@components/*`, `@hooks/*` mirror the web client.
