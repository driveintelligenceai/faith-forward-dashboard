import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MOCK_CHAPTERS, MOCK_EVENTS, MOCK_POSTS, MOCK_MEMBERS } from '@/data/mock-data';
import { ROLE_LABELS, ROLE_COLORS } from '@/types';
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
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight text-primary">
            Community
          </h1>
          <p className="text-base font-body text-muted-foreground mt-2">
            Connect with your brothers across chapters
          </p>
        </div>

        <Tabs defaultValue="chapters" className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-1 font-body">
            <TabsTrigger value="chapters" className="font-body font-semibold">Chapters</TabsTrigger>
            <TabsTrigger value="events" className="font-body font-semibold">Events</TabsTrigger>
            <TabsTrigger value="discussions" className="font-body font-semibold">Discussions</TabsTrigger>
            <TabsTrigger value="directory" className="font-body font-semibold">Directory</TabsTrigger>
          </TabsList>

          <TabsContent value="chapters">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {MOCK_CHAPTERS.map((chapter) => (
                <Card key={chapter.id} className="hover:shadow-md hover:border-secondary/40 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-heading font-bold">{chapter.name}</h3>
                        <div className="flex items-center gap-1 text-sm font-body text-muted-foreground mt-1">
                          <MapPin className="h-4 w-4" />
                          {chapter.city}, {chapter.state}
                        </div>
                      </div>
                      <Badge className="bg-secondary text-secondary-foreground font-body font-semibold border-0">
                        {chapter.memberCount} members
                      </Badge>
                    </div>
                    <div className="mt-4 space-y-2 text-sm font-body">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <UserCircle className="h-4 w-4" />
                        <span>Facilitator: <span className="font-semibold text-foreground">{chapter.facilitatorName}</span></span>
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

          <TabsContent value="events">
            <div className="space-y-4">
              {MOCK_EVENTS.map((event) => (
                <Card key={event.id} className="hover:shadow-md transition-all">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-heading font-bold">{event.title}</h3>
                        <p className="text-sm font-body text-muted-foreground mt-1">{event.description}</p>
                        <div className="flex flex-wrap gap-4 mt-3 text-sm font-body text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-secondary" />
                            {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-secondary" />
                            {event.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-secondary" />
                            {event.attendees.length}/{event.maxAttendees} attending
                          </span>
                        </div>
                      </div>
                      <Button
                        variant={event.attendees.includes('1') ? 'secondary' : 'default'}
                        className="font-heading font-semibold shrink-0"
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

          <TabsContent value="discussions">
            <div className="space-y-4">
              {MOCK_POSTS.map((post) => (
                <Card key={post.id} className="hover:shadow-md hover:border-secondary/40 transition-all cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs font-body font-semibold">{post.category}</Badge>
                        </div>
                        <h3 className="text-lg font-heading font-bold">{post.title}</h3>
                        <p className="text-sm font-body text-muted-foreground mt-1 line-clamp-2">{post.content}</p>
                        <div className="flex items-center gap-3 mt-3 text-sm font-body text-muted-foreground">
                          <span className="font-semibold text-foreground">{post.authorName}</span>
                          <span>•</span>
                          <span>{new Date(post.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-sm font-body font-semibold">{post.replies}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="directory">
            <div className="space-y-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search members by name or chapter..."
                  className="pl-11 h-12 text-base font-body"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMembers.map((member) => (
                  <Card key={member.id} className="hover:shadow-md transition-all">
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <span className="text-primary-foreground font-heading font-bold text-lg">
                          {member.name.split(' ').map((n) => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-heading font-semibold text-base">{member.name}</h4>
                        <p className="text-sm font-body text-muted-foreground">{member.chapter}</p>
                        <Badge className={`${ROLE_COLORS[member.role]} text-xs font-body mt-1 border-0`}>
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
