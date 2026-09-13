import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import styles from '../admin.module.css';

export default async function AdminOrganizationsPage() {
  const orgs = await prisma.organization.findMany({
    include: {
      facilities: true,
      memberships: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>
            Provisioned Organizations
          </h1>
          <p style={{ color: '#555', marginTop: '0.25rem' }}>
            Active organizations and food operational hubs. Total: {orgs.length}
          </p>
        </div>
        <Link href="/admin">
          <Button variant="default">
            <ArrowLeft size={16} style={{ marginRight: '0.4rem' }} /> Overview
          </Button>
        </Link>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Organization</th>
                <th>Type</th>
                <th>Status</th>
                <th>Facilities</th>
                <th>Active Members</th>
                <th>Created Date</th>
              </tr>
            </thead>
            <tbody>
              {orgs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                    No organizations currently provisioned.
                  </td>
                </tr>
              ) : (
                orgs.map((org) => (
                  <tr key={org.id}>
                    <td>
                      <strong>{org.name}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>ID: <code>{org.id}</code></div>
                    </td>
                    <td>
                      <Badge variant="black">{org.type}</Badge>
                    </td>
                    <td>
                      <Badge variant={org.isVerified ? 'yellow' : 'black'}>
                        {org.isVerified ? 'VERIFIED' : 'ACTIVE'}
                      </Badge>
                    </td>
                    <td>
                      {org.facilities?.length || 0} facilities
                      {org.facilities?.[0] && (
                        <div style={{ fontSize: '0.75rem', color: '#777' }}>
                          Primary: {org.facilities[0].name} ({org.facilities[0].city})
                        </div>
                      )}
                    </td>
                    <td>
                      {org.memberships?.length || 0} members
                    </td>
                    <td>
                      {new Date(org.createdAt).toLocaleDateString()}
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
