// ==============================================
// SaveByte — Dashboard Server Layout
// ==============================================

import React from 'react';
import { resolveIdentityContext } from '@/lib/context';
import { DashboardLayoutClient } from '@/components/layout/DashboardLayoutClient';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await resolveIdentityContext();

  return (
    <DashboardLayoutClient context={context}>
      {children}
    </DashboardLayoutClient>
  );
}
