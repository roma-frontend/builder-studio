import 'server-only';
import { createPrivateKey, sign as signCrypto, randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { getDb, newId, users, type User } from '@/lib/db';
import { normalizeEmail } from '@/lib/auth';
import { platformBase, isSuperadminEmail } from '@/lib/google-auth';

// "Sign in with Apple" via OAuth 2.0 / OIDC authorization-code flow, mirroring
// lib/google-auth.ts. Apple specifics handled here:
//  • the client secret is an ES256 JWT signed with the .p8 key (team/key ids);
//  • requesting the email scope makes Apple use response_mode=form_post, so the
//    callback is a POST (see the route);
//  • the user's email/sub come from the returned id_token (a JWT), decoded here
//    (it arrives over TLS directly from Apple's token endpoint).

const APPLE_AUTH_URL = 'https://appleid.apple.com/auth/authorize';
const APPLE_TOKEN_URL = 'https://appleid.apple.com/auth/token';
const AUD = 'https://appleid.apple.com';
const TIMEOUT_MS = 8000;

export interface AppleConfig {
  clientId: string; // the Services ID, e.g. com.acme.web
  teamId: string;
  keyId: string;
  privateKey: string; // .p8 PEM contents
  configured: boolean;
}

/** Resolve Apple credentials from env. AUTH_APPLE_* accepted as aliases. */
export function getAppleConfig(): AppleConfig {
  const clientId = (process.env.APPLE_CLIENT_ID || process.env.AUTH_APPLE_ID || '').trim();
  const teamId = (process.env.APPLE_TEAM_ID || '').trim();
  const keyId = (process.env.APPLE_KEY_ID || '').trim();
  // The .p8 may carry literal "\n" when stored in a single-line env var.
  const privateKey = (process.env.APPLE_PRIVATE_KEY || process.env.AUTH_APPLE_SECRET || '').replace(/\\n/g, '\n').trim();
  return { clientId, teamId, keyId, privateKey, configured: Boolean(clientId && teamId && keyId && privateKey) };
}

export function getAppleRedirectUri(): string {
  const explicit = (process.env.APPLE_REDIRECT_URI || '').trim();
  if (explicit) return explicit;
  return `${platformBase()}/api/auth/apple/callback`;
}

/** Apple callback for the TENANT flow (runs on the platform host too). */
export function getSiteAppleRedirectUri(): string {
  return `${platformBase()}/api/site-auth/apple/callback`;
}

const b64url = (buf: Buffer | string) =>
  Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/**
 * Build the short-lived ES256 client-secret JWT Apple requires. Signed with the
 * .p8 EC private key; `dsaEncoding: 'ieee-p1363'` yields the raw r||s form JWS
 * needs (no DER conversion). Valid for ~1h.
 */
export function makeAppleClientSecret(cfg: AppleConfig = getAppleConfig()): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'ES256', kid: cfg.keyId, typ: 'JWT' };
  const payload = { iss: cfg.teamId, iat: now, exp: now + 3600, aud: AUD, sub: cfg.clientId };
  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const key = createPrivateKey(cfg.privateKey);
  const sig = signCrypto('sha256', Buffer.from(signingInput), { key, dsaEncoding: 'ieee-p1363' });
  return `${signingInput}.${b64url(sig)}`;
}

/** Build the Apple consent URL. Uses form_post because we request the email scope. */
export function buildAppleAuthUrl(state: string, redirectUri: string = getAppleRedirectUri()): string {
  const { clientId } = getAppleConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    response_mode: 'form_post',
    scope: 'name email',
    state,
  });
  return `${APPLE_AUTH_URL}?${params.toString()}`;
}

export interface AppleProfile {
  sub: string;
  email: string;
  email_verified?: boolean;
}

export type AppleExchangeError = 'not_configured' | 'exchange_failed' | 'no_email';
export interface AppleExchangeSuccess { ok: true; profile: AppleProfile }
export interface AppleExchangeFailure { ok: false; error: AppleExchangeError }

