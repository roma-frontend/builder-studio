'use client';

// "Moment of delight" shown right after a site is published — a small burst of
// confetti, the live URL with one-tap copy, a QR to open it on a phone, and
// native/social share. Turning the publish click into a dopamine hit nudges the
// user toward the next paid step (custom domain, sharing, inviting members).
// Self-contained i18n (ru/en/hy). QR is generated lazily on the client (dynamic
// import of the already-bundled `qrcode`), so nothing loads until it's shown.

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Rocket, Copy, Check, ExternalLink, Download, Share2, X, QrCode as QrIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/hooks/use-locale';
import { usePrefersReducedMotion } from '@/hooks/use-media-query';

type Copy = {
  title: string; subtitle: string; landingTitle: string; landingSubtitle: string;
  open: string; copy: string; copied: string; download: string; share: string;
  scan: string; close: string; shareText: string;
};

const COPY: Record<'ru' | 'en' | 'hy', Copy> = {
  ru: {
    title: 'Ваш сайт в эфире! 🎉',
    subtitle: 'Поздравляем — сайт опубликован и доступен всем. Поделитесь ссылкой:',
    landingTitle: 'Лендинг обновлён! 🎉',
    landingSubtitle: 'Главная страница «/» обновлена и доступна всем. Поделитесь:',
    open: 'Открыть сайт', copy: 'Копировать ссылку', copied: 'Скопировано', download: 'Скачать QR', share: 'Поделиться',
    scan: 'Наведите камеру телефона, чтобы открыть', close: 'Закрыть',
    shareText: 'Смотрите мой новый сайт:',
  },
  en: {
    title: 'Your site is live! 🎉',
    subtitle: 'Congrats — your site is published and open to everyone. Share the link:',
    landingTitle: 'Landing updated! 🎉',
    landingSubtitle: 'Your home page “/” is updated and live. Share it:',
    open: 'Open site', copy: 'Copy link', copied: 'Copied', download: 'Download QR', share: 'Share',
    scan: 'Point your phone camera to open', close: 'Close',
    shareText: 'Check out my new site:',
  },
  hy: {
    title: 'Ձեր կայքը եթերում է! 🎉',
    subtitle: 'Շնորհավորում ենք — կայքը հրապարակված է և հասանելի բոլորին։ Կիսվեք հղումով՝',
    landingTitle: 'Լենդինգը թարմացվեց! 🎉',
    landingSubtitle: 'Գլխավոր «/» էջը թարմացվեց և հասանելի է բոլորին։ Կիսվեք՝',
    open: 'Բացել կայքը', copy: 'Պատճենել հղումը', copied: 'Պատճենվեց', download: 'Ներբեռնել QR', share: 'Կիսվել',
    scan: 'Ուղղեք հեռախոսի տեսախցիկը՝ բացելու համար', close: 'Փակել',
    shareText: 'Տեսեք իմ նոր կայքը՝',
  },
};

const CONFETTI_COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#38bdf8'];

function Confetti() {
  // ~48 lightweight pieces bursting from the top-center; pure framer, GPU-cheap.
  const pieces = useMemo(
    () => Array.from({ length: 48 }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 520,
      rot: Math.random() * 720 - 360,
      delay: Math.random() * 0.25,
      dur: 1.6 + Math.random() * 1.2,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 6 + Math.random() * 6,
    })),
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center overflow-visible" aria-hidden>
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 1, y: 0, x: 0, rotate: 0 }}
          animate={{ opacity: [1, 1, 0], y: 420, x: p.x, rotate: p.rot }}
          transition={{ duration: p.dur, delay: p.delay, ease: 'easeOut' }}
          style={{ width: p.size, height: p.size * 1.4, backgroundColor: p.color, borderRadius: 2, position: 'absolute', top: 8 }}
        />
      ))}
    </div>
  );
}

