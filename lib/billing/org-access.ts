// Organization-level billing access. The unit that "turns on" is the
// ORGANIZATION (a tenant site): its owner (a platform admin) buys a plan, and
// that single subscription activates the whole org — the owner's dashboard AND
// every member (site_user) who joined it. When the owner's subscription lapses
// (trial ended / period over / canceled) the org goes dark: the owner sees the
// paywall, members lose access to member content. The superadmin owns the
// platform itself — always active, no org, no members.
//
// Single source of truth so the dashboard paywall and the tenant member gate
// can never disagree about whether an org is currently paid-for.

import 'server-only';
import { eq } from 'drizzle-orm';
import { getDb, sites } from '@/lib/db';
import { isSuperadmin } from '@/lib/auth';
import { getUserById } from '@/lib/admin';
import { getActiveSubscription } from '@/lib/billing/subscriptions';

/** Does this platform user currently have billing that grants org access?
 *  The superadmin owns the platform — always active. An 'admin' is an org
 *  OWNER (paying customer): they need an active/trialing subscription. */
export function ownerBillingActive(owner: { id: string; role?: string } | null | undefined): boolean {
  if (!owner) return false;
  if (isSuperadmin(owner)) return true;
  return getActiveSubscription(owner.id) != null;
}

/** Is the ORGANIZATION behind `siteId` currently active? Resolves the site's
 *  owner and checks their billing. Unknown site → false (fail closed). */
export function siteBillingActive(siteId: string): boolean {
  if (!siteId) return false;
  const site = getDb().select({ userId: sites.userId }).from(sites).where(eq(sites.id, siteId)).get();
  if (!site) return false;
  return ownerBillingActive(getUserById(site.userId));
}
