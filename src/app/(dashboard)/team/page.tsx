'use client';

// ==============================================
// SaveByte — Organization Team & Access Management (Phase 2.1)
// ==============================================

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { HandwrittenNote } from '@/components/ui/HandwrittenNote';
import { Button } from '@/components/ui/Button';
import {
  listOrganizationMembersAction,
  inviteMemberAction,
  updateMemberRoleAction,
  updateMemberStatusAction,
} from '@/app/actions/membershipActions';
import {
  Users,
  Building2,
  UserPlus,
  UserCheck,
  UserX,
  AlertCircle,
  Plus,
  RefreshCw,
  Mail,
  ShieldAlert,
} from 'lucide-react';
import { MembershipRole, MembershipStatus, IdentityContext } from '@/types';
import styles from './team.module.css';

const ROLE_OPTIONS: Array<{ value: MembershipRole; label: string; description: string }> = [
  { value: 'ORGANIZATION_OWNER', label: 'Organization Owner', description: 'Full administrative, financial, facility, and member governance.' },
  { value: 'ORGANIZATION_ADMIN', label: 'Organization Admin', description: 'Operational management, facilities, team, and batch dispatch.' },
  { value: 'DONOR_MANAGER', label: 'Donor Manager', description: 'Food batch reporting, pantry telemetry, and ESG carbon tracking.' },
  { value: 'KITCHEN_MANAGER', label: 'Kitchen Manager', description: 'Kitchen prep forecasting, production batch logging, and freshness tracking.' },
  { value: 'PROCESSING_MANAGER', label: 'Processing Manager', description: 'Value-add processing, secondary batch purchase, and recovery streams.' },
  { value: 'NGO_COORDINATOR', label: 'NGO Coordinator', description: 'Surplus food claiming, community requests, and beneficiary distribution.' },
  { value: 'FOOD_BANK_COORDINATOR', label: 'Food Bank Coordinator', description: 'Cold storage inventory and warehouse depot distribution.' },
  { value: 'SHELTER_COORDINATOR', label: 'Shelter Coordinator', description: 'Direct shelter meal intake, emergency claiming, and distribution.' },
  { value: 'COMMUNITY_KITCHEN_MANAGER', label: 'Community Kitchen Manager', description: 'Volunteer kitchen meal prep and community matching.' },
  { value: 'BUYER', label: 'Secondary Buyer', description: 'Discounted surplus acquisition for secondary markets.' },
  { value: 'INDUSTRIAL_RECOVERY_MANAGER', label: 'Industrial Recovery Manager', description: 'Composting, biogas, and animal nutrition upcycling.' },
  { value: 'LOGISTICS_MANAGER', label: 'Logistics Fleet Manager', description: 'Vehicle routing, temperature assurance, and cold-chain dispatches.' },
  { value: 'INDIVIDUAL_USER', label: 'Individual Saver', description: 'Personal surplus claiming and micro-meal sponsorships.' },
  { value: 'PLATFORM_ADMIN', label: 'Platform Admin', description: 'System-wide governance and network administration.' },
];

interface MemberRecord {
  id: string;
  userId: string;
  organizationId: string | null;
  role: string;
  status: string;
  createdAt: string | Date;
  user?: {
    id: string;
    displayName: string | null;
    email: string | null;
    avatarUrl: string | null;
  } | null;
}

