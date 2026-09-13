import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import '@/styles/globals.css';
import { SITE } from '@/lib/constants';

export const metadata: Metadata = {
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  keywords: [
    'food waste',
    'food rescue',
    'surplus food',
    'food donation',
    'zero waste',
    'sustainability',
    'NGO',
    'community',
    'India',
  ],
  authors: [{ name: SITE.name }],
  openGraph: {
    type: 'website',
    locale: SITE.locale,
    siteName: SITE.name,
    title: SITE.name,
    description: SITE.description,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
