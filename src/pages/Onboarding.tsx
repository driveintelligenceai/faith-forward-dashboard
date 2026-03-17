import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { SNAPSHOT_TYPE_LABELS, getRoleSnapshotType, ROLE_LABELS } from '@/types';
import type { UserRole, SnapshotType } from '@/types';
import { ArrowRight, ArrowLeft, User, Briefcase, BookOpen, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const SNAPSHOT_TYPE_DESCRIPTIONS: Record<SnapshotType, string> = {
  member: 'Covers 11 areas of life and business — from faith and marriage to sales and leadership.',
  leader: 'Focused on 9 areas including team management, goal progress, and spiritual growth.',
  advisor: 'Tailored for mentors and advisors — 9 areas including mentoring and life lessons.',
  nonprofit: 'Built for nonprofit leaders — 11 areas including growth, impact, and donor relationships.',
};

export default function Onboarding() {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [companyName, setCompanyName] = useState(profile?.company_name || '');
  const [companyTitle, setCompanyTitle] = useState(profile?.company_title || '');
  const [city, setCity] = useState(profile?.city || '');
  const [state, setState] = useState(profile?.state || '');

  const role = (profile?.role || 'member') as UserRole;
  const defaultSnapshotType = getRoleSnapshotType(role);
  const [snapshotType, setSnapshotType] = useState<SnapshotType>(defaultSnapshotType);

  const totalSteps = 3; // Profile, Snapshot Type, Welcome

  const handleComplete = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          company_name: companyName,
          company_title: companyTitle,
          city,
          state,
          snapshot_type: snapshotType,
          onboarding_completed: true,
        })
        .eq('user_id', profile.user_id);

      if (error) throw error;
      await refreshProfile();
      navigate('/');
    } catch (err) {
      console.error('Onboarding error:', err);
      toast({ title: 'Error', description: 'Could not save your profile. Please try again.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // For demo mode, just mark complete locally
  const handleDemoComplete = () => {
    navigate('/');
  };

  const isDemo = profile?.user_id === 'demo';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-xl w-full space-y-6">
        {/* Progress */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-secondary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
            />
          </div>
          <span className="text-sm font-body text-muted-foreground shrink-0">
            Step {step + 1} of {totalSteps}
          </span>
        </div>

        {/* Step 0: Profile Info */}
        {step === 0 && (
          <Card className="border-secondary/20 animate-slide-up-fade">
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="mx-auto w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                  <User className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-2xl font-heading font-bold text-primary">Welcome to Iron Forums</h2>
                <p className="text-base font-body text-muted-foreground">Let's get your profile set up so your brothers know who you are.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-heading font-semibold">Full Name</Label>
                  <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" className="font-body" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="font-heading font-semibold">Company</Label>
                    <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Company name" className="font-body" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-heading font-semibold">Title</Label>
                    <Input value={companyTitle} onChange={e => setCompanyTitle(e.target.value)} placeholder="Your title" className="font-body" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="font-heading font-semibold">City</Label>
                    <Input value={city} onChange={e => setCity(e.target.value)} placeholder="City" className="font-body" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-heading font-semibold">State</Label>
                    <Input value={state} onChange={e => setState(e.target.value)} placeholder="State" className="font-body" />
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-heading font-semibold">Your Role: {ROLE_LABELS[role]}</p>
                  <p className="text-xs font-body text-muted-foreground">Assigned by your chapter facilitator</p>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full h-14 text-base font-heading font-bold bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2"
                onClick={() => setStep(1)}
                disabled={!fullName.trim()}
              >
                Continue
                <ArrowRight className="h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Snapshot Type Selection */}
        {step === 1 && (
          <Card className="border-secondary/20 animate-slide-up-fade">
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="mx-auto w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center mb-2">
                  <BookOpen className="h-7 w-7 text-secondary" />
                </div>
                <h2 className="text-2xl font-heading font-bold text-primary">Choose Your Snapshot</h2>
                <p className="text-base font-body text-muted-foreground">
                  Based on your role, we recommend the <span className="font-semibold text-foreground">{SNAPSHOT_TYPE_LABELS[defaultSnapshotType]}</span>.
                  You can change this anytime.
                </p>
              </div>

              <div className="space-y-3">
                {(Object.keys(SNAPSHOT_TYPE_LABELS) as SnapshotType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => setSnapshotType(type)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      snapshotType === type
                        ? 'border-secondary bg-secondary/5 shadow-sm'
                        : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-base font-heading font-bold">{SNAPSHOT_TYPE_LABELS[type]}</p>
                        <p className="text-sm font-body text-muted-foreground mt-0.5">{SNAPSHOT_TYPE_DESCRIPTIONS[type]}</p>
                      </div>
                      {snapshotType === type && (
                        <CheckCircle2 className="h-5 w-5 text-secondary shrink-0" />
                      )}
                    </div>
                    {type === defaultSnapshotType && (
                      <span className="inline-block mt-2 text-xs font-body font-semibold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
                        Recommended for {ROLE_LABELS[role]}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" size="lg" className="h-14 font-heading font-bold gap-1.5" onClick={() => setStep(0)}>
                  <ArrowLeft className="h-5 w-5" />
                  Back
                </Button>
                <Button
                  size="lg"
                  className="flex-1 h-14 text-base font-heading font-bold bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2"
                  onClick={() => setStep(2)}
                >
                  Continue
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Welcome / Confirmation */}
        {step === 2 && (
          <Card className="border-secondary/20 animate-slide-up-fade">
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="text-center space-y-3">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mb-2">
                  <CheckCircle2 className="h-9 w-9 text-secondary" />
                </div>
                <h2 className="text-2xl font-heading font-bold text-primary">
                  You're all set, {fullName.split(' ')[0]}!
                </h2>
                <p className="text-base font-body text-muted-foreground leading-relaxed">
                  Every month, you'll be prompted to take your <span className="font-semibold text-foreground">{SNAPSHOT_TYPE_LABELS[snapshotType]}</span> — an honest 10-minute check-in across the areas of life that matter most.
                </p>
              </div>

              <div className="bg-muted/50 rounded-xl p-5 space-y-3">
                <h3 className="text-base font-heading font-bold">How it works:</h3>
                <ul className="space-y-2 text-sm font-body text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-secondary font-bold">1.</span>
                    On the 1st of each month, you'll be asked to complete your Snapshot.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-secondary font-bold">2.</span>
                    Rate each area of life honestly on a 1-10 scale.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-secondary font-bold">3.</span>
                    James, your accountability partner, will guide you with insights and encouragement.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-secondary font-bold">4.</span>
                    Track your growth over time and share with your Forum brothers.
                  </li>
                </ul>
              </div>

              <blockquote className="text-base font-body italic text-muted-foreground border-l-2 border-secondary/40 pl-4">
                "As iron sharpens iron, so one man sharpens another."
                <span className="block text-xs mt-1 not-italic">— Proverbs 27:17</span>
              </blockquote>

              <div className="flex gap-3">
                <Button variant="outline" size="lg" className="h-14 font-heading font-bold gap-1.5" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-5 w-5" />
                  Back
                </Button>
                <Button
                  size="lg"
                  className="flex-1 h-14 text-base font-heading font-bold bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2"
                  onClick={isDemo ? handleDemoComplete : handleComplete}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : "Let's Go"}
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