export default function TeamManagementPage() {
  const [contextData, setContextData] = useState<IdentityContext | null>(null);
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteIdentifier, setInviteIdentifier] = useState('');
  const [inviteRole, setInviteRole] = useState<MembershipRole>('DONOR_MANAGER');
  const [submitting, setSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const loadTeamData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const authRes = await fetch('/api/v1/auth/me');
      const authData = (await authRes.json()) as IdentityContext;
      setContextData(authData);

      if (!authData.isIndividual && authData.activeOrganization) {
        const rosterRes = await listOrganizationMembersAction();
        if (rosterRes.success && rosterRes.members) {
          setMembers(rosterRes.members as unknown as MemberRecord[]);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load team roster';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const authRes = await fetch('/api/v1/auth/me');
        const authData = (await authRes.json()) as IdentityContext;
        if (!ignore) {
          setContextData(authData);
        }

        if (!authData.isIndividual && authData.activeOrganization) {
          const rosterRes = await listOrganizationMembersAction();
          if (!ignore && rosterRes.success && rosterRes.members) {
            setMembers(rosterRes.members as unknown as MemberRecord[]);
          }
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : 'Failed to load team roster';
          setError(msg);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      ignore = true;
    };
  }, []);

  const activeOrg = contextData?.activeOrganization;
  const activeRole = contextData?.activeMembership?.role;
  const isIndividual = contextData?.isIndividual ?? true;

  const isOwner = activeRole === 'ORGANIZATION_OWNER';
  const isAdmin = activeRole === 'ORGANIZATION_ADMIN' || isOwner;

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteIdentifier.trim()) return;

    setSubmitting(true);
    try {
      await inviteMemberAction(inviteIdentifier, inviteRole);
      setShowInviteModal(false);
      setInviteIdentifier('');
      await loadTeamData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to invite member';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = (membershipId: string, newRole: MembershipRole) => {
    startTransition(async () => {
      try {
        await updateMemberRoleAction(membershipId, newRole);
        await loadTeamData();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to update role';
        alert(msg);
      }
    });
  };

  const handleStatusChange = (membershipId: string, newStatus: MembershipStatus) => {
    startTransition(async () => {
      try {
        await updateMemberStatusAction(membershipId, newStatus);
        await loadTeamData();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to update status';
        alert(msg);
      }
    });
  };

  const selectedRoleMeta = ROLE_OPTIONS.find((r) => r.value === inviteRole);

  const activeCount = members.filter((m) => m.status === 'ACTIVE').length;
  const invitedCount = members.filter((m) => m.status === 'INVITED').length;
  const suspendedCount = members.filter((m) => m.status === 'SUSPENDED').length;

  return (
    <div className={styles.page}>
      {/* Top Header */}
      <div className={styles.header}>
        <div>
          <Badge variant="black">✦ ACCESS CONTROL & ROSTER</Badge>
          <h1 className="u-heading-l" style={{ marginTop: '0.25em' }}>
            Organization Team & Roles
          </h1>
          <HandwrittenNote rotate={-1.5} size="medium" style={{ color: 'var(--sb-wine)' }}>
            Role capabilities and permissions are validated server-side on every request.
          </HandwrittenNote>
        </div>

        <div className={styles.headerActions}>
          <Button
            variant="alt"
            className="is--cream"
            onClick={loadTeamData}
            disabled={loading || isPending}
          >
            <RefreshCw size={15} /> Refresh
          </Button>
          {!isIndividual && isAdmin && (
            <Button
              variant="alt"
              className="is--yellow"
              onClick={() => setShowInviteModal(true)}
            >
              <UserPlus size={16} /> + Invite Team Member
            </Button>
          )}
        </div>
      </div>

      {/* Individual Mode Warning Guard */}
      {isIndividual && (
        <div className={styles.individualNoticeCard}>
          <div className={styles.contextIcon} style={{ background: 'var(--sb-bright-pink)' }}>
            <ShieldAlert size={24} style={{ color: 'var(--sb-black)' }} />
          </div>
          <h2 className="u-heading-s">Personal Mode Active</h2>
          <p style={{ maxWidth: '540px', fontSize: '0.95rem', lineHeight: '1.6', color: '#444' }}>
            You are currently operating in <strong>Personal Individual Context</strong>. Team and role management is an enterprise multi-user capability that operates across registered organizations.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
            <Link href="/profile">
              <Button variant="alt" className="is--black">
                Switch to an Organization
              </Button>
            </Link>
            <Link href="/onboarding">
              <Button variant="alt" className="is--cyan">
                <Plus size={16} /> Register New Organization
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Active Organization Context View */}
      {!isIndividual && (
        <>
          {/* Active Context Card */}
          <div className={styles.contextBanner}>
            <div className={styles.contextLeft}>
              <div className={styles.contextIcon}>
                <Building2 size={24} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: '1.1rem' }}>{activeOrg?.name}</strong>
                  {activeOrg?.type && <Badge variant="black">{activeOrg.type}</Badge>}
                  {activeRole && (
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      background: 'var(--sb-bright-pink)',
                      color: 'var(--sb-black)',
                      border: '1.5px solid var(--sb-black)',
                      borderRadius: '1em',
                      padding: '0.15rem 0.6rem',
                    }}>
                      YOUR ROLE: {activeRole}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.2rem' }}>
                  {activeOrg?.facilities?.[0]?.address
                    ? `Primary Facility: ${activeOrg.facilities[0].name} — ${activeOrg.facilities[0].address}`
                    : 'Verified Organization Workspace'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link href="/profile">
                <Button variant="alt" className="is--periwinkle" style={{ fontSize: '0.85rem' }}>
                  Switch Context
                </Button>
              </Link>
            </div>
          </div>

          {/* 4 Stat Overview Cards */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statTop}>
                <span className={styles.statLabel}>Total Members</span>
                <div className={styles.statIconBox}><Users size={18} /></div>
              </div>
              <div className={styles.statValue}>{members.length}</div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statTop}>
                <span className={styles.statLabel}>Active</span>
                <div className={styles.statIconBox} style={{ background: '#cbf3f0' }}><UserCheck size={18} /></div>
              </div>
              <div className={styles.statValue}>{activeCount}</div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statTop}>
                <span className={styles.statLabel}>Invited</span>
                <div className={styles.statIconBox} style={{ background: 'var(--sb-pale-yellow)' }}><Mail size={18} /></div>
              </div>
              <div className={styles.statValue}>{invitedCount}</div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statTop}>
                <span className={styles.statLabel}>Suspended</span>
                <div className={styles.statIconBox} style={{ background: '#fecdd3' }}><UserX size={18} /></div>
              </div>
              <div className={styles.statValue}>{suspendedCount}</div>
            </div>
          </div>

          {/* Roster Table Card */}
          <div className={styles.mainCard}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className="u-heading-s">Organization Members Roster</h2>
                <p style={{ fontSize: '0.88rem', color: '#666', marginTop: '0.2rem' }}>
                  {isAdmin
                    ? 'Manage permissions, assign domain roles, and govern member access.'
                    : 'View current team members and operational capability roles.'}
                </p>
              </div>
              <Badge variant="black">{members.length} MEMBERS REGISTERED</Badge>
            </div>

            {error && (
              <div style={{
                background: '#fee2e2',
                border: '2px solid var(--sb-black)',
                borderRadius: '1em',
                padding: '0.85rem 1.25rem',
                color: '#991b1b',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem',
                fontSize: '0.9rem',
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 0.5rem auto' }} />
                <p>Loading organization team roster...</p>
              </div>
            ) : members.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                <p>No team members found in this organization.</p>
              </div>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.rosterTable}>
                  <thead>
                    <tr>
                      <th className={styles.thCell}>Member</th>
                      <th className={styles.thCell}>Assigned Role</th>
                      <th className={styles.thCell}>Status</th>
                      <th className={styles.thCell}>Joined</th>
                      {isAdmin && <th className={styles.thCell} style={{ textAlign: 'right' }}>Access Controls</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => {
                      const isOwnerMember = member.role === 'ORGANIZATION_OWNER';
                      const canModifyTarget = isAdmin && (!isOwnerMember || isOwner);

                      const initials = (member.user?.displayName || member.user?.email || 'SB')
                        .substring(0, 2)
                        .toUpperCase();

                      return (
                        <tr key={member.id} className={styles.memberRow}>
                          {/* Member Identity */}
                          <td className={styles.tdCell}>
                            <div className={styles.userCell}>
                              <div className={styles.userAvatar}>{initials}</div>
                              <div>
                                <div className={styles.userName}>
                                  {member.user?.displayName || 'SAVEBiET Operator'}
                                </div>
                                <div className={styles.userEmail}>
                                  {member.user?.email || 'invited.user@savebiet.org'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className={styles.tdCell}>
                            {canModifyTarget && isOwner ? (
                              <select
                                className={styles.roleSelect}
                                value={member.role}
                                onChange={(e) =>
                                  handleRoleChange(member.id, e.target.value as MembershipRole)
                                }
                                disabled={isPending}
                              >
                                {ROLE_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            ) : canModifyTarget && isAdmin && !isOwnerMember ? (
                              <select
                                className={styles.roleSelect}
                                value={member.role}
                                onChange={(e) =>
                                  handleRoleChange(member.id, e.target.value as MembershipRole)
                                }
                                disabled={isPending}
                              >
                                {ROLE_OPTIONS.filter((o) => o.value !== 'ORGANIZATION_OWNER').map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className={styles.roleBadgeStatic}>{member.role}</span>
                            )}
                          </td>

                          {/* Lifecycle Status */}
                          <td className={styles.tdCell}>
                            <span
                              className={`${styles.statusPill} ${
                                member.status === 'ACTIVE'
                                  ? styles.statusActive
                                  : member.status === 'INVITED'
                                  ? styles.statusInvited
                                  : member.status === 'SUSPENDED'
                                  ? styles.statusSuspended
                                  : styles.statusRemoved
                              }`}
                            >
                              {member.status}
                            </span>
                          </td>

                          {/* Joined Date */}
                          <td className={styles.tdCell} style={{ fontSize: '0.85rem', color: '#666' }}>
                            {new Date(member.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>

                          {/* Action Controls */}
                          {isAdmin && (
                            <td className={styles.tdCell} style={{ textAlign: 'right' }}>
                              {canModifyTarget && !isOwnerMember ? (
                                <div className={styles.actionButtonGroup} style={{ justifyContent: 'flex-end' }}>
                                  {member.status === 'ACTIVE' ? (
                                    <button
                                      type="button"
                                      className={styles.iconActionBtn}
                                      title="Suspend Member"
                                      onClick={() => handleStatusChange(member.id, 'SUSPENDED')}
                                      disabled={isPending}
                                    >
                                      <UserX size={15} />
                                    </button>
                                  ) : member.status === 'SUSPENDED' ? (
                                    <button
                                      type="button"
                                      className={styles.iconActionBtn}
                                      title="Reactivate Member"
                                      onClick={() => handleStatusChange(member.id, 'ACTIVE')}
                                      disabled={isPending}
                                      style={{ background: '#cbf3f0' }}
                                    >
                                      <UserCheck size={15} />
                                    </button>
                                  ) : null}

                                  {member.status !== 'REMOVED' && (
                                    <button
                                      type="button"
                                      className={`${styles.iconActionBtn} ${styles.iconActionBtnDanger}`}
                                      title="Remove from Organization"
                                      onClick={() => {
                                        if (confirm(`Remove ${member.user?.displayName || 'this member'} from ${activeOrg?.name}?`)) {
                                          handleStatusChange(member.id, 'REMOVED');
                                        }
                                      }}
                                      disabled={isPending}
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              ) : isOwnerMember ? (
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#666' }}>
                                  Protected Owner
                                </span>
                              ) : null}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className={styles.modalOverlay} onClick={() => setShowInviteModal(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <Badge variant="black">✦ INVITE TEAM MEMBER</Badge>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setShowInviteModal(false)}
              >
                ✕
              </button>
            </div>

            <h3 className="u-heading-s" style={{ marginTop: '0.35rem' }}>
              Add Team Member to {activeOrg?.name}
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#555', marginTop: '0.2rem' }}>
              Attach a colleague or operator to your active organization context.
            </p>

            <form onSubmit={handleInviteSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>User Email or Account ID *</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="e.g. chef.rahul@hotelgrand.com or user_cuid"
                  value={inviteIdentifier}
                  onChange={(e) => setInviteIdentifier(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Operational Role *</label>
                <select
                  className={styles.formSelect}
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as MembershipRole)}
                >
                  {ROLE_OPTIONS.filter((r) => isOwner || r.value !== 'ORGANIZATION_OWNER').map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {selectedRoleMeta && (
                <div className={styles.roleDescBox}>
                  <strong>Role Capability Scope:</strong>
                  <p style={{ marginTop: '0.25rem' }}>{selectedRoleMeta.description}</p>
                </div>
              )}

              <div style={{ marginTop: '0.5rem' }}>
                <Button
                  type="submit"
                  variant="alt"
                  className="is--black"
                  style={{ width: '100%', justifyContent: 'center' }}
                  disabled={submitting}
                >
                  {submitting ? 'Adding Member...' : 'Send Organization Invitation →'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
