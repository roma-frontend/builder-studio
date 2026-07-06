'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/hooks/use-locale';
import { dashDict } from '@/lib/dashboard-dict';

export function LogoutButton() {
  const router = useRouter();
  const t = dashDict(useLocale().locale);
  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };
  return (
    <Button variant="outline" className="gap-2" onClick={logout}>
      <LogOut className="h-4 w-4" /> {t.cmd.logout}
    </Button>
  );
}
