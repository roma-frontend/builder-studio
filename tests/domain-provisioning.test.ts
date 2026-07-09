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
      if (url === 'https://api.fly.io/graphql') return json({ data: { addCertificate: { errors: null } } });
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

  it('updates an existing Cloudflare CNAME and accepts FLY_APP fallback', async () => {
    process.env.NEXT_PUBLIC_APP_HOST = 'builder-studio.fly.dev';
    process.env.CUSTOM_DOMAIN_CNAME_TARGET = 'builder-studio.fly.dev.';
    process.env.CLOUDFLARE_API_TOKEN = 'cf_test';
    process.env.FLY_API_TOKEN = 'fly_test';
    process.env.FLY_APP = 'builder-studio';

    const calls: { url: string; init?: RequestInit }[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      if (url.includes('/zones?name=www.client.example.com')) return json({ success: true, result: [] });
      if (url.includes('/zones?name=client.example.com')) return json({ success: true, result: [] });
      if (url.includes('/zones?name=example.com')) return json({ success: true, result: [{ id: 'zone_1', name: 'example.com' }] });
      if (url.includes('/dns_records?name=www.client.example.com')) {
        return json({ success: true, result: [{ id: 'rec_1', type: 'CNAME' }] });
      }
      if (url.includes('/dns_records/rec_1') && init?.method === 'PUT') return json({ success: true, result: { id: 'rec_1' } });
      if (url === 'https://api.fly.io/graphql') return json({ data: { addCertificate: { errors: null } } });
      return json({ success: false, errors: [{ message: `unexpected ${url}` }] }, 500);
    }));

    const { expectedDomainTargets, provisionCustomDomain } = await import('@/lib/domain-provisioning');

    expect(expectedDomainTargets()).toEqual(['builder-studio.fly.dev']);
    expect(await provisionCustomDomain('www.client.example.com')).toEqual({
      provider: 'cloudflare-dns+fly',
      status: 'provisioning',
    });

    const dnsUpdate = calls.find((c) => c.url.includes('/dns_records/rec_1') && c.init?.method === 'PUT');
    expect(JSON.parse(String(dnsUpdate?.init?.body))).toMatchObject({
      type: 'CNAME',
      content: 'builder-studio.fly.dev',
    });
  });

  it('returns failed when Cloudflare has no delegated zone', async () => {
    process.env.CLOUDFLARE_API_TOKEN = 'cf_test';
    vi.stubGlobal('fetch', vi.fn(async () => json({ success: true, result: [] })));

    const { provisionCustomDomain } = await import('@/lib/domain-provisioning');
    const result = await provisionCustomDomain('client.example.com');

    expect(result.provider).toBe('cloudflare-dns');
    expect(result.status).toBe('failed');
    expect(result.error).toContain('Cloudflare zone not found');
  });

  it('returns failed when Fly reports certificate errors', async () => {
    process.env.FLY_API_TOKEN = 'fly_test';
    process.env.FLY_APP_NAME = 'builder-studio';
    vi.stubGlobal('fetch', vi.fn(async () => json({ data: { addCertificate: { errors: 'hostname is invalid' } } })));

    const { provisionCustomDomain } = await import('@/lib/domain-provisioning');
    const result = await provisionCustomDomain('bad.example.com');

    expect(result.provider).toBe('fly');
    expect(result.status).toBe('failed');
    expect(result.error).toContain('hostname is invalid');
  });

  it('surfaces malformed provider responses as failed provisioning', async () => {
    process.env.FLY_API_TOKEN = 'fly_test';
    process.env.FLY_APP_NAME = 'builder-studio';
    vi.stubGlobal('fetch', vi.fn(async () => new Response('not json', { status: 502 })));

    const { provisionCustomDomain } = await import('@/lib/domain-provisioning');
    const result = await provisionCustomDomain('client.example.com');

    expect(result.provider).toBe('fly');
    expect(result.status).toBe('failed');
    expect(result.error).toContain('Fly API failed with 502');
  });
});
