'use client';

// ==============================================
// SaveByte — Organization Switcher Component
// ==============================================

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { switchOrganizationAction } from '@/app/actions/organizationActions';
import { Building2, ChevronDown, Check, Plus, User } from 'lucide-react';
import Link from 'next/link';
import styles from './OrgSwitcher.module.css';

interface OrgOption {
  id: string;
  name: string;
  role: string;
  type: string;
}

interface OrgSwitcherProps {
  activeOrgId: string | null;
  activeOrgName: string | null;
  activeRole: string | null;
  organizations: OrgOption[];
  isIndividual: boolean;
}

export function OrgSwitcher({
  activeOrgId,
  activeOrgName,
  activeRole,
  organizations,
  isIndividual,
}: OrgSwitcherProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSwitch = (targetOrgId: string | null) => {
    setIsOpen(false);
    startTransition(async () => {
      await switchOrganizationAction(targetOrgId);
      router.refresh();
    });
  };

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.triggerBtn}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
      >
        <div className={styles.triggerMain}>
          <span className={styles.dot}>●</span>
          <div className={styles.orgMeta}>
            <span className={styles.orgName}>
              {isIndividual ? 'Personal Account' : activeOrgName || 'Primary Workspace'}
            </span>
            <span className={styles.roleBadge}>
              {isIndividual ? 'Individual' : activeRole || 'Member'}
            </span>
          </div>
        </div>
        <ChevronDown size={16} className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className={styles.backdrop} onClick={() => setIsOpen(false)} />
          <div className={styles.dropdownMenu}>
            <div className={styles.menuHeader}>
              <span>SWITCH CONTEXT</span>
            </div>

            {/* Joined Organizations List */}
            {organizations.map((org) => {
              const isSelected = !isIndividual && activeOrgId === org.id;
              return (
                <button
                  key={org.id}
                  type="button"
                  className={`${styles.menuItem} ${isSelected ? styles.menuItemActive : ''}`}
                  onClick={() => handleSwitch(org.id)}
                >
                  <div className={styles.itemLeft}>
                    <Building2 size={16} />
                    <div className={styles.itemInfo}>
                      <span className={styles.itemName}>{org.name}</span>
                      <span className={styles.itemSub}>{org.role}</span>
                    </div>
                  </div>
                  {isSelected && <Check size={16} className={styles.checkIcon} />}
                </button>
              );
            })}

            {/* Personal Mode Option */}
            <button
              type="button"
              className={`${styles.menuItem} ${isIndividual ? styles.menuItemActive : ''}`}
              onClick={() => handleSwitch(null)}
            >
              <div className={styles.itemLeft}>
                <User size={16} />
                <div className={styles.itemInfo}>
                  <span className={styles.itemName}>Personal Account</span>
                  <span className={styles.itemSub}>Individual Mode</span>
                </div>
              </div>
              {isIndividual && <Check size={16} className={styles.checkIcon} />}
            </button>

            <div className={styles.menuDivider} />

            {/* Create New Org Link */}
            <Link
              href="/onboarding"
              className={styles.createLink}
              onClick={() => setIsOpen(false)}
            >
              <Plus size={16} />
              <span>Register New Organization</span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
