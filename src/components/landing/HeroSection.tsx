'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { HandwrittenNote } from '@/components/ui/HandwrittenNote';
import { Badge } from '@/components/ui/Badge';
import styles from './HeroSection.module.css';

export function HeroSection() {
  return (
    <section className={styles.heroSection}>
      <div className="u-container">
        <div className={styles.heroGrid}>
          {/* Left Column: Editorial Headline & Actions */}
          <div className={styles.heroContent}>
            <div className={styles.topBadgeRow}>
              <Badge variant="orange">✦ THE ZERO-WASTE FOOD REVOLUTION</Badge>
            </div>

            <h1 className="u-heading-xxl">
              Predict food demand. Prevent surplus. Feed communities.
            </h1>

            <div className={styles.handwrittenWrap}>
              <HandwrittenNote rotate={-3} size="regular">
                1.3B tons wasted annually — We are closing the loop.
              </HandwrittenNote>
            </div>

            <p className={styles.heroParagraph}>
              SAVEBiET applies AI forecasting, real-time IoT freshness telemetry, and autonomous matching to prevent food waste at the source, redistribute edible surplus, and recover industrial byproducts.
            </p>

            <div className={styles.heroActions}>
              <Button variant="alt" href="/dashboard" className="is--black">
                Launch Command Center
              </Button>
              <Button variant="default" href="#lifecycle" className="is--orange">
                Explore Lifecycle ▷
              </Button>
            </div>

            {/* Micro Stats Pills */}
            <div className={styles.metricPillsRow}>
              <div className={styles.metricPill}>
                <span className={styles.metricDot} />
                <span className={styles.metricVal}>98.4%</span>
                <span className={styles.metricLabel}>Forecast Accuracy</span>
              </div>
              <div className={styles.metricPill}>
                <span className={styles.metricVal}>4.2M+</span>
                <span className={styles.metricLabel}>Meals Rescued</span>
              </div>
            </div>
          </div>

          {/* Right Column: Tactile Staggered Card Visual Stack */}
          <div className={styles.heroVisual}>
            <div className={styles.cardStack}>
              {/* Card 1: Batch Telemetry (Rotated -3deg) */}
              <div className={`${styles.stackCard} ${styles.card1}`}>
                <div className={styles.cardHeaderRow}>
                  <Badge variant="cyan">IoT LIVE SENSOR #842</Badge>
                  <span className={styles.freshnessScore}>99.4% Freshness</span>
                </div>
                <h3 className={styles.cardTitle}>Artisanal Sourdough & Pastry Batch</h3>
                <p className={styles.cardDetail}>
                  Grand Central Kitchen • 140 Portions • Oven Line 2
                </p>
                <div className={styles.sensorRow}>
                  <div className={styles.sensorTag}>Temp: 18.2°C</div>
                  <div className={styles.sensorTag}>Humidity: 44%</div>
                  <div className={styles.statusLiveTag}>
                    <span className={styles.livePip} /> Cold-Chain Verified
                  </div>
                </div>
              </div>

              {/* Card 2: AI Dispatch Match (Rotated 2deg) */}
              <div className={`${styles.stackCard} ${styles.card2}`}>
                <div className={styles.cardHeaderRow}>
                  <Badge variant="orange">AI AUTONOMOUS MATCH</Badge>
                  <span className={styles.etaText}>ETA 18 mins</span>
                </div>
                <h3 className={styles.cardTitle}>Bowery Community Kitchen & Shelter</h3>
                <p className={styles.cardDetail}>
                  Matched with Van #04 • 2.4 miles away • Urgent dinner service
                </p>
                <div className={styles.dispatchPill}>
                  <span>Autonomous Route Optimized</span>
                  <span className={styles.arrowIcon}>→</span>
                </div>
              </div>

              {/* Card 3: ESG Impact Micro-Card (Rotated -1deg) */}
              <div className={`${styles.stackCard} ${styles.card3}`}>
                <div className={styles.impactContent}>
                  <span className={styles.leafIcon}>🌿</span>
                  <div>
                    <strong>4.6t CO₂e Prevented Today</strong>
                    <p className={styles.impactSub}>Verified ESG carbon avoidance manifest locked</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
