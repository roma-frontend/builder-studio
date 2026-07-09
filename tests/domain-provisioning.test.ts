import { afterEach, describe, expect, it, vi } from 'vitest';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  for (const key of [
    'NEXT_PUBLIC_APP_HOST',
    'CUSTOM_DOMAIN_CNAME_TARGET',
    'CLOUDFLARE_API_TOKEN',
    'FLY_API_TOKEN',
    'FLY_APP_NAME',
    'FLY_APP',
  ]) {
    delete process.env[key];
  }
});

describe('domain provisioning', () => {
  it('returns a platform-action state when no provider credentials are configured', async () => {
    const { provisionCustomDomain } = await import('@/lib/domain-provisioning');

    const result = await provisionCustomDomain('client.example.com');

    expect(result.provider).toBe('manual');
    expect(result.status).toBe('dns_required');
    expect(result.error).toContain('not configured');
  });

  it('creates Cloudflare DNS and adds a Fly certificate when configured', async () => {
    process.env.NEXT_PUBLIC_APP_HOST = 'builder-studio.fly.dev';
    process.env.CUSTOM_DOMAIN_CNAME_TARGET = 'builder-studio.fly.dev';
    process.env.CLOUDFLARE_API_TOKEN = 'cf_test';
    process.env.FLY_API_TOKEN = 'fly_test';
    process.env.FLY_APP_NAME = 'builder-studio';

    const calls: { url: string; init?: RequestInit }[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      if (url.includes('/zones?name=client.example.com')) return json({ success: true, result: [] });
      if (url.includes('/zones?name=example.com')) return json({ success: true, result: [{ id: 'zone_1', name: 'example.com' }] });
      if (url.includes('/dns_records?name=client.example.com')) return json({ success: true, result: [] });
      if (url.includes('/dns_records') && init?.method === 'POST') return json({ success: true, result: { id: 'rec_1' } });
      if (url === 'https://api.fly.io/graphql') return json({ data: { addCertificate: { errors: [] } } });
      return json({ success: false, errors: [{ message: `unexpected ${url}` }] }, 500);
    }));

    const { provisionCustomDomain } = await import('@/lib/domain-provisioning');
    const result = await provisionCustomDomain('client.example.com');

    expect(result).toEqual({ provider: 'cloudflare-dns+fly', status: 'provisioning' });
    const dnsCreate = calls.find((c) => c.url.includes('/dns_records') && c.init?.method === 'POST');
    expect(JSON.parse(String(dnsCreate?.init?.body))).toMatchObject({
      type: 'CNAME',
      name: 'client.example.com',
      content: 'builder-studio.fly.dev',
    });
    const flyCall = calls.find((c) => c.url === 'https://api.fly.io/graphql');
    expect(String(flyCall?.init?.body)).toContain('client.example.com');
  });
});
