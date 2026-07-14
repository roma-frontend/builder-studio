import { describe, it, expect } from 'vitest';
import { ACCEPTED_TYPES } from '@/lib/media-optimize';

describe('ACCEPTED_TYPES', () => {
  it('is a non-empty allow-list that excludes active content', () => {
    expect(ACCEPTED_TYPES.length).toBeGreaterThan(0);
    expect(ACCEPTED_TYPES).not.toContain('image/svg+xml');
    expect(ACCEPTED_TYPES).not.toContain('text/html');
  });
});
