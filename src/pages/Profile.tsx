import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_LABELS } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { UserCircle, Save, Bell, CreditCard } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Profile & Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
        </div>

        {/* Profile Card */}
        <Card>
          <CardContent className="p-6 flex items-center gap-6">
            <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-bold text-2xl">
                {user?.name?.split(' ').map((n) => n[0]).join('')}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold">{user?.name}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="bg-secondary/20 text-secondary">
                  {user ? ROLE_LABELS[user.role] : '—'}
                </Badge>
                <span className="text-sm text-muted-foreground">{user?.chapter}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5" /> Edit Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base">Full Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="text-base h-12" />
            </div>
            <div className="space-y-2">
              <Label className="text-base">Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} className="text-base h-12" />
            </div>
            <Button onClick={() => toast({ title: 'Profile Updated', description: 'Your changes have been saved.' })}>
              <Save className="h-4 w-4 mr-2" /> Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" /> Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Snapshot Reminders', desc: 'Monthly reminder to complete your Member Snapshot' },
              { label: 'Event Notifications', desc: 'Updates about upcoming events and RSVPs' },
              { label: 'Discussion Replies', desc: 'Notify when someone replies to your posts' },
              { label: 'Announcements', desc: 'New announcements from HQ and your chapter' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                <Switch defaultChecked />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Membership */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" /> Membership
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">Active Member</p>
                <p className="text-sm text-muted-foreground">Member since {user?.joinedDate ? new Date(user.joinedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}</p>
              </div>
              <Badge className="bg-score-high/20 text-score-high border-0">Active</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
