import 'server-only';

export type DomainProvisioningStatus = 'pending' | 'provisioning' | 'dns_required' | 'active' | 'failed';

export interface DomainProvisioningResult {
  provider: string;
  status: DomainProvisioningStatus;
  error?: string;
}

const APP_HOSTNAME = (process.env.NEXT_PUBLIC_APP_HOST || 'localhost:3000').toLowerCase().split(':')[0];
const CNAME_TARGET = (process.env.CUSTOM_DOMAIN_CNAME_TARGET || APP_HOSTNAME).toLowerCase().replace(/\.$/, '');

function hasFlyConfig(): boolean {
  return Boolean(process.env.FLY_API_TOKEN && (process.env.FLY_APP_NAME || process.env.FLY_APP));
}

function hasCloudflareConfig(): boolean {
  return Boolean(process.env.CLOUDFLARE_API_TOKEN);
}

function domainProviderName(): string {
  const parts: string[] = [];
  if (hasCloudflareConfig()) parts.push('cloudflare-dns');
  if (hasFlyConfig()) parts.push('fly');
  return parts.join('+') || 'manual';
}

async function cloudflareRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  const json = await res.json().catch(() => null) as { success?: boolean; errors?: { message?: string }[] } & T | null;
  if (!res.ok || !json?.success) {
    const msg = json?.errors?.map((e) => e.message).filter(Boolean).join('; ') || `Cloudflare API failed with ${res.status}`;
    throw new Error(msg);
  }
  return json as T;
}

async function findCloudflareZone(hostname: string): Promise<{ id: string; name: string } | null> {
  const labels = hostname.split('.');
  for (let i = 0; i < labels.length - 1; i += 1) {
    const candidate = labels.slice(i).join('.');
    const data = await cloudflareRequest<{ result?: { id: string; name: string }[] }>(
      `/zones?name=${encodeURIComponent(candidate)}&status=active`,
    );
    const zone = data.result?.[0];
    if (zone) return zone;
  }
  return null;
}

async function ensureCloudflareCname(hostname: string): Promise<void> {
  const zone = await findCloudflareZone(hostname);
  if (!zone) throw new Error('Cloudflare zone not found. Delegate the domain DNS to the platform Cloudflare account first.');

  const existing = await cloudflareRequest<{ result?: { id: string; type: string }[] }>(
    `/zones/${zone.id}/dns_records?name=${encodeURIComponent(hostname)}`,
  );
  const cname = existing.result?.find((r) => r.type === 'CNAME');
  const body = JSON.stringify({ type: 'CNAME', name: hostname, content: CNAME_TARGET, ttl: 1, proxied: false });

  if (cname) {
    await cloudflareRequest(`/zones/${zone.id}/dns_records/${cname.id}`, { method: 'PUT', body });
  } else {
    await cloudflareRequest(`/zones/${zone.id}/dns_records`, { method: 'POST', body });
  }
}

async function flyGraphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch('https://api.fly.io/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.FLY_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json().catch(() => null) as { data?: T; errors?: { message?: string }[] } | null;
  if (!res.ok || json?.errors?.length || !json?.data) {
    const msg = json?.errors?.map((e) => e.message).filter(Boolean).join('; ') || `Fly API failed with ${res.status}`;
    throw new Error(msg);
  }
  return json.data;
}

async function addFlyCertificate(hostname: string): Promise<void> {
  const appId = process.env.FLY_APP_NAME || process.env.FLY_APP;
  if (!appId) throw new Error('FLY_APP_NAME is not configured.');

  const data = await flyGraphql<{
    addCertificate?: { errors?: string | string[] | null };
  }>(
    `mutation AddCertificate($appId: ID!, $hostname: String!) {
      addCertificate(appId: $appId, hostname: $hostname) {
        certificate { hostname }
        errors
      }
    }`,
    { appId, hostname },
  );
  const errors = data.addCertificate?.errors;
  const msg = Array.isArray(errors) ? errors.filter(Boolean).join('; ') : errors;
  if (msg) throw new Error(msg);
}

/**
 * Best-effort platform provisioning for a custom tenant domain.
 *
 * Fully automatic DNS requires the domain to be delegated to the platform DNS
 * provider (currently Cloudflare via CLOUDFLARE_API_TOKEN). Fly provisioning
 * then registers the hostname and starts TLS issuance for the app.
 */
export async function provisionCustomDomain(hostname: string): Promise<DomainProvisioningResult> {
  const provider = domainProviderName();
  try {
    if (hasCloudflareConfig()) await ensureCloudflareCname(hostname);
    if (hasFlyConfig()) await addFlyCertificate(hostname);

    if (provider === 'manual') {
      return {
        provider,
        status: 'dns_required',
        error: 'Custom domain automation is not configured. Superadmin must configure DNS/hosting provider credentials.',
      };
    }
    return { provider, status: 'provisioning' };
  } catch (error) {
    return {
      provider,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Domain provisioning failed',
    };
  }
}

export function expectedDomainTargets(): string[] {
  return Array.from(new Set([APP_HOSTNAME, CNAME_TARGET].filter(Boolean)));
}
