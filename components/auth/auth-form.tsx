'use client';

// Shared login/register UI. Design ported from the Caron project (mesh-orb
// backdrop, glass card, icon inputs, multi-step register wizard with a stepper
// and password-strength meter) and wired to our own SQLite/scrypt auth API
// (/api/auth/login | /api/auth/register). On success → ?next= or /dashboard.

import { useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Mail, Lock, User, Loader2, Eye, EyeOff, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EMAIL_RE, iconCls, passwordScore, StrengthMeter, Stepper, Shell, Brand } from '@/components/auth/auth-ui';

function useAuthSubmit(mode: 'login' | 'register') {
  const router = useRouter();
  const search = useSearchParams();
  return async (payload: Record<string, string>): Promise<string | null> => {
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return data.error || 'Что-то пошло не так.';
      const next = search.get('next');
      router.push(next && next.startsWith('/') ? next : '/dashboard');
      router.refresh();
      return null;
    } catch {
      return 'Сеть недоступна, попробуйте ещё раз.';
    }
  };
}

function LoginForm() {
  const submitAuth = useAuthSubmit('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const err = await submitAuth({ email, password });
    if (err) { setError(err); setBusy(false); }
  };

  return (
    <Shell>
      <Brand title="Вход в аккаунт" subtitle="Продолжите работу над своими сайтами" />
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <div className="relative">
            <Mail className={iconCls} />
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" className="h-11 pl-10" data-testid="login-email" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Пароль</label>
          <div className="relative">
            <Lock className={iconCls} />
            <Input type={showPw ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" className="h-11 pl-10 pr-10" data-testid="login-password" />
            <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground" aria-label="Показать пароль">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" data-testid="login-error" className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500 duration-200 animate-in fade-in slide-in-from-top-1">
            {error}
          </div>
        )}

        <Button type="submit" disabled={busy} size="lg" className="w-full gap-2" data-testid="login-submit">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Войти
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Нет аккаунта?{' '}
        <Link href="/register" data-testid="to-register" className="font-medium text-primary hover:underline">Регистрация</Link>
      </p>
    </Shell>
  );
}

const STEP_TITLES = ['Ваши данные', 'Пароль', 'Подтверждение'];
const STEP_DESCS = ['Как к вам обращаться и email для входа', 'Придумайте надёжный пароль', 'Проверьте данные и создайте аккаунт'];

function RegisterWizard() {
  const submitAuth = useAuthSubmit('register');
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pwScore = useMemo(() => passwordScore(form.password), [form.password]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = (s: number): string | null => {
    if (s === 0) {
      if (!form.name.trim()) return 'Укажите имя.';
      if (!EMAIL_RE.test(form.email.trim())) return 'Некорректный email.';
    }
    if (s === 1) {
      if (form.password.length < 8) return 'Пароль должен быть не короче 8 символов.';
      if (form.password !== form.confirm) return 'Пароли не совпадают.';
    }
    return null;
  };

  const goNext = () => {
    const err = validate(step);
    if (err) { setError(err); return; }
    setError('');
    setDir(1);
    setStep((s) => Math.min(s + 1, STEP_TITLES.length - 1));
  };
  const goBack = () => { setError(''); setDir(-1); setStep((s) => Math.max(s - 1, 0)); };

  const finish = async () => {
    for (const s of [0, 1]) { const err = validate(s); if (err) { setError(err); setStep(s); return; } }
    setBusy(true);
    setError('');
    const err = await submitAuth({ name: form.name.trim(), email: form.email.trim(), password: form.password });
    if (err) { setError(err); setBusy(false); }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (step < STEP_TITLES.length - 1) goNext();
    else finish();
  };

  return (
    <Shell maxWidth="28rem">
      <Brand title="Создать аккаунт" />
      <p className="-mt-3 mb-5 text-center text-xs font-medium text-muted-foreground">Шаг {step + 1} из {STEP_TITLES.length}</p>
      <Stepper step={step} count={STEP_TITLES.length} />

      <div className="mb-5 text-center">
        <h2 className="text-base font-semibold">{STEP_TITLES[step]}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{STEP_DESCS[step]}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative -mx-1.5 overflow-hidden px-1.5 py-1">
          <AnimatePresence mode="wait" initial={false} custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              initial={{ x: dir * 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: dir * -40, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="space-y-4"
            >
              {step === 0 && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Имя</label>
                    <div className="relative">
                      <User className={iconCls} />
                      <Input autoFocus value={form.name} onChange={set('name')} placeholder="Как к вам обращаться" autoComplete="name" className="h-11 pl-10" data-testid="register-name" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <div className="relative">
                      <Mail className={iconCls} />
                      <Input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" autoComplete="email" className="h-11 pl-10" data-testid="register-email" />
                    </div>
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Пароль</label>
                    <div className="relative">
                      <Lock className={iconCls} />
                      <Input autoFocus type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="Минимум 8 символов" autoComplete="new-password" className="h-11 pl-10 pr-10" data-testid="register-password" />
                      <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground" aria-label="Показать пароль">
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <StrengthMeter score={pwScore} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Повторите пароль</label>
                    <div className="relative">
                      <Lock className={iconCls} />
                      <Input type={showPw ? 'text' : 'password'} value={form.confirm} onChange={set('confirm')} placeholder="Ещё раз" autoComplete="new-password" className="h-11 pl-10 pr-10" data-testid="register-confirm" />
                      {form.confirm.length > 0 && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2">
                          {form.confirm === form.password ? <Check className="h-4 w-4 text-green-500" /> : <span className="block h-2 w-2 rounded-full bg-red-500" />}
                        </span>
                      )}
                    </div>
                    {form.confirm.length > 0 && (
                      <p className={`text-xs ${form.confirm === form.password ? 'text-green-600' : 'text-red-500'}`}>
                        {form.confirm === form.password ? 'Пароли совпадают' : 'Пароли не совпадают'}
                      </p>
                    )}
                  </div>
                </>
              )}

              {step === 2 && (
                <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm">
                  <div className="flex items-center justify-between gap-2 py-1">
                    <span className="text-muted-foreground">Имя</span>
                    <span className="truncate font-medium">{form.name}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 py-1">
                    <span className="text-muted-foreground">Email</span>
                    <span className="truncate font-medium">{form.email}</span>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Регистрируясь, вы получаете дашборд, конструктор и публикацию на своём поддомене — бесплатно.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {error && (
          <div role="alert" data-testid="register-error" className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500 duration-200 animate-in fade-in slide-in-from-top-1">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          {step > 0 && (
            <Button type="button" variant="outline" size="lg" className="gap-2" onClick={goBack} disabled={busy} data-testid="register-back">
              <ArrowLeft className="h-4 w-4" /> Назад
            </Button>
          )}
          {step < STEP_TITLES.length - 1 ? (
            <Button type="submit" size="lg" className="flex-1 gap-2" data-testid="register-next">
              Далее <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" size="lg" disabled={busy} className="flex-1 gap-2" data-testid="register-submit">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Зарегистрироваться
            </Button>
          )}
        </div>
      </form>

      {step === 0 && (
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Уже есть аккаунт?{' '}
          <Link href="/login" data-testid="to-login" className="font-medium text-primary hover:underline">
            Войти <ArrowRight className="inline h-3 w-3" />
          </Link>
        </p>
      )}
    </Shell>
  );
}

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  return mode === 'login' ? <LoginForm /> : <RegisterWizard />;
}
