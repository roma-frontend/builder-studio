import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCurrentUser, getUserByToken, isSuperadmin, ADMIN_RETURN_COOKIE } from '@/lib/auth';
import { listSitesForUser, statsForUser } from '@/lib/sites';
import { countPendingOrgRequests } from '@/lib/org-requests';
import { countPendingMembersForOwner } from '@/lib/site-membership';
import { disabledCapabilitiesFor } from '@/lib/access';
import { getLocale } from '@/lib/i18n';
import { dashDict } from '@/lib/dashboard-dict';
import { DashboardShell, type Role } from '@/components/dashboard/shell';
import { ImpersonationBanner } from '@/components/dashboard/impersonation-banner';
import { PageHeader } from '@/components/dashboard/ui';
import { OrgOnboarding } from '@/components/dashboard/org-onboarding';
import { StudioAssistant } from '@/components/assistant/studio-assistant';
import { PlatformThemeStyle } from '@/components/platform-theme-style';
import { llmConfigured } from '@/lib/llm';
import { getUserEntitlements } from '@/lib/billing/entitlements';
import { getActiveSubscription, getLatestSubscription } from '@/lib/billing/subscriptions';
import { getEffectivePlans } from '@/lib/billing/plan-config';
import { PlanRequired } from '@/components/billing/plan-required';
import type { PlanId } from '@/lib/billing/plans';

// Private area — keep it out of search indexes.
export async function generateMetadata() {
  const t = dashDict(await getLocale());
  return { title: t.dashboard, robots: { index: false, follow: false } as const };
}

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/dashboard');

  // If a superadmin return-token is stashed, we're impersonating this user.
  const jar = await cookies();
  const returnToken = jar.get(ADMIN_RETURN_COOKIE)?.value;
  const impersonating = Boolean(returnToken && getUserByToken(returnToken));

  // Forced password change after a superadmin issued a temporary password.
  // Skipped while impersonating so a superadmin never sets the real user's
  // password without their knowledge.
  if (user.mustChangePassword && !impersonating) redirect('/change-password');

  // Access gate: you can't just enter the dashboard — a superadmin must let you
  // in. Until you own an organization (a superadmin approved your create/join
  // request), every dashboard section shows the onboarding instead of content.
  const hasOrg = listSitesForUser(user.id).length > 0;
  const gated = !isSuperadmin(user) && !hasOrg;
  // Billing gate: an org owner (admin) whose subscription isn't active can't use
  // the dashboard until they (re)subscribe — the whole org turns on with the
  // plan. Superadmin is exempt; the onboarding (gated) takes precedence.
  const activeSub = isSuperadmin(user) ? true : getActiveSubscription(user.id) != null;
  const needsPlan = !isSuperadmin(user) && hasOrg && !activeSub;
  const orgRequests = isSuperadmin(user) ? countPendingOrgRequests() : 0;
  const siteMembers = gated ? 0 : countPendingMembersForOwner(user);
  // Aggregate baseline for the header NotificationBell: form submissions +
  // pending member requests + (superadmin) pending org requests. Live bumps for
  // each of these arrive via the unified SSE stream (/api/notifications/stream).
  const notifications = gated ? 0 : statsForUser(user.id).submissions + siteMembers + orgRequests;
  const disabled = disabledCapabilitiesFor(user.role);
  const dashT = dashDict(await getLocale());

  // Paywall copy depends on WHY billing is inactive: a trial that just ended vs
  // a lapsed paid plan vs never subscribed.
  const latestSub = needsPlan ? getLatestSubscription(user.id) : null;
  const paywallReason: 'none' | 'trial_ended' | 'lapsed' = !latestSub
    ? 'none'
    : latestSub.status === 'trialing'
      ? 'trial_ended'
      : 'lapsed';
  const paywallPlans = needsPlan ? getEffectivePlans() : [];

  // Telegram sign-ins have a synthetic tg_<id>@telegram.local email — show the
  // @username instead (or nothing) rather than that long placeholder.
  const isTgEmail = /@telegram\.local$/i.test(user.email);
  const handle = user.telegramUsername
    ? `@${user.telegramUsername}`
    : isTgEmail ? '' : user.email;

  return (
    <>
      <PlatformThemeStyle />
      <DashboardShell
        user={{ name: user.name, email: user.email, role: (user.role as Role) ?? 'customer', handle }}
        banner={impersonating ? <ImpersonationBanner name={user.name || user.email} /> : null}
        gated={gated}
        orgRequests={orgRequests}
        siteMembers={siteMembers}
        notifications={notifications}
        disabled={disabled}
        hideOrgNav={isSuperadmin(user) || hasOrg}
      >
        {gated ? (
          <>
            <PageHeader title={dashT.org.welcomeTitle} description={dashT.org.welcomeDesc} />
            <OrgOnboarding />
          </>
        ) : needsPlan ? (
          <PlanRequired
            reason={paywallReason}
            plans={paywallPlans}
            currentPlan={(latestSub?.planId as PlanId) ?? null}
          />
        ) : (
          children
        )}
      </DashboardShell>
      {/* Floating AI guide — only for users with dashboard access, an assistant
          entitlement (Pro/Studio) and when an LLM (e.g. Groq) is configured.
          Role- and plan-gated capabilities inside. */}
      {!gated && llmConfigured() && getUserEntitlements(user).has('assistant.use') && (
        <StudioAssistant role={(user.role as Role) ?? 'customer'} />
      )}
    </>
  );
}
