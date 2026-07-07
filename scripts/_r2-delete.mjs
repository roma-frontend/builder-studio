// Delete given media keys from R2 (e.g. orphaned PNGs after WebP switch).
//   node scripts/_r2-delete.mjs media/tutorial-shot-1.ru.png media/...
import fs from 'node:fs';
import { AwsClient } from 'aws4fetch';
for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;
const client = new AwsClient({ accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY, region: 'auto', service: 's3' });
const endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}`;
for (const key of process.argv.slice(2)) {
  const res = await client.fetch(`${endpoint}/${encodeURI(key)}`, { method: 'DELETE' });
  console.log(`  ${res.ok || res.status === 204 ? '✓' : '✗'} deleted ${key} (${res.status})`);
}
