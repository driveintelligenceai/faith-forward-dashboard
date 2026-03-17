import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_LABELS, ROLE_COLORS } from '@/types';
import type { UserRole } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserCircle, Save, Bell, CreditCard, Linkedin, ExternalLink, Building2, MapPin } from 'lucide-react';

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(profile?.full_name ?? '');
  const [email] = useState(profile?.email ?? user?.email ?? '');
  const [companyName, setCompanyName] = useState(profile?.company_name ?? '');
  const [companyTitle, setCompanyTitle] = useState(profile?.company_title ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [city, setCity] = useState(profile?.city ?? '');
  const [state, setState] = useState(profile?.state ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [saving, setSaving] = useState(false);

  const role = (profile?.role ?? 'member') as UserRole;

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: name,
        company_name: companyName,
        company_title: companyTitle,
        bio,
        city,
        state,
        phone,
      })
      .eq('user_id', user.id);
    setSaving(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      await refreshProfile();
      toast({ title: 'Profile Updated', description: 'Your changes have been saved.' });
    }
  };

  const handleConnectLinkedIn = () => {
    // PLACEHOLDER: Wire up your LinkedIn OAuth flow here.
    // After OAuth, call the linkedin-profile edge function with the access token
    // to pull in profile data, then refreshProfile().
    toast({
      title: 'LinkedIn Integration',
      description: 'LinkedIn OAuth will be wired up in your own codebase. The edge function endpoint is ready at /functions/v1/linkedin-profile.',
    });
  };

  const initials = (profile?.full_name || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <DashboardLayout>
      <div className="space-y-10 max-w-3xl">
        <div>
          <h1 className="text-4xl sm:text-5xl font-heading font-bold tracking-tight text-primary">
            My Profile
          </h1>
          <p className="text-lg font-body text-muted-foreground mt-3">
            Manage your account, connect LinkedIn, and update your info
          </p>
        </div>

        {/* Avatar & Summary */}
        <Card>
          <CardContent className="p-8 flex items-center gap-7 flex-wrap">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name ?? ''} className="h-24 w-24 rounded-full object-cover shrink-0" />
            ) : (
              <div className="h-24 w-24 rounded-full bg-primary flex items-center justify-center shrink-0">
                <span className="text-primary-foreground font-heading font-bold text-3xl">{initials}</span>
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-3xl font-heading font-bold">{profile?.full_name || 'New Member'}</h2>
              <p className="text-lg font-body text-muted-foreground mt-1">{email}</p>
              {(profile?.company_title || profile?.company_name) && (
                <p className="text-base font-body text-muted-foreground mt-1 flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" />
                  {[profile?.company_title, profile?.company_name].filter(Boolean).join(' at ')}
                </p>
              )}
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <Badge className={`${ROLE_COLORS[role]} font-body text-sm font-semibold border-0 px-3 py-1`}>
                  {ROLE_LABELS[role]}
                </Badge>
                {profile?.chapter && (
                  <span className="text-base font-body text-muted-foreground">{profile.chapter}</span>
                )}
                {profile?.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-sm font-body">
                    <Linkedin className="h-4 w-4" /> LinkedIn <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* LinkedIn Connect */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 font-heading text-2xl">
              <Linkedin className="h-6 w-6 text-[#0A66C2]" /> Connect LinkedIn
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile?.linkedin_connected_at ? (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                <Badge className="bg-score-high/20 text-score-high font-body font-semibold border-0">Connected</Badge>
                <div>
                  <p className="font-heading font-semibold text-lg">{profile.linkedin_headline || 'LinkedIn Profile Connected'}</p>
                  <p className="text-sm font-body text-muted-foreground">
                    {profile.linkedin_company && `${profile.linkedin_title || ''} at ${profile.linkedin_company}`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="font-body text-muted-foreground">
                  Connect your LinkedIn profile to automatically import your photo, headline, company, and professional bio.
                </p>
                <Button
                  onClick={handleConnectLinkedIn}
                  className="h-12 text-base font-heading font-semibold gap-3 bg-[#0A66C2] hover:bg-[#004182] text-white"
                >
                  <Linkedin className="h-5 w-5" />
                  Connect LinkedIn Profile
                </Button>
                <p className="text-xs font-body text-muted-foreground">
                  We'll pull your public profile info — photo, headline, company, and bio. You can edit anything after import.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 font-heading text-2xl">
              <UserCircle className="h-6 w-6 text-secondary" /> Edit Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-base font-heading font-semibold">Full Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="text-lg font-body h-14" />
              </div>
              <div className="space-y-2">
                <Label className="text-base font-heading font-semibold">Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="text-lg font-body h-14" placeholder="(555) 555-5555" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-base font-heading font-semibold">Company</Label>
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="text-lg font-body h-14" placeholder="Your company name" />
              </div>
              <div className="space-y-2">
                <Label className="text-base font-heading font-semibold">Title</Label>
                <Input value={companyTitle} onChange={(e) => setCompanyTitle(e.target.value)} className="text-lg font-body h-14" placeholder="CEO, Founder, etc." />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-base font-heading font-semibold flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> City
                </Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} className="text-lg font-body h-14" placeholder="Alpharetta" />
              </div>
              <div className="space-y-2">
                <Label className="text-base font-heading font-semibold">State</Label>
                <Input value={state} onChange={(e) => setState(e.target.value)} className="text-lg font-body h-14" placeholder="Georgia" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-base font-heading font-semibold">Bio</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} className="text-base font-body min-h-[100px]" placeholder="Tell your brothers a bit about yourself..." />
            </div>
            <Button size="lg" className="font-heading font-semibold text-base h-12 px-6" onClick={handleSave} disabled={saving}>
              <Save className="h-5 w-5 mr-2" /> {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>

        {/* Notifications */}
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

        {/* Membership */}
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
                  Member since {profile?.joined_date ? new Date(profile.joined_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
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
