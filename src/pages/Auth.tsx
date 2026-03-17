import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import ironForumsLogo from '@/assets/iron-forums-logo.svg';
import { Mail, ArrowRight, CheckCircle2, Eye } from 'lucide-react';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();
  const { enterDemoMode } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      toast({ title: 'Sign in failed', description: error.message, variant: 'destructive' });
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Could not send link', description: error.message, variant: 'destructive' });
    } else {
      setEmailSent(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left: Brand panel */}
      <div className="bg-primary flex flex-col items-center justify-center lg:w-[48%] px-8 py-12 lg:py-0 lg:min-h-screen">
        <div className="max-w-sm w-full flex flex-col items-center text-center space-y-6">
          <img
            src={ironForumsLogo}
            alt="Iron Forums"
            className="w-48 sm:w-56 lg:w-64 h-auto brightness-0 invert"
          />
          <p className="text-[0.7rem] font-body tracking-[0.3em] uppercase text-secondary font-bold">
            Connect <span className="text-primary-foreground/30 mx-1">»</span> Sharpen <span className="text-primary-foreground/30 mx-1">»</span> Grow
          </p>
          <div className="hidden lg:block pt-6">
            <blockquote className="text-primary-foreground/70 font-body text-sm italic leading-relaxed border-l-2 border-secondary/40 pl-4 text-left">
              "As iron sharpens iron, so one person sharpens another."
              <span className="block text-xs mt-1 not-italic text-primary-foreground/50">— Proverbs 27:17</span>
            </blockquote>
          </div>
        </div>
      </div>

      {/* Right: Auth form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:py-0 bg-background">
        <div className="max-w-sm w-full space-y-8">
          {/* Mobile logo (hidden on desktop since left panel shows it) */}
          <div className="lg:hidden flex justify-center">
            <img src={ironForumsLogo} alt="Iron Forums" className="h-12 w-auto" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-primary tracking-tight">
              Member Portal
            </h1>
            <p className="font-body text-muted-foreground text-base">
              Sign in to access your dashboard and monthly snapshots.
            </p>
          </div>

          {emailSent ? (
            <div className="text-center space-y-4 py-6">
              <div className="mx-auto w-14 h-14 rounded-full bg-secondary/10 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-secondary" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-lg font-heading font-bold text-foreground">Check your email</h2>
                <p className="font-body text-sm text-muted-foreground">
                  We sent a sign-in link to <span className="font-semibold text-foreground">{email}</span>
                </p>
              </div>
              <button
                onClick={() => { setEmailSent(false); setEmail(''); }}
                className="text-sm font-body text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Explore Demo */}
              <Button
                size="lg"
                className="w-full h-13 text-base font-heading font-bold gap-3 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                onClick={() => { enterDemoMode(); navigate('/hub'); }}
              >
                <Eye className="h-5 w-5" />
                Explore the Demo
              </Button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs font-body text-muted-foreground uppercase tracking-wider">or sign in</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Google Sign In */}
              <Button
                variant="outline"
                size="lg"
                className="w-full h-13 text-base font-body font-semibold gap-3 border-border hover:bg-muted/50 transition-all"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </Button>

              {/* LinkedIn coming soon */}
              <Button
                variant="outline"
                size="lg"
                className="w-full h-13 text-base font-body font-semibold gap-3 border-border opacity-50 cursor-not-allowed"
                disabled
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#0A66C2">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn — Coming Soon
              </Button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs font-body text-muted-foreground uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Email magic link */}
              <form onSubmit={handleMagicLink} className="space-y-3">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-body font-semibold text-foreground">
                    Email address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 text-base font-body"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-13 text-base font-heading font-bold gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                  disabled={loading || !email.trim()}
                >
                  <Mail className="h-4.5 w-4.5" />
                  Send me a sign-in link
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>

              <p className="text-xs font-body text-muted-foreground text-center leading-relaxed">
                By signing in, you agree to the Iron Forums member guidelines.
                <br />
                Only active members can access the portal.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
