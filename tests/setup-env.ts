// Test env hygiene: unit tests must be hermetic and never pick up ambient
// integration credentials from the developer's shell or .env.local. Without
// this, modules that read these at import/call time (lib/storage.ts,
// lib/turnstile.ts, lib/workers-ai.ts, lib/billing/provider.ts) would report
// "configured" on a machine that has real creds, breaking the tests that assert
// the unconfigured/local-fallback path first.
//
// Tests that specifically exercise the configured path set these vars
// themselves (and re-import the module), so clearing them here is safe.
for (const k of [
  // Cloudflare R2 (storage / media-optimize / uploads-gc)
  'R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET', 'R2_PUBLIC_BASE_URL',
  // Cloudflare Turnstile (bot protection)
  'TURNSTILE_SECRET_KEY', 'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
  // Cloudflare Workers AI
  'CF_ACCOUNT_ID', 'CF_AI_TOKEN',
  // Stripe billing provider
  'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET',
  // LLM (theme picker / assistant / page generator)
  'LLM_URL', 'LLM_KEY', 'THEME_LLM_URL', 'THEME_LLM_KEY',
  // Custom-domain provisioning (Cloudflare DNS + Fly certs)
  'CLOUDFLARE_API_TOKEN', 'FLY_API_TOKEN', 'FLY_APP_NAME', 'FLY_APP',
]) {
  delete process.env[k];
}
