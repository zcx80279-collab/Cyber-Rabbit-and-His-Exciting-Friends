#!/usr/bin/env bash
set -euo pipefail

target=${1:?target directory required}
test -d "$target"

forbidden_names='(^|/)(\.env($|\.)|.*\.(jks|keystore|p12|pfx|pem|key|mobileprovision|sqlite|db|bak|backup|log)$|google-services\.json$|service-account.*|credentials.*|.*vault\.enc$)'
file_list=$(mktemp)
find "$target" \( -path '*/.git' -o -path '*/node_modules' \) -prune -o -type f -printf '%P\n' | grep -Ev '(^|/)\.env\.example$' >"$file_list"
if grep -Eiq "$forbidden_names" "$file_list"; then
  echo '::error::A forbidden credential, database, log, or signing filename is present.'
  grep -Ei "$forbidden_names" "$file_list" | sed -n '1,30p'
  exit 1
fi

matches="${RUNNER_TEMP:-/tmp}/cyberrabbit-secret-matches.txt"
if grep -RInE --exclude-dir=.git --exclude-dir=node_modules --exclude='package-lock.json' \
  '(gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----)' \
  "$target" | grep -v 'TEST_ONLY_NOT_A_REAL_TOKEN' >"$matches"; then
  echo '::error::A high-confidence secret pattern was found.'
  cut -d: -f1 "$matches" | sort -u | sed "s#^$target/##" | sed -n '1,30p'
  exit 1
fi

echo 'Source security scan passed.'

