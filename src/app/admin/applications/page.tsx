'use client';

// ==============================================
// SaveByte — Applications Management Queue
// ==============================================

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { listApplicationsAction } from '@/app/actions/adminActions';
import type { OrganizationApplicationRecord, ApplicationType, ApplicationStatus } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Search } from 'lucide-react';
import styles from '../admin.module.css';

export default function ApplicationsListPage() {
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<{ applications: OrganizationApplicationRecord[]; total: number }>({ applications: [], total: 0 });

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listApplicationsAction({
        type: typeFilter === 'ALL' ? undefined : (typeFilter as ApplicationType),
        status: statusFilter === 'ALL' ? undefined : (statusFilter as ApplicationStatus),
        search: search.trim() || undefined,
        limit: 50,
      });
      if (res.success) {
        setData({
          applications: res.applications,
          total: res.total,
        });
      }
    } catch (err) {
      console.error('Failed to load applications', err);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, search]);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const res = await listApplicationsAction({
          type: typeFilter === 'ALL' ? undefined : (typeFilter as ApplicationType),
          status: statusFilter === 'ALL' ? undefined : (statusFilter as ApplicationStatus),
          search: search.trim() || undefined,
          limit: 50,
        });
        if (!ignore && res.success) {
          setData({
            applications: res.applications,
            total: res.total,
          });
        }
      } catch (err) {
        console.error('Failed to load applications', err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [typeFilter, statusFilter, search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchApplications();
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>
          Applications Review Queue
        </h1>
        <p style={{ color: '#555', marginTop: '0.25rem' }}>
          Evaluate and verify food producer and NGO applications. Total records: <strong>{data.total}</strong>
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className={styles.tableCard} style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Type Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#666' }}>Type:</span>
            {['ALL', 'INDUSTRY', 'NGO'].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`${styles.filterBtn} ${typeFilter === t ? styles.filterBtnActive : ''}`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Status Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#666' }}>Status:</span>
            {['ALL', 'PENDING', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`${styles.filterBtn} ${statusFilter === s ? styles.filterBtnActive : ''}`}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
            <input
              type="text"
              placeholder="Search by organization name or registration number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 1rem 0.65rem 2.75rem',
                border: '2px solid var(--sb-black)',
                borderRadius: '1.5em',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <Button type="submit" variant="alt" className="is--black" style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem' }}>
            Search
          </Button>
        </form>
      </div>

      {/* Applications Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Organization</th>
                <th>Type</th>
                <th>Facility & Location</th>
                <th>Submission Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                    Loading applications queue...
                  </td>
                </tr>
              ) : data.applications.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                    No applications match the current filter criteria.
                  </td>
                </tr>
              ) : (
                data.applications.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <strong>{app.applicant?.displayName || app.contactName}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>{app.applicant?.email || app.contactEmail}</div>
                      <div style={{ fontSize: '0.75rem', color: '#888' }}>{app.contactPhone}</div>
                    </td>
                    <td>
                      <strong>{app.orgName}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>
                        ID: {app.registrationNumber || 'None'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#888' }}>
                        Category: {app.industryCategory || app.orgType}
                      </div>
                    </td>
                    <td>
                      <Badge variant={app.type === 'INDUSTRY' ? 'pink' : 'cyan'}>
                        {app.type}
                      </Badge>
                    </td>
                    <td>
                      <div><strong>{app.facilityName || 'Main Facility'}</strong></div>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>
                        {app.city}, {app.state}
                      </div>
                    </td>
                    <td>
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      {app.status === 'PENDING' && <Badge variant="yellow">PENDING</Badge>}
                      {app.status === 'UNDER_REVIEW' && <Badge variant="cyan">UNDER REVIEW</Badge>}
                      {app.status === 'CHANGES_REQUESTED' && <Badge variant="orange">CHANGES REQUESTED</Badge>}
                      {app.status === 'APPROVED' && <Badge variant="black">APPROVED</Badge>}
                      {app.status === 'REJECTED' && <Badge variant="pink">REJECTED</Badge>}
                    </td>
                    <td>
                      <Link href={`/admin/applications/${app.id}`}>
                        <Button variant="alt" className="is--black" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                          Review Dossier →
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
