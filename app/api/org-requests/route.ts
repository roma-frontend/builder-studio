import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createOrgRequest, getMyOrgRequests, listJoinableOrgs, orgEligibility, manualOrgApprovalEnabled, selfServeCreateOrg } from '@/lib/org-requests';
import { notifyOrgRequest } from '@/lib/notify';
import { getLocale } from '@/lib/i18n';
import { apiErrors, type ApiErrorsDict } from '@/lib/api-errors-dict';

export const runtime = 'nodejs';

// A logged-in platform user requests to create/join an organization. The request
// is reviewed by a superadmin (see /api/admin/org-requests).

const ERR: Record<string, [number, keyof ApiErrorsDict]> = {
  PENDING_EXISTS: [409, 'pendingExists'],
  NAME_REQUIRED: [400, 'orgNameRequired'],
  SLUG_INVALID: [400, 'invalidSlug'],
  SLUG_TAKEN: [409, 'orgSlugTaken2'],
  ORG_NOT_FOUND: [404, 'orgNotFound'],
  INVALID_TARGET: [400, 'orgNotFound'],
  ALREADY_HAS_ORG: [403, 'forbidden'],
  SUPERADMIN_NO_ORG: [403, 'forbidden'],
};

export async function GET() {
  const t = apiErrors(await getLocale());
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: t.unauthorizedDot }, { status: 401 });
  return NextResponse.json({
    requests: getMyOrgRequests(me.id),
    organizations: listJoinableOrgs(me),
    eligibility: orgEligibility(me),
  });
}

export async function POST(request: Request) {
  const t = apiErrors(await getLocale());
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: t.unauthorizedDot }, { status: 401 });

  let body: { type?: string; requestedName?: string; requestedSlug?: string; targetSiteId?: string; message?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const type = body.type === 'join' ? 'join' : 'create';
  try {
    // Self-serve: creating an org needs no human review by default — provision
    // it instantly and hand back the new site id so the UI can drop the user
    // straight into the builder. Joining someone else's org still goes through
    // review (it's the org owner's decision). Manual approval can be re-enabled
    // platform-wide via the `manual-org-approval` setting.
    if (type === 'create' && !manualOrgApprovalEnabled()) {
      const { siteId } = selfServeCreateOrg(me, { requestedName: body.requestedName, requestedSlug: body.requestedSlug, message: body.message });
      return NextResponse.json({ ok: true, autoApproved: true, siteId });
    }
    const req = createOrgRequest(me, { type, requestedName: body.requestedName, requestedSlug: body.requestedSlug, targetSiteId: body.targetSiteId, message: body.message });
    notifyOrgRequest({ type, requesterEmail: me.email, requesterName: me.name, requestedName: body.requestedName, message: body.message });
    return NextResponse.json({ ok: true, request: req });
  } catch (e) {
    const code = e instanceof Error ? e.message : '';
    const fallback: [number, keyof ApiErrorsDict] = [500, 'submitRequestFailed'];
    const [status, key] = ERR[code] ?? fallback;
    return NextResponse.json({ error: t[key] }, { status });
  }
}
