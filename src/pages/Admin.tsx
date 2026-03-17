import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MOCK_MEMBERS, MOCK_CHAPTERS } from '@/data/mock-data';
import { ROLE_LABELS, type UserRole } from '@/types';
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
          <Shield className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h1 className="text-2xl font-bold">Access Restricted</h1>
          <p className="text-muted-foreground mt-2">You need Facilitator or Admin access to view this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-muted-foreground mt-1">Manage members, events, and announcements</p>
        </div>

        <Tabs defaultValue="members" className="space-y-6">
          <TabsList>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="events">Create Event</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
          </TabsList>

          <TabsContent value="members">
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Member Management</CardTitle>
                  <CardDescription>{MOCK_MEMBERS.length} members across all chapters</CardDescription>
                </div>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Chapter</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {MOCK_MEMBERS.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">{member.name}</TableCell>
                          <TableCell>{member.chapter}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{ROLE_LABELS[member.role]}</Badge>
                          </TableCell>
                          <TableCell>{new Date(member.joinedDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
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
                <CardTitle>Create New Event</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-base">Event Title</Label>
                    <Input placeholder="e.g. Q2 Leadership Breakfast" className="text-base h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base">Date</Label>
                    <Input type="date" className="text-base h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base">Location</Label>
                    <Input placeholder="e.g. Nashville Convention Center" className="text-base h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base">Chapter</Label>
                    <Select>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Select chapter" />
                      </SelectTrigger>
                      <SelectContent>
                        {MOCK_CHAPTERS.map((ch) => (
                          <SelectItem key={ch.id} value={ch.id}>{ch.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base">Max Attendees</Label>
                    <Input type="number" placeholder="50" className="text-base h-12" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-base">Description</Label>
                    <Textarea placeholder="Describe the event..." className="text-base min-h-[100px]" />
                  </div>
                  <div className="md:col-span-2">
                    <Button size="lg" className="text-base" onClick={() => toast({ title: 'Event Created', description: 'The event has been published.' })}>
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
                <CardTitle>Post Announcement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-w-2xl">
                  <div className="space-y-2">
                    <Label className="text-base">Title</Label>
                    <Input placeholder="Announcement title" className="text-base h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base">Chapter (optional)</Label>
                    <Select>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="All chapters" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Chapters</SelectItem>
                        {MOCK_CHAPTERS.map((ch) => (
                          <SelectItem key={ch.id} value={ch.id}>{ch.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base">Content</Label>
                    <Textarea placeholder="Write your announcement..." className="text-base min-h-[120px]" />
                  </div>
                  <Button size="lg" className="text-base" onClick={() => toast({ title: 'Announcement Posted', description: 'Your announcement has been published.' })}>
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
