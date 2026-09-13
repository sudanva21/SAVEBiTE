'use client';

import React, { useState } from 'react';
import { FOOD_LIFECYCLE } from '@/lib/constants';
import { HandwrittenNote } from '@/components/ui/HandwrittenNote';
import { Badge } from '@/components/ui/Badge';
import styles from './HowItWorksSection.module.css';

const CARD_COLORS = [
  'is--cyan',
  'is--pink',
  'is--yellow',
  'is--periwinkle',
  'is--orange',
  'is--cyan',
  'is--pink',
  'is--yellow',
  'is--periwinkle',
  'is--orange',
  'is--cyan',
  'is--pink',
];

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="lifecycle" className={styles.section}>
      <div className="u-container">
        {/* Section Header */}
        <div className={styles.header}>
          <Badge variant="black">✦ THE CLOSED-LOOP LIFECYCLE</Badge>
          <h2 className="u-heading-l" style={{ marginTop: '0.25em' }}>
            From Forecast to Fork.
          </h2>
          <HandwrittenNote rotate={2} size="big" style={{ color: 'var(--sb-violet)' }}>
            12 integrated stages of continuous food intelligence.
          </HandwrittenNote>
        </div>

        {/* Step Selector Pills */}
        <div className={styles.pillScroller}>
          {FOOD_LIFECYCLE.map((stage, idx) => (
            <button
              key={stage.key}
              type="button"
              className={`${styles.stepPill} ${activeStep === idx ? styles.activePill : ''}`}
              onClick={() => setActiveStep(idx)}
            >
              <span className={styles.pillIndex}>{String(idx + 1).padStart(2, '0')}</span>
              <span>{stage.label}</span>
            </button>
          ))}
        </div>

        {/* Highlighted Staggered Feature Deck */}
        <div className={styles.deckWrap}>
          <div className={`${styles.featuredCard} ${CARD_COLORS[activeStep]}`}>
            <div className={styles.cardHeader}>
              <span className={styles.hugeNumber}>
                {String(activeStep + 1).padStart(2, '0')}
              </span>
              <Badge variant="black">PHASE {activeStep + 1} OF 12</Badge>
            </div>

            <div className={styles.cardBody}>
              <h3 className={styles.cardTitle}>
                {FOOD_LIFECYCLE[activeStep].label}
              </h3>
              <p className={styles.cardDesc}>
                {FOOD_LIFECYCLE[activeStep].description}
              </p>
            </div>

            <div className={styles.cardFooter}>
              <div className={styles.actionPrompt}>
                <span>SAVEBiET Intelligence Engine Active</span>
                <span className={styles.starGlyph}>✦</span>
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal Staggered Cards Preview Stack */}
        <div className={styles.cardsRow}>
          {FOOD_LIFECYCLE.slice(0, 4).map((stage, idx) => {
            const rotations = [-2, 1, 2, -1];
            return (
              <div
                key={stage.key}
                className={`flow__card ${CARD_COLORS[idx]} ${styles.miniCard}`}
                style={{ transform: `rotate(${rotations[idx]}deg)` }}
                onClick={() => setActiveStep(idx)}
              >
                <div>
                  <div className={styles.miniHeader}>
                    <span className={styles.miniNum}>0{idx + 1}</span>
                    <Badge variant="black">{stage.key.toUpperCase()}</Badge>
                  </div>
                  <h4 className={styles.miniTitle}>{stage.label}</h4>
                  <p className={styles.miniDesc}>{stage.description}</p>
                </div>
                <div className={styles.miniFooter}>
                  <span>Click to view stage →</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
