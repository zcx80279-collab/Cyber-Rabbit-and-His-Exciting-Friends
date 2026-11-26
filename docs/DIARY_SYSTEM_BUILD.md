# Diary System build operations

## Required environment

The `diary-system-release` GitHub Environment is restricted to the `main` branch without human reviewer gates.

Required Environment secret:

- `DIARY_SIGNING_KEY_ENCRYPTION_PASSWORD`: existing encryption password for `signing-secrets.enc` in `Magic-Rabbit--K2`

Dedicated Diary Source Reader credentials (stored in `diary-system-release` Environment):

- Variable `DIARY_SOURCE_READER_APP_ID`: App ID of the dedicated Diary Source Reader GitHub App
- Secret `DIARY_SOURCE_READER_APP_PRIVATE_KEY`: Private key of the dedicated Diary Source Reader GitHub App

Note: The existing `signing-secrets.enc` bundle in `Magic-Rabbit--K2` is reused directly at build time and decrypted only inside `$RUNNER_TEMP`. No replacement Android signing key is created.

## Rollout order

1. Create the dedicated Diary Source Reader GitHub App (read-only Contents & Metadata on `zcx80279-collab/Magic-Rabbit--K2`) and register `DIARY_SOURCE_READER_APP_ID`, `DIARY_SOURCE_READER_APP_PRIVATE_KEY`, and `DIARY_SIGNING_KEY_ENCRYPTION_PASSWORD` in `diary-system-release`.
2. Run both `Diary System Android` and `Diary System Windows` workflows with `publish=false` to verify checkout, keystore restoration, SHA-1 match, and builds.
3. Run both workflows with `publish=true` to publish the first public releases under `diary-system/android/v*` and `diary-system/windows/v*`.
4. Confirm Android upgrade installation preserves user data and signature continuity, and verify Windows installer output.
5. Only after verification succeeds, disable automatic `push` triggers in `Magic-Rabbit--K2` and set repository variable `DIARY_AUTOMATION_ENABLED` to `true`.
