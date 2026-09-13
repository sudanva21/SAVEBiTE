'use client';

// ==============================================
// SaveByte — Phase 2.2 Account Type Onboarding Experience
// ==============================================

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { HandwrittenNote } from '@/components/ui/HandwrittenNote';
import { Button } from '@/components/ui/Button';
import { completePersonalOnboardingAction } from '@/app/actions/onboardingActions';
import {
  submitIndustryApplicationAction,
  submitNgoApplicationAction,
  getUserApplicationsAction,
} from '@/app/actions/applicationActions';
import {
  User,
  Building2,
  HeartHandshake,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Building,
  Utensils,
  Truck,
} from 'lucide-react';
import type { OrganizationApplicationRecord } from '@/types';
import styles from './onboarding.module.css';

const INDUSTRY_ORG_TYPES = [
  { value: 'RESTAURANT', label: 'Commercial Kitchen / Restaurant / Catering' },
  { value: 'HOTEL', label: 'Hotel / Hospitality Group' },
  { value: 'INSTITUTIONAL_KITCHEN', label: 'University / Corporate / Institutional Kitchen' },
  { value: 'FOOD_PROCESSING_UNIT', label: 'Food Processing / Value-Add Producer' },
  { value: 'DONOR', label: 'Retail / Bakery / Supermarket Donor' },
];

const NGO_ORG_TYPES = [
  { value: 'NGO', label: 'Registered Non-Profit / Relief Charity' },
  { value: 'FOOD_BANK', label: 'Food Bank / Central Cold Storage Depot' },
  { value: 'SHELTER', label: 'Shelter / Direct Community Feeding Hub' },
  { value: 'COMMUNITY_KITCHEN', label: 'Community & Volunteer Kitchen' },
];

