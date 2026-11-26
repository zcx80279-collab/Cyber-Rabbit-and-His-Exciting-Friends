# CyberRabbit OS build operations

## Required environment

Create the `cyberrabbit-os-release` GitHub Environment. It must be restricted to
the protected default branch, but it must not require a human reviewer for each
deployment.

Required environment secret:

- `CYBERRABBIT_VAULT_PASSPHRASE`: existing encrypted vault master passphrase
- `CYBERRABBIT_VAULT_BASE64`: unchanged encrypted vault envelope, registered by provisioning

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
download the private source. Read-only GitHub Apps cannot read private Draft
Release assets, so the private provisioning workflow copies the unchanged
encrypted vault envelope into the release Environment with Keystore-Sync.
Android and GPG keys are decrypted only under `RUNNER_TEMP`, verified, used,
and deleted.

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

## Verification status — 2026-11-26 KST

- Public security validation passed for orchestration commit `1db1536`.
- The private Draft Release contains the original
  `cyberrabbit-keystore.vault.enc`. Its unencrypted envelope metadata and the
  separately GPG-signed fingerprint record agree on Android SHA-1
  `8C:CC:2D:5B:DC:ED:18:D7:C2:30:00:07:35:E4:92:BC:E2:1B:2A:96` and SHA-256
  `13:C7:49:8F:F9:1F:8D:18:33:9B:B9:9F:14:DF:C3:BE:15:56:1B:A8:B1:35:CC:5D:93:77:C0:50:2B:79:FE:F7`.
- The signed record was verified with existing GPG primary fingerprint
  `B92A0E78A8B020F3DFF6F5D7A9400256FF5B9C7B`. No key or vault was changed.
- Private provisioning run `45724567209` did not start because the private
  repository Actions budget prevented job execution.
- Updated provisioning run `45727619828` on private commit `fea1d27` was also
  prevented from starting by the same Actions budget limit. Keystore-Sync
  authentication and Environment writes therefore remain unverified.
- Source Reader App ID `5928892` authentication, private `main` resolution, and
  source checkout succeeded in runs `45727285756` and `45727395688` after its
  existing installation was corrected.
- Run `45727395688` confirmed that a Contents-read installation token cannot
  see private Draft Release assets. The workflow now keeps that least-privilege
  scope and receives the unchanged encrypted vault through Keystore-Sync
  provisioning instead of expanding Source Reader permissions.
- Public commit `3ea073e` consumes the provisioned encrypted vault only from
  the protected release Environment and no longer asks Source Reader to read a
  Draft Release asset.
- The managed local runner has repository administration through its existing
  connector token and can download the encrypted vault, but it does not hold
  the Source Reader private key, Keystore-Sync private key, or vault
  passphrase. GitHub does not allow Actions Secret values to be read back, so
  local provisioning cannot safely replace the blocked private job.
- No public Android or Windows release and no `update-feeds` branch exist yet.
  Do not publish a transition release until provisioning, vault decryption,
  certificate verification, and both validation builds succeed.

Resume in this order:

1. Run the private `Provision Public CyberRabbit OS Release` workflow after
   private Actions usage is available.
2. Run Android and Windows with `publish=false` and verify the recorded
   fingerprints.
3. Publish both public releases and verify the Windows feed.
4. Run the existing private `Windows Desktop Build` once to produce the final
   bridge release for clients still checking the private repository.

## Build migration log — 2026-11-26

- Android run `45751480661` restored the existing vault and completed source
  tests, then failed because the private source does not install
  `@capacitor/cli` or `@capacitor/android`. The public workflow now installs
  pinned Capacitor `8.6.2` tooling without changing the private package files
  and invokes the local executable directly.
- Windows run `45751498403` reached vault restoration, then Git Bash failed to
  apply POSIX mode `0700` on the Windows runner. The workflow now creates the
  runner-temporary directories with `mkdir -p`; encrypted and decrypted files
  remain under `RUNNER_TEMP` and the existing cleanup step is unchanged.
- No signing key, vault, application source, release, or update feed was
  changed by these fixes.
- Parallel validation runs `45754842974` and `45754843823` confirmed that the
  original two failures are fixed. Android completed APK assembly and existing
  certificate verification before its APK inspection script exited without a
  diagnostic. The inspection now reports signer failures and compares the
  digests using the same output format as the established private workflow.
- Windows completed installer packaging and artifact validation. Its GPG step
  then exposed a second MSYS path conversion issue in the Node wrapper. The
  Windows workflow now imports, signs, and self-verifies with Git Bash `gpg`
  using POSIX paths, while preserving the same restored private key and
  passphrase.

