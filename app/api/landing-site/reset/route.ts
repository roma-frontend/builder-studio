import { NextResponse } from 'next/server';
import { getCurrentUser, isStaff } from '@/lib/auth';
import { resetLandingSite } from '@/lib/landing-site';
import { parseDoc } from '@/lib/sites';
import { getLocale } from '@/lib/i18n';
import { apiErrors } from '@/lib/api-errors-dict';

export const runtime = 'nodejs';

// Reset the landing to its initial seeded state AND unpublish it, so / returns
// to the coded showcase (with all effects). Staff-only. Returns the fresh draft
// doc so the open builder can swap to it without a reload.
export async function POST() {
  const t = apiErrors(await getLocale());
  const user = await getCurrentUser();
  if (!isStaff(user)) {
    return NextResponse.json({ error: t.adminRightsRequired }, { status: 403 });
  }
  const site = resetLandingSite();
  if (!site) return NextResponse.json({ error: t.noOwnerUser }, { status: 500 });
  const doc = parseDoc(site.draftDoc);
  return NextResponse.json({ id: site.id, slug: site.slug, published: false, doc });
}
