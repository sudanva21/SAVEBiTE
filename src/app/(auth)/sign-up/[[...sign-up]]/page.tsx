import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { HandwrittenNote } from '@/components/ui/HandwrittenNote';
import styles from '../../auth.module.css';

export default function SignUpPage() {
  return (
    <div className={styles.page}>
      <div className={styles.authCard}>
        <div className={styles.brandHeader}>
          <Link href="/" className={styles.logoLink}>
            <span className={styles.logoStar}>✦</span>
            <span className={styles.logoText}>SAVEBiET</span>
          </Link>
          <Badge variant="black">✦ JOIN THE ECOSYSTEM</Badge>
          <HandwrittenNote rotate={2} size="medium" style={{ color: 'var(--sb-magenta)' }}>
            Start rescuing surplus with AI intelligence.
          </HandwrittenNote>
        </div>

        <div className={styles.clerkWrap}>
          <SignUp
            appearance={{
              elements: {
                rootBox: { width: '100%' },
                card: {
                  borderRadius: '2em',
                  border: '2.5px solid var(--sb-border)',
                  boxShadow: 'var(--shadow-xl)',
                  backgroundColor: 'var(--sb-white)',
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
