import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSnapshots } from '@/hooks/use-snapshots';
import { getRoleSnapshotType, SNAPSHOT_TYPE_LABELS } from '@/types';
import type { UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, ArrowRight, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import ironForumsLogo from '@/assets/iron-forums-logo.svg';

const DISMISS_KEY = 'snapshot-gate-dismissed';

function getDismissKey() {
  const now = new Date();
  return `${DISMISS_KEY}-${now.getFullYear()}-${now.getMonth() + 1}`;
}

interface SnapshotGateProps {
  children: React.ReactNode;
}

export function SnapshotGate({ children }: SnapshotGateProps) {
  const { profile } = useAuth();
  const { snapshots, isLoading } = useSnapshots();
  const navigate = useNavigate();
  const location = useLocation();
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem(getDismissKey()) === 'true';
  });

  // Don't gate the snapshot page itself
  if (location.pathname === '/snapshot') return <>{children}</>;

  if (isLoading || !profile) return <>{children}</>;

  // Check if current month snapshot exists
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const hasCurrentMonth = snapshots.some((s) => s.date.startsWith(currentMonth));

  // Also check mock data fallback — if no DB snapshots, check if demo data covers current month
  // For real users with no snapshots at all, they need to take one
  const needsSnapshot = !hasCurrentMonth;

  if (!needsSnapshot) return <>{children}</>;

  // If dismissed once this session, let them through but show a subtle banner
  if (dismissed) {
    return <>{children}</>;
  }

  }

  const role = (profile.role || 'member') as UserRole;
  const snapshotType = getRoleSnapshotType(role);
  const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const firstName = (profile.full_name || 'Brother')?.split(' ')[0];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Brand header */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <img src={ironForumsLogo} alt="Iron Forums" className="h-10 w-auto" />
        <p className="text-[0.6rem] font-body tracking-[0.25em] uppercase text-muted-foreground/60 font-semibold">
          Connect <span className="mx-0.5">»</span> Sharpen <span className="mx-0.5">»</span> Grow
        </p>
      </div>

      <div className="max-w-lg w-full text-center space-y-8 animate-slide-up-fade">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-secondary/10 flex items-center justify-center">
          <ClipboardCheck className="h-10 w-10 text-secondary" />
        </div>

        {/* Greeting */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight text-primary">
            It's time, {firstName}.
          </h1>
          <p className="text-lg font-body text-muted-foreground leading-relaxed">
            Your <span className="font-semibold text-foreground">{monthName}</span> Snapshot is ready.
            Take 10 minutes to honestly reflect on the last 30 days.
          </p>
        </div>

        {/* Snapshot type badge */}
        <div className="inline-flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2">
          <span className="text-sm font-body text-muted-foreground">Your snapshot:</span>
          <span className="text-sm font-heading font-bold text-primary">
            {SNAPSHOT_TYPE_LABELS[snapshotType]}
          </span>
        </div>

        {/* Scripture */}
        <blockquote className="text-base font-body italic text-muted-foreground border-l-2 border-secondary/40 pl-4 text-left max-w-sm mx-auto">
          "Examine yourselves to see whether you are in the faith; test yourselves."
          <span className="block text-xs mt-1 not-italic">— 2 Corinthians 13:5</span>
        </blockquote>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full sm:w-auto h-14 px-10 text-base font-heading font-bold bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2.5"
            onClick={() => navigate('/snapshot')}>
            
            Begin My Snapshot
            <ArrowRight className="h-5 w-5" />
          </Button>

          <div>
            <button
              onClick={() => {
                sessionStorage.setItem(getDismissKey(), 'true');
                setDismissed(true);
              }}
              className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
              
              I'll do it later — take me to the dashboard
            </button>
          </div>
        </div>
      </div>
    </div>);

}