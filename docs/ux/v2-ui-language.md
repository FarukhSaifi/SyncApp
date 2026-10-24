# SyncApp v2 UI language (slothUI pilot)

Settings-first visual refresh inspired by [slothUI Billing Settings](https://dribbble.com/shots/24301800-slothUI-World-s-Laziest-Design-System-Billing-Settings-UIUX). No billing product was added — only the soft SaaS look and shell.

## Tokens

| Surface | Source |
| --- | --- |
| Web colors / radius | [`client/app/globals.css`](../../client/app/globals.css) — soft gray `--background`, elevated `--card`, `--radius: 0.75rem`, purple primary |
| Web shell / settings layout | [`client/src/constants/designTokens.ts`](../../client/src/constants/designTokens.ts) — `APP_SHELL`, `SETTINGS_LAYOUT` |
| Mobile palette | [`mobile/src/constants/palette.ts`](../../mobile/src/constants/palette.ts) |
| Mobile settings rhythm | [`mobile/src/constants/designTokens.ts`](../../mobile/src/constants/designTokens.ts) — `SETTINGS_LAYOUT`, tab bar chrome |

Use semantic classes / theme colors only — no hardcoded hex in UI.

## Shell

- **Web desktop (`md+`):** left sidebar (`APP_SHELL`) with nav, theme toggle, profile, sign out.
- **Web mobile:** compact top bar + slide-over drawer.
- **Editor / auth:** no sidebar chrome (editor stays full-bleed).
- **Native mobile:** floating tab bar retained; restyled via `IOS26` / palette.

## Pilot screens

- Web: Settings + Profile (`SettingsPageHeader`, `SettingsSectionNav`, calmer cards).
- Mobile: Settings + Profile + shared `Card` / `ScreenIntro` / `SETTINGS_LAYOUT` / `EDITOR_SHEET`.

## Mobile parity notes

- Native keeps the floating tab bar (no web sidebar); shadows stay soft to match flat cards.
- Compact headers + in-content `ScreenIntro` titles (same rhythm as web mobile).
- Shared section chips (`SettingsSectionNav`), `Card` / `ConnectionStatusPill`, and `SETTINGS_LAYOUT` spacing match web mobile Settings/Profile.
- Editor sheets use full-height chrome (`EDITOR_SHEET` + `OVERLAY`) instead of short bottom sheets.
- Auth, Dashboard, Analytics, Users consume the same soft canvas + card radius (`RADIUS.CARD`) and soft primary chip active state.

## Phase 2 rollout

1. Further Dashboard / Analytics / Users density polish
2. Editor workspace flex-fill write canvas
3. Remaining hardcoded overlay/shadow literals → tokens

New screens should consume `APP_SHELL` / `SETTINGS_LAYOUT` (or mobile `SETTINGS_LAYOUT` / `EDITOR_SHEET`) before inventing local layout constants.
