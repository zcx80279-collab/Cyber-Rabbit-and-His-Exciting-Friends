import fs from 'node:fs';

const [platform, requested = 'auto'] = process.argv.slice(2);
if (!['android', 'windows'].includes(platform)) {
  throw new Error('platform must be android or windows');
}

const config = JSON.parse(fs.readFileSync(new URL('../config/diary-system.json', import.meta.url)));
const baseline = config.minimumVersions[platform];
const prefix = config.tagPrefixes[platform];
const semver = /^([0-9]+)\.([0-9]+)\.([0-9]+)$/;

function tuple(value) {
  const match = semver.exec(value);
  if (!match) throw new Error(`Invalid stable version: ${value}`);
  return match.slice(1).map(Number);
}

function compare(a, b) {
  const left = tuple(a);
  const right = tuple(b);
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  return 0;
}

async function publishedVersions() {
  const repository = process.env.GITHUB_REPOSITORY;
  if (!repository || !process.env.GITHUB_TOKEN) return [];
  const response = await fetch(`https://api.github.com/repos/${repository}/releases?per_page=100`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });
  if (!response.ok) throw new Error(`Unable to inspect releases (HTTP ${response.status})`);
  const releases = await response.json();
  return releases
    .filter((release) => !release.draft && String(release.tag_name).startsWith(prefix))
    .map((release) => String(release.tag_name).slice(prefix.length))
    .filter((version) => semver.test(version));
}

const published = await publishedVersions();
const floor = [baseline, ...published].sort(compare).at(-1);
let version = requested;
if (requested === 'auto') {
  const [major, minor, patch] = tuple(floor);
  version = `${major}.${minor}.${patch + 1}`;
}
if (!semver.test(version)) throw new Error('Requested version must be X.Y.Z or auto');
if (compare(version, floor) <= 0) {
  throw new Error(`Version ${version} must be greater than existing floor ${floor}`);
}

const [major, minor, patch] = tuple(version);
const versionCode = major * 1_000_000 + minor * 10_000 + patch;
if (platform === 'android' && versionCode <= config.minimumVersions.androidVersionCode) {
  throw new Error(`Android versionCode ${versionCode} must exceed ${config.minimumVersions.androidVersionCode}`);
}
if (versionCode > 2_100_000_000) throw new Error('Android versionCode exceeds safe range');

const result = {
  platform,
  version,
  versionCode,
  tag: `${prefix}${version}`
};
for (const [key, value] of Object.entries(result)) {
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
}
process.stdout.write(`${JSON.stringify(result)}\n`);
