import { describe, it, expect, beforeEach } from 'vitest';
import {
  adminCreateMember, adminUpdateMember, adminResetMemberPassword, adminDeleteMember, adminImportMembers,
  listMembers,
} from '@/lib/site-membership';
import { createUser } from '@/lib/auth';
import { createSite } from '@/lib/sites';
import { verifySiteCredentials } from '@/lib/site-auth';
import { resetDb } from './helpers';

beforeEach(() => resetDb());

function seed() {
  createUser('super@example.com', 'password123', 'Super'); // first => superadmin
  const owner = createUser('owner@example.com', 'password123', 'Owner');
  const site = createSite(owner.id, 'Org');
  return { owner, site };
}

describe('admin member management', () => {
  it('creates an approved member with a working temp password', () => {
    const { site } = seed();
    const { member, password } = adminCreateMember(site.id, { email: 'A@Ex.com', name: 'Ann' });
    expect(member.status).toBe('approved');
    expect(member.email).toBe('a@ex.com'); // normalized
    expect(password).toHaveLength(12);
    expect(verifySiteCredentials(site.id, 'a@ex.com', password)).not.toBeNull();
  });

  it('rejects invalid email and duplicate email', () => {
    const { site } = seed();
    expect(() => adminCreateMember(site.id, { email: 'nope' })).toThrow('INVALID_EMAIL');
    adminCreateMember(site.id, { email: 'dup@ex.com' });
    expect(() => adminCreateMember(site.id, { email: 'dup@ex.com' })).toThrow('EMAIL_TAKEN');
  });

  it('edits name and email, guarding email uniqueness', () => {
    const { site } = seed();
    const { member } = adminCreateMember(site.id, { email: 'x@ex.com', name: 'X' });
    adminCreateMember(site.id, { email: 'y@ex.com' });
    adminUpdateMember(site.id, member.id, { name: 'New', email: 'z@ex.com' });
    const row = listMembers(site.id).find((r) => r.id === member.id)!;
    expect(row.name).toBe('New');
    expect(row.email).toBe('z@ex.com');
    expect(() => adminUpdateMember(site.id, member.id, { email: 'y@ex.com' })).toThrow('EMAIL_TAKEN');
  });

  it('resets a password to a new working value', () => {
    const { site } = seed();
    const { member, password } = adminCreateMember(site.id, { email: 'r@ex.com' });
    const next = adminResetMemberPassword(site.id, member.id);
    expect(next).not.toBe(password);
    expect(verifySiteCredentials(site.id, 'r@ex.com', next)).not.toBeNull();
    expect(verifySiteCredentials(site.id, 'r@ex.com', password)).toBeNull();
  });

  it('deletes a member, scoped by site', () => {
    const { site } = seed();
    const { member } = adminCreateMember(site.id, { email: 'd@ex.com' });
    adminDeleteMember(site.id, member.id);
    expect(listMembers(site.id)).toHaveLength(0);
  });

  it('does not delete a member belonging to another site', () => {
    const { owner, site } = seed();
    const other = createSite(owner.id, 'Org2');
    const { member } = adminCreateMember(site.id, { email: 'keep@ex.com' });
    adminDeleteMember(other.id, member.id); // wrong site → no-op
    expect(listMembers(site.id)).toHaveLength(1);
  });

  it('imports a batch: created / skipped / invalid with passwords for new rows', () => {
    const { site } = seed();
    adminCreateMember(site.id, { email: 'exists@ex.com' });
    const res = adminImportMembers(site.id, [
      { email: 'new1@ex.com', name: 'One' },
      { email: 'exists@ex.com' },
      { email: 'bad-email' },
      { email: 'new2@ex.com' },
    ]);
    expect(res.created).toBe(2);
    expect(res.skipped).toBe(1);
    expect(res.invalid).toBe(1);
    expect(res.passwords).toHaveLength(2);
    expect(verifySiteCredentials(site.id, 'new1@ex.com', res.passwords.find((p) => p.email === 'new1@ex.com')!.password)).not.toBeNull();
  });
});
