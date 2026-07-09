import { NextResponse } from 'next/server';
import { getGoogleConfig } from '@/lib/google-auth';

export const runtime = 'nodejs';

/** Whether Google sign-in is configured (drives the button's visibility).
 *  Returns only a boolean — never the client secret. */
export async function GET() {
  return NextResponse.json({ enabled: getGoogleConfig().configured });
}
