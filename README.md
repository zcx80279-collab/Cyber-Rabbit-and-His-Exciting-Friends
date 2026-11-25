# Cyber Rabbit and His Exciting Friends

Public build and release orchestration repository. Only **CyberRabbit OS** is
connected at this time. Private application source is checked out temporarily
on a GitHub-hosted runner and is never committed or uploaded as an artifact.

## CyberRabbit OS

- Source and encrypted vault: private repository, read through a short-lived repository-scoped Source Reader App token
- Android application ID: `com.cyberrabbit.os`
- Windows application ID: `com.chacha.magicrabbit`
- Release tags: `cyberrabbit-os/android/vX.Y.Z` and `cyberrabbit-os/windows/vX.Y.Z`
- Update feeds: isolated under the `update-feeds` branch
- Release environment: `cyberrabbit-os-release`

Builds default to validation-only. Publishing requires an explicit workflow
input or a trusted scheduled dispatch from the protected default branch.

See [CyberRabbit OS build operations](docs/CYBERRABBIT_OS_BUILD.md).

