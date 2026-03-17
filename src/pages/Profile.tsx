import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_LABELS, ROLE_COLORS } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { UserCircle, Save, Bell, CreditCard } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');

  return (
    <DashboardLayout>
      <div className="space-y-10 max-w-3xl">
        <div>
          <h1 className="text-4xl sm:text-5xl font-heading font-bold tracking-tight text-primary">
            My Profile
          </h1>
          <p className="text-lg font-body text-muted-foreground mt-3">
            Manage your account and notification preferences
          </p>
        </div>

        <Card>
          <CardContent className="p-8 flex items-center gap-7 flex-wrap">
            <div className="h-24 w-24 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-heading font-bold text-3xl">
                {user?.name?.split(' ').map((n) => n[0]).join('')}
              </span>
            </div>
            <div>
              <h2 className="text-3xl font-heading font-bold">{user?.name}</h2>
              <p className="text-lg font-body text-muted-foreground mt-1">{user?.email}</p>
              <div className="flex items-center gap-3 mt-3">
                {user && (
                  <Badge className={`${ROLE_COLORS[user.role]} font-body text-sm font-semibold border-0 px-3 py-1`}>
                    {ROLE_LABELS[user.role]}
                  </Badge>
                )}
                <span className="text-base font-body text-muted-foreground">{user?.chapter}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 font-heading text-2xl">
              <UserCircle className="h-6 w-6 text-secondary" /> Edit Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-base font-heading font-semibold">Full Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="text-lg font-body h-14" />
            </div>
            <div className="space-y-2">
              <Label className="text-base font-heading font-semibold">Email Address</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} className="text-lg font-body h-14" />
            </div>
            <Button size="lg" className="font-heading font-semibold text-base h-12 px-6" onClick={() => toast({ title: 'Profile Updated', description: 'Your changes have been saved.' })}>
              <Save className="h-5 w-5 mr-2" /> Save Changes
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 font-heading text-2xl">
              <Bell className="h-6 w-6 text-secondary" /> Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              { label: 'Snapshot Reminders', desc: 'Monthly reminder to complete your Snapshot' },
              { label: 'Event Notifications', desc: 'Updates about upcoming events and RSVPs' },
              { label: 'Discussion Replies', desc: 'When someone replies to your posts' },
              { label: 'Announcements', desc: 'New announcements from HQ and your chapter' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-heading font-semibold text-lg">{item.label}</p>
                  <p className="text-base font-body text-muted-foreground">{item.desc}</p>
                </div>
                <Switch defaultChecked className="scale-125" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 font-heading text-2xl">
              <CreditCard className="h-6 w-6 text-secondary" /> Membership
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-6 rounded-xl bg-muted/50">
              <div>
                <p className="font-heading font-bold text-xl">Active Member</p>
                <p className="text-base font-body text-muted-foreground mt-1">
                  Member since {user?.joinedDate ? new Date(user.joinedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
                </p>
              </div>
              <Badge className="bg-score-high/20 text-score-high font-body font-semibold text-base border-0 px-4 py-1.5">Active</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
