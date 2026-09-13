import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { HandwrittenNote } from '@/components/ui/HandwrittenNote';
import styles from './ProblemSection.module.css';

export function ProblemSection() {
  return (
    <section className={styles.section} id="problem">
      <div className="u-container">
        {/* Section Header */}
        <div className={styles.header}>
          <Badge variant="black">✦ THE SUPPLY-CHAIN DISCONNECT</Badge>
          <h2 className="u-heading-l" style={{ marginTop: '0.25em' }}>
            A Broken Cycle of Waste & Hunger
          </h2>
          <HandwrittenNote rotate={-2} size="big" style={{ color: 'var(--sb-magenta)' }}>
            1/3 of all food produced is lost while millions go hungry.
          </HandwrittenNote>
          <p className={styles.introText}>
            Traditional food rescue relies on reactive, ad-hoc manual calls. By the time surplus is reported, spoilage has begun. 
            <strong> SAVEBiET</strong> replaces guesswork with predictive AI matching, real-time IoT freshness sensors, and an automated multi-tier recovery pipeline.
          </p>
        </div>

        {/* 3 Chunky Staggered Stat Cards */}
        <div className={styles.grid}>
          {/* Card 1 */}
          <div className={`${styles.card} is--pink`} style={{ transform: 'rotate(-1.5deg)' }}>
            <div className={styles.cardTop}>
              <Badge variant="black">ANNUAL LOSS</Badge>
              <span className={styles.cardEmoji}>📉</span>
            </div>
            <div className={styles.statValue}>68M</div>
            <h3 className={styles.statHeading}>Tonnes of Food Wasted</h3>
            <p className={styles.statDesc}>
              Wasted across Indian harvest, transit, commercial kitchens, and retail shelves every year.
            </p>
            <div className={styles.cardFooterNote}>
              <span>Equivalent to ₹92,000+ Crores lost</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className={`${styles.card} is--yellow`} style={{ transform: 'rotate(1.2deg)' }}>
            <div className={styles.cardTop}>
              <Badge variant="black">HUMAN COST</Badge>
              <span className={styles.cardEmoji}>🍲</span>
            </div>
            <div className={styles.statValue}>190M</div>
            <h3 className={styles.statHeading}>Citizens Undernourished</h3>
            <p className={styles.statDesc}>
              Going hungry daily despite surplus existing within a 5km radius of urban distribution hubs.
            </p>
            <div className={styles.cardFooterNote}>
              <span>Zero-visibility hyper-local gap</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className={`${styles.card} is--cyan`} style={{ transform: 'rotate(-0.8deg)' }}>
            <div className={styles.cardTop}>
              <Badge variant="black">CLIMATE TOLL</Badge>
              <span className={styles.cardEmoji}>🌍</span>
            </div>
            <div className={styles.statValue}>8%</div>
            <h3 className={styles.statHeading}>Global GHG Emissions</h3>
            <p className={styles.statDesc}>
              Generated directly by decomposing landfill food waste. Preventing waste is climate action.
            </p>
            <div className={styles.cardFooterNote}>
              <span>Scope 3 emissions reduction priority</span>
            </div>
          </div>
        </div>

        {/* Tactical Comparison Banner */}
        <div className={styles.comparisonBanner}>
          <div className={styles.compLeft}>
            <span className={styles.compLabel}>The Traditional Failure</span>
            <p className={styles.compText}>
              Slow manual calls, expired batches upon arrival, unverified quality, zero logistics routing, zero carbon credit attribution.
            </p>
          </div>
          <div className={styles.compDivider}>VS</div>
          <div className={styles.compRight}>
            <span className={styles.compLabel}>The SAVEBiET Solution</span>
            <p className={styles.compText}>
              Predictive surplus forecasting, sub-second route-optimized matching, IoT electronic nose verification, and multi-tier industrial secondary conversion.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
