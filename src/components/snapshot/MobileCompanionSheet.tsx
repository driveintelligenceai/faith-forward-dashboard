import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { SnapshotCompanion } from './SnapshotCompanion';
import { JourneyChat } from './JourneyChat';
import type { SnapshotCategory, SnapshotRating, Snapshot } from '@/types';

interface MobileCompanionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCategory: SnapshotCategory | null;
  ratings: Record<string, SnapshotRating>;
  previousRatings?: Record<string, SnapshotRating>;
  userName: string;
  allSnapshots: Snapshot[];
  categories?: SnapshotCategory[];
  mode?: 'scoring' | 'journey';
}

export function MobileCompanionSheet({
  open,
  onOpenChange,
  currentCategory,
  ratings,
  previousRatings,
  userName,
  allSnapshots,
  categories,
  mode = 'scoring',
}: MobileCompanionSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[75vh] p-0 rounded-t-3xl border-t border-border/40 shadow-2xl"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{mode === 'journey' ? 'Ask James' : 'Your Snapshot Mentor'}</SheetTitle>
          <SheetDescription>
            {mode === 'journey'
              ? 'Chat with James about your Snapshot journey'
              : 'A personal reflection space with your mentor, James'}
          </SheetDescription>
        </SheetHeader>
        {/* Swipe handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border/60" />
        </div>
        <div className="h-[calc(100%-20px)]">
          {mode === 'journey' && categories ? (
            <JourneyChat
              snapshots={allSnapshots}
              categories={categories}
              userName={userName}
            />
          ) : (
            <SnapshotCompanion
              currentCategory={currentCategory}
              ratings={ratings}
              previousRatings={previousRatings}
              userName={userName}
              allSnapshots={allSnapshots}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
