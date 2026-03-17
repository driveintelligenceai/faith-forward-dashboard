import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { MOCK_MEMBERS, MOCK_CHAPTERS, MOCK_SNAPSHOTS } from '@/data/mock-data';
import { ROLE_LABELS } from '@/types';
import type { UserRole } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Shield, UserPlus, Calendar, Megaphone, Trash2, Eye, BarChart3, Settings } from 'lucide-react';

// Permission matrix by role
const ADMIN_PERMISSIONS: Record<UserRole, {
  canManageMembers: boolean;
  canDeleteMembers: boolean;
  canCreateEvents: boolean;
  canPostAnnouncements: boolean;
  canViewAllSnapshots: boolean;
  canManageChapters: boolean;
  canInviteMembers: boolean;
}> = {
  member: {
    canManageMembers: false,
    canDeleteMembers: false,
    canCreateEvents: false,
    canPostAnnouncements: false,
    canViewAllSnapshots: false,
    canManageChapters: false,
    canInviteMembers: false,
  },
  facilitator: {
    canManageMembers: true,
    canDeleteMembers: false,
    canCreateEvents: true,
    canPostAnnouncements: true,
    canViewAllSnapshots: true,
    canManageChapters: false,
    canInviteMembers: true,
  },
  executive: {
    canManageMembers: true,
    canDeleteMembers: true,
    canCreateEvents: true,
    canPostAnnouncements: true,
    canViewAllSnapshots: true,
    canManageChapters: true,
    canInviteMembers: true,
  },
  ceo: {
    canManageMembers: true,
    canDeleteMembers: true,
    canCreateEvents: true,
    canPostAnnouncements: true,
    canViewAllSnapshots: true,
    canManageChapters: true,
    canInviteMembers: true,
  },
};

