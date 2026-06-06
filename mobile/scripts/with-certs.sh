#!/usr/bin/env bash
# CocoaPods/Ruby on macOS often fail SSL without an explicit CA bundle.
set -euo pipefail

resolve_cert_bundle() {
  if [ -n "${SSL_CERT_FILE:-}" ] && [ -f "${SSL_CERT_FILE}" ]; then
    echo "${SSL_CERT_FILE}"
    return
  fi

  local candidates=(
    "${HOMEBREW_PREFIX:-}/etc/ca-certificates/cert.pem"
    "${HOME}/homebrew/etc/ca-certificates/cert.pem"
    "/opt/homebrew/etc/ca-certificates/cert.pem"
    "/usr/local/etc/ca-certificates/cert.pem"
  )

  if command -v brew >/dev/null 2>&1; then
    local prefix
    prefix="$(brew --prefix ca-certificates 2>/dev/null || true)"
    if [ -n "${prefix}" ] && [ -f "${prefix}/share/ca-certificates/cacert.pem" ]; then
      candidates=("${prefix}/share/ca-certificates/cacert.pem" "${candidates[@]}")
    fi
    if [ -n "${prefix}" ] && [ -f "${prefix}/../etc/ca-certificates/cert.pem" ]; then
      candidates=("${prefix}/../etc/ca-certificates/cert.pem" "${candidates[@]}")
    fi
  fi

  for cert in "${candidates[@]}"; do
    if [ -f "${cert}" ]; then
      echo "${cert}"
      return
    fi
  done

  echo ""
}

CERT_FILE="$(resolve_cert_bundle)"
if [ -n "${CERT_FILE}" ]; then
  export SSL_CERT_FILE="${CERT_FILE}"
  export CURL_CA_BUNDLE="${CERT_FILE}"
  export GIT_SSL_CAINFO="${CERT_FILE}"
fi

exec "$@"
