import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { MOCK_CHAPTERS, MOCK_MEMBERS } from '@/data/mock-data';
import type { Chapter } from '@/types';
import { MapPin, Clock, Users, Star } from 'lucide-react';

export default function Leadership() {
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);

  const chapterMembers = selectedChapter
    ? MOCK_MEMBERS.filter((m) => m.chapter === selectedChapter.name)
    : [];

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8 max-w-5xl">

        {/* ── Page Header ── */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-primary tracking-tight">
            Leadership
          </h1>
          <p className="text-sm sm:text-base font-body text-muted-foreground mt-1">
            Growth &amp; mentoring
          </p>
        </div>

        {/* ── Chapter Directory ── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-heading font-bold text-foreground">
              CHAPTERS
            </h2>
            <Badge variant="secondary" className="font-body text-xs">
              {MOCK_CHAPTERS.length} locations
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_CHAPTERS.map((chapter) => (
              <Card
                key={chapter.id}
                className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-150 min-h-[44px]"
                onClick={() => setSelectedChapter(chapter)}
              >
                <CardContent className="p-4 space-y-3">
                  <div>
                    <p className="text-base font-heading font-bold text-foreground leading-snug">
                      {chapter.name}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <p className="text-sm font-body text-muted-foreground">
                        {chapter.city}, {chapter.state}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 text-sm font-body text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 shrink-0" />
                      <span>{chapter.memberCount} members</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {chapter.meetingDay} {chapter.meetingTime}
                      </span>
                    </div>
                  </div>

                  <div className="pt-1 border-t border-border/60">
                    <p className="text-xs font-body text-muted-foreground/80">
                      <span className="font-semibold text-foreground">
                        {chapter.facilitatorName}
                      </span>{' '}
                      · Facilitator
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

      </div>

      {/* ── Chapter Detail Dialog ── */}
      <Dialog open={!!selectedChapter} onOpenChange={(open) => !open && setSelectedChapter(null)}>
        <DialogContent className="max-w-md">
          {selectedChapter && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-heading font-bold text-primary">
                  {selectedChapter.name}
                </DialogTitle>
                <DialogDescription asChild>
                  <div className="space-y-1 pt-0.5">
                    <div className="flex items-center gap-1.5 text-sm font-body text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span>{selectedChapter.city}, {selectedChapter.state}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-body text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {selectedChapter.meetingDay}s at {selectedChapter.meetingTime}
                      </span>
                    </div>
                  </div>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                {/* Member list */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-4 w-4 text-secondary" />
                    <h3 className="text-sm font-heading font-bold text-foreground">
                      Members ({chapterMembers.length})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {chapterMembers.length > 0 ? (
                      chapterMembers.map((member) => {
                        const isFacilitator =
                          member.name === selectedChapter.facilitatorName;
                        return (
                          <div
                            key={member.id}
                            className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/40"
                          >
                            <span className="text-sm font-body text-foreground">
                              {member.name}
                            </span>
                            {isFacilitator && (
                              <Badge className="bg-secondary text-secondary-foreground text-xs font-body gap-1 px-2">
                                <Star className="h-3 w-3" />
                                Facilitator
                              </Badge>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm font-body text-muted-foreground italic px-3">
                        No members listed yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
