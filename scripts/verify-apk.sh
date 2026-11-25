#!/usr/bin/env bash
set -euo pipefail

apk=${1:?APK required}
expected_sha1=${2:?expected SHA-1 required}
expected_sha256=${3:?expected SHA-256 required}
test -s "$apk"

sdk_root=${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}
apksigner=$(find "$sdk_root/build-tools" -name apksigner -type f | sort -V | tail -n 1)
test -n "$apksigner"
output=$($apksigner verify --verbose --print-certs "$apk")
actual_sha1=$(printf '%s\n' "$output" | sed -n 's/^Signer #1 certificate SHA-1 digest: //p' | head -n 1)
actual_sha256=$(printf '%s\n' "$output" | sed -n 's/^Signer #1 certificate SHA-256 digest: //p' | head -n 1)
normalize() { printf '%s' "$1" | tr '[:lower:]' '[:upper:]' | tr -d '[:space:]:'; }
test "$(normalize "$actual_sha1")" = "$(normalize "$expected_sha1")"
test "$(normalize "$actual_sha256")" = "$(normalize "$expected_sha256")"

if unzip -Z1 "$apk" | grep -Eiq '(^|/)(.*\.(jks|keystore|p12|pfx|pem|key|env|map)|google-services\.json|service-account.*)$'; then
  echo '::error::Forbidden file embedded in APK.'
  exit 1
fi
if strings "$apk" | grep -Eq '(gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----)'; then
  echo '::error::High-confidence secret pattern embedded in APK.'
  exit 1
fi
echo 'APK signature and content checks passed.'

