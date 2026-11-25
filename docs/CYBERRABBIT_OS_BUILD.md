# CyberRabbit OS build operations

## Required environment

Create the `cyberrabbit-os-release` GitHub Environment. It must be restricted to
the protected default branch, but it must not require a human reviewer for each
deployment.

Required environment secret:

- `CYBERRABBIT_VAULT_PASSPHRASE`: existing encrypted vault master passphrase

Repository Source Reader credentials:

- Variable `CYBERRABBIT_SOURCE_READER_APP_ID`
- Secret `CYBERRABBIT_SOURCE_READER_APP_PRIVATE_KEY`

Environment variables:

- `ANDROID_GOOGLE_WEB_CLIENT_ID`
- `GOOGLE_DESKTOP_OAUTH_CLIENT_ID`

Run `Provision Public CyberRabbit OS Release` in the private source repository
to register the passphrase and OAuth identifiers with the existing
Keystore-Sync GitHub App. Its private key remains in the private repository.
The public workflows use a short-lived Source Reader installation token to
download the private source and encrypted Draft Release vault. Android and GPG
keys are decrypted only under `RUNNER_TEMP`, verified, used, and deleted.

Never create a replacement Android key. The workflow rejects a keystore whose
certificate fingerprints differ from the previously released application.

## Rollout order

1. Run the private provisioning workflow once.
2. Run both public workflows with `publish=false` against private `main`.
3. Produce one final legacy-repository migration release for already-installed Windows clients.
4. Publish newer Android and Windows releases here.
5. Confirm Android installation upgrade, Windows NSIS update, Google login, Drive access, and signature continuity.
6. Only then disable automatic triggers in the private repository. Do not delete its workflow files.

Scheduled detection remains disabled until the repository variable
`CYBERRABBIT_AUTOMATION_ENABLED` is explicitly set to `true` after both
validation builds and migration releases succeed.

The `update-feeds` branch contains only public update metadata. It must never
contain source, logs, signing material, OAuth secrets, or user data.

