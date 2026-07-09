import { NextResponse } from 'next/server';
import { requireUser, unauthorized } from '@/lib/api-guard';
import { isSuperadmin } from '@/lib/auth';
import { listSitesForUser } from '@/lib/sites';
import { videoQuota } from '@/lib/media-usage';
import { getUserEntitlements } from '@/lib/billing/entitlements';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Studio bootstrap context for the client: who the user is, whether they run the
// PLATFORM studio (superadmin) or the TENANT studio (org admin), their primary
// tenant site (for the read-only preview), and their AI-video quota. The studio
// page uses this to gate tabs and pick the preview target.
export async function GET() {
  const user = await requireUser();
  if (!user) return unauthorized();

  const superadmin = isSuperadmin(user);
  const ent = getUserEntitlements(user);
  const q = videoQuota(user);

  // Tenant admin: preview their own site (first owned site).
  const sites = superadmin ? [] : listSitesForUser(user.id);
  const primary = sites[0] ?? null;

  return NextResponse.json({
    role: user.role ?? 'customer',
    superadmin,
    // 'platform' = edit the Builder Studio marketing site; 'tenant' = generate
    // assets + preview own site (no platform editing).
    mode: superadmin ? 'platform' : 'tenant',
    tenant: primary ? { id: primary.id, slug: primary.slug, name: primary.name } : null,
    canGenerate: ent.has('ai.generate'),
    video: { limit: q.limit, used: q.used, remaining: q.remaining },
  });
}
