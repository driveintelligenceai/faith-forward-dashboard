import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import ironForumsLogo from '@/assets/iron-forums-logo.svg';
import { LogIn, Lock, Mail, User, Linkedin } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup, loginWithGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await login(email, password);
    setLoading(false);
    if (error) {
      toast({ title: 'Sign In Failed', description: error, variant: 'destructive' });
    } else {
      navigate('/');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signup(email, password, fullName);
    setLoading(false);
    if (error) {
      toast({ title: 'Sign Up Failed', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Check Your Email', description: 'We sent you a confirmation link to verify your account.' });
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await loginWithGoogle();
    setLoading(false);
    if (error) {
      toast({ title: 'Google Sign In Failed', description: error, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="flex justify-center">
            <img src={ironForumsLogo} alt="Iron Forums" className="h-20 w-auto" />
          </div>
          <div>
            <CardTitle className="text-3xl font-heading font-bold text-primary">Welcome</CardTitle>
            <CardDescription className="text-base font-body mt-2">
              Sign in to your Iron Forums dashboard
            </CardDescription>
            <p className="text-xs font-body text-secondary font-semibold tracking-wide mt-1">
              Connect · Sharpen · Grow
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-4">
          {/* Google Sign In */}
          <Button
            variant="outline"
            className="w-full h-12 text-base font-heading font-semibold gap-3"
            onClick={handleGoogle}
            disabled={loading}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </Button>

          {/* LinkedIn placeholder */}
          <Button
            variant="outline"
            className="w-full h-12 text-base font-heading font-semibold gap-3 border-[hsl(var(--primary))]/30 text-primary hover:bg-primary/5"
            disabled
          >
            <Linkedin className="h-5 w-5" />
            Continue with LinkedIn
            <span className="text-xs font-body text-muted-foreground ml-auto">(Coming Soon)</span>
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground font-body">Or with email</span>
            </div>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin" className="font-heading font-semibold">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="font-heading font-semibold">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleLogin} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-base font-heading font-semibold">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-11 h-12 text-base font-body" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-heading font-semibold">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-11 h-12 text-base font-body" required />
                  </div>
                </div>
                <Button className="w-full h-12 text-base font-heading font-bold" size="lg" type="submit" disabled={loading}>
                  <LogIn className="h-5 w-5 mr-2" /> Sign In
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-base font-heading font-semibold">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input type="text" placeholder="John Smith" value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-11 h-12 text-base font-body" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-heading font-semibold">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-11 h-12 text-base font-body" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-heading font-semibold">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-11 h-12 text-base font-body" required minLength={6} />
                  </div>
                </div>
                <Button className="w-full h-12 text-base font-heading font-bold" size="lg" type="submit" disabled={loading}>
                  <User className="h-5 w-5 mr-2" /> Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
