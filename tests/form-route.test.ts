import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => undefined }) }));

import { POST as formRoute } from '@/app/api/form/route';
import { createUser } from '@/lib/auth';
import { createSite, listSubmissions } from '@/lib/sites';
import { resetDb } from './helpers';

let log: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  resetDb();
  delete process.env.RESEND_API_KEY;
  delete process.env.BREVO_API_KEY;
  log = vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('POST /api/form tenant submissions', () => {
  it('stores the tenant submission and emails the site owner resolved from /s/<slug>', async () => {
    const owner = createUser('admin@example.com', 'password123', 'Admin');
    const site = createSite(owner.id, 'BBH');

    const res = await formRoute(new Request('http://localhost:3000/api/form', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        referer: `http://localhost:3000/s/${site.slug}/contact`,
      },
      body: JSON.stringify({ formId: 'contact', name: 'Visitor', email: 'v@example.com', message: 'Hello' }),
    }));

    expect(res.status).toBe(200);
    expect(listSubmissions(site.id, 10)).toHaveLength(1);
    const printed = log.mock.calls.map((c) => String(c[0])).join('\n');
    expect(printed).toContain('[email → admin@example.com]');
    expect(printed).toContain('Новая заявка');
    expect(printed).toContain('Visitor');
  });
});
