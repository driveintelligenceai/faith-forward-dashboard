import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SNAPSHOT_CATEGORIES } from '@/data/snapshot-categories';
import { SetReminderSheet } from '@/components/dashboard/SetReminderSheet';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Bell } from 'lucide-react';
import type { Snapshot } from '@/types';

interface PulseAlert {
  emoji: string;
  headline: string;
  detail: string;
  type: 'declining' | 'stagnant' | 'growing' | 'warning';
  categoryId?: string;
}

function generateAlerts(snapshots: Snapshot[]): PulseAlert[] {
  if (snapshots.length < 3) return [];

  const alerts: PulseAlert[] = [];
  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const recent3 = sorted.slice(-3);
  const catMap = new Map(SNAPSHOT_CATEGORIES.map(c => [c.id, c.name]));
  const categoryIds = new Set(sorted[0]?.ratings.map(r => r.categoryId) || []);

  for (const catId of categoryIds) {
    const last3Scores = recent3.map(s => s.ratings.find(r => r.categoryId === catId)?.score ?? 0);
    const catName = catMap.get(catId) || catId;

    if (last3Scores[0] > last3Scores[1] && last3Scores[1] > last3Scores[2]) {
      alerts.push({
        emoji: '📉',
        headline: `${catName} has declined 3 months straight`,
        detail: `You scored ${last3Scores.join('→')}. Time to address this before it becomes a pattern.`,
        type: 'declining',
        categoryId: catId,
      });
    }

    if (last3Scores.every(s => s <= 4)) {
      if (!(last3Scores[0] > last3Scores[1] && last3Scores[1] > last3Scores[2])) {
        alerts.push({
          emoji: '⚠️',
          headline: `${catName} has been stuck at ${last3Scores[2]}`,
          detail: `It's been at ${last3Scores.join(', ')} for three months. Small steps compound.`,
          type: 'stagnant',
          categoryId: catId,
        });
      }
    }

    const latestSnap = sorted[sorted.length - 1];
    const latestRating = latestSnap.ratings.find(r => r.categoryId === catId);
    if (latestRating?.spouseScore !== undefined && latestRating.spouseScore > 0) {
      const gap = latestRating.score - latestRating.spouseScore;
      if (gap >= 2) {
        alerts.push({
          emoji: '💬',
          headline: `Your wife sees ${catName} differently`,
          detail: `You scored ${latestRating.score}, she scored ${latestRating.spouseScore}. That gap matters.`,
          type: 'warning',
          categoryId: catId,
        });
      }
    }
  }

  const recent6 = sorted.slice(-6);
  if (recent6.length >= 2) {
    let bestDelta = 0;
    let bestCat = '';
    let bestCatId = '';
    for (const catId of categoryIds) {
      const first = recent6[0].ratings.find(r => r.categoryId === catId)?.score ?? 0;
      const last = recent6[recent6.length - 1].ratings.find(r => r.categoryId === catId)?.score ?? 0;
      if (last - first > bestDelta) {
        bestDelta = last - first;
        bestCat = catMap.get(catId) || catId;
        bestCatId = catId;
      }
    }
    if (bestDelta >= 2) {
      alerts.push({
        emoji: '📈',
        headline: `${bestCat} is your growth story`,
        detail: `Up ${bestDelta} points over 6 months. Whatever you're doing, keep doing it.`,
        type: 'growing',
        categoryId: bestCatId,
      });
    }
  }

  const priority: Record<string, number> = { declining: 0, warning: 1, stagnant: 2, growing: 3 };
  alerts.sort((a, b) => priority[a.type] - priority[b.type]);
  return alerts.slice(0, 3);
}

const borderColors: Record<string, string> = {
  declining: 'border-l-destructive',
  stagnant: 'border-l-secondary',
  growing: 'border-l-primary',
  warning: 'border-l-secondary',
};

const bgColors: Record<string, string> = {
  declining: 'bg-destructive/5',
  stagnant: 'bg-secondary/5',
  growing: 'bg-primary/5',
  warning: 'bg-secondary/5',
};

export function PulseAlerts({ snapshots }: { snapshots: Snapshot[] }) {
  const alerts = generateAlerts(snapshots);
  const navigate = useNavigate();
  const [reminderSheet, setReminderSheet] = useState(false);
  const [reminderDefaults, setReminderDefaults] = useState({ text: '', categoryId: '' });

  if (alerts.length === 0) return null;

  const handleAskJames = (alert: PulseAlert) => {
    navigate('/snapshot?mode=review&tab=insights');
  };

  const handleSetReminder = (alert: PulseAlert) => {
    const catName = SNAPSHOT_CATEGORIES.find(c => c.id === alert.categoryId)?.name || '';
    setReminderDefaults({
      text: `Work on ${catName}: ${alert.headline}`,
      categoryId: alert.categoryId || '',
    });
    setReminderSheet(true);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg sm:text-xl font-heading font-bold text-foreground">Pulse</h2>
        <p className="text-sm font-body text-muted-foreground">Patterns the AI noticed in your journey</p>
      </div>
      <div className="space-y-3">
        {alerts.map((alert, i) => (
          <div
            key={i}
            className={`border-l-4 ${borderColors[alert.type]} ${bgColors[alert.type]} rounded-r-xl p-4 sm:p-5 transition-all`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl leading-none shrink-0 mt-0.5">{alert.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-bold text-base sm:text-lg text-foreground leading-snug">
                  {alert.headline}
                </p>
                <p className="font-body text-sm text-muted-foreground mt-1 leading-relaxed">
                  {alert.detail}
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => handleAskJames(alert)}
                    className="inline-flex items-center gap-1 text-sm font-body text-primary hover:text-primary/80 transition-colors min-h-[36px]"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Ask James
                  </button>
                  <button
                    onClick={() => handleSetReminder(alert)}
                    className="inline-flex items-center gap-1 text-sm font-body text-muted-foreground hover:text-foreground transition-colors min-h-[36px]"
                  >
                    <Bell className="h-3.5 w-3.5" />
                    Set reminder
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <SetReminderSheet
        open={reminderSheet}
        onOpenChange={setReminderSheet}
        defaultText={reminderDefaults.text}
        defaultCategoryId={reminderDefaults.categoryId}
      />
    </div>
  );
}
