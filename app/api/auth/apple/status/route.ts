import { NextResponse } from 'next/server';
import { getAppleConfig } from '@/lib/apple-auth';

export const runtime = 'nodejs';

/** Whether Apple sign-in is configured (drives the button's visibility). */
export async function GET() {
  return NextResponse.json({ enabled: getAppleConfig().configured });
}
