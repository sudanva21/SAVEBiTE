'use client';

// ==============================================
// SaveByte — Dashboard Layout Client Shell
// ==============================================

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, SignOutButton } from '@clerk/nextjs';
import { DASHBOARD_NAV } from '@/lib/constants';
import { Badge } from '@/components/ui/Badge';
import { OrgSwitcher } from '@/components/layout/OrgSwitcher';
import { IdentityContext } from '@/types';
import * as LucideIcons from 'lucide-react';
import styles from '@/app/(dashboard)/layout.module.css';

function NavIcon({ name, size = 18 }: { name?: string; size?: number }) {
  if (!name) return null;
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[name];
  if (!Icon) return <LucideIcons.Sparkles size={size} />;
  return <Icon size={size} />;
}

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  context: IdentityContext | null;
}

export function DashboardLayoutClient({
  children,
  context,
}: DashboardLayoutClientProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const activeOrgId = context?.activeOrganization?.id || null;
  const activeOrgName = context?.activeOrganization?.name || null;
  const activeRole = context?.activeMembership?.role || null;
  const isIndividual = context?.isIndividual ?? true;

  const orgOptions = (context?.memberships || [])
    .filter((m) => m.organization !== null)
    .map((m) => ({
      id: m.organization!.id,
      name: m.organization!.name,
      role: m.role,
      type: m.organization!.type,
    }));

  const isPlatformAdmin =
    context?.user?.role === 'PLATFORM_ADMIN' ||
    (context?.memberships || []).some((m) => m.role === 'PLATFORM_ADMIN');

  return (
    <div className={styles.container}>
      {/* Left Sidebar */}
      <aside className={`${styles.sidebar} ${mobileNavOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.brandLink}>
            <span className={styles.brandStar}>✦</span>
            <span className={styles.brandName}>SAVEBiET</span>
          </Link>
          <button
            type="button"
            className={styles.closeMobileBtn}
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation"
          >
            ✕
          </button>
        </div>

        {/* Dynamic Organization Switcher */}
        <div className={styles.orgPillWrap}>
          <OrgSwitcher
            activeOrgId={activeOrgId}
            activeOrgName={activeOrgName}
            activeRole={activeRole}
            organizations={orgOptions}
            isIndividual={isIndividual}
          />
        </div>

        <nav className={styles.sidebarNav}>
          {isPlatformAdmin && (
            <div className={styles.navGroup} style={{ marginBottom: '0.85rem' }}>
              <span className={styles.groupTitle} style={{ color: 'var(--sb-magenta)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                ✦ Governance
              </span>
              <ul className={styles.navList}>
                <li>
                  <Link
                    href="/admin"
                    className={`${styles.navItem} ${pathname.startsWith('/admin') ? styles.navItemActive : ''}`}
                    onClick={() => setMobileNavOpen(false)}
                    style={{
                      backgroundColor: 'var(--sb-pale-yellow)',
                      border: '2px solid var(--sb-black)',
                      fontWeight: 800,
                    }}
                  >
                    <span className={styles.navIcon}>
                      <NavIcon name="ShieldCheck" size={18} />
                    </span>
                    <span className={styles.navLabel}>Admin Console</span>
                    <span className={styles.soonPill} style={{ background: 'var(--sb-yellow)', color: '#000', fontWeight: 900 }}>ADMIN</span>
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {DASHBOARD_NAV.map((section) => (
            <div key={section.title} className={styles.navGroup}>
              <span className={styles.groupTitle}>{section.title}</span>
              <ul className={styles.navList}>
                {section.links.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                        onClick={() => setMobileNavOpen(false)}
                      >
                        <span className={styles.navIcon}>
                          <NavIcon name={link.icon} size={18} />
                        </span>
                        <span className={styles.navLabel}>{link.label}</span>
                        {link.isComingSoon && (
                          <span className={styles.soonPill}>Soon</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userProfilePill}>
            <UserButton />
            <div className={styles.userInfo}>
              <span className={styles.userName}>{context?.user?.displayName || 'Operator'}</span>
              <span className={styles.userEmail}>{context?.user?.email || 'active@savebiet.org'}</span>
            </div>
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <SignOutButton>
              <button 
                type="button" 
                style={{
                  width: '100%',
                  padding: '0.6em',
                  backgroundColor: 'var(--sb-cream)',
                  border: '1.5px solid var(--sb-black)',
                  borderRadius: '0.75em',
                  fontWeight: 800,
                  fontSize: '0.85em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5em',
                  boxShadow: 'var(--shadow-sm)',
                  color: 'var(--sb-black)'
                }}
              >
                <NavIcon name="LogOut" size={16} />
                Sign Out
              </button>
            </SignOutButton>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={styles.mainWrapper}>
        {/* Topbar */}
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button
              type="button"
              className={styles.menuTrigger}
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open sidebar"
            >
              ☰
            </button>
            <div className={styles.breadcrumbs}>
              <Link href="/dashboard" className={styles.crumbRoot}>SAVEBiET Command Center</Link>
              <span className={styles.crumbSep}>/</span>
              <span className={styles.crumbCurrent} style={{ textTransform: 'capitalize' }}>
                {pathname === '/dashboard' ? 'Overview' : pathname.replace(/^\//, '').replace(/-/g, ' ')}
              </span>
            </div>
          </div>

          <div className={styles.topbarRight}>
            <div className={styles.telemetryBadge}>
              <span className={styles.livePulse}>●</span>
              <span>
                {activeOrgName ? `${activeOrgName}` : 'Individual Mode'}
              </span>
            </div>
            <Badge variant="black">PROD-AP-SOUTH-1</Badge>
          </div>
        </header>

        {/* Page Content */}
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
