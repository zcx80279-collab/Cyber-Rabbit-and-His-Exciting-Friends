import fs from 'node:fs';

const [path, inputFile, message] = process.argv.slice(2);
const { GITHUB_REPOSITORY: repository, GITHUB_TOKEN: token } = process.env;
if (!path || !inputFile || !repository || !token) throw new Error('Feed arguments or GitHub context missing');
const branch = 'update-feeds';
const headers = {
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${token}`,
  'X-GitHub-Api-Version': '2022-11-28'
};
const refEndpoint = `https://api.github.com/repos/${repository}/git/ref/heads/${branch}`;
const branchResponse = await fetch(refEndpoint, { headers });
if (branchResponse.status === 404) {
  const repositoryResponse = await fetch(`https://api.github.com/repos/${repository}`, { headers });
  if (!repositoryResponse.ok) throw new Error(`Unable to inspect repository (HTTP ${repositoryResponse.status})`);
  const { default_branch: defaultBranch } = await repositoryResponse.json();
  const defaultRef = await fetch(`https://api.github.com/repos/${repository}/git/ref/heads/${defaultBranch}`, { headers });
  if (!defaultRef.ok) throw new Error(`Unable to inspect default branch (HTTP ${defaultRef.status})`);
  const { object } = await defaultRef.json();
  const created = await fetch(`https://api.github.com/repos/${repository}/git/refs`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: object.sha })
  });
  if (!created.ok && created.status !== 422) throw new Error(`Unable to create feed branch (HTTP ${created.status})`);
} else if (!branchResponse.ok) {
  throw new Error(`Unable to inspect feed branch (HTTP ${branchResponse.status})`);
}
const endpoint = `https://api.github.com/repos/${repository}/contents/${path}`;
const current = await fetch(`${endpoint}?ref=${branch}`, { headers });
let sha;
if (current.ok) sha = (await current.json()).sha;
else if (current.status !== 404) throw new Error(`Unable to inspect feed (HTTP ${current.status})`);

const payload = {
  message: message || `Update ${path}`,
  content: fs.readFileSync(inputFile).toString('base64'),
  branch,
  ...(sha ? { sha } : {})
};
const response = await fetch(endpoint, { method: 'PUT', headers, body: JSON.stringify(payload) });
if (!response.ok) throw new Error(`Unable to publish feed (HTTP ${response.status})`);

