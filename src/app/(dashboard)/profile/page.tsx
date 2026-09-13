'use client';

// ==============================================
// SaveByte — Profile & Multi-Organization Management (Phase 2)
// ==============================================

import React, { useState, useEffect, useTransition } from 'react';
import { useUser } from '@clerk/nextjs';
import { Badge } from '@/components/ui/Badge';
import { HandwrittenNote } from '@/components/ui/HandwrittenNote';
import { Button } from '@/components/ui/Button';
import {
  switchOrganizationAction,
  createOrganizationAction,
} from '@/app/actions/organizationActions';
import Link from 'next/link';
import {
  Building2,
  Shield,
  MapPin,
  Mail,
  User,
  Check,
  Plus,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { IdentityContext } from '@/types';
import styles from './profile.module.css';

const ORG_TYPES = [
  { value: 'DONOR', label: 'Commercial Kitchen / Restaurant / Catering' },
  { value: 'HOTEL', label: 'Hotel / Hospitality Group' },
  { value: 'INSTITUTIONAL_KITCHEN', label: 'University / Corporate / Institutional Kitchen' },
  { value: 'FOOD_PROCESSING_UNIT', label: 'Food Processing / Value-Add Producer' },
  { value: 'NGO', label: 'Registered NGO / Relief Charity' },
  { value: 'FOOD_BANK', label: 'Food Bank / Central Cold Storage Depot' },
  { value: 'SHELTER', label: 'Shelter / Direct Community Feeding Hub' },
  { value: 'COMMUNITY_KITCHEN', label: 'Community & Volunteer Kitchen' },
  { value: 'SECONDARY_BUYER', label: 'Secondary Discount Buyer' },
  { value: 'INDUSTRIAL_RECOVERY_PARTNER', label: 'Biogas / Composting / Industrial Recovery' },
  { value: 'LOGISTICS_PARTNER', label: 'Logistics / Cold-Chain Fleet Provider' },
];

export default function ProfilePage() {
  const { user } = useUser();
  const [contextData, setContextData] = useState<IdentityContext | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [, startTransition] = useTransition();

  const loadData = () => {
    fetch('/api/v1/auth/me')
      .then((res) => res.json())
      .then((data) => setContextData(data))
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  const memberships = contextData?.memberships || [];
  const activeOrgId = contextData?.activeOrganization?.id || null;
  const isIndividual = contextData?.isIndividual ?? false;

  const handleSwitchOrg = (targetOrgId: string | null) => {
    startTransition(async () => {
      await switchOrganizationAction(targetOrgId);
      loadData();
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <Badge variant="black">✦ IDENTITY & ACCESS CONTROL</Badge>
          <h1 className="u-heading-l" style={{ marginTop: '0.25em' }}>
            Profile & Organization Memberships
          </h1>
          <HandwrittenNote rotate={-1.5} size="medium" style={{ color: 'var(--sb-wine)' }}>
            Decoupled identity: A single person can participate across multiple organizations.
          </HandwrittenNote>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {!isIndividual && (
            <Link href="/dashboard/team">
              <Button variant="alt" className="is--cyan">
                <Users size={16} /> Manage Team & Roles
              </Button>
            </Link>
          )}
          <Button
            variant="alt"
            className="is--yellow"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={16} /> Register Organization
          </Button>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Left Column: Human Identity Profile */}
        <div className={styles.leftCol}>
          <div className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.avatarBox}>
                <User size={28} />
              </div>
              <Badge variant="black">AUTHENTICATED IDENTITY</Badge>
            </div>
            <h2 className="u-heading-s">{user?.fullName || contextData?.user?.displayName || 'SAVEBiET Operator'}</h2>
            <p className={styles.userEmailText}>{user?.primaryEmailAddress?.emailAddress || contextData?.user?.email || 'operator@savebiet.org'}</p>

            <div className={styles.detailList}>
              <div className={styles.detailItem}>
                <Mail size={16} />
                <span>Email: <strong>{user?.primaryEmailAddress?.emailAddress || contextData?.user?.email || 'operator@savebiet.org'}</strong></span>
              </div>
              <div className={styles.detailItem}>
                <Building2 size={16} />
                <span>Active Context: <strong>{isIndividual ? 'Personal Individual' : contextData?.activeOrganization?.name || 'None'}</strong></span>
              </div>
              <div className={styles.detailItem}>
                <Shield size={16} />
                <span>Active Role: <strong>{isIndividual ? 'INDIVIDUAL_USER' : contextData?.activeMembership?.role || 'None'}</strong></span>
              </div>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className={styles.card} style={{ background: 'var(--sb-pale-yellow)' }}>
            <div className={styles.cardTop}>
              <div className={styles.iconBox}>
                <ShieldAlert size={20} />
              </div>
              <Badge variant="black">LOCATION PRIVACY</Badge>
            </div>
            <h3 className="u-heading-s">Zero Public Coordinates</h3>
            <p className={styles.cardDesc}>
              SAVEBiET strictly decouples your personal identity from operational locations. Geographic coordinates attach exclusively to verified operational Facilities under your organizations.
            </p>
          </div>
        </div>

        {/* Right Column: Real Multi-Organization Memberships */}
        <div className={styles.rightCol}>
          <div className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.iconBox}>
                <Building2 size={20} />
              </div>
              <Badge variant="black">MEMBERSHIPS ({memberships.length})</Badge>
            </div>
            <h3 className="u-heading-s">Your Organization Memberships</h3>
            <p className={styles.cardDesc}>
              Switch between your operational contexts. Server-side authorization validates your role and permissions on every request.
            </p>

            <div className={styles.rolesList}>
              {/* Personal Context Option */}
              <div
                className={`${styles.roleCard} ${isIndividual ? styles.roleCardActive : ''}`}
                onClick={() => handleSwitchOrg(null)}
              >
                <div className={styles.roleCardHeader}>
                  <div className={styles.roleTitleRow}>
                    <div className={`${styles.radioCircle} ${isIndividual ? styles.radioSelected : ''}`}>
                      {isIndividual && <Check size={12} />}
                    </div>
                    <div>
                      <h4 className={styles.roleTitle}>Personal Account</h4>
                      <span style={{ fontSize: '0.75rem', color: '#666' }}>Role: INDIVIDUAL_USER</span>
                    </div>
                  </div>
                  {isIndividual && <Badge variant="black">ACTIVE CONTEXT</Badge>}
                </div>
                <p className={styles.roleDesc}>
                  Operate in personal citizen mode to volunteer, claim individual portions, or sponsor meals.
                </p>
              </div>

              {/* Organization Memberships */}
              {memberships.map((m) => {
                const org = m.organization;
                if (!org) return null;
                const isSelected = !isIndividual && activeOrgId === org.id;
                const primaryFacility = org.facilities?.[0];

                return (
                  <div
                    key={m.id}
                    className={`${styles.roleCard} ${isSelected ? styles.roleCardActive : ''}`}
                    onClick={() => handleSwitchOrg(org.id)}
                  >
                    <div className={styles.roleCardHeader}>
                      <div className={styles.roleTitleRow}>
                        <div className={`${styles.radioCircle} ${isSelected ? styles.radioSelected : ''}`}>
                          {isSelected && <Check size={12} />}
                        </div>
                        <div>
                          <h4 className={styles.roleTitle}>{org.name}</h4>
                          <span style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', fontWeight: 700 }}>
                            {org.type} • {m.role}
                          </span>
                        </div>
                      </div>
                      {isSelected ? (
                        <Badge variant="black">ACTIVE CONTEXT</Badge>
                      ) : (
                        <span className={`${styles.statusPill} ${m.status === 'ACTIVE' ? styles.statusActive : ''}`}>
                          {m.status}
                        </span>
                      )}
                    </div>
                    {org.description && <p className={styles.roleDesc}>{org.description}</p>}
                    {primaryFacility && (
                      <div style={{ fontSize: '0.78rem', color: '#555', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <MapPin size={12} />
                        <span>Facility: {primaryFacility.name} ({primaryFacility.city || 'India'})</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Register New Organization */}
      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <Badge variant="black">✦ REGISTER NEW ORGANIZATION</Badge>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            <h3 className="u-heading-s" style={{ marginTop: '0.25em' }}>
              Create Organization & Primary Facility
            </h3>
            <p className={styles.modalSub}>
              You will automatically become the <strong>ORGANIZATION_OWNER</strong> of this organization.
            </p>

            <form
              action={async (formData) => {
                await createOrganizationAction(formData);
                setShowCreateModal(false);
                loadData();
              }}
              className={styles.modalForm}
            >
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Organization Name *</label>
                <input
                  type="text"
                  name="name"
                  className={styles.formInput}
                  placeholder="e.g. Harvest Bakery Hub / City Relief"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Organization Type *</label>
                <select name="type" className={styles.formInput} required defaultValue="DONOR">
                  {ORG_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Primary Facility Name *</label>
                <input
                  type="text"
                  name="facilityName"
                  className={styles.formInput}
                  placeholder="e.g. Production Kitchen #1"
                  defaultValue="Main Operating Facility"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Physical Facility Address *</label>
                <input
                  type="text"
                  name="address"
                  className={styles.formInput}
                  placeholder="Street address, unit number"
                  required
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>City / Zone</label>
                  <input type="text" name="city" className={styles.formInput} placeholder="e.g. Bengaluru" required />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>State</label>
                  <input type="text" name="state" className={styles.formInput} placeholder="e.g. Karnataka" required />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <Button variant="alt" className="is--black" style={{ width: '100%', justifyContent: 'center' }}>
                  Create Organization & Establish Owner Membership →
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
