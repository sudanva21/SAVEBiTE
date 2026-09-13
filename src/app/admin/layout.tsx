import React from 'react';
import Link from 'next/link';
import { authorizationService } from '@/services/authorizationService';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  LayoutDashboard,
  ClipboardList,
  Building2,
  Users,
  History,
  ArrowLeft,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { grantPlatformAdminAction } from './actions';
import styles from './admin.module.css';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let adminContext;
  let isAuthorized = false;
  let errorMessage = '';

  try {
    const res = await authorizationService.requirePlatformAdmin();
    adminContext = res.context;
    isAuthorized = true;
  } catch (err: unknown) {
    isAuthorized = false;
    errorMessage = err instanceof Error ? err.message : 'Unauthorized access';
  }

  if (!isAuthorized) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f7f5f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}>
        <div style={{
          maxWidth: '520px',
          width: '100%',
          background: '#fff',
          border: '3px solid var(--sb-black)',
          borderRadius: '2em',
          padding: '2.5rem',
          boxShadow: '8px 8px 0px var(--sb-black)',
          textAlign: 'center',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--sb-bright-pink)',
            border: '2.5px solid var(--sb-black)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto',
          }}>
            <AlertTriangle size={32} />
          </div>

          <Badge variant="pink">ACCESS RESTRICTED (403)</Badge>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '1rem 0 0.5rem 0' }}>
            Platform Administration
          </h1>
          <p style={{ color: '#555', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
            {errorMessage || 'Access to this environment is strictly restricted to verified PLATFORM_ADMIN operators with admin:access clearance.'}
          </p>

          <div style={{
            background: '#fffdf5',
            border: '2px dashed var(--sb-black)',
            borderRadius: '1.25rem',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#666', marginBottom: '0.4rem' }}>
              ✦ Demonstration Elevation (SIH Live Demo)
            </div>
            <p style={{ fontSize: '0.85rem', color: '#444', marginBottom: '1rem', lineHeight: 1.4 }}>
              Click below to grant your active account <strong>PLATFORM_ADMIN</strong> governance clearance and enter the administration panel.
            </p>
            <form action={grantPlatformAdminAction}>
              <Button
                type="submit"
                variant="default"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  background: 'var(--sb-yellow)',
                  color: 'var(--sb-black)',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '1rem',
                  border: '2px solid var(--sb-black)',
                  boxShadow: '3px 3px 0px var(--sb-black)',
                }}
              >
                <ShieldCheck size={18} style={{ marginRight: '0.5rem' }} /> Enter as Platform Admin
              </Button>
            </form>
          </div>

          <Link href="/dashboard">
            <Button variant="alt" className="is--black" style={{ width: '100%', justifyContent: 'center' }}>
              <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} /> Return to Command Center
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adminLayout}>
      {/* Admin Sidebar */}
      <aside className={styles.sidebar}>
        <div>
          <div className={styles.sidebarHeader}>
            <Link href="/admin" className={styles.brandLink}>
              <span style={{ color: 'var(--sb-yellow)' }}>✦</span>
              <span>SAVEBiET</span>
            </Link>
            <div className={styles.brandBadge}>
              <Badge variant="yellow">PLATFORM ADMIN</Badge>
            </div>
          </div>

          <nav className={styles.navSection}>
            <Link href="/admin" className={styles.navLink}>
              <LayoutDashboard size={18} />
              <span>Overview</span>
            </Link>

            <Link href="/admin/applications" className={styles.navLink}>
              <ClipboardList size={18} />
              <span>Applications Queue</span>
            </Link>

            <Link href="/admin/organizations" className={styles.navLink}>
              <Building2 size={18} />
              <span>Organizations</span>
            </Link>

            <Link href="/admin/users" className={styles.navLink}>
              <Users size={18} />
              <span>Platform Users</span>
            </Link>

            <Link href="/admin/audit" className={styles.navLink}>
              <History size={18} />
              <span>Immutable Audit Logs</span>
            </Link>
          </nav>
        </div>

        <div className={styles.sidebarFooter}>
          <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.75rem' }}>
            Logged in as: <br />
            <strong style={{ color: '#fff' }}>{adminContext?.user.email}</strong>
          </div>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <Button variant="default" style={{ width: '100%', color: '#fff', borderColor: '#444', justifyContent: 'center' }}>
              <ArrowLeft size={14} style={{ marginRight: '0.5rem' }} /> Exit to App
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className={styles.mainContent}>
        <div className={styles.topBar}>
          <div className={styles.topBarTitle}>
            Platform Governance & Compliance Center
          </div>
          <Badge variant="black">SECURE MODE</Badge>
        </div>
        <div className={styles.pageBody}>
          {children}
        </div>
      </main>
    </div>
  );
}