/** Decode a JWT payload without verifying (id_token arrives over TLS from Apple). */
function decodeJwtPayload(jwt: string): Record<string, unknown> | null {
  const parts = jwt.split('.');
  if (parts.length !== 3) return null;
  try {
    const json = Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Exchange an authorization code for the id_token and extract the profile. */
export async function exchangeAppleCode(code: string, redirectUri: string = getAppleRedirectUri()): Promise<AppleExchangeSuccess | AppleExchangeFailure> {
  const cfg = getAppleConfig();
  if (!cfg.configured) return { ok: false, error: 'not_configured' };
  try {
    const res = await fetch(APPLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: cfg.clientId,
        client_secret: makeAppleClientSecret(cfg),
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return { ok: false, error: 'exchange_failed' };
    const data = (await res.json()) as { id_token?: string };
    if (!data.id_token) return { ok: false, error: 'exchange_failed' };
    const claims = decodeJwtPayload(data.id_token);
    const sub = typeof claims?.sub === 'string' ? claims.sub : '';
    const email = typeof claims?.email === 'string' ? claims.email : '';
    if (!sub || !email) return { ok: false, error: 'no_email' };
    const verified = claims?.email_verified === true || claims?.email_verified === 'true';
    return { ok: true, profile: { sub, email, email_verified: verified } };
  } catch {
    return { ok: false, error: 'exchange_failed' };
  }
}

function unusablePasswordHash(): string {
  return `scrypt:16384:8:1:${randomBytes(16).toString('base64')}:${randomBytes(64).toString('base64')}`;
}

export type AppleLoginError = 'suspended';
export interface AppleLoginResult { ok: true; user: User; created: boolean }
export interface AppleLoginFailure { ok: false; error: AppleLoginError }

/**
 * Find-or-create the platform user for a verified Apple profile. Keyed by
 * apple_id, then unified by verified email (so email/Google/Telegram accounts
 * get Apple LINKED, one account per person). Mirrors loginOrCreateGoogleUser.
 */
export function loginOrCreateAppleUser(profile: AppleProfile): AppleLoginResult | AppleLoginFailure {
  const db = getDb();
  const email = normalizeEmail(profile.email);
  const wantsSuperadmin = isSuperadminEmail(email);

  let user = db.select().from(users).where(eq(users.appleId, profile.sub)).get() ?? null;
  let created = false;

  if (!user) {
    const byEmail = db.select().from(users).where(eq(users.email, email)).get() ?? null;
    if (byEmail) {
      const patch: Partial<User> = { appleId: profile.sub };
      if (wantsSuperadmin && byEmail.role !== 'superadmin') patch.role = 'superadmin';
      db.update(users).set(patch).where(eq(users.id, byEmail.id)).run();
      user = { ...byEmail, ...patch };
    }
  }

  if (!user) {
    const isFirst = !db.select({ id: users.id }).from(users).limit(1).get();
    const row: User = {
      id: newId('u'),
      email,
      name: email.split('@')[0],
      passwordHash: unusablePasswordHash(),
      role: isFirst || wantsSuperadmin ? 'superadmin' : 'customer',
      isActive: true,
      failedAttempts: 0,
      lockedUntil: null,
      totpSecret: null,
      totpEnabled: false,
      mustChangePassword: false,
      telegramId: null,
      telegramUsername: null,
      googleId: null,
      appleId: profile.sub,
      createdAt: new Date(),
    };
    db.insert(users).values(row).run();
    user = row;
    created = true;
  } else if (wantsSuperadmin && user.role !== 'superadmin') {
    db.update(users).set({ role: 'superadmin' }).where(eq(users.id, user.id)).run();
    user = { ...user, role: 'superadmin' };
  }

  if (!user.isActive) return { ok: false, error: 'suspended' };
  return { ok: true, user, created };
}