export function PublishCelebration({
  open, onClose, liveUrl, isLanding = false,
}: {
  open: boolean; onClose: () => void; liveUrl: string; isLanding?: boolean;
}) {
  const { locale } = useLocale();
  const c = COPY[(locale as 'ru' | 'en' | 'hy')] ?? COPY.en;
  const reduced = usePrefersReducedMotion();
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState<string>('');
  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  // Lazily build the QR only while the dialog is open.
  useEffect(() => {
    if (!open || !liveUrl) return;
    let alive = true;
    import('qrcode')
      .then((m) => m.toDataURL(liveUrl, { margin: 1, width: 320, errorCorrectionLevel: 'M' }))
      .then((url) => { if (alive) setQr(url); })
      .catch(() => { /* QR is a nicety — ignore failures */ });
    return () => { alive = false; };
  }, [open, liveUrl]);

  // Esc to close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const prettyUrl = liveUrl.replace(/^https?:\/\//, '');
  const copyLink = () => {
    navigator.clipboard?.writeText(liveUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }).catch(() => {});
  };
  const share = () => { navigator.share?.({ title: c.shareText, text: c.shareText, url: liveUrl }).catch(() => {}); };
  const enc = encodeURIComponent(liveUrl);
  const encText = encodeURIComponent(`${c.shareText} ${liveUrl}`);
  const socials = [
    { key: 'tg', label: 'Telegram', href: `https://t.me/share/url?url=${enc}&text=${encodeURIComponent(c.shareText)}` },
    { key: 'wa', label: 'WhatsApp', href: `https://wa.me/?text=${encText}` },
    { key: 'x', label: 'X', href: `https://twitter.com/intent/tweet?text=${encText}` },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          role="dialog" aria-modal="true" aria-label={isLanding ? c.landingTitle : c.title}
        >
          <button className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-label={c.close} onClick={onClose} />
          <motion.div
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border/70 bg-background/95 p-6 shadow-2xl backdrop-blur-xl"
            initial={{ opacity: 0, y: 24, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          >
            {!reduced && <Confetti />}
            <button type="button" onClick={onClose} aria-label={c.close}
              className="absolute right-3 top-3 z-20 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </button>

            <div className="relative z-20 flex flex-col items-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-lg shadow-primary/30">
                <Rocket className="h-7 w-7" />
              </span>
              <h2 className="mt-4 text-xl font-bold tracking-tight">{isLanding ? c.landingTitle : c.title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{isLanding ? c.landingSubtitle : c.subtitle}</p>

              {/* Live URL */}
              <div className="mt-4 flex w-full items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2">
                <code className="min-w-0 flex-1 truncate text-left font-mono text-xs">{prettyUrl}</code>
                <button type="button" onClick={copyLink} aria-label={c.copy} title={c.copy}
                  className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground">
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>

              {/* QR */}
              <div className="mt-4 rounded-2xl border border-border bg-white p-3 shadow-sm">
                {qr ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qr} alt="QR" width={160} height={160} className="h-40 w-40 rounded-lg" />
                ) : (
                  <div className="flex h-40 w-40 items-center justify-center text-muted-foreground/40"><QrIcon className="h-10 w-10" /></div>
                )}
              </div>
              <p className="mt-2 max-w-56 text-xs text-muted-foreground">{c.scan}</p>

              {/* Actions */}
              <div className="mt-5 flex w-full flex-col gap-2">
                <a href={liveUrl} target="_blank" rel="noreferrer" className="w-full">
                  <Button className="w-full gap-1.5"><ExternalLink className="h-4 w-4" /> {c.open}</Button>
                </a>
                <div className="flex gap-2">
                  {canShare ? (
                    <Button variant="outline" onClick={share} className="flex-1 gap-1.5"><Share2 className="h-4 w-4" /> {c.share}</Button>
                  ) : (
                    <Button variant="outline" onClick={copyLink} className="flex-1 gap-1.5">
                      {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />} {copied ? c.copied : c.copy}
                    </Button>
                  )}
                  {qr && (
                    <a href={qr} download="site-qr.png" className="flex-1">
                      <Button variant="outline" className="w-full gap-1.5"><Download className="h-4 w-4" /> {c.download}</Button>
                    </a>
                  )}
                </div>
                <div className="mt-1 flex items-center justify-center gap-2">
                  {socials.map((s) => (
                    <a key={s.key} href={s.href} target="_blank" rel="noreferrer"
                      className="rounded-full border border-border/70 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground">
                      {s.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
