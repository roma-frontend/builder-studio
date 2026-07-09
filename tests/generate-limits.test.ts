// Per-user rate limits on the routes that spend the server's API credits
// (media pipeline / LLM): /api/generate, /api/generate-page, /api/pick-theme.

import { describe, it, expect, beforeEach, vi } from 'vitest';

// A minimal in-memory cookie jar standing in for Next's cookies().
const store = new Map<string, string>();
const jar = {
  get: (k: string) => (store.has(k) ? { name: k, value: store.get(k)! } : undefined),
  set: (k: string, v: string) => void store.set(k, v),
  delete: (k: string) => void store.delete(k),
};
vi.mock('next/headers', () => ({ cookies: async () => jar }));

import { POST as generateRoute } from '@/app/api/generate/route';
import { POST as generatePageRoute } from '@/app/api/generate-page/route';
import { POST as pickThemeRoute } from '@/app/api/pick-theme/route';
import { createUser, createSession, SESSION_COOKIE } from '@/lib/auth';
import { resetDb } from './helpers';

// Emails must be unique across the whole file: the module-level rate limiter
// keys on user id and survives resetDb(), so every test needs a fresh user.
let seq = 0;
const signIn = (role: 'first' | 'customer' = 'customer') => {
  if (role === 'first') resetDb(); // first account after a wipe → superadmin
  const user = createUser(`gen${seq++}@example.com`, 'password123', 'Ген Тестов');
  const { token } = createSession(user.id);
  store.set(SESSION_COOKIE, token);
  return user;
};

const post = (body: unknown) =>
  new Request('http://test.local/api', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

beforeEach(() => {
  resetDb();
  store.clear();
});

describe('POST /api/generate rate limit', () => {
  it('rejects anonymous callers before touching the limiter', async () => {
    const res = await generateRoute(post({ prompt: 'x' }));
    expect(res.status).toBe(401);
  });

  it('returns 429 after 5 runs within the window (staff user)', async () => {
    signIn('first'); // superadmin passes requireStaff
    // Malformed JSON keeps the pipeline from actually spawning but still
    // passes the guard + limiter, so each call burns one slot.
    for (let i = 0; i < 5; i++) {
      const res = await generateRoute(post('{not json'));
      expect(res.status).toBe(400);
    }
    const res = await generateRoute(post('{not json'));
    expect(res.status).toBe(429);
    expect((await res.json()).error).toMatch(/подожд/i);
  });
});

describe('POST /api/generate-page rate limit', () => {
  it('serves the fallback page for a signed-in user', async () => {
    signIn();
    const res = await generatePageRoute(post({ brief: 'кофейня в центре' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.source).toBe('fallback');
    expect(data.page.blocks.length).toBeGreaterThan(0);
  });

  it('returns 429 after 10 generations within the window', async () => {
    signIn();
    for (let i = 0; i < 10; i++) {
      const res = await generatePageRoute(post({ brief: 'кофейня' }));
      expect(res.status).toBe(200);
    }
    const res = await generatePageRoute(post({ brief: 'кофейня' }));
    expect(res.status).toBe(429);
  });

  it('counts rejected briefs against the same budget (no free probing)', async () => {
    signIn();
    for (let i = 0; i < 10; i++) await generatePageRoute(post({ brief: '' }));
    const res = await generatePageRoute(post({ brief: 'кофейня' }));
    expect(res.status).toBe(429);
  });
});

describe('POST /api/pick-theme rate limit', () => {
  it('returns 429 after 30 requests within the window', async () => {
    signIn();
    for (let i = 0; i < 30; i++) {
      const res = await pickThemeRoute(post({ brief: 'барбершоп' }));
      expect(res.status).toBe(200);
    }
    const res = await pickThemeRoute(post({ brief: 'барбершоп' }));
    expect(res.status).toBe(429);
  });

  it('limits are per user — a different account is not affected', async () => {
    signIn();
    for (let i = 0; i < 31; i++) await pickThemeRoute(post({ brief: 'спа' }));
    signIn(); // fresh user, same process-wide limiter
    const res = await pickThemeRoute(post({ brief: 'спа' }));
    expect(res.status).toBe(200);
  });
});
