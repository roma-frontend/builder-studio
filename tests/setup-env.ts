// Test env hygiene: unit tests must be hermetic and never pick up ambient
// Cloudflare R2 credentials from the developer's shell or .env.local. Without
// this, lib/storage.ts (which reads R2_* at import time) would report "r2" mode
// on a machine that has real R2 creds configured, breaking the storage /
// media-optimize / uploads-gc tests that assert the local-storage fallback.
//
// Tests that specifically exercise the R2 path set these vars themselves and
// re-import the module (see tests/storage-extra.test.ts, tests/uploads-gc-r2.test.ts),
// so clearing them here is safe.
for (const k of ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET', 'R2_PUBLIC_BASE_URL']) {
  delete process.env[k];
}
