'use client';

import { UserButton } from '@clerk/nextjs';
import { Bell, Search, Menu } from 'lucide-react';
import styles from './TopBar.module.css';

export function TopBar() {
  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <button className={styles.mobileMenuBtn} aria-label="Open menu">
          <Menu size={20} />
        </button>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search..."
            className={styles.searchInput}
            aria-label="Search"
          />
        </div>
      </div>

      <div className={styles.right}>
        <button className={styles.iconBtn} aria-label="Notifications">
          <Bell size={18} />
          <span className={styles.notifDot} />
        </button>
        <UserButton
          appearance={{
            elements: {
              avatarBox: { width: 32, height: 32 },
            },
          }}
        />
      </div>
    </header>
  );
}
