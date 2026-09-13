'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { HandwrittenNote } from '@/components/ui/HandwrittenNote';
import { Button } from '@/components/ui/Button';
import { Mail, MapPin, Phone, CheckCircle2 } from 'lucide-react';
import styles from './contact.module.css';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className={styles.page}>
      {/* Editorial Hero Header */}
      <section className={styles.hero}>
        <div className="u-container">
          <div className={styles.heroContent}>
            <Badge variant="black">✦ GET IN TOUCH</Badge>
            <h1 className="u-heading-xl" style={{ marginTop: '0.25em' }}>
              Let’s Connect & Collaborate.
            </h1>
            <HandwrittenNote rotate={-2} size="big" style={{ color: 'var(--sb-magenta)' }}>
              Questions, enterprise partnerships, or NGO onboarding.
            </HandwrittenNote>
            <p className={styles.heroDesc}>
              Whether you are an enterprise kitchen seeking surplus optimization, an NGO expanding your reach, 
              or a city sustainability manager — we are here to support your mission.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Content Grid */}
      <section className={styles.contactSection}>
        <div className="u-container">
          <div className={styles.grid}>
            {/* Left Column: Pastel Contact Cards */}
            <div className={styles.infoCards}>
              <div className={`${styles.infoCard} is--yellow`}>
                <div className={styles.cardHeader}>
                  <div className={styles.iconBox}>
                    <Mail size={22} />
                  </div>
                  <Badge variant="black">EMAIL</Badge>
                </div>
                <h3 className={styles.infoTitle}>Direct Inquiries</h3>
                <p className={styles.infoText}>partner@savebiet.org</p>
                <span className={styles.infoSub}>Responses within 4 business hours</span>
              </div>

              <div className={`${styles.infoCard} is--cyan`}>
                <div className={styles.cardHeader}>
                  <div className={styles.iconBox}>
                    <Phone size={22} />
                  </div>
                  <Badge variant="black">PHONE</Badge>
                </div>
                <h3 className={styles.infoTitle}>Operations Hotline</h3>
                <p className={styles.infoText}>+91 (80) 4567 8900</p>
                <span className={styles.infoSub}>24/7 emergency dispatch support</span>
              </div>

              <div className={`${styles.infoCard} is--pink`}>
                <div className={styles.cardHeader}>
                  <div className={styles.iconBox}>
                    <MapPin size={22} />
                  </div>
                  <Badge variant="black">HQ</Badge>
                </div>
                <h3 className={styles.infoTitle}>Innovation Center</h3>
                <p className={styles.infoText}>Bengaluru & Mumbai, India</p>
                <span className={styles.infoSub}>Command Center & Sensor Lab</span>
              </div>
            </div>

            {/* Right Column: Tactile Form */}
            <div className={styles.formCard}>
              {submitted ? (
                <div className={styles.successState}>
                  <CheckCircle2 size={56} style={{ color: 'var(--sb-green)' }} />
                  <h3 className="u-heading-m" style={{ color: 'var(--sb-black)', marginTop: '0.5em' }}>
                    Message Received!
                  </h3>
                  <p className={styles.successText}>
                    Thank you for reaching out to SAVEBiET. A member of our ecosystem team will contact you shortly.
                  </p>
                  <Button variant="alt" className="is--black" onClick={() => setSubmitted(false)}>
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form
                  className={styles.form}
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSubmitted(true);
                  }}
                >
                  <div className={styles.formHeader}>
                    <Badge variant="black">✦ SEND A MESSAGE</Badge>
                    <h3 className="u-heading-s" style={{ marginTop: '0.25em' }}>
                      Start the Conversation
                    </h3>
                  </div>

                  <div className={styles.inputRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="name" className={styles.label}>Full Name</label>
                      <input id="name" type="text" className={styles.input} placeholder="Jane Doe" required />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="email" className={styles.label}>Work Email</label>
                      <input id="email" type="email" className={styles.input} placeholder="jane@organization.org" required />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="orgType" className={styles.label}>Organization Type</label>
                    <select id="orgType" className={styles.select} defaultValue="donor">
                      <option value="donor">Food Donor / Commercial Kitchen</option>
                      <option value="ngo">NGO / Food Bank / Shelter</option>
                      <option value="buyer">Secondary Buyer / Processor</option>
                      <option value="industrial">Industrial Upcycler / Biogas</option>
                      <option value="logistics">Logistics / Fleet Partner</option>
                      <option value="other">Government / Researcher / Other</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="message" className={styles.label}>How can we collaborate?</label>
                    <textarea
                      id="message"
                      className={styles.textarea}
                      rows={4}
                      placeholder="Tell us about your food volume, location, or partnership goals..."
                      required
                    />
                  </div>

                  <Button variant="alt" className="is--black" style={{ width: '100%', justifyContent: 'center' }}>
                    Submit Partner Request
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
