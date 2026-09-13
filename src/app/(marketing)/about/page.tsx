import type { Metadata } from 'next';
import { Badge } from '@/components/ui/Badge';
import { HandwrittenNote } from '@/components/ui/HandwrittenNote';
import { Button } from '@/components/ui/Button';
import { Heart, Users, Globe, Lightbulb, ShieldCheck, Sparkles } from 'lucide-react';
import styles from './about.module.css';

export const metadata: Metadata = {
  title: 'About SAVEBiET | AI-Powered Food Lifecycle & Redistribution',
  description: 'Learn about SAVEBiET\'s mission to eliminate food waste and feed communities with closed-loop AI intelligence.',
};

const VALUES = [
  {
    icon: Heart,
    color: 'is--pink',
    title: 'Dignity & Empathy',
    desc: 'Every meal recovered is delivered with care, speed, and strict hygiene to preserve the dignity of recipient communities.',
  },
  {
    icon: Sparkles,
    color: 'is--cyan',
    title: 'Predictive, Not Reactive',
    desc: 'We solve food waste before it happens using AI forecasting, shelf-life decay analytics, and continuous IoT freshness telemetry.',
  },
  {
    icon: Globe,
    color: 'is--yellow',
    title: 'Climate-Grade ESG Impact',
    desc: 'Food waste is a leading driver of global GHG emissions. Every recovered kilogram directly powers verifiable Scope 3 offsets.',
  },
  {
    icon: Users,
    color: 'is--periwinkle',
    title: 'Multi-Tier Ecosystem',
    desc: 'From donor kitchens and local NGOs to secondary retail buyers and industrial bio-converters, everyone plays a role.',
  },
  {
    icon: ShieldCheck,
    color: 'is--orange',
    title: 'Zero-Spoilage Cold Chain',
    desc: 'Smart logistics and sensor integration verify temperature and safety at every handoff from kitchen to fork.',
  },
  {
    icon: Lightbulb,
    color: 'is--cyan',
    title: 'Open Tech Architecture',
    desc: 'Built on high-performance open standards, ready for digital twin simulations, IoT sensor grids, and enterprise integrations.',
  },
];

export default function AboutPage() {
  return (
    <div className={styles.page}>
      {/* Editorial Hero */}
      <section className={styles.hero}>
        <div className="u-container">
          <div className={styles.heroContent}>
            <Badge variant="black">✦ THE SAVEBiET MISSION</Badge>
            <h1 className="u-heading-xl" style={{ marginTop: '0.25em' }}>
              Feeding People, Not Landfills.
            </h1>
            <HandwrittenNote rotate={-2} size="big" style={{ color: 'var(--sb-magenta)' }}>
              Transforming surplus into nutrition through closed-loop intelligence.
            </HandwrittenNote>
            <p className={styles.heroDesc}>
              SAVEBiET is building the foundational operating system for sustainable food lifecycle management. 
              By connecting commercial kitchens, disaster shelters, community food banks, and certified industrial upcyclers, 
              we ensure no edible calorie is ever lost to landfill decay.
            </p>
          </div>
        </div>
      </section>

      {/* Core Mission Bento Grid */}
      <section className={styles.valuesSection}>
        <div className="u-container">
          <div className={styles.sectionHeader}>
            <Badge variant="black">✦ WHAT DRIVES US</Badge>
            <h2 className="u-heading-l" style={{ marginTop: '0.25em' }}>
              Our Architectural Principles
            </h2>
            <HandwrittenNote rotate={2} size="medium" style={{ color: 'var(--sb-violet)' }}>
              Built for reliability, speed, and real-world execution.
            </HandwrittenNote>
          </div>

          <div className={styles.valuesGrid}>
            {VALUES.map((val, idx) => {
              const Icon = val.icon;
              return (
                <div key={val.title} className={`${styles.valueCard} ${val.color}`}>
                  <div className={styles.valueCardTop}>
                    <div className={styles.iconBox}>
                      <Icon size={24} />
                    </div>
                    <Badge variant="black">0{idx + 1}</Badge>
                  </div>
                  <h3 className={styles.valueTitle}>{val.title}</h3>
                  <p className={styles.valueDesc}>{val.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Story & Ecosystem Strip */}
      <section className={styles.storySection}>
        <div className="u-container">
          <div className={styles.storyBanner}>
            <div className={styles.storyLeft}>
              <Badge variant="black">THE PLATFORM</Badge>
              <h2 className="u-heading-m" style={{ marginTop: '0.35em', color: 'var(--sb-black)' }}>
                Powered by the SAVEBiET Core Engine
              </h2>
              <p className={styles.storyText}>
                The SAVEBiET platform unifies demand forecasting, route-optimized dispatching, 
                and certified carbon accounting into a single real-time operations engine. 
                Whether handling 50kg or 50,000kg of food, our digital twin architecture adapts seamlessly.
              </p>
              <div className={styles.storyActions}>
                <Button variant="alt" href="/#features" className="is--black">
                  Explore Features
                </Button>
                <Button variant="alt" href="/contact" className="is--cyan">
                  Partner with SAVEBiET
                </Button>
              </div>
            </div>
            <div className={styles.storyRight}>
              <div className={`${styles.quoteCard} is--yellow`}>
                <span className={styles.quoteIcon}>“</span>
                <p className={styles.quoteText}>
                  We believe food security is an optimization challenge. With predictive data and community logistics, 
                  zero food waste is an achievable reality.
                </p>
                <div className={styles.quoteAuthor}>
                  <strong>SAVEBiET Core Team</strong>
                  <span>Engineering Sustainable Food Systems</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
