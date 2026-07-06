import { LegalPage } from '@/components/legal-page';
import { legalDict } from '@/lib/legal-dict';
import { getLocale } from '@/lib/i18n';
import { BCP47, OG_LOCALE, APP_URL } from '@/lib/seo';

export async function generateMetadata() {
  const locale = await getLocale();
  const doc = legalDict(locale).terms;
  return {
    title: doc.title,
    description: doc.tagline.replaceAll('{SITE}', ''),
    alternates: { canonical: `${APP_URL}/legal/terms` },
    openGraph: { type: 'website', title: doc.title, url: `${APP_URL}/legal/terms`, locale: OG_LOCALE[locale] },
  };
}

export default async function TermsPage() {
  const locale = await getLocale();
  const t = legalDict(locale);
  const updated = new Date().toLocaleDateString(BCP47[locale]);
  return <LegalPage doc={t.terms} updatedLabel={t.updatedLabel} disclaimer={t.disclaimer} updated={updated} />;
}
