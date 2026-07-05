import landingData from '@/data/landing.json';

export type LandingCta = {
  ctaPrimaryLabel: string;
  ctaPrimaryHref: string;
  ctaSecondaryLabel: string;
  ctaSecondaryHref: string;
};
export type LandingContent = {
  hero: { badge: string; title: string; subtitle: string; note: string } & LandingCta;
  steps: { title: string; subtitle: string; items: { n: string; title: string; text: string }[] };
  features: { title: string; subtitle: string; items: { title: string; text: string }[] };
  themesTeaser: { title: string; subtitle: string };
  finalCta: { title: string; subtitle: string } & LandingCta;
};

/** The editable landing copy (data/landing.json), managed from the Studio. */
export function getLanding(): LandingContent {
  return landingData as LandingContent;
}
