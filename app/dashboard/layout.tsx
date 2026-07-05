import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { DashboardShell, type Role } from '@/components/dashboard/shell';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/dashboard');
  return (
    <DashboardShell user={{ name: user.name, email: user.email, role: (user.role as Role) ?? 'customer' }}>
      {children}
    </DashboardShell>
  );
}