export default function Admin() {
  const { profile, hasMinRole } = useAuth();
  const { toast } = useToast();
  const userRole = (profile?.role || 'member') as UserRole;
  const perms = ADMIN_PERMISSIONS[userRole];

  if (!hasMinRole('facilitator')) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <Shield className="h-16 w-16 text-muted-foreground/20 mb-4" />
          <h1 className="text-3xl font-heading font-bold text-primary">Access Restricted</h1>
          <p className="text-base font-body text-muted-foreground mt-2">
            You need Facilitator or higher access to view this page.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  // Filter members based on role — facilitators see only their chapter
  const visibleMembers = userRole === 'facilitator'
    ? MOCK_MEMBERS.filter((m) => m.chapter === profile?.chapter)
    : MOCK_MEMBERS;

  // Build available tabs based on permissions
  const tabs: { value: string; label: string; icon: React.ReactNode }[] = [];
  if (perms.canManageMembers) tabs.push({ value: 'members', label: 'Members', icon: null });
  if (perms.canViewAllSnapshots) tabs.push({ value: 'snapshots', label: 'Snapshot Overview', icon: null });
  if (perms.canCreateEvents) tabs.push({ value: 'events', label: 'Create Event', icon: null });
  if (perms.canPostAnnouncements) tabs.push({ value: 'announcements', label: 'Announcements', icon: null });
  if (perms.canManageChapters) tabs.push({ value: 'chapters', label: 'Chapters', icon: null });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight text-primary">
            Admin Panel
          </h1>
          <p className="text-base font-body text-muted-foreground mt-1">
            {ROLE_LABELS[userRole]} access
            {userRole === 'facilitator' && profile?.chapter ? ` · ${profile.chapter}` : ''}
            {hasMinRole('executive') ? ' · All chapters' : ''}
          </p>
        </div>

        <Tabs defaultValue={tabs[0]?.value || 'members'} className="space-y-6">
          <TabsList className="p-1.5 gap-1 font-body">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="font-body font-semibold text-sm px-4 py-2 min-h-[40px]"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Members Tab */}
          {perms.canManageMembers && (
            <TabsContent value="members">
              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0 flex-wrap gap-3">
                  <div>
                    <CardTitle className="font-heading text-xl">
                      {userRole === 'facilitator' ? `${profile?.chapter} Members` : 'All Members'}
                    </CardTitle>
                    <CardDescription className="font-body text-sm mt-0.5">
                      {visibleMembers.length} member{visibleMembers.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                  {perms.canInviteMembers && (
                    <Button size="default" className="font-heading font-semibold text-sm h-10 px-4">
                      <UserPlus className="h-4 w-4 mr-1.5" />
                      Invite
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-heading font-semibold text-sm">Name</TableHead>
                          <TableHead className="font-heading font-semibold text-sm">Chapter</TableHead>
                          <TableHead className="font-heading font-semibold text-sm">Role</TableHead>
                          <TableHead className="font-heading font-semibold text-sm">Joined</TableHead>
                          {perms.canDeleteMembers && (
                            <TableHead className="font-heading font-semibold text-sm w-[80px]" />
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visibleMembers.map((member) => (
                          <TableRow key={member.id} className="h-12">
                            <TableCell className="font-body font-semibold text-sm">{member.name}</TableCell>
                            <TableCell className="font-body text-sm text-muted-foreground">{member.chapter}</TableCell>
                            <TableCell>
                              <span className="text-sm font-body text-muted-foreground">
                                {ROLE_LABELS[member.role]}
                              </span>
                            </TableCell>
                            <TableCell className="font-body text-sm text-muted-foreground">
                              {new Date(member.joinedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </TableCell>
                            {perms.canDeleteMembers && (
                              <TableCell>
                                <Button variant="ghost" size="icon" className="text-destructive/60 hover:text-destructive h-9 w-9">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Snapshot Overview — Facilitators+ can see aggregate data */}
          {perms.canViewAllSnapshots && (
            <TabsContent value="snapshots">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-xl">
                    {userRole === 'facilitator' ? 'Chapter Snapshot Overview' : 'Organization Snapshot Overview'}
                  </CardTitle>
                  <CardDescription className="font-body text-sm">
                    {userRole === 'facilitator'
                      ? 'Aggregated snapshot data for your chapter members'
                      : 'Aggregated snapshot data across all chapters'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-muted/30 rounded-lg p-4 text-center">
                      <p className="text-3xl font-heading font-bold text-primary">
                        {visibleMembers.length}
                      </p>
                      <p className="text-sm font-body text-muted-foreground mt-1">Active Members</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4 text-center">
                      <p className="text-3xl font-heading font-bold text-primary">
                        {MOCK_SNAPSHOTS.length}
                      </p>
                      <p className="text-sm font-body text-muted-foreground mt-1">Snapshots Submitted</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4 text-center">
                      <p className="text-3xl font-heading font-bold text-primary">
                        {(MOCK_SNAPSHOTS[0]?.ratings.reduce((s, r) => s + r.score, 0) / (MOCK_SNAPSHOTS[0]?.ratings.length || 1)).toFixed(1)}
                      </p>
                      <p className="text-sm font-body text-muted-foreground mt-1">Latest Avg Score</p>
                    </div>
                  </div>
                  <p className="text-sm font-body text-muted-foreground mt-6 text-center">
                    Detailed analytics coming soon — individual member snapshot trends, chapter comparisons, and category breakdowns.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Events Tab */}
          {perms.canCreateEvents && (
            <TabsContent value="events">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-xl">Create New Event</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl">
                    <div className="space-y-1.5 md:col-span-2">
                      <Label className="text-sm font-heading font-semibold">Event Title</Label>
                      <Input placeholder="e.g. Q2 Leadership Breakfast" className="text-base font-body h-11" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-heading font-semibold">Date</Label>
                      <Input type="date" className="text-base font-body h-11" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-heading font-semibold">Location</Label>
                      <Input placeholder="City, Venue" className="text-base font-body h-11" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-heading font-semibold">Chapter</Label>
                      <Select>
                        <SelectTrigger className="h-11 text-base font-body">
                          <SelectValue placeholder="Select chapter" />
                        </SelectTrigger>
                        <SelectContent>
                          {(userRole === 'facilitator'
                            ? MOCK_CHAPTERS.filter((ch) => ch.name === profile?.chapter)
                            : MOCK_CHAPTERS
                          ).map((ch) => (
                            <SelectItem key={ch.id} value={ch.id} className="font-body text-sm py-2">{ch.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-heading font-semibold">Max Attendees</Label>
                      <Input type="number" placeholder="50" className="text-base font-body h-11" />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label className="text-sm font-heading font-semibold">Description</Label>
                      <Textarea placeholder="Describe the event..." className="text-base font-body min-h-[100px]" />
                    </div>
                    <div className="md:col-span-2">
                      <Button size="default" className="text-sm font-heading font-semibold h-11 px-6" onClick={() => toast({ title: 'Event Created', description: 'Published successfully.' })}>
                        <Calendar className="h-4 w-4 mr-1.5" />
                        Create Event
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Announcements Tab */}
          {perms.canPostAnnouncements && (
            <TabsContent value="announcements">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-xl">Post Announcement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-5 max-w-2xl">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-heading font-semibold">Title</Label>
                      <Input placeholder="Announcement title" className="text-base font-body h-11" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-heading font-semibold">Chapter</Label>
                      <Select>
                        <SelectTrigger className="h-11 text-base font-body">
                          <SelectValue placeholder="All chapters" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" className="font-body text-sm py-2">All Chapters</SelectItem>
                          {(userRole === 'facilitator'
                            ? MOCK_CHAPTERS.filter((ch) => ch.name === profile?.chapter)
                            : MOCK_CHAPTERS
                          ).map((ch) => (
                            <SelectItem key={ch.id} value={ch.id} className="font-body text-sm py-2">{ch.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-heading font-semibold">Content</Label>
                      <Textarea placeholder="Write your announcement..." className="text-base font-body min-h-[120px]" />
                    </div>
                    <Button size="default" className="text-sm font-heading font-semibold h-11 px-6" onClick={() => toast({ title: 'Announcement Posted' })}>
                      <Megaphone className="h-4 w-4 mr-1.5" />
                      Post
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Chapters Tab — Executive+ only */}
          {perms.canManageChapters && (
            <TabsContent value="chapters">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-xl">Chapter Management</CardTitle>
                  <CardDescription className="font-body text-sm">
                    {MOCK_CHAPTERS.length} chapters across the network
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-heading font-semibold text-sm">Chapter</TableHead>
                        <TableHead className="font-heading font-semibold text-sm">Location</TableHead>
                        <TableHead className="font-heading font-semibold text-sm">Facilitator</TableHead>
                        <TableHead className="font-heading font-semibold text-sm">Members</TableHead>
                        <TableHead className="font-heading font-semibold text-sm">Meeting</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {MOCK_CHAPTERS.map((ch) => (
                        <TableRow key={ch.id} className="h-12">
                          <TableCell className="font-body font-semibold text-sm">{ch.name}</TableCell>
                          <TableCell className="font-body text-sm text-muted-foreground">{ch.city}, {ch.state}</TableCell>
                          <TableCell className="font-body text-sm">{ch.facilitatorName}</TableCell>
                          <TableCell className="font-body text-sm text-muted-foreground">{ch.memberCount}</TableCell>
                          <TableCell className="font-body text-sm text-muted-foreground">{ch.meetingDay} {ch.meetingTime}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
