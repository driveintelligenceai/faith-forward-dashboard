import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import ironForumsLogo from '@/assets/iron-forums-logo.svg';
import { Mail, Linkedin, Loader2, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const { login, signup, loginWithGoogle, sendMagicLink, loginAsDemo } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await loginWithGoogle();
    setLoading(false);
    if (error) {
      toast({ title: 'Google Sign In Failed', description: error, variant: 'destructive' });
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await sendMagicLink(email);
    setLoading(false);
    if (error) {
      toast({ title: 'Failed to send link', description: error, variant: 'destructive' });
    } else {
      setMagicLinkSent(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-primary p-6">
      {/* Logo — large and commanding */}
      <div className="flex flex-col items-center mb-10">
        <img
          src={ironForumsLogo}
          alt="Iron Forums"
          className="h-28 sm:h-36 lg:h-44 w-auto brightness-0 invert drop-shadow-lg"
        />
        <p className="text-sm sm:text-base font-body tracking-[0.25em] uppercase text-secondary font-semibold mt-4">
          Connect &nbsp;»&nbsp; Sharpen &nbsp;»&nbsp; Grow
        </p>
      </div>

      {/* Auth card */}
      <div className="w-full max-w-sm space-y-4">
        {/* Google */}
        <Button
          variant="secondary"
          className="w-full h-14 text-base sm:text-lg font-heading font-bold gap-3 rounded-xl shadow-md"
          onClick={handleGoogle}
          disabled={loading}
        >
          <svg className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Sign in with Google
        </Button>

        {/* LinkedIn — coming soon */}
        <div className="relative w-full">
          <Button
            variant="outline"
            className="w-full h-14 text-base sm:text-lg font-heading font-semibold gap-3 rounded-xl bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/15 pr-24"
            disabled
          >
            <Linkedin className="h-5 w-5 sm:h-6 sm:w-6" />
            Sign in with LinkedIn
          </Button>
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-body text-primary-foreground/40 uppercase tracking-wider">
            Coming Soon
          </span>
        </div>

        {/* Divider */}
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-primary-foreground/20" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-primary px-3 text-xs font-body text-primary-foreground/50 uppercase tracking-wider">
              or
            </span>
          </div>
        </div>

        {/* Magic Link */}
        {magicLinkSent ? (
          <div className="bg-primary-foreground/10 rounded-xl p-5 text-center space-y-2">
            <CheckCircle2 className="h-8 w-8 text-secondary mx-auto" />
            <p className="text-base font-heading font-bold text-primary-foreground">Check your email</p>
            <p className="text-sm font-body text-primary-foreground/70">
              We sent a sign-in link to <strong className="text-primary-foreground">{email}</strong>
            </p>
            <button
              onClick={() => setMagicLinkSent(false)}
              className="text-sm font-body text-secondary hover:underline mt-2"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleMagicLink} className="space-y-3">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-14 text-base sm:text-lg font-body rounded-xl bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40 focus:border-secondary"
              required
            />
            <Button
              type="submit"
              variant="outline"
              className="w-full h-14 text-base sm:text-lg font-heading font-semibold gap-3 rounded-xl bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
              disabled={loading || !email.trim()}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Mail className="h-5 w-5 sm:h-6 sm:w-6" />
              )}
              Email me a sign-in link
            </Button>
          </form>
        )}

        {/* Demo */}
        <div className="pt-2">
          <button
            onClick={() => { loginAsDemo(); navigate('/'); }}
            className="w-full text-sm font-body text-primary-foreground/50 hover:text-secondary transition-colors py-2"
          >
            Try the demo →
          </button>
        </div>
      </div>

      {/* Footer scripture */}
      <p className="text-xs font-body text-primary-foreground/30 mt-10 text-center max-w-xs italic">
        "As iron sharpens iron, so one man sharpens another." — Proverbs 27:17
      </p>
    </div>
  );
}
