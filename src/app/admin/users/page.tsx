import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import styles from '../admin.module.css';

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    include: {
      memberships: {
        include: {
          organization: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>
            User Accounts Directory
          </h1>
          <p style={{ color: '#555', marginTop: '0.25rem' }}>
            Registered platform users across individual and organizational contexts. Total: {users.length}
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
                <th>User</th>
                <th>System Role</th>
                <th>Status</th>
                <th>Organization Memberships</th>
                <th>Joined Date</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.displayName || 'Anonymous User'}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>{u.email}</div>
                    </td>
                    <td>
                      <Badge variant={u.role === 'PLATFORM_ADMIN' ? 'yellow' : 'black'}>
                        {u.role}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant="black">{u.memberships[0]?.status || 'ACTIVE'}</Badge>
                    </td>
                    <td>
                      {u.memberships && u.memberships.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          {u.memberships.map((m) => (
                            <div key={m.id} style={{ fontSize: '0.8rem' }}>
                              <strong>{m.organization?.name || 'Personal'}</strong> ({m.role})
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#888' }}>Individual Saver</span>
                      )}
                    </td>
                    <td>
                      {new Date(u.createdAt).toLocaleDateString()}
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
