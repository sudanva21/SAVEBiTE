import { NextRequest, NextResponse } from 'next/server';
import { authorizationService } from '@/services/authorizationService';
import { organizationService } from '@/services/organizationService';
import { CreateOrganizationInput } from '@/types';

export async function GET() {
  try {
    const context = await authorizationService.requireContext();
    const organizations = await organizationService.listForUser(context.user.id);
    return NextResponse.json({ organizations });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to list organizations';
    return NextResponse.json(
      { error: message },
      { status: message.includes('Authentication') ? 401 : 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const context = await authorizationService.requireContext();
    const body = (await req.json()) as CreateOrganizationInput;

    if (!body.name || !body.primaryFacility?.address) {
      return NextResponse.json(
        { error: 'Organization name and primary facility address are required' },
        { status: 400 }
      );
    }

    const result = await organizationService.createOrganization(context.user.id, body);
    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create organization';
    return NextResponse.json(
      { error: message },
      { status: message.includes('Authentication') ? 401 : 500 }
    );
  }
}
