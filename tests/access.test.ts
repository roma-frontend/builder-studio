import { describe, it, expect, beforeEach } from 'vitest';
import { resetDb } from './helpers';
import {
  CAPABILITIES, MANAGED_ROLES, getAccessMatrix, setCapability,
  disabledCapabilitiesFor, isCapabilityEnabled,
  grantCapability, activeGrantCapabilities, listActiveGrants, revokeGrant,
} from '@/lib/access';

beforeEach(() => resetDb());

describe('access matrix', () => {
  it('defaults every capability to enabled for managed roles', () => {
    const { matrix, capabilities } = getAccessMatrix();
    expect(capabilities.length).toBe(CAPABILITIES.length);
    for (const role of MANAGED_ROLES) {
      for (const cap of CAPABILITIES) {
        expect(matrix[role][cap.key]).toBe(true);
      }
    }
  });

  it('disables and re-enables a capability, reflected in the matrix', () => {
    setCapability('admin', 'users', false, 'super-1');
    expect(getAccessMatrix().matrix.admin.users).toBe(false);
    expect(disabledCapabilitiesFor('admin')).toContain('users');
    expect(isCapabilityEnabled('admin', 'users')).toBe(false);
    expect(isCapabilityEnabled('admin', 'allSites')).toBe(true);

    setCapability('admin', 'users', true, 'super-1');
    expect(getAccessMatrix().matrix.admin.users).toBe(true);
    expect(disabledCapabilitiesFor('admin')).not.toContain('users');
    expect(isCapabilityEnabled('admin', 'users')).toBe(true);
  });

  it('superadmin is never restricted', () => {
    setCapability('admin', 'audit', false, 'super-1');
    expect(disabledCapabilitiesFor('superadmin')).toEqual([]);
    expect(isCapabilityEnabled('superadmin', 'audit')).toBe(true);
  });

  it('non-managed roles have no restrictions', () => {
    expect(disabledCapabilitiesFor('customer')).toEqual([]);
  });

  it('rejects unmanaged roles and unknown capabilities', () => {
    expect(() => setCapability('customer', 'users', false, 'x')).toThrow('UNMANAGED_ROLE');
    expect(() => setCapability('admin', 'nope', false, 'x')).toThrow('UNKNOWN_CAPABILITY');
  });
});

describe('temporary grants', () => {
  it('a live grant re-enables a disabled capability', () => {
    setCapability('admin', 'users', false, 'super-1');
    expect(isCapabilityEnabled('admin', 'users')).toBe(false);

    const g = grantCapability('admin', 'users', 60, 'super-1');
    expect(new Date(g.expiresAt).getTime()).toBeGreaterThan(Date.now());
    expect(activeGrantCapabilities('admin').has('users')).toBe(true);
    expect(isCapabilityEnabled('admin', 'users')).toBe(true);
    expect(disabledCapabilitiesFor('admin')).not.toContain('users');
    expect(getAccessMatrix().grants.some((x) => x.capability === 'users')).toBe(true);
  });

  it('revoking a grant restores the matrix default', () => {
    setCapability('admin', 'audit', false, 'super-1');
    grantCapability('admin', 'audit', 30, 'super-1');
    expect(isCapabilityEnabled('admin', 'audit')).toBe(true);
    revokeGrant('admin', 'audit');
    expect(isCapabilityEnabled('admin', 'audit')).toBe(false);
    expect(listActiveGrants()).toHaveLength(0);
  });

  it('clamps duration and rejects bad input', () => {
    const g = grantCapability('admin', 'allSites', 100000, 'super-1');
    // clamped to 1440 minutes (24h) max
    expect(new Date(g.expiresAt).getTime() - Date.now()).toBeLessThanOrEqual(1440 * 60 * 1000 + 1000);
    expect(() => grantCapability('customer', 'users', 60, 'x')).toThrow('UNMANAGED_ROLE');
    expect(() => grantCapability('admin', 'nope', 60, 'x')).toThrow('UNKNOWN_CAPABILITY');
  });
});
