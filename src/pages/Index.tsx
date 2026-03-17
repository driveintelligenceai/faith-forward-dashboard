import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { MOCK_SNAPSHOTS } from '@/data/mock-data';
import { SNAPSHOT_CATEGORIES } from '@/data/snapshot-categories';
import { useSnapshots } from '@/hooks/use-snapshots';
import { ROLE_LABELS } from '@/types';
import type { UserRole } from '@/types';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardCheck,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
} from 'lucide-react';

export default function Index() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { snapshots: dbSnapshots } = useSnapshots();
  const allSnapshots = dbSnapshots.length > 0 ? dbSnapshots : MOCK_SNAPSHOTS;
  const latestSnapshot = allSnapshots[0];
  const previousSnapshot = allSnapshots[1];

  const avgScore = latestSnapshot
    ? Math.round((latestSnapshot.ratings.reduce((sum, r) => sum + r.score, 0) / latestSnapshot.ratings.length) * 10) / 10
    : 0;

  const prevAvg = previousSnapshot
    ? Math.round((previousSnapshot.ratings.reduce((sum, r) => sum + r.score, 0) / previousSnapshot.ratings.length) * 10) / 10
    : null;

  const avgDelta = prevAvg !== null ? Math.round((avgScore - prevAvg) * 10) / 10 : null;

  const topArea = latestSnapshot
    ? latestSnapshot.ratings.reduce((best, r) => (r.score > best.score ? r : best))
    : null;
  const weakArea = latestSnapshot
    ? latestSnapshot.ratings.reduce((worst, r) => (r.score < worst.score ? r : worst))
    : null;

  const topCategory = topArea ? SNAPSHOT_CATEGORIES.find(c => c.id === topArea.categoryId) : null;
  const weakCategory = weakArea ? SNAPSHOT_CATEGORIES.find(c => c.id === weakArea.categoryId) : null;

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const hasThisMonthSnapshot = latestSnapshot && latestSnapshot.date.startsWith(currentMonth);

  const firstName = (profile?.full_name || 'Brother')?.split(' ')[0];

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8">
        {/* Welcome + Role */}
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold tracking-tight text-primary">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm sm:text-base font-body text-muted-foreground mt-1">
            {profile ? ROLE_LABELS[(profile.role || 'member') as UserRole] : ''}{profile?.chapter ? ` · ${profile.chapter}` : ''}
          </p>
        </div>

        {/* Hero CTA — Take Your Snapshot */}
        <Card
          className={`cursor-pointer transition-all hover:shadow-md group ${
            hasThisMonthSnapshot
              ? 'border-primary/20 bg-primary/5'
              : 'border-secondary bg-secondary/10 shadow-sm'
          }`}
          onClick={() => navigate('/snapshot')}
        >
          <CardContent className="p-5 sm:p-7">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className={`h-14 w-14 sm:h-16 sm:w-16 rounded-2xl flex items-center justify-center shrink-0 ${
                hasThisMonthSnapshot ? 'bg-primary/10' : 'bg-secondary'
              }`}>
                <ClipboardCheck className={`h-7 w-7 sm:h-8 sm:w-8 ${
                  hasThisMonthSnapshot ? 'text-primary' : 'text-secondary-foreground'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-heading font-bold text-foreground">
                  {hasThisMonthSnapshot
                    ? 'March Snapshot Complete'
                    : 'Time for Your March Snapshot'}
                </h2>
                <p className="text-sm font-body text-muted-foreground mt-0.5">
                  {hasThisMonthSnapshot
                    ? 'View your results, trends, and AI insights →'
                    : 'Rate your last 30 days. Be honest — this is between you and God.'}
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-secondary transition-colors shrink-0" />
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <Card className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => navigate('/snapshot')}>
            <CardContent className="p-4 sm:p-5">
              <p className="text-xs sm:text-sm font-body text-muted-foreground">Overall</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <p className="text-3xl sm:text-4xl font-heading font-bold text-primary">{avgScore}</p>
                {avgDelta !== null && (
                  <span className={`inline-flex items-center text-xs font-body font-bold ${
                    avgDelta > 0 ? 'text-primary' : avgDelta < 0 ? 'text-destructive' : 'text-muted-foreground'
                  }`}>
                    {avgDelta > 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : avgDelta < 0 ? <TrendingDown className="h-3 w-3 mr-0.5" /> : <Minus className="h-3 w-3 mr-0.5" />}
                    {avgDelta > 0 ? '+' : ''}{avgDelta}
                  </span>
                )}
              </div>
              <p className="text-xs font-body text-muted-foreground">/10 avg</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-5">
              <p className="text-xs sm:text-sm font-body text-muted-foreground">Strongest</p>
              <p className="text-sm sm:text-base font-heading font-bold mt-1 truncate">{topCategory?.name ?? '—'}</p>
              <p className="text-xs font-body text-muted-foreground">{topArea?.score ?? '—'}/10</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-5">
              <p className="text-xs sm:text-sm font-body text-muted-foreground">Focus Area</p>
              <p className="text-sm sm:text-base font-heading font-bold mt-1 truncate">{weakCategory?.name ?? '—'}</p>
              <p className="text-xs font-body text-muted-foreground">{weakArea?.score ?? '—'}/10</p>
            </CardContent>
          </Card>
        </div>

        {/* Snapshots on record */}
        <Card className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => navigate('/snapshot')}>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-heading font-bold">{allSnapshots.length} Snapshots on Record</p>
              <p className="text-xs font-body text-muted-foreground mt-0.5">
                View your full history, trends, and AI insights
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
