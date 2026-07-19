'use client';

function getMediaOrigin(): string | null {
  const base = process.env.NEXT_PUBLIC_MEDIA_BASE_URL;
  if (!base) return null;
  try {
    return new URL(base).origin;
  } catch {
    return null;
  }
}

const origin = getMediaOrigin();

export function MediaPreconnect() {
  if (!origin) return null;
  return (
    <>
      <link rel="preconnect" href={origin} crossOrigin="anonymous" />
      <link rel="dns-prefetch" href={origin} />
    </>
  );
}
