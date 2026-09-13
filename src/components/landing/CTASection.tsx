import React from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { HandwrittenNote } from '@/components/ui/HandwrittenNote';
import styles from './CTASection.module.css';

export function CTASection() {
  return (
    <section className={styles.section}>
      <div className="u-container">
        <div className={styles.banner}>
          {/* Top Badge & Star */}
          <div className={styles.topRow}>
            <Badge variant="black">✦ JOIN THE ECOSYSTEM</Badge>
            <span className={styles.starGlyph}>✦</span>
          </div>

          {/* Heading */}
          <h2 className={styles.title}>
            Ready to Turn Surplus Into Impact?
          </h2>

          {/* Handwritten Annotation */}
          <HandwrittenNote rotate={-2} size="big" style={{ color: 'var(--sb-wine)' }}>
            Join 940+ enterprise kitchens, NGOs, and conscious consumers.
          </HandwrittenNote>

          <p className={styles.description}>
            Whether you manage commercial kitchens with daily excess, coordinate disaster relief shelters, 
            or recover industrial biowaste — SAVEBiET gives you real-time intelligence to ensure zero food loss.
          </p>

          {/* Dual-Pill CTA Buttons */}
          <div className={styles.actions}>
            <Button variant="alt" href="/sign-up" className="is--black">
              Get Started with SAVEBiET
            </Button>
            <Button variant="alt" href="/contact" className="is--cyan">
              Schedule Enterprise Demo
            </Button>
          </div>

          {/* Bottom Feature Badges */}
          <div className={styles.perks}>
            <div className={styles.perkItem}>
              <span className={styles.perkDot}>●</span> Instant AI Match Engine
            </div>
            <div className={styles.perkItem}>
              <span className={styles.perkDot}>●</span> IoT Cold-Chain Verification
            </div>
            <div className={styles.perkItem}>
              <span className={styles.perkDot}>●</span> Automated ESG Reports
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
