// Client-safe resolver for STATIC app media (tutorial videos/images, etc.).
//
// When NEXT_PUBLIC_MEDIA_BASE_URL is set — e.g. a Cloudflare R2 public bucket
// URL or a CDN/custom domain in front of it — assets are served from there.
// Otherwise they fall back to the local /public folder, so development and
// R2-less deployments keep working unchanged.
//
// Unlike lib/storage.ts (server-only, used for uploads/signing), this helper is
// safe to import from client components: it only reads a NEXT_PUBLIC_* value,
// which Next.js inlines at build time.
//
// It is idempotent for already-absolute URLs (http(s)/data/blob), so passing a
// full R2 URL through it is a no-op.

const BASE = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL || '').replace(/\/$/, '');

export function mediaUrl(path: string): string {
  if (!path) return path;
  if (/^(https?:)?\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) return path;
  const p = path.startsWith('/') ? path : `/${path}`;
  return BASE ? BASE + p : p;
}

/** Whether static media is being served from a remote base (R2/CDN). */
export function mediaFromRemote(): boolean {
  return BASE.length > 0;
}
