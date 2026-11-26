#!/usr/bin/env bash
set -euo pipefail

apk=${1:?APK required}
expected_sha1=${2:?expected SHA-1 required}
expected_sha256=${3:?expected SHA-256 required}
test -s "$apk"

sdk_root=${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}
apksigner=$(find "$sdk_root/build-tools" -name apksigner -type f | sort -V | tail -n 1)
test -n "$apksigner"
if ! output=$("$apksigner" verify --verbose --print-certs "$apk" 2>&1); then
  printf '%s\n' "$output"
  echo '::error::APK signature verification failed.'
  exit 1
fi
actual_sha1=$(printf '%s\n' "$output" | awk -F': ' '/certificate SHA-1 digest:/{print $NF; exit}')
actual_sha256=$(printf '%s\n' "$output" | awk -F': ' '/certificate SHA-256 digest:/{print $NF; exit}')
normalize() { printf '%s' "$1" | tr '[:lower:]' '[:upper:]' | tr -d '[:space:]:'; }
if [ -z "$actual_sha1" ] || [ "$(normalize "$actual_sha1")" != "$(normalize "$expected_sha1")" ]; then
  echo "::error::APK SHA-1 certificate fingerprint mismatch."
  exit 1
fi
if [ -z "$actual_sha256" ] || [ "$(normalize "$actual_sha256")" != "$(normalize "$expected_sha256")" ]; then
  echo "::error::APK SHA-256 certificate fingerprint mismatch."
  exit 1
fi

if unzip -Z1 "$apk" | grep -Eiq '(^|/)(.*\.(jks|keystore|p12|pfx|pem|key|env|map)|google-services\.json|service-account.*)$'; then
  echo '::error::Forbidden file embedded in APK.'
  exit 1
fi
if strings "$apk" | grep -Eq '(gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----)'; then
  echo '::error::High-confidence secret pattern embedded in APK.'
  exit 1
fi
echo 'APK signature and content checks passed.'

