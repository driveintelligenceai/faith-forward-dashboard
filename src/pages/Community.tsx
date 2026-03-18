import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MOCK_MEMBERS, MOCK_CHAPTERS, MOCK_POSTS } from '@/data/mock-data';
import { ROLE_LABELS, ROLE_COLORS, type UserRole } from '@/types';
import { Search, Users, MessageSquare, MessageCircle, Calendar } from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_BG: Record<UserRole, string> = {
  ceo: 'bg-secondary text-secondary-foreground',
  executive: 'bg-primary text-primary-foreground',
  facilitator: 'bg-primary/70 text-primary-foreground',
  member: 'bg-muted text-muted-foreground',
};

function relativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const CATEGORIES = ['All', 'Testimony', 'Leadership', 'Business', 'Faith', 'Community', 'Resources'] as const;

// ─── Member Card ─────────────────────────────────────────────────────────────

function MemberCard({ member }: { member: typeof MOCK_MEMBERS[0] }) {
  const chapter = MOCK_CHAPTERS.find(c => c.name === member.chapter);

  return (
    <Card className="hover:shadow-md transition-shadow border-border/60">
      <CardContent className="p-4 flex flex-col gap-3">
        {/* Avatar + Name */}
        <div className="flex items-center gap-3">
          <div
            className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 text-base font-heading font-bold ${AVATAR_BG[member.role]}`}
            aria-label={member.name}
          >
            {getInitials(member.name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-heading font-bold text-foreground truncate">{member.name}</p>
            <Badge className={`text-xs font-body mt-0.5 ${ROLE_COLORS[member.role]}`}>
              {ROLE_LABELS[member.role]}
            </Badge>
          </div>
        </div>

        {/* Chapter + Joined */}
        <div className="space-y-1 text-xs font-body text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{member.chapter}</span>
          </div>
          {chapter && (
            <div className="flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 shrink-0" />
              <span>{chapter.city}, {chapter.state} · {chapter.meetingDay}s</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>Joined {new Date(member.joinedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({ post, onClick }: { post: typeof MOCK_POSTS[0]; onClick: () => void }) {
  return (
    <Card
      className="hover:shadow-md transition-shadow border-border/60 cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-4 sm:p-5 space-y-2">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-heading font-bold text-primary">
              {getInitials(post.authorName)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-heading font-semibold text-foreground truncate">{post.authorName}</p>
              <p className="text-xs font-body text-muted-foreground">{relativeDate(post.date)}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs font-body border-secondary/30 text-secondary shrink-0">
            {post.category}
          </Badge>
        </div>

        {/* Title */}
        <p className="text-sm font-heading font-bold text-foreground leading-snug">{post.title}</p>

        {/* Excerpt */}
        <p className="text-sm font-body text-muted-foreground line-clamp-2 leading-relaxed">
          {post.content}
        </p>

        {/* Footer */}
        <div className="flex items-center gap-1 text-xs font-body text-muted-foreground/70 pt-1">
          <MessageCircle className="h-3.5 w-3.5" />
          <span>{post.replies} {post.replies === 1 ? 'reply' : 'replies'}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Community() {
  const [search, setSearch] = useState('');
  const [chapterFilter, setChapterFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedPost, setSelectedPost] = useState<typeof MOCK_POSTS[0] | null>(null);

  // Directory filtering
  const filteredMembers = MOCK_MEMBERS.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchesChapter = chapterFilter === 'all' || m.chapter === chapterFilter;
    return matchesSearch && matchesChapter;
  });

  // Discussion filtering
  const filteredPosts = MOCK_POSTS.filter(p =>
    categoryFilter === 'All' || p.category === categoryFilter
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">

        {/* ── Page Header ── */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-primary tracking-tight">
            Community
          </h1>
          <p className="text-sm font-body text-muted-foreground mt-1">
            Your forum brothers
          </p>
        </div>

        {/* ── Tabs ── */}
        <Tabs defaultValue="directory" className="space-y-5">

          {/* Tab bar + Search row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <TabsList className="h-10 shrink-0">
              <TabsTrigger value="directory" className="font-heading font-semibold text-sm px-4">
                Directory
              </TabsTrigger>
              <TabsTrigger value="discussion" className="font-heading font-semibold text-sm px-4">
                Discussion
              </TabsTrigger>
            </TabsList>

            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 font-body text-sm min-h-[44px]"
              />
            </div>
          </div>

          {/* ── Directory Tab ── */}
          <TabsContent value="directory" className="space-y-4 mt-0">

            {/* Chapter filter */}
            <div className="flex items-center gap-3">
              <Select value={chapterFilter} onValueChange={setChapterFilter}>
                <SelectTrigger className="w-[220px] font-body text-sm min-h-[44px]">
                  <SelectValue placeholder="All Chapters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-body">All Chapters</SelectItem>
                  {MOCK_CHAPTERS.map(c => (
                    <SelectItem key={c.id} value={c.name} className="font-body">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <span className="text-sm font-body text-muted-foreground">
                {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'}
              </span>
            </div>

            {/* Member grid */}
            {filteredMembers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMembers.map(member => (
                  <MemberCard key={member.id} member={member} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground font-body text-sm">
                No members found matching your search.
              </div>
            )}
          </TabsContent>

          {/* ── Discussion Tab ── */}
          <TabsContent value="discussion" className="space-y-4 mt-0">

            {/* Category chips + Create Post */}
            <div className="flex flex-wrap items-center gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-heading font-semibold transition-colors min-h-[36px] ${
                    categoryFilter === cat
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/70'
                  }`}
                >
                  {cat}
                </button>
              ))}
              <div className="ml-auto">
                <Button
                  size="sm"
                  className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-heading font-bold min-h-[44px] px-4"
                >
                  Create Post
                </Button>
              </div>
            </div>

            {/* Post list */}
            {filteredPosts.length > 0 ? (
              <div className="space-y-3">
                {filteredPosts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onClick={() => setSelectedPost(post)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground font-body text-sm">
                No posts in this category yet.
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* ── Post Detail Dialog ── */}
        <Dialog open={!!selectedPost} onOpenChange={open => !open && setSelectedPost(null)}>
          <DialogContent className="max-w-lg">
            {selectedPost && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs font-body border-secondary/30 text-secondary">
                      {selectedPost.category}
                    </Badge>
                  </div>
                  <DialogTitle className="font-heading font-bold text-foreground text-left leading-snug">
                    {selectedPost.title}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Author row */}
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-heading font-bold text-primary">
                      {getInitials(selectedPost.authorName)}
                    </div>
                    <div>
                      <p className="text-sm font-heading font-semibold text-foreground">{selectedPost.authorName}</p>
                      <p className="text-xs font-body text-muted-foreground">{relativeDate(selectedPost.date)}</p>
                    </div>
                  </div>

                  {/* Content */}
                  <p className="text-sm font-body text-foreground leading-relaxed">
                    {selectedPost.content}
                  </p>

                  {/* Reply count */}
                  <div className="flex items-center gap-1.5 text-xs font-body text-muted-foreground pt-1 border-t border-border/40">
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>{selectedPost.replies} {selectedPost.replies === 1 ? 'reply' : 'replies'} in this thread</span>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
}
