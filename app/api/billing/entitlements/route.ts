import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUserEntitlements, toDTO } from '@/lib/billing/entitlements';

export const runtime = 'nodejs';

// Current user's entitlement snapshot — consumed by client surfaces (e.g. the
// builder) to gate advanced, plan-only capabilities.
export async function GET() {
  const me = await getCurrentUser();
  return NextResponse.json(toDTO(getUserEntitlements(me)));
}
