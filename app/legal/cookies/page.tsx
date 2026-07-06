import { LegalPage } from '@/components/legal-page';
import { legalDict } from '@/lib/legal-dict';
import { getLocale } from '@/lib/i18n';
import { BCP47, OG_LOCALE, APP_URL } from '@/lib/seo';

export async function generateMetadata() {
  const locale = await getLocale();
  const doc = legalDict(locale).cookies;
  return {
    title: doc.title,
    description: doc.tagline.replaceAll('{SITE}', ''),
    alternates: { canonical: `${APP_URL}/legal/cookies` },
    openGraph: { type: 'website', title: doc.title, url: `${APP_URL}/legal/cookies`, locale: OG_LOCALE[locale] },
  };
}

export default async function CookiesPage() {
  const locale = await getLocale();
  const t = legalDict(locale);
  const updated = new Date().toLocaleDateString(BCP47[locale]);
  return <LegalPage doc={t.cookies} updatedLabel={t.updatedLabel} disclaimer={t.disclaimer} updated={updated} />;
}
