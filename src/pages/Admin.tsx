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
import { MOCK_MEMBERS, MOCK_CHAPTERS } from '@/data/mock-data';
import { ROLE_LABELS, ROLE_COLORS } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Shield, UserPlus, Calendar, Megaphone, Trash2 } from 'lucide-react';

export default function Admin() {
  const { hasMinRole } = useAuth();
  const { toast } = useToast();

  if (!hasMinRole('facilitator')) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <Shield className="h-20 w-20 text-muted-foreground/30 mb-5" />
          <h1 className="text-4xl font-heading font-bold text-primary">Access Restricted</h1>
          <p className="text-lg font-body text-muted-foreground mt-3">
            You need Facilitator or higher access to view this page.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div>
          <h1 className="text-4xl sm:text-5xl font-heading font-bold tracking-tight text-primary">
            Admin Panel
          </h1>
          <p className="text-lg font-body text-muted-foreground mt-3">
            Manage members, events, and announcements
          </p>
        </div>

        <Tabs defaultValue="members" className="space-y-8">
          <TabsList className="p-2 gap-2 font-body">
            <TabsTrigger value="members" className="font-body font-semibold text-base px-5 py-2.5 min-h-[44px]">
              Members
            </TabsTrigger>
            <TabsTrigger value="events" className="font-body font-semibold text-base px-5 py-2.5 min-h-[44px]">
              Create Event
            </TabsTrigger>
            <TabsTrigger value="announcements" className="font-body font-semibold text-base px-5 py-2.5 min-h-[44px]">
              Announcements
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members">
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0 flex-wrap gap-4">
                <div>
                  <CardTitle className="font-heading text-2xl">Member Management</CardTitle>
                  <CardDescription className="font-body text-base mt-1">{MOCK_MEMBERS.length} members across all chapters</CardDescription>
                </div>
                <Button size="lg" className="font-heading font-semibold text-base h-12 px-6">
                  <UserPlus className="h-5 w-5 mr-2" />
                  Invite Member
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-heading font-semibold text-base">Name</TableHead>
                        <TableHead className="font-heading font-semibold text-base">Chapter</TableHead>
                        <TableHead className="font-heading font-semibold text-base">Role</TableHead>
                        <TableHead className="font-heading font-semibold text-base">Joined</TableHead>
                        <TableHead className="font-heading font-semibold text-base w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {MOCK_MEMBERS.map((member) => (
                        <TableRow key={member.id} className="h-16">
                          <TableCell className="font-body font-semibold text-base">{member.name}</TableCell>
                          <TableCell className="font-body text-base">{member.chapter}</TableCell>
                          <TableCell>
                            <Badge className={`${ROLE_COLORS[member.role]} text-sm font-body border-0`}>
                              {ROLE_LABELS[member.role]}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-body text-base">{new Date(member.joinedDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-11 w-11">
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-2xl">Create New Event</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-base font-heading font-semibold">Event Title</Label>
                    <Input placeholder="e.g. Q2 Leadership Breakfast" className="text-lg font-body h-14" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-heading font-semibold">Date</Label>
                    <Input type="date" className="text-lg font-body h-14" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-heading font-semibold">Location</Label>
                    <Input placeholder="e.g. Nashville Convention Center" className="text-lg font-body h-14" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-heading font-semibold">Chapter</Label>
                    <Select>
                      <SelectTrigger className="h-14 text-lg font-body">
                        <SelectValue placeholder="Select chapter" />
                      </SelectTrigger>
                      <SelectContent>
                        {MOCK_CHAPTERS.map((ch) => (
                          <SelectItem key={ch.id} value={ch.id} className="font-body text-base py-3">{ch.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-heading font-semibold">Max Attendees</Label>
                    <Input type="number" placeholder="50" className="text-lg font-body h-14" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-base font-heading font-semibold">Description</Label>
                    <Textarea placeholder="Describe the event..." className="text-lg font-body min-h-[120px]" />
                  </div>
                  <div className="md:col-span-2">
                    <Button size="lg" className="text-base font-heading font-semibold h-14 px-8" onClick={() => toast({ title: 'Event Created', description: 'The event has been published.' })}>
                      <Calendar className="h-5 w-5 mr-2" />
                      Create Event
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="announcements">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-2xl">Post Announcement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6 max-w-3xl">
                  <div className="space-y-2">
                    <Label className="text-base font-heading font-semibold">Title</Label>
                    <Input placeholder="Announcement title" className="text-lg font-body h-14" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-heading font-semibold">Chapter (optional)</Label>
                    <Select>
                      <SelectTrigger className="h-14 text-lg font-body">
                        <SelectValue placeholder="All chapters" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="font-body text-base py-3">All Chapters</SelectItem>
                        {MOCK_CHAPTERS.map((ch) => (
                          <SelectItem key={ch.id} value={ch.id} className="font-body text-base py-3">{ch.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-heading font-semibold">Content</Label>
                    <Textarea placeholder="Write your announcement..." className="text-lg font-body min-h-[140px]" />
                  </div>
                  <Button size="lg" className="text-base font-heading font-semibold h-14 px-8" onClick={() => toast({ title: 'Announcement Posted', description: 'Your announcement has been published.' })}>
                    <Megaphone className="h-5 w-5 mr-2" />
                    Post Announcement
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
