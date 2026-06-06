#!/usr/bin/env bash
# Build and install SyncApp (expo-dev-client) on a USB-connected iPhone.
# Native settings (deployment target, device family) come from app.config.ts + config/ios.js.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

echo "→ SyncApp iOS dev client — physical device install"
echo ""

if ! command -v xcodebuild >/dev/null 2>&1; then
  echo "Error: Xcode is required. Install from the Mac App Store, then run: xcode-select --install"
  exit 1
fi

resolve_device_udid() {
  if [ -n "${EXPO_IOS_DEVICE:-}" ]; then
    echo "${EXPO_IOS_DEVICE}"
    return
  fi

  local line udid
  line="$(xcrun xctrace list devices 2>/dev/null | grep -i 'iPhone' | grep -vi Simulator | head -1 || true)"
  if [ -z "${line}" ]; then
    return 1
  fi
  udid="$(echo "${line}" | grep -oE '\([0-9A-Fa-f-]{24,}\)' | tail -1 | tr -d '()')"
  if [ -z "${udid}" ]; then
    return 1
  fi
  echo "${udid}"
}

DEVICE_UDID="$(resolve_device_udid || true)"
if [ -z "${DEVICE_UDID}" ]; then
  echo "Error: No physical iPhone detected over USB."
  echo "  • Connect the iPhone and tap Trust on the device"
  echo "  • Enable Developer Mode: Settings → Privacy & Security → Developer Mode"
  echo "  • Or set EXPO_IOS_DEVICE to the device UDID from Xcode → Window → Devices"
  exit 1
fi

DEVICE_LABEL="$(xcrun xctrace list devices 2>/dev/null | grep "${DEVICE_UDID}" | head -1 || echo "iPhone")"
echo "Target device: ${DEVICE_LABEL}"
echo "UDID: ${DEVICE_UDID}"
echo ""

BUNDLE_ID="${IOS_BUNDLE_IDENTIFIER:-}"
if [ -z "${BUNDLE_ID}" ]; then
  echo "Error: IOS_BUNDLE_IDENTIFIER is not set."
  echo "  Copy .env.example → .env and set a unique bundle ID for your Apple team."
  exit 1
fi
echo "Bundle ID: ${BUNDLE_ID}"
echo "iOS deployment target: ${IOS_DEPLOYMENT_TARGET:-26.0} (latest default — config/iosDefaults.js)"
echo ""

if [ ! -f .env ]; then
  echo "Tip: copy .env.example → .env and set IOS_BUNDLE_IDENTIFIER + EXPO_PUBLIC_API_BASE_URL."
  echo ""
fi

# Regenerate ios/ only when missing or explicitly requested — keeps Xcode schemes stable.
if [ "${IOS_REGEN:-}" = "1" ]; then
  echo "IOS_REGEN=1 — removing ios/ and regenerating from app.config.ts..."
  rm -rf ios
elif [ -d ios ]; then
  echo "Reusing ios/ (set IOS_REGEN=1 to force full prebuild from app.config)."
else
  echo "No ios/ folder — expo will prebuild with production settings from app.config.ts."
fi

RUN_ARGS=(--device "${DEVICE_UDID}")
if [ "${IOS_BUILD_CONFIGURATION:-Debug}" = "Release" ]; then
  RUN_ARGS+=(--configuration Release)
  echo "Building Release configuration (TestFlight-style)."
fi

# First build may prompt for Apple ID / team in Xcode for code signing.
exec bash scripts/with-certs.sh npx expo run:ios "${RUN_ARGS[@]}"
