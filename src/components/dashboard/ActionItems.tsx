import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface ActionItem {
  id: string;
  text: string;
  category: string;
  categoryColor: string;
  due: string;
}

const DEMO_ACTIONS: ActionItem[] = [
  {
    id: '1',
    text: 'Follow up with Forum brother about marketing hire',
    category: 'Marketing',
    categoryColor: 'bg-secondary/20 text-secondary-foreground',
    due: 'This week',
  },
  {
    id: '2',
    text: 'Schedule date night this week — Marriage has been declining',
    category: 'Marriage',
    categoryColor: 'bg-destructive/10 text-destructive',
    due: 'This week',
  },
  {
    id: '3',
    text: 'Book 3 gym sessions — Physical Health dropped to 4',
    category: 'Physical Health',
    categoryColor: 'bg-destructive/10 text-destructive',
    due: 'This week',
  },
];

export function ActionItems() {
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setCompleted(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg sm:text-xl font-heading font-bold text-foreground">Action Items</h2>
        <p className="text-sm font-body text-muted-foreground">Steps to move the needle this week</p>
      </div>
      <div className="space-y-2">
        {DEMO_ACTIONS.map(item => {
          const done = completed.has(item.id);
          return (
            <div
              key={item.id}
              className={`flex items-start gap-3 rounded-xl border p-4 transition-all ${
                done ? 'bg-primary/5 border-primary/20 opacity-60' : 'bg-card border-border hover:shadow-sm'
              }`}
            >
              <Checkbox
                checked={done}
                onCheckedChange={() => toggle(item.id)}
                className="mt-0.5 h-5 w-5 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className={`font-body text-base leading-snug ${done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {item.text}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className={`text-xs font-body ${item.categoryColor}`}>
                    {item.category}
                  </Badge>
                  <span className="text-xs font-body text-muted-foreground">{item.due}</span>
                </div>
              </div>
              {done && (
                <span className="text-lg shrink-0 animate-in fade-in zoom-in duration-300">✓</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
