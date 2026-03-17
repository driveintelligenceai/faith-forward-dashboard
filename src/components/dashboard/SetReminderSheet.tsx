import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SNAPSHOT_CATEGORIES } from '@/data/snapshot-categories';
import { useReminders } from '@/hooks/use-reminders';
import { useToast } from '@/hooks/use-toast';

interface SetReminderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultText?: string;
  defaultCategoryId?: string;
}

export function SetReminderSheet({ open, onOpenChange, defaultText = '', defaultCategoryId }: SetReminderSheetProps) {
  const { addReminder } = useReminders();
  const { toast } = useToast();
  const [text, setText] = useState(defaultText);
  const [categoryId, setCategoryId] = useState(defaultCategoryId || '');
  const [dueDate, setDueDate] = useState<Date>(addDays(new Date(), 7));

  // Reset when opened with new defaults
  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setText(defaultText);
      setCategoryId(defaultCategoryId || '');
      setDueDate(addDays(new Date(), 7));
    }
    onOpenChange(isOpen);
  };

  const handleSave = () => {
    if (!text.trim()) return;
    addReminder({
      text: text.trim(),
      categoryId: categoryId || undefined,
      dueDate: format(dueDate, 'yyyy-MM-dd'),
      source: 'user',
    });
    toast({ title: 'Reminder set', description: `Due ${format(dueDate, 'MMM d')}` });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-heading text-xl">Set a Reminder</SheetTitle>
          <SheetDescription className="font-body text-sm">
            Create a personal action item to keep yourself accountable.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 mt-6">
          <div className="space-y-2">
            <Label className="font-heading font-semibold text-sm">What do you want to do?</Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g., Schedule date night this week"
              className="font-body text-base min-h-[80px] resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-heading font-semibold text-sm">Category (optional)</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="font-body text-sm h-11">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="" className="text-sm">None</SelectItem>
                {SNAPSHOT_CATEGORIES.map(c => (
                  <SelectItem key={c.id} value={c.id} className="text-sm">{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="font-heading font-semibold text-sm">Due date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-body text-sm h-11',
                    !dueDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={(d) => d && setDueDate(d)}
                  disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className={cn('p-3 pointer-events-auto')}
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button
            size="lg"
            className="w-full h-12 font-heading font-bold text-base bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            onClick={handleSave}
            disabled={!text.trim()}
          >
            Save Reminder
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
