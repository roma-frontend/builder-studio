'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { setPref } from '@/hooks/use-user-prefs';
import { useMounted } from '@/hooks/use-mounted';
import { useLocale } from '@/hooks/use-locale';
import { ui } from '@/lib/ui-dict';

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const { locale } = useLocale();
  const label = ui(locale).a11y.toggleTheme;

  const isDark = resolvedTheme === 'dark';
  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={label}
      title={label}
      className={className}
      onClick={() => {
        const next = isDark ? 'light' : 'dark';
        setTheme(next);
        setPref('theme', next); // follows the account across browsers
      }}
    >
      {mounted && isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
