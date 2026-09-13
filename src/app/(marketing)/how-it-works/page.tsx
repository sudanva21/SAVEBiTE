import type { Metadata } from 'next';
import { Badge } from '@/components/ui/Badge';
import { HandwrittenNote } from '@/components/ui/HandwrittenNote';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { Button } from '@/components/ui/Button';
import styles from './how-it-works.module.css';

export const metadata: Metadata = {
  title: 'How It Works | SAVEBiET AI Closed-Loop Lifecycle',
  description: 'Explore the 12-stage SAVEBiET closed-loop food intelligence engine from prediction and quality sensing to redistribution and ESG measurement.',
};

const ACTORS = [
  {
    role: 'Food Donors & Kitchens',
    color: 'is--yellow',
    desc: 'Commercial kitchens, banquet halls, supermarkets, and corporate cafeterias receive AI production guides and 1-click surplus dispatch.',
    perks: ['Smart batch forecasting', 'IoT freshness scanning', 'Automated tax & ESG offset certificates'],
  },
  {
    role: 'NGOs, Food Banks & Shelters',
    color: 'is--cyan',
    desc: 'Verified relief organizations post live beneficiary requirements and receive routed delivery batches directly to their doorsteps.',
    perks: ['Instant broadcast matching', 'Sub-second acceptance routing', 'Zero logistics cost on volunteer network'],
  },
  {
    role: 'Industrial Upcyclers & Biogas',
    color: 'is--pink',
    desc: 'Non-edible organic surplus is diverted to certified composting and bioenergy facilities for circular economy repurposing.',
    perks: ['Automated purity grading', 'Bulk transport scheduling', 'Verified landfill diversion credits'],
  },
];

export default function HowItWorksPage() {
  return (
    <div className={styles.page}>
      {/* Editorial Hero Header */}
      <section className={styles.hero}>
        <div className="u-container">
          <div className={styles.heroContent}>
            <Badge variant="black">✦ THE CLOSED-LOOP OPERATING SYSTEM</Badge>
            <h1 className="u-heading-xl" style={{ marginTop: '0.25em' }}>
              How SAVEBiET Eliminates Food Waste
            </h1>
            <HandwrittenNote rotate={-2} size="big" style={{ color: 'var(--sb-wine)' }}>
              12 integrated stages of continuous food intelligence.
            </HandwrittenNote>
            <p className={styles.heroDesc}>
              Traditional food donation is reactive and unreliable. SAVEBiET re-engineers the entire flow with 
              predictive AI, cold-chain telemetry, and automated multi-tier distribution networks.
            </p>
          </div>
        </div>
      </section>

      {/* 12-Stage Interactive Lifecycle Section */}
      <HowItWorksSection />

      {/* Stakeholder Deep Dive Section */}
      <section className={styles.actorsSection}>
        <div className="u-container">
          <div className={styles.sectionHeader}>
            <Badge variant="black">✦ MULTI-TIER ECOSYSTEM</Badge>
            <h2 className="u-heading-l" style={{ marginTop: '0.25em' }}>
              Built for Every Stakeholder
            </h2>
            <HandwrittenNote rotate={1.5} size="medium" style={{ color: 'var(--sb-magenta)' }}>
              Synchronized coordination across the entire supply chain.
            </HandwrittenNote>
          </div>

          <div className={styles.actorsGrid}>
            {ACTORS.map((actor) => (
              <div key={actor.role} className={`${styles.actorCard} ${actor.color}`}>
                <div className={styles.actorHeader}>
                  <Badge variant="black">TIER</Badge>
                  <h3 className={styles.actorTitle}>{actor.role}</h3>
                </div>
                <p className={styles.actorDesc}>{actor.desc}</p>
                <div className={styles.perksList}>
                  {actor.perks.map((p) => (
                    <div key={p} className={styles.perkItem}>
                      <span className={styles.perkDot}>●</span>
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Callout */}
          <div className={styles.ctaBox}>
            <div className={styles.ctaContent}>
              <h3 className="u-heading-m" style={{ color: 'var(--sb-black)' }}>
                Ready to Experience SAVEBiET in Action?
              </h3>
              <p className={styles.ctaSub}>
                Join our network of food donors, recovery partners, and community organizers today.
              </p>
            </div>
            <div className={styles.ctaActions}>
              <Button variant="alt" href="/sign-up" className="is--black">
                Get Started Now
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
