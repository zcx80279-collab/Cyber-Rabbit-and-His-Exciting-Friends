import fs from 'node:fs';
import path from 'node:path';

const [sourceRoot, version] = process.argv.slice(2);
if (!sourceRoot || !/^\d+\.\d+\.\d+$/.test(version || '')) {
  throw new Error('Usage: set-source-version.mjs SOURCE_ROOT X.Y.Z');
}
for (const relative of ['package.json', 'package-lock.json']) {
  const filename = path.join(sourceRoot, relative);
  const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
  data.version = version;
  if (relative === 'package-lock.json' && data.packages?.['']) data.packages[''].version = version;
  fs.writeFileSync(filename, `${JSON.stringify(data, null, 2)}\n`);
}

