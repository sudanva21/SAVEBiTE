import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  const body = await req.text();

  let evt: {
    type: string;
    data: {
      id?: string;
      email_addresses?: Array<{ email_address: string }>;
      phone_numbers?: Array<{ phone_number: string }>;
      first_name?: string;
      last_name?: string;
      image_url?: string;
    };
  };

  if (WEBHOOK_SECRET) {
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return NextResponse.json(
        { error: 'Missing svix verification headers' },
        { status: 400 }
      );
    }

    const wh = new Webhook(WEBHOOK_SECRET);
    try {
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as unknown as typeof evt;
    } catch (err) {
      console.error('[Clerk Webhook Verification Failed]:', err);
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }
  } else {
    try {
      evt = JSON.parse(body);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
  }

  try {
    const eventType = evt.type;

    if (eventType === 'user.created' || eventType === 'user.updated') {
      const { id, email_addresses, first_name, last_name, image_url, phone_numbers } = evt.data;

      const primaryEmail = email_addresses?.[0]?.email_address;
      const primaryPhone = phone_numbers?.[0]?.phone_number || null;
      const name = [first_name, last_name].filter(Boolean).join(' ') || null;

      if (id && primaryEmail) {
        await prisma.user.upsert({
          where: { clerkUserId: id },
          update: {
            email: primaryEmail,
            displayName: name,
            avatarUrl: image_url || null,
            phone: primaryPhone,
          },
          create: {
            clerkUserId: id,
            email: primaryEmail,
            displayName: name,
            avatarUrl: image_url || null,
            phone: primaryPhone,
          },
        });
      }
    } else if (eventType === 'user.deleted') {
      const { id } = evt.data;
      if (id) {
        await prisma.user.deleteMany({
          where: { clerkUserId: id },
        });
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[Clerk Webhook Database Sync Error]:', error);
    return NextResponse.json({ error: 'Database synchronization failed' }, { status: 500 });
  }
}