export default function OnboardingPage() {
  const [selectedPathway, setSelectedPathway] = useState<'user' | 'industry' | 'ngo'>('industry');
  const [loading, setLoading] = useState(false);
  const [existingApps, setExistingApps] = useState<OrganizationApplicationRecord[]>([]);

  useEffect(() => {
    getUserApplicationsAction()
      .then((res) => {
        if (res.success && res.applications) {
          setExistingApps(res.applications);
        }
      })
      .catch(() => {});
  }, []);

  const handlePersonalSubmit = async () => {
    setLoading(true);
    try {
      await completePersonalOnboardingAction();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (!msg.includes('NEXT_REDIRECT')) {
        alert(msg || 'Failed to complete personal onboarding');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Active Application Banner */}
        {existingApps.length > 0 && (
          <div className={styles.activeAppBanner}>
            <div>
              <div className={styles.activeAppTitle}>
                📋 You have an existing organization application: {existingApps[0].orgName}
              </div>
              <div className={styles.activeAppSub}>
                Current Status: <strong>{existingApps[0].status}</strong> • Submitted {new Date(existingApps[0].createdAt).toLocaleDateString()}
              </div>
            </div>
            <Link href={`/onboarding/status?appId=${existingApps[0].id}`}>
              <Button variant="alt" className="is--black">
                View Application Status & Feedback →
              </Button>
            </Link>
          </div>
        )}

        {/* Header */}
        <div className={styles.header}>
          <Badge variant="black">✦ WELCOME TO SAVEBiET</Badge>
          <h1 className={styles.title}>Choose Your Account Type</h1>
          <p className={styles.subtitle}>
            Select the pathway that matches your mission. SAVEBiET maintains a decoupled identity architecture—individual users can later associate with multiple organizations.
          </p>
          <div style={{ marginTop: '0.75rem' }}>
            <HandwrittenNote rotate={-1.5} size="medium" style={{ color: 'var(--sb-wine)' }}>
              Industry and NGO accounts undergo verified review before operational activation.
            </HandwrittenNote>
          </div>
        </div>

        {/* 3 Pathway Selection Cards */}
        <div className={styles.optionsGrid}>
          {/* Pathway 1: Industry */}
          <div
            className={`${styles.optionCard} ${selectedPathway === 'industry' ? styles.optionCardSelected : ''}`}
            onClick={() => setSelectedPathway('industry')}
          >
            <div>
              <div className={styles.cardTop}>
                <div className={`${styles.iconBox} ${styles.iconBoxPink}`}>
                  <Building2 size={26} />
                </div>
                <Badge variant="pink">INDUSTRY</Badge>
              </div>
              <h2 className={styles.cardTitle}>Industry & Food Producer</h2>
              <p className={styles.cardDesc}>
                For restaurants, hotels, corporate kitchens, catering companies, and food processors generating surplus food.
              </p>
            </div>
            {selectedPathway === 'industry' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.9rem', color: 'var(--sb-black)' }}>
                <span>Fill Application Below</span>
                <ArrowRight size={16} />
              </div>
            )}
          </div>

          {/* Pathway 2: NGO */}
          <div
            className={`${styles.optionCard} ${selectedPathway === 'ngo' ? styles.optionCardSelected : ''}`}
            onClick={() => setSelectedPathway('ngo')}
          >
            <div>
              <div className={styles.cardTop}>
                <div className={`${styles.iconBox} ${styles.iconBoxPeriwinkle}`}>
                  <HeartHandshake size={26} />
                </div>
                <Badge variant="cyan">NGO / RELIEF</Badge>
              </div>
              <h2 className={styles.cardTitle}>NGOs & Relief Charity</h2>
              <p className={styles.cardDesc}>
                For non-profits, food banks, community kitchens, and shelters serving verified beneficiaries and meal programs.
              </p>
            </div>
            {selectedPathway === 'ngo' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.9rem', color: 'var(--sb-black)' }}>
                <span>Fill Application Below</span>
                <ArrowRight size={16} />
              </div>
            )}
          </div>

          {/* Pathway 3: Individual User */}
          <div
            className={`${styles.optionCard} ${selectedPathway === 'user' ? styles.optionCardSelected : ''}`}
            onClick={() => setSelectedPathway('user')}
          >
            <div>
              <div className={styles.cardTop}>
                <div className={`${styles.iconBox} ${styles.iconBoxCyan}`}>
                  <User size={26} />
                </div>
                <Badge variant="black">INDIVIDUAL</Badge>
              </div>
              <h2 className={styles.cardTitle}>Individual User</h2>
              <p className={styles.cardDesc}>
                Claim surplus food deals, sponsor community meals, fulfill localized hunger requests, or volunteer.
              </p>
            </div>
            {selectedPathway === 'user' && (
              <Button
                variant="alt"
                className="is--black"
                onClick={handlePersonalSubmit}
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {loading ? 'Activating Profile...' : 'Continue as Individual Saver →'}
              </Button>
            )}
          </div>
        </div>

        {/* Dynamic Form: Industry Onboarding Application */}
        {selectedPathway === 'industry' && (
          <div className={styles.formContainer}>
            <div className={styles.formHeader}>
              <Badge variant="pink">✦ INDUSTRY ORGANIZATION APPLICATION</Badge>
              <h3 className="u-heading-s" style={{ marginTop: '0.5rem' }}>
                Food Producer & Operational Verification
              </h3>
              <p style={{ fontSize: '0.95rem', color: '#555', marginTop: '0.25rem' }}>
                Applications are reviewed by the SAVEBiET safety and operations team. Upon approval, your organization and facility will be automatically provisioned with Owner access.
              </p>
            </div>

            <form
              action={async (formData) => {
                setLoading(true);
                try {
                  await submitIndustryApplicationAction(formData);
                } catch (err: unknown) {
                  const msg = err instanceof Error ? err.message : '';
                  if (!msg.includes('NEXT_REDIRECT')) {
                    alert(msg || 'Failed to submit application');
                  }
                } finally {
                  setLoading(false);
                }
              }}
            >
              {/* Section 1: Organization Information */}
              <div className={styles.sectionDivider}>
                <span className={styles.sectionTitle}>
                  <Building size={18} /> 1. Organization Information
                </span>
                <span className={styles.sectionBadge}>Required</span>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Organization Name *</label>
                  <input
                    type="text"
                    name="orgName"
                    className={styles.fieldInput}
                    placeholder="e.g. Grand Apex Hospitality Group"
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Organization Type *</label>
                  <select name="orgType" className={styles.fieldSelect} required defaultValue="RESTAURANT">
                    {INDUSTRY_ORG_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Industry Category *</label>
                  <input
                    type="text"
                    name="industryCategory"
                    className={styles.fieldInput}
                    placeholder="e.g. Fine Dining, Catering, Bakery, Hospitality"
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Registration / Company ID *</label>
                  <input
                    type="text"
                    name="registrationNumber"
                    className={styles.fieldInput}
                    placeholder="e.g. CIN-U74999KA2024PTC184422 or GSTIN"
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Website (Optional)</label>
                  <input
                    type="url"
                    name="website"
                    className={styles.fieldInput}
                    placeholder="https://example-hospitality.com"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Operating Hours</label>
                  <input
                    type="text"
                    name="operatingHours"
                    className={styles.fieldInput}
                    placeholder="e.g. 06:00 - 23:30 Daily"
                  />
                </div>

                <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                  <label className={styles.fieldLabel}>Organization Description</label>
                  <input
                    type="text"
                    name="description"
                    className={styles.fieldInput}
                    placeholder="Brief description of scale, food preparation lines, or culinary operations"
                  />
                </div>
              </div>

              {/* Section 2: Primary Contact */}
              <div className={styles.sectionDivider}>
                <span className={styles.sectionTitle}>
                  <User size={18} /> 2. Primary Contact
                </span>
                <span className={styles.sectionBadge}>Required</span>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Contact Person Name *</label>
                  <input
                    type="text"
                    name="contactName"
                    className={styles.fieldInput}
                    placeholder="e.g. Chef Vikram Sethi"
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Designation *</label>
                  <input
                    type="text"
                    name="contactDesignation"
                    className={styles.fieldInput}
                    placeholder="e.g. Executive Chef / Operations Director"
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Official Email *</label>
                  <input
                    type="email"
                    name="contactEmail"
                    className={styles.fieldInput}
                    placeholder="operations@grandapex.com"
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Official Phone Number *</label>
                  <input
                    type="tel"
                    name="contactPhone"
                    className={styles.fieldInput}
                    placeholder="+91 98765 43210"
                    required
                  />
                </div>
              </div>

              {/* Section 3: Facility Information */}
              <div className={styles.sectionDivider}>
                <span className={styles.sectionTitle}>
                  <MapPin size={18} /> 3. Primary Operational Facility
                </span>
                <span className={styles.sectionBadge}>Required</span>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Facility Name *</label>
                  <input
                    type="text"
                    name="facilityName"
                    className={styles.fieldInput}
                    placeholder="e.g. Central Production Kitchen"
                    defaultValue="Primary Production Kitchen"
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Facility Type *</label>
                  <select name="facilityType" className={styles.fieldSelect} required defaultValue="KITCHEN">
                    <option value="KITCHEN">Kitchen / Food Prep</option>
                    <option value="PROCESSING_UNIT">Processing / Packaging Unit</option>
                    <option value="HOTEL">Hotel Food Service</option>
                    <option value="OUTLET">Retail / Dining Outlet</option>
                    <option value="WAREHOUSE">Warehouse / Storage Hub</option>
                  </select>
                </div>

                <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                  <label className={styles.fieldLabel}>Physical Facility Address *</label>
                  <input
                    type="text"
                    name="address"
                    className={styles.fieldInput}
                    placeholder="Building, Plot No., Industrial Area, Street"
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>City *</label>
                  <input
                    type="text"
                    name="city"
                    className={styles.fieldInput}
                    placeholder="e.g. Bengaluru"
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>State *</label>
                  <input
                    type="text"
                    name="state"
                    className={styles.fieldInput}
                    placeholder="e.g. Karnataka"
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Postal Code *</label>
                  <input
                    type="text"
                    name="postalCode"
                    className={styles.fieldInput}
                    placeholder="e.g. 560001"
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Country</label>
                  <input
                    type="text"
                    name="country"
                    className={styles.fieldInput}
                    defaultValue="India"
                    readOnly
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Latitude (Optional)</label>
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    className={styles.fieldInput}
                    placeholder="e.g. 12.9716"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Longitude (Optional)</label>
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    className={styles.fieldInput}
                    placeholder="e.g. 77.5946"
                  />
                </div>
              </div>

              <div className={styles.facilityNotice}>
                <ShieldCheck size={20} style={{ color: 'var(--sb-black)', flexShrink: 0 }} />
                <span>
                  <strong>Facility Privacy Isolation:</strong> Coordinates attach exclusively to the Facility record. Personal user profiles contain zero public location telemetry.
                </span>
              </div>

              {/* Section 4: Operational Information */}
              <div className={styles.sectionDivider}>
                <span className={styles.sectionTitle}>
                  <Utensils size={18} /> 4. Operational Information
                </span>
                <span className={styles.sectionBadge}>Operations</span>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Daily Food Production (Approx)</label>
                  <input
                    type="text"
                    name="dailyFoodProduction"
                    className={styles.fieldInput}
                    placeholder="e.g. 600 meals/day or 300 kg"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Daily Food Consumption (Approx)</label>
                  <input
                    type="text"
                    name="dailyFoodConsumption"
                    className={styles.fieldInput}
                    placeholder="e.g. 500 meals/day"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Typical Surplus Quantity</label>
                  <input
                    type="text"
                    name="typicalSurplus"
                    className={styles.fieldInput}
                    placeholder="e.g. 20-50 kg / 40 portions nightly"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Food Categories Handled</label>
                  <input
                    type="text"
                    name="foodCategories"
                    className={styles.fieldInput}
                    placeholder="e.g. Cooked Buffet, Bakery & Pastry, Raw Vegetables"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Current Waste Handling Method</label>
                  <input
                    type="text"
                    name="wasteHandlingMethod"
                    className={styles.fieldInput}
                    placeholder="e.g. Municipal waste collection / local compost"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Existing Food Donation Process</label>
                  <input
                    type="text"
                    name="existingDonationProcess"
                    className={styles.fieldInput}
                    placeholder="e.g. Ad-hoc pickup by local community volunteers"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="coldStorageAvailable"
                      className={styles.checkboxInput}
                    />
                    <span>Cold-Storage / Blast Chillers Available</span>
                  </label>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="iotSensorsAvailable"
                      className={styles.checkboxInput}
                    />
                    <span>IoT Telemetry / Smart Sensors Available</span>
                  </label>
                </div>
              </div>

              <div className={styles.submitBar}>
                <Button
                  type="submit"
                  variant="alt"
                  className="is--pink"
                  disabled={loading}
                >
                  {loading ? 'Submitting Application...' : 'Submit Industry Application for Review →'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Dynamic Form: NGO Onboarding Application */}
        {selectedPathway === 'ngo' && (
          <div className={styles.formContainer}>
            <div className={styles.formHeader}>
              <Badge variant="cyan">✦ NGO & RELIEF CHARITY APPLICATION</Badge>
              <h3 className="u-heading-s" style={{ marginTop: '0.5rem' }}>
                Food Rescue & Community Feeding Partner Verification
              </h3>
              <p style={{ fontSize: '0.95rem', color: '#555', marginTop: '0.25rem' }}>
                SAVEBiET connects verified relief organizations with high-grade edible surplus. Applications are vetted to ensure cold-chain safety and humanitarian distribution.
              </p>
            </div>

            <form
              action={async (formData) => {
                setLoading(true);
                try {
                  await submitNgoApplicationAction(formData);
                } catch (err: unknown) {
                  const msg = err instanceof Error ? err.message : '';
                  if (!msg.includes('NEXT_REDIRECT')) {
                    alert(msg || 'Failed to submit application');
                  }
                } finally {
                  setLoading(false);
                }
              }}
            >
              {/* Section 1: NGO Information */}
              <div className={styles.sectionDivider}>
                <span className={styles.sectionTitle}>
                  <HeartHandshake size={18} /> 1. NGO Information
                </span>
                <span className={styles.sectionBadge}>Required</span>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>NGO / Charity Name *</label>
                  <input
                    type="text"
                    name="orgName"
                    className={styles.fieldInput}
                    placeholder="e.g. Annapoorna Community Relief Foundation"
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>NGO Type *</label>
                  <select name="orgType" className={styles.fieldSelect} required defaultValue="NGO">
                    {NGO_ORG_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Registration / Trust Number *</label>
                  <input
                    type="text"
                    name="registrationNumber"
                    className={styles.fieldInput}
                    placeholder="e.g. TRUST-REG-2019-9481 or 12A/80G ID"
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Website (Optional)</label>
                  <input
                    type="url"
                    name="website"
                    className={styles.fieldInput}
                    placeholder="https://annapoornarelief.org"
                  />
                </div>

                <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                  <label className={styles.fieldLabel}>Organization Mission / Description</label>
                  <input
                    type="text"
                    name="description"
                    className={styles.fieldInput}
                    placeholder="Brief description of your hunger relief mission, shelters, and communities served"
                  />
                </div>
              </div>

              {/* Section 2: Authorized Contact */}
              <div className={styles.sectionDivider}>
                <span className={styles.sectionTitle}>
                  <User size={18} /> 2. Authorized Contact
                </span>
                <span className={styles.sectionBadge}>Required</span>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Contact Person Name *</label>
                  <input
                    type="text"
                    name="contactName"
                    className={styles.fieldInput}
                    placeholder="e.g. Priya Sundaram"
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Designation *</label>
                  <input
                    type="text"
                    name="contactDesignation"
                    className={styles.fieldInput}
                    placeholder="e.g. Program Coordinator / Executive Trustee"
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Official Email *</label>
                  <input
                    type="email"
                    name="contactEmail"
                    className={styles.fieldInput}
                    placeholder="priya@annapoornarelief.org"
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Official Phone Number *</label>
                  <input
                    type="tel"
                    name="contactPhone"
                    className={styles.fieldInput}
                    placeholder="+91 99887 76655"
                    required
                  />
                </div>
              </div>

              {/* Section 3: Operational Information */}
              <div className={styles.sectionDivider}>
                <span className={styles.sectionTitle}>
                  <Truck size={18} /> 3. Operational & Service Details
                </span>
                <span className={styles.sectionBadge}>Required</span>
              </div>

              <div className={styles.formGrid}>
                <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                  <label className={styles.fieldLabel}>Operational Address / Headquarters *</label>
                  <input
                    type="text"
                    name="address"
                    className={styles.fieldInput}
                    placeholder="Shelter address, community center, or distribution warehouse"
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>City *</label>
                  <input
                    type="text"
                    name="city"
                    className={styles.fieldInput}
                    placeholder="e.g. Bengaluru"
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>State *</label>
                  <input
                    type="text"
                    name="state"
                    className={styles.fieldInput}
                    placeholder="e.g. Karnataka"
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Postal Code *</label>
                  <input
                    type="text"
                    name="postalCode"
                    className={styles.fieldInput}
                    placeholder="e.g. 560025"
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Service Area / Coverage Zone</label>
                  <input
                    type="text"
                    name="serviceArea"
                    className={styles.fieldInput}
                    placeholder="e.g. East Bangalore, Indiranagar & surrounding 15km"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Approximate Beneficiaries Served</label>
                  <input
                    type="number"
                    name="beneficiariesServed"
                    className={styles.fieldInput}
                    placeholder="e.g. 850"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Approximate Meals Served / Day</label>
                  <input
                    type="number"
                    name="mealsPerDay"
                    className={styles.fieldInput}
                    placeholder="e.g. 500"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Food Categories Accepted</label>
                  <input
                    type="text"
                    name="foodCategories"
                    className={styles.fieldInput}
                    placeholder="e.g. Cooked Rice/Curry, Packaged Dry Goods, Breads"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Preferred Pickup / Delivery Windows</label>
                  <input
                    type="text"
                    name="pickupDeliveryWindows"
                    className={styles.fieldInput}
                    placeholder="e.g. 13:00 - 15:00, 20:30 - 23:00"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="storageAvailable"
                      className={styles.checkboxInput}
                    />
                    <span>Ambient Dry Storage Facility Available</span>
                  </label>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="coldStorageAvailable"
                      className={styles.checkboxInput}
                    />
                    <span>Refrigerated / Cold Storage Available</span>
                  </label>
                </div>
              </div>

              <div className={styles.submitBar}>
                <Button
                  type="submit"
                  variant="alt"
                  className="is--periwinkle"
                  disabled={loading}
                >
                  {loading ? 'Submitting Application...' : 'Submit NGO Application for Review →'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
