'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Leaf, ChevronLeft, ChevronRight } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { DASHBOARD_NAV, SITE } from '@/lib/constants';
import { cn } from '@/lib/utils';
import styles from './Sidebar.module.css';

function DynamicIcon({ name, size = 18 }: { name: string; size?: number }) {
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[name];
  if (!Icon) return null;
  return <Icon size={size} />;
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside className={cn(styles.sidebar, collapsed && styles.collapsed)}>
      {/* Header */}
      <div className={styles.header}>
        <Link href="/dashboard" className={styles.logo}>
          <Leaf size={24} className={styles.logoIcon} />
          {!collapsed && <span className={styles.logoText}>{SITE.name}</span>}
        </Link>
        <button
          className={styles.collapseBtn}
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        {DASHBOARD_NAV.map(section => (
          <div key={section.title} className={styles.section}>
            {!collapsed && (
              <span className={styles.sectionTitle}>{section.title}</span>
            )}
            <div className={styles.links}>
              {section.links.map(link => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.isComingSoon ? '#' : link.href}
                    className={cn(
                      styles.link,
                      isActive && styles.linkActive,
                      link.isComingSoon && styles.linkDisabled
                    )}
                    title={collapsed ? link.label : undefined}
                    aria-disabled={link.isComingSoon}
                  >
                    {link.icon && <DynamicIcon name={link.icon} />}
                    {!collapsed && (
                      <>
                        <span className={styles.linkLabel}>{link.label}</span>
                        {link.isComingSoon && (
                          <span className={styles.comingSoon}>Soon</span>
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
