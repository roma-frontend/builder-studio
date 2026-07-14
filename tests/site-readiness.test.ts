import { describe, expect, it } from 'vitest';
import { auditSiteReadiness } from '@/lib/site-readiness';
import type { BuilderDoc } from '@/lib/builder/types';

function doc(overrides: Partial<BuilderDoc> = {}): BuilderDoc {
  return {
    brand: 'Acme', themeId: 'auto', nav: [], footer: { text: '', links: [] },
    pages: [{ id: 'home', path: '', title: 'Acme platform', description: 'A clear description of the product and its benefits for every visitor.', blocks: [
      { id: 'h1', type: 'heading', props: { level: '1', text: 'Build faster' } },
      { id: 'cta', type: 'button', props: { text: 'Start', href: '/site/contact' } },
      { id: 'form', type: 'form', props: { formId: 'contact' }, children: [] },
      { id: 'image', type: 'image', props: { src: '/hero.jpg', alt: 'Product dashboard' } },
    ] }],
    ...overrides,
  };
}

describe('auditSiteReadiness', () => {
  it('returns a perfect score for a complete conversion-ready site', () => {
    expect(auditSiteReadiness(doc())).toMatchObject({ score: 100, issues: [] });
  });

  it('reports actionable SEO, accessibility and conversion gaps', () => {
    const result = auditSiteReadiness(doc({ pages: [{ id: 'home', path: '', title: '', description: '', blocks: [
      { id: 'a', type: 'heading', props: { level: '2', text: 'Not an H1' } },
      { id: 'b', type: 'image', props: { src: '/hero.jpg', alt: '' } },
    ] }] }));
    expect(result.score).toBeLessThan(50);
    expect(result.issues.map((i) => i.code)).toEqual(expect.arrayContaining(['page-title', 'page-description', 'page-h1', 'image-alt', 'no-cta', 'no-form']));
  });
});
