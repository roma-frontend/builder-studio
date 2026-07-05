// Shared route-handler guards (modeled on hr-project's requireAuth/assertSuperadmin).
// The legacy studio/media routes write shared files under data/ and spend the
// server's LLM/media API credits, so they are limited to staff; uploads are
// allowed for any signed-in platform user.

import 'server-only';
import { NextResponse } from 'next/server';
import { getCurrentUser, isStaff } from '@/lib/auth';
import type { User } from '@/lib/db';

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
}

export function forbidden(): NextResponse {
  return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
}

/** Any logged-in platform user, or null. */
export async function requireUser(): Promise<User | null> {
  return getCurrentUser();
}

/** Staff only (admin/superadmin), or null. */
export async function requireStaff(): Promise<User | null> {
  const user = await getCurrentUser();
  return user && isStaff(user) ? user : null;
}
