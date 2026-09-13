'use client';

import React from 'react';
import Link from 'next/link';
import { SITE, FOOTER_LINKS } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { HandwrittenNote } from '@/components/ui/HandwrittenNote';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      {/* Top Banner Tagline */}
      <div className={styles.taglineSection}>
        <div className="u-container">
          <div className={styles.taglineContent}>
            <span className={styles.taglineStar}>✦</span>
            <h2 className="u-heading-l" style={{ color: 'var(--sb-black)', textAlign: 'center' }}>
              Zero Waste. Infinite Impact.
            </h2>
            <HandwrittenNote rotate={-3} size="big" style={{ color: 'var(--sb-wine)' }}>
              Join the new standard in AI food intelligence.
            </HandwrittenNote>
          </div>
        </div>
      </div>

      <div className="u-container">
        {/* Newsletter & Brand Bento Grid */}
        <div className={styles.grid}>
          {/* Brand & Mission Card */}
          <div className={styles.brandCard}>
            <div className={styles.logoWrap}>
              <span className={styles.logoStar}>✦</span>
              <span className={styles.logoText}>SAVEBiET</span>
            </div>
            <p className={styles.brandDesc}>
              {SITE.description}
            </p>
            <div className={styles.socialRow}>
              <a href="#" aria-label="Twitter" className={styles.socialCircle}>𝕏</a>
              <a href="#" aria-label="LinkedIn" className={styles.socialCircle}>in</a>
              <a href="#" aria-label="Instagram" className={styles.socialCircle}>ig</a>
              <a href="#" aria-label="GitHub" className={styles.socialCircle}>git</a>
            </div>
          </div>

          {/* Newsletter Card */}
          <div className={styles.newsletterCard}>
            <div className={styles.cardHeader}>
              <h3 className="u-heading-s">Stay in the Loop</h3>
              <p className={styles.subtext}>
                Weekly AI food recovery insights, surplus trends, and sustainability briefs.
              </p>
            </div>
            <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter your work email"
                className={styles.emailInput}
                required
              />
              <Button variant="alt" className="is--black">
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        {/* Links Navigation Grid */}
        <div className={styles.linksGrid}>
          <div>
            <h4 className={styles.linkHeader}>Product</h4>
            <ul className={styles.linkList}>
              {FOOTER_LINKS.product.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className={styles.linkItem}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className={styles.linkHeader}>Ecosystem</h4>
            <ul className={styles.linkList}>
              {FOOTER_LINKS.ecosystem.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className={styles.linkItem}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className={styles.linkHeader}>Company</h4>
            <ul className={styles.linkList}>
              {FOOTER_LINKS.company.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className={styles.linkItem}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className={styles.linkHeader}>Legal & Security</h4>
            <ul className={styles.linkList}>
              {FOOTER_LINKS.legal.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className={styles.linkItem}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={styles.bottomBar}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>
          <div className={styles.bottomPill}>
            <span style={{ color: 'var(--sb-green)', marginRight: '6px' }}>●</span>
            All AI Forecasting & Telemetry Operational
          </div>
        </div>
      </div>
    </footer>
  );
}
