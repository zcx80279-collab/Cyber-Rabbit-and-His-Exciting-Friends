# CyberRabbit OS build operations

## Required environment

Create the `cyberrabbit-os-release` GitHub Environment. It must be restricted to
the protected default branch, but it must not require a human reviewer for each
deployment.

Required environment secrets:

- `CYBERRABBIT_SOURCE_SSH_KEY`: read-only deploy key for the private source repository
- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`
- `ANDROID_GOOGLE_WEB_CLIENT_ID`
- `GOOGLE_DESKTOP_OAUTH_CLIENT_ID`
- `GPG_PRIVATE_KEY`, `GPG_PASSPHRASE`, `GPG_KEY_ID` (required to preserve GPG release signing)

Never create a replacement Android key. The workflow rejects a keystore whose
certificate fingerprints differ from the previously released application.

## Rollout order

1. Run both workflows with `publish=false` against the private integration branch.
2. Copy the existing signing and OAuth values into the environment.
3. Produce one final legacy-repository migration release for installed clients.
4. Publish newer Android and Windows releases here.
5. Confirm Android installation upgrade, Windows NSIS update, Google login, Drive access, and signature continuity.
6. Only then disable automatic triggers in the private repository. Do not delete its workflow files.

Scheduled detection remains disabled until the repository variable
`CYBERRABBIT_AUTOMATION_ENABLED` is explicitly set to `true` after both
validation builds and migration releases succeed.

The `update-feeds` branch contains only public update metadata. It must never
contain source, logs, signing material, OAuth secrets, or user data.

