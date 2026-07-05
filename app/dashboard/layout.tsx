import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCurrentUser, getUserByToken, ADMIN_RETURN_COOKIE } from '@/lib/auth';
import { DashboardShell, type Role } from '@/components/dashboard/shell';
import { ImpersonationBanner } from '@/components/dashboard/impersonation-banner';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/dashboard');

  // If a superadmin return-token is stashed, we're impersonating this user.
  const jar = await cookies();
  const returnToken = jar.get(ADMIN_RETURN_COOKIE)?.value;
  const impersonating = Boolean(returnToken && getUserByToken(returnToken));

  return (
    <DashboardShell
      user={{ name: user.name, email: user.email, role: (user.role as Role) ?? 'customer' }}
      banner={impersonating ? <ImpersonationBanner name={user.name || user.email} /> : null}
    >
      {children}
    </DashboardShell>
  );
}
