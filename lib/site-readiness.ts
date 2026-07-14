import type { BuilderDoc, BuilderNode } from '@/lib/builder/types';

export type ReadinessIssueCode = 'page-title' | 'page-description' | 'page-h1' | 'image-alt' | 'no-cta' | 'no-form';
export interface ReadinessIssue { code: ReadinessIssueCode; page: string; count?: number }
export interface ReadinessReport { score: number; passed: number; total: number; issues: ReadinessIssue[] }

function walk(nodes: BuilderNode[], visit: (node: BuilderNode) => void): void {
  for (const node of nodes) {
    visit(node);
    if (node.children?.length) walk(node.children, visit);
  }
}

/** Fast deterministic content/readiness audit run whenever a site is published. */
export function auditSiteReadiness(doc: BuilderDoc): ReadinessReport {
  const issues: ReadinessIssue[] = [];
  let passed = 0;
  let total = 0;
  let hasCta = false;
  let hasForm = false;

  for (const page of doc.pages) {
    const pageName = page.title || page.path || '/';
    total += 3;
    if (page.title.trim().length >= 3) passed += 1;
    else issues.push({ code: 'page-title', page: pageName });
    if ((page.description || '').trim().length >= 50) passed += 1;
    else issues.push({ code: 'page-description', page: pageName });

    let h1 = 0;
    let missingAlt = 0;
    walk(page.blocks, (node) => {
      if (node.type === 'heading' && node.props.level === '1' && node.props.text?.trim()) h1 += 1;
      if (node.type === 'image' && node.props.src?.trim() && !node.props.alt?.trim()) missingAlt += 1;
      if (node.type === 'button' && node.props.href?.trim()) hasCta = true;
      if (node.type === 'form') hasForm = true;
    });
    if (h1 === 1) passed += 1;
    else issues.push({ code: 'page-h1', page: pageName, count: h1 });
    if (missingAlt) {
      total += 1;
      issues.push({ code: 'image-alt', page: pageName, count: missingAlt });
    }
  }

  total += 2;
  if (hasCta) passed += 1;
  else issues.push({ code: 'no-cta', page: doc.brand });
  if (hasForm) passed += 1;
  else issues.push({ code: 'no-form', page: doc.brand });

  return { score: total ? Math.round((passed / total) * 100) : 0, passed, total, issues };
}
