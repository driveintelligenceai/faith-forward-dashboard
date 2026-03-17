import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useReminders } from '@/hooks/use-reminders';
import { SetReminderSheet } from '@/components/dashboard/SetReminderSheet';
import { SNAPSHOT_CATEGORIES } from '@/data/snapshot-categories';

function relativeDue(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr + 'T00:00:00');
  const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return `In ${diff} days`;
}

function categoryColor(catId?: string): string {
  if (!catId) return 'bg-muted text-muted-foreground';
  const cat = SNAPSHOT_CATEGORIES.find(c => c.id === catId);
  if (!cat) return 'bg-muted text-muted-foreground';
  if (cat.group === 'spiritual') return 'bg-secondary/20 text-secondary-foreground';
  if (cat.group === 'personal') return 'bg-primary/10 text-primary';
  return 'bg-muted text-muted-foreground';
}

function categoryName(catId?: string): string {
  if (!catId) return '';
  return SNAPSHOT_CATEGORIES.find(c => c.id === catId)?.name || catId;
}

export function ActionItems() {
  const { getUpcoming, completeReminder } = useReminders();
  const [sheetOpen, setSheetOpen] = useState(false);
  const upcoming = getUpcoming(7);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-heading font-bold text-foreground">Action Items</h2>
          <p className="text-sm font-body text-muted-foreground">Steps to move the needle this week</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="font-body text-sm gap-1.5 text-muted-foreground hover:text-foreground min-h-[40px]"
          onClick={() => setSheetOpen(true)}
        >
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      {upcoming.length === 0 ? (
        <p className="text-sm font-body text-muted-foreground py-4 text-center">
          No upcoming reminders. You're all caught up! ✓
        </p>
      ) : (
        <div className="space-y-1.5">
          {upcoming.map(item => (
            <div
              key={item.id}
              className="flex items-start gap-3 py-3 px-1 border-b border-border/30 last:border-0 transition-all"
            >
              <Checkbox
                checked={item.completed}
                onCheckedChange={() => completeReminder(item.id)}
                className="mt-0.5 h-5 w-5 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className={`font-body text-[15px] leading-snug ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {item.text}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  {item.categoryId && (
                    <Badge variant="secondary" className={`text-xs font-body ${categoryColor(item.categoryId)}`}>
                      {categoryName(item.categoryId)}
                    </Badge>
                  )}
                  <span className={`text-xs font-body ${
                    item.dueDate < new Date().toISOString().split('T')[0] ? 'text-destructive font-semibold' : 'text-muted-foreground'
                  }`}>
                    {relativeDue(item.dueDate)}
                  </span>
                  {item.source === 'ai' && (
                    <span className="text-xs font-body text-secondary">✦ AI suggested</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <SetReminderSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
