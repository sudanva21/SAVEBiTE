import { Badge } from '@/components/ui/Badge';
import { HandwrittenNote } from '@/components/ui/HandwrittenNote';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-card is--yellow">
        <div className="not-found-top-row">
          <Badge variant="black">✦ 404 DISPATCH EXCEPTION</Badge>
          <span className="not-found-star">✦</span>
        </div>

        <h1 className="not-found-big-number">404</h1>
        <h2 className="u-heading-m" style={{ color: 'var(--sb-black)' }}>
          Page Not Found
        </h2>

        <HandwrittenNote rotate={-3} size="big" style={{ color: 'var(--sb-wine)' }}>
          Looks like this food route or batch has expired or moved!
        </HandwrittenNote>

        <p className="not-found-desc">
          The page you are looking for does not exist or has been relocated to another distribution sector.
        </p>

        <div className="not-found-actions">
          <Button variant="alt" href="/" className="is--black">
            Return to SAVEBiET Home
          </Button>
          <Button variant="alt" href="/dashboard" className="is--cyan">
            Go to Command Center
          </Button>
        </div>
      </div>
    </div>
  );
}
