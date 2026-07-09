import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { requireUser, unauthorized } from '@/lib/api-guard';
import { getDb, sites } from '@/lib/db';
import { listSitesForUser } from '@/lib/sites';
import { THEMES } from '@/lib/themes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Org-wide admin-panel theme, set by the org admin and applied to their own
// dashboard and their members' account area. Stored on the owner's primary
// site (sites.dashboard_theme). '' / 'auto' = inherit the platform theme.
const VALID = new Set(['', 'auto', ...THEMES.map((t) => t.id)]);

function primarySite(userId: string) {
  return listSitesForUser(userId)[0] ?? null;
}

export async function GET() {
  const user = await requireUser();
  if (!user) return unauthorized();
  const site = primarySite(user.id);
  return NextResponse.json({ theme: site?.dashboardTheme || 'auto', siteId: site?.id ?? null });
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const site = primarySite(user.id);
  if (!site) return NextResponse.json({ error: 'No organization to theme.' }, { status: 400 });

  let theme = 'auto';
  try {
    theme = String(((await request.json()) as { theme?: string }).theme ?? 'auto');
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!VALID.has(theme)) {
    return NextResponse.json({ error: `Unknown theme "${theme}"` }, { status: 400 });
  }
  // 'auto' clears the override → inherit the platform theme.
  const stored = theme === 'auto' ? '' : theme;
  getDb().update(sites).set({ dashboardTheme: stored, updatedAt: new Date() }).where(eq(sites.id, site.id)).run();
  return NextResponse.json({ ok: true, theme: theme });
}
