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
      <div className="space-y-8 max-w-2xl">
        <div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight text-primary">
            Profile & Settings
          </h1>
          <p className="text-base font-body text-muted-foreground mt-2">
            Manage your account and preferences
          </p>
        </div>

        <Card>
          <CardContent className="p-6 flex items-center gap-6">
            <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-heading font-bold text-2xl">
                {user?.name?.split(' ').map((n) => n[0]).join('')}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-heading font-bold">{user?.name}</h2>
              <p className="text-base font-body text-muted-foreground">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                {user && (
                  <Badge className={`${ROLE_COLORS[user.role]} font-body text-xs font-semibold border-0`}>
                    {ROLE_LABELS[user.role]}
                  </Badge>
                )}
                <span className="text-sm font-body text-muted-foreground">{user?.chapter}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-xl">
              <UserCircle className="h-5 w-5 text-secondary" /> Edit Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-base font-heading font-semibold">Full Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="text-base font-body h-12" />
            </div>
            <div className="space-y-2">
              <Label className="text-base font-heading font-semibold">Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} className="text-base font-body h-12" />
            </div>
            <Button className="font-heading font-semibold" onClick={() => toast({ title: 'Profile Updated', description: 'Your changes have been saved.' })}>
              <Save className="h-4 w-4 mr-2" /> Save Changes
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-xl">
              <Bell className="h-5 w-5 text-secondary" /> Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              { label: 'Snapshot Reminders', desc: 'Monthly reminder to complete your Member Snapshot' },
              { label: 'Event Notifications', desc: 'Updates about upcoming events and RSVPs' },
              { label: 'Discussion Replies', desc: 'Notify when someone replies to your posts' },
              { label: 'Announcements', desc: 'New announcements from HQ and your chapter' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <p className="font-heading font-semibold">{item.label}</p>
                  <p className="text-sm font-body text-muted-foreground">{item.desc}</p>
                </div>
                <Switch defaultChecked />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-xl">
              <CreditCard className="h-5 w-5 text-secondary" /> Membership
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-heading font-semibold">Active Member</p>
                <p className="text-sm font-body text-muted-foreground">
                  Member since {user?.joinedDate ? new Date(user.joinedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
                </p>
              </div>
              <Badge className="bg-score-high/20 text-score-high font-body font-semibold border-0">Active</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
