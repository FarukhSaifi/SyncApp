# Expo SDK 57

Read the exact versioned docs at <https://docs.expo.dev/versions/v57.0.0/> before writing Expo or React Native code.

- Keep Expo packages aligned with the installed SDK; use `npx expo install --fix` for SDK-compatible updates.
- Target platforms: **iOS 26** (`IOS_DEPLOYMENT_TARGET=26.0`) and **Android 16** (`compileSdkVersion: 36, targetSdkVersion: 36`).
- Authenticated Publishing: Only platforms with active credentials (`/api/credentials`) must be shown as selectable target channels in the editor.
- EAS Build: Monorepo uses npm; `mobile/package.json` specifies `"packageManager": "npm@11.13.0"` and `eas.json` sets `EAS_NO_FROZEN_LOCKFILE: "1"`.
- Run `npm run typecheck` and `npx expo-doctor` from `mobile/` after dependency or native-config changes.
- Use `npm run start:go` for Expo Go and `npm run start:dev-client` for the custom development build.
- Native folders are generated and ignored. Change native behavior through `app.config.ts`, `config/`, and Expo config plugins.
- Read [mobile/README.md](README.md) for device setup and [../docs/ux/mobile-editor-flow.md](../docs/ux/mobile-editor-flow.md) for editor UX requirements.
