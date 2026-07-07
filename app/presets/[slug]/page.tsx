import { notFound } from 'next/navigation';
import { PRESETS, getPreset } from '@/lib/presets';
import { presetDict } from '@/lib/preset-demo-dict';
import { getTheme } from '@/lib/themes';
import { ThemeStyle } from '@/components/theme-style';
import { ThemeFX } from '@/components/theme-fx';
import { PresetLanding } from '@/components/presets/preset-landing';
import { getLocale } from '@/lib/i18n';

export function generateStaticParams() {
  return PRESETS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const def = getPreset(slug);
  if (!def) return {};
  const d = presetDict(await getLocale());
  const c = d.presets[slug];
  return { title: `${c.label} — ${d.common.metaSuffix}`, description: c.hero.subtitle };
}

// A full, themed demo landing for one preset. Showcase only — every control is
// a link/redirect (no forms or logic). The theme gives each preset its look.
export default async function PresetDemoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const def = getPreset(slug);
  if (!def) notFound();
  const d = presetDict(await getLocale());
  const c = d.presets[slug];
  return (
    <>
      <ThemeStyle theme={getTheme(def.theme)} />
      <ThemeFX />
      <PresetLanding def={def} c={c} common={d.common} label={c.label} />
    </>
  );
}
