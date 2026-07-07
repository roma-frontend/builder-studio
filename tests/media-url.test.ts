import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// mediaUrl reads NEXT_PUBLIC_MEDIA_BASE_URL at module load, so each mode is
// tested via a fresh dynamic import with the env set beforehand.
const ORIG = process.env.NEXT_PUBLIC_MEDIA_BASE_URL;

describe('mediaUrl', () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => { process.env.NEXT_PUBLIC_MEDIA_BASE_URL = ORIG; });

  it('falls back to local paths when no base is set', async () => {
    delete process.env.NEXT_PUBLIC_MEDIA_BASE_URL;
    const { mediaUrl, mediaFromRemote } = await import('@/lib/media-url');
    expect(mediaUrl('/media/x.webm')).toBe('/media/x.webm');
    expect(mediaUrl('media/x.webm')).toBe('/media/x.webm');
    expect(mediaFromRemote()).toBe(false);
  });

  it('prefixes the remote base (trailing slash trimmed) when set', async () => {
    process.env.NEXT_PUBLIC_MEDIA_BASE_URL = 'https://cdn.example.com/';
    const { mediaUrl, mediaFromRemote } = await import('@/lib/media-url');
    expect(mediaUrl('/media/x.webm')).toBe('https://cdn.example.com/media/x.webm');
    expect(mediaUrl('media/x.webm')).toBe('https://cdn.example.com/media/x.webm');
    expect(mediaFromRemote()).toBe(true);
  });

  it('leaves absolute and data/blob URLs untouched', async () => {
    process.env.NEXT_PUBLIC_MEDIA_BASE_URL = 'https://cdn.example.com';
    const { mediaUrl } = await import('@/lib/media-url');
    expect(mediaUrl('https://x.com/a.mp4')).toBe('https://x.com/a.mp4');
    expect(mediaUrl('//x.com/a.mp4')).toBe('//x.com/a.mp4');
    expect(mediaUrl('data:image/png;base64,AAAA')).toBe('data:image/png;base64,AAAA');
    expect(mediaUrl('blob:abc')).toBe('blob:abc');
  });
});
