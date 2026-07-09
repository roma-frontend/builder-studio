import 'server-only';
import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { getDb, newId, users, type User } from '@/lib/db';
import { normalizeEmail } from '@/lib/auth';

// Google "Sign in with Google" via the standard OAuth 2.0 / OpenID Connect
// authorization-code flow (server-side, no client secret in the browser).
// Mirrors the shape of lib/telegram-auth.ts: pure find-or-create keyed by the
// Google-verified email, superadmin bootstrap, and account unification so a
// superadmin is ONE account regardless of login method (email / Telegram /
// Google). The API route owns cookies + the OAuth redirect dance; this module
// stays pure and unit-testable.

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';
const TIMEOUT_MS = 8000;

export interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  configured: boolean;
}

/**
 * Resolve the OAuth client credentials from env. Accepts the Auth.js-style
 * names used by hr-project (AUTH_GOOGLE_ID/SECRET) as aliases so the same
 * secrets can be reused across projects.
 */
export function getGoogleConfig(): GoogleConfig {
  const clientId = (process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID || '').trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET || '').trim();
  return { clientId, clientSecret, configured: Boolean(clientId && clientSecret) };
}

/**
 * The redirect/callback URL Google sends the user back to. Must match EXACTLY
 * an "Authorized redirect URI" in the Google Cloud OAuth client. Derived from
 * the app host unless explicitly overridden with GOOGLE_REDIRECT_URI.
 */
export function getGoogleRedirectUri(): string {
  const explicit = (process.env.GOOGLE_REDIRECT_URI || '').trim();
  if (explicit) return explicit;
  return `${platformBase()}/api/auth/google/callback`;
}

/** Absolute base URL of the PLATFORM host (where OAuth start/callback run). */
export function platformBase(): string {
  const host = (process.env.NEXT_PUBLIC_APP_HOST || process.env.NEXT_PUBLIC_APP_URL || '').trim();
  return host
    ? (/^https?:\/\//.test(host) ? host : `https://${host}`).replace(/\/+$/, '')
    : 'http://localhost:3000';
}

/**
 * Callback for the TENANT (site end-user) Google flow. Lives on the PLATFORM
 * host too — so a single registered redirect URI works for every tenant site
 * regardless of its subdomain/custom domain. The resulting session is handed
 * off to the tenant host via a one-time token (see site-auth google-exchange).
 */
export function getSiteGoogleRedirectUri(): string {
  return `${platformBase()}/api/site-auth/google/callback`;
}

/** Bootstrap superadmin emails (comma-separated in `SUPERADMIN_EMAILS`). Lets
 *  the owner sign in via Google and be recognised as superadmin on first login. */
function bootstrapSuperadminEmails(): string[] {
  const raw = process.env.SUPERADMIN_EMAILS ?? process.env.SUPERADMIN_EMAIL ?? '';
  return raw.split(',').map((s) => normalizeEmail(s)).filter(Boolean);
}

/** Is this email designated as a bootstrap superadmin? */
export function isSuperadminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return bootstrapSuperadminEmails().includes(normalizeEmail(email));
}

/** A never-usable scrypt-shaped hash: Google accounts have no local password. */
function unusablePasswordHash(): string {
  return `scrypt:16384:8:1:${randomBytes(16).toString('base64')}:${randomBytes(64).toString('base64')}`;
}

/** Build the Google consent-screen URL for the given anti-CSRF `state`. */
export function buildGoogleAuthUrl(state: string, redirectUri: string = getGoogleRedirectUri()): string {
  const { clientId } = getGoogleConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/** The OpenID profile fields we consume from Google's userinfo endpoint. */
export interface GoogleProfile {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export type GoogleExchangeError = 'not_configured' | 'exchange_failed' | 'no_email' | 'unverified_email';

export interface GoogleExchangeSuccess { ok: true; profile: GoogleProfile }
export interface GoogleExchangeFailure { ok: false; error: GoogleExchangeError }

/**
 * Exchange an authorization `code` for tokens and fetch the user's profile.
 * Never throws — returns a tagged failure the route maps to a redirect.
 */
export async function exchangeGoogleCode(code: string, redirectUri: string = getGoogleRedirectUri()): Promise<GoogleExchangeSuccess | GoogleExchangeFailure> {
  const cfg = getGoogleConfig();
  if (!cfg.configured) return { ok: false, error: 'not_configured' };

  try {
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!tokenRes.ok) return { ok: false, error: 'exchange_failed' };
    const token = (await tokenRes.json()) as { access_token?: string };
    if (!token.access_token) return { ok: false, error: 'exchange_failed' };

    const infoRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${token.access_token}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!infoRes.ok) return { ok: false, error: 'exchange_failed' };
    const profile = (await infoRes.json()) as GoogleProfile;

    if (!profile.email) return { ok: false, error: 'no_email' };
    // Google marks whether it verified ownership of the address; only trust
    // verified emails, otherwise account takeover by unverified claims is possible.
    if (profile.email_verified === false) return { ok: false, error: 'unverified_email' };
    return { ok: true, profile };
  } catch {
    return { ok: false, error: 'exchange_failed' };
  }
}

export type GoogleLoginError = 'suspended';
export interface GoogleLoginResult { ok: true; user: User; created: boolean }
export interface GoogleLoginFailure { ok: false; error: GoogleLoginError }

/**
 * Find-or-create the user for a verified Google profile. Keyed by google_id
 * first, then by the verified email so a superadmin (or anyone) who already has
 * an email/Telegram account gets Google LINKED to that single account instead
 * of a duplicate. Does NOT set a session — the route does that.
 */
export function loginOrCreateGoogleUser(profile: GoogleProfile): GoogleLoginResult | GoogleLoginFailure {
  const db = getDb();
  const email = normalizeEmail(profile.email);
  const wantsSuperadmin = isSuperadminEmail(email);

  // 1) Already linked by Google id.
  let user = db.select().from(users).where(eq(users.googleId, profile.sub)).get() ?? null;
  let created = false;

  // 2) Account unification: link Google to the existing account with the same
  //    verified email (email/Telegram-created), rather than forking a new one.
  if (!user) {
    const byEmail = db.select().from(users).where(eq(users.email, email)).get() ?? null;
    if (byEmail) {
      const patch: Partial<User> = { googleId: profile.sub };
      if (wantsSuperadmin && byEmail.role !== 'superadmin') patch.role = 'superadmin';
      db.update(users).set(patch).where(eq(users.id, byEmail.id)).run();
      user = { ...byEmail, ...patch };
    }
  }

  // 3) First-time Google user → create.
  if (!user) {
    const name = profile.name
      || [profile.given_name, profile.family_name].filter(Boolean).join(' ').trim()
      || email.split('@')[0];
    const isFirst = !db.select({ id: users.id }).from(users).limit(1).get();
    const row: User = {
      id: newId('u'),
      email,
      name,
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
      googleId: profile.sub,
      appleId: null,
      createdAt: new Date(),
    };
    db.insert(users).values(row).run();
    user = row;
    created = true;
  } else {
    // Existing google-linked account: promote a designated owner if needed.
    if (wantsSuperadmin && user.role !== 'superadmin') {
      db.update(users).set({ role: 'superadmin' }).where(eq(users.id, user.id)).run();
      user = { ...user, role: 'superadmin' };
    }
  }

  if (!user.isActive) return { ok: false, error: 'suspended' };
  return { ok: true, user, created };
}
