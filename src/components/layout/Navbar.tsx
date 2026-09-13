'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/Button';
import { MARKETING_NAV } from '@/lib/constants';
import { cn } from '@/lib/utils';
import styles from './Navbar.module.css';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const { isSignedIn } = useUser();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          styles.header,
          isScrolled && styles.isScrolled
        )}
      >
        <div className={styles.inner}>
          {/* Logo */}
          <div className={styles.brand}>
            <Link href="/" className={styles.logoLink}>
              <span className={styles.logoStar}>✦</span>
              <span className={styles.logoText}>SAVEBiET</span>
            </Link>
          </div>

          {/* Desktop Central Pills */}
          <nav className={styles.navCapsule}>
            {MARKETING_NAV.map((link) => (
              <Link
                key={`${link.label}-${link.href}`}
                href={link.href}
                className={cn(
                  styles.navPill,
                  pathname === link.href && styles.navPillActive
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Right Actions (Dual-Pill) */}
          <div className={styles.actions}>
            {isSignedIn ? (
              <div className={styles.signedInWrap}>
                <Button variant="alt" href="/dashboard" className="is--orange">
                  Command Center
                </Button>
                <div className={styles.userButtonWrap}>
                  <UserButton />
                </div>
              </div>
            ) : (
              <div className={styles.authRow}>
                <SignInButton mode="modal">
                  <button type="button" className={styles.signInTextBtn}>
                    Log-in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button variant="alt" className="is--black">
                    Join SAVEBiET
                  </Button>
                </SignUpButton>
              </div>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <div className={styles.mobileTriggerWrap}>
            <button
              type="button"
              className={styles.mobileMenuBtn}
              onClick={() => setIsOpen(true)}
              aria-label="Open menu"
            >
              <span>Menu</span>
              <span className={styles.mobileBtnIcon}>☰</span>
            </button>
          </div>
        </div>
      </header>

      {/* Fullscreen Mobile Menu Drawer */}
      <div className={cn(styles.mobileDrawer, isOpen && styles.isOpen)}>
        <div className={styles.drawerInner}>
          <div className={styles.drawerHeader}>
            <Link href="/" className={styles.logoLink} onClick={() => setIsOpen(false)}>
              <span className={styles.logoStar}>✦</span>
              <span className={styles.logoText}>SAVEBiET</span>
            </Link>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          <nav className={styles.drawerNav}>
            {MARKETING_NAV.map((link) => (
              <Link
                key={`mobile-${link.label}-${link.href}`}
                href={link.href}
                className={styles.drawerNavLink}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className={styles.drawerFooter}>
            {isSignedIn ? (
              <Button
                variant="alt"
                href="/dashboard"
                className="is--orange"
                style={{ width: '100%' }}
              >
                Go to Command Center
              </Button>
            ) : (
              <div className={styles.drawerAuthCol}>
                <SignUpButton mode="modal">
                  <Button
                    variant="alt"
                    className="is--black"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    Sign Up / Log In
                  </Button>
                </SignUpButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
