import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { SnapshotCompanion } from './SnapshotCompanion';
import type { SnapshotCategory, SnapshotRating, Snapshot } from '@/types';

interface MobileCompanionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCategory: SnapshotCategory | null;
  ratings: Record<string, SnapshotRating>;
  previousRatings?: Record<string, SnapshotRating>;
  userName: string;
  allSnapshots: Snapshot[];
}

export function MobileCompanionSheet({
  open,
  onOpenChange,
  currentCategory,
  ratings,
  previousRatings,
  userName,
  allSnapshots,
}: MobileCompanionSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] p-0 rounded-t-2xl">
        <SheetHeader className="sr-only">
          <SheetTitle>AI Companion</SheetTitle>
          <SheetDescription>Your AI-powered snapshot scoring assistant</SheetDescription>
        </SheetHeader>
        <div className="h-full">
          <SnapshotCompanion
            currentCategory={currentCategory}
            ratings={ratings}
            previousRatings={previousRatings}
            userName={userName}
            allSnapshots={allSnapshots}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
