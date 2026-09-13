import { NextResponse } from 'next/server';
import { resolveIdentityContext } from '@/lib/context';

export async function GET() {
  try {
    const context = await resolveIdentityContext();
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      user: context.user,
      memberships: context.memberships,
      activeMembership: context.activeMembership,
      activeOrganization: context.activeOrganization,
      isIndividual: context.isIndividual,
    });
  } catch (error) {
    console.error('[API /auth/me Error]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
