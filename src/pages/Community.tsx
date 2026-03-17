import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MOCK_CHAPTERS, MOCK_EVENTS, MOCK_POSTS, MOCK_MEMBERS } from '@/data/mock-data';
import { ROLE_LABELS } from '@/types';
import {
  MapPin,
  Calendar,
  Users,
  MessageCircle,
  Clock,
  Search,
  UserCircle,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Community() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMembers = MOCK_MEMBERS.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.chapter.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Community</h1>
          <p className="text-muted-foreground mt-1">
            Connect with your brothers across chapters
          </p>
        </div>

        <Tabs defaultValue="chapters" className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="chapters">Chapters</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="discussions">Discussions</TabsTrigger>
            <TabsTrigger value="directory">Directory</TabsTrigger>
          </TabsList>

          {/* Chapters */}
          <TabsContent value="chapters">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MOCK_CHAPTERS.map((chapter) => (
                <Card key={chapter.id} className="hover:border-secondary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{chapter.name}</h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-4 w-4" />
                          {chapter.city}, {chapter.state}
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-secondary/20 text-secondary">
                        {chapter.memberCount} members
                      </Badge>
                    </div>
                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <UserCircle className="h-4 w-4" />
                        <span>Facilitator: {chapter.facilitatorName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{chapter.meetingDay}s at {chapter.meetingTime}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Events */}
          <TabsContent value="events">
            <div className="space-y-4">
              {MOCK_EVENTS.map((event) => (
                <Card key={event.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{event.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {event.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {event.attendees.length}/{event.maxAttendees} attending
                          </span>
                        </div>
                      </div>
                      <Button
                        variant={event.attendees.includes('1') ? 'secondary' : 'default'}
                        onClick={() => toast({ title: event.attendees.includes('1') ? 'RSVP Cancelled' : 'RSVP Confirmed', description: event.title })}
                      >
                        {event.attendees.includes('1') ? (
                          <><CheckCircle2 className="h-4 w-4 mr-1" /> Attending</>
                        ) : (
                          'RSVP'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Discussions */}
          <TabsContent value="discussions">
            <div className="space-y-4">
              {MOCK_POSTS.map((post) => (
                <Card key={post.id} className="hover:border-secondary/50 transition-colors cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">{post.category}</Badge>
                        </div>
                        <h3 className="text-lg font-semibold">{post.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.content}</p>
                        <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
                          <span>{post.authorName}</span>
                          <span>•</span>
                          <span>{new Date(post.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-sm">{post.replies}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Directory */}
          <TabsContent value="directory">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members by name or chapter..."
                  className="pl-10 h-12 text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMembers.map((member) => (
                  <Card key={member.id}>
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <span className="text-primary-foreground font-semibold text-lg">
                          {member.name.split(' ').map((n) => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium">{member.name}</h4>
                        <p className="text-sm text-muted-foreground">{member.chapter}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {ROLE_LABELS[member.role]}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
