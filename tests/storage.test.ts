import { describe, it, expect } from 'vitest';
import { contentTypeFor, r2Configured, storageInfo } from '@/lib/storage';
import { ACCEPTED_TYPES } from '@/lib/media-optimize';

describe('contentTypeFor', () => {
  it('maps known extensions', () => {
    expect(contentTypeFor('x.webp')).toBe('image/webp');
    expect(contentTypeFor('x.webm')).toBe('video/webm');
    expect(contentTypeFor('x.jpg')).toBe('image/jpeg');
    expect(contentTypeFor('x.jpeg')).toBe('image/jpeg');
    expect(contentTypeFor('x.png')).toBe('image/png');
    expect(contentTypeFor('x.svg')).toBe('image/svg+xml');
    expect(contentTypeFor('x.mp4')).toBe('video/mp4');
  });

  it('is case-insensitive', () => {
    expect(contentTypeFor('PHOTO.WEBP')).toBe('image/webp');
  });

  it('falls back to octet-stream for unknown', () => {
    expect(contentTypeFor('file.bin')).toBe('application/octet-stream');
    expect(contentTypeFor('noext')).toBe('application/octet-stream');
  });
});

describe('storage mode (no R2 env in tests)', () => {
  it('reports local mode when R2 is unconfigured', () => {
    expect(r2Configured()).toBe(false);
    expect(storageInfo()).toEqual({ mode: 'local' });
  });
});

describe('accepted upload types', () => {
  it('includes safe image and video types', () => {
    for (const t of ['image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'video/webm']) {
      expect(ACCEPTED_TYPES).toContain(t);
    }
  });

  it('rejects unexpected and active-content types', () => {
    expect(ACCEPTED_TYPES).not.toContain('application/pdf');
    expect(ACCEPTED_TYPES).not.toContain('text/html');
    expect(ACCEPTED_TYPES).not.toContain('image/svg+xml');
  });
});
