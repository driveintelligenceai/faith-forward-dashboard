import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ironForumsLogo from '@/assets/iron-forums-logo.svg';
import { LogIn, Lock, Mail } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="flex justify-center">
            <img src={ironForumsLogo} alt="Iron Forums" className="h-20 w-auto" />
          </div>
          <div>
            <CardTitle className="text-3xl font-heading font-bold text-primary">Welcome Back</CardTitle>
            <CardDescription className="text-base font-body mt-2">
              Sign in to your Iron Forums dashboard
            </CardDescription>
            <p className="text-xs font-body text-secondary font-semibold tracking-wide mt-1">
              Connect · Sharpen · Grow
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-4">
          <div className="space-y-2">
            <Label className="text-base font-heading font-semibold">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-11 h-12 text-base font-body"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-base font-heading font-semibold">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-11 h-12 text-base font-body"
              />
            </div>
          </div>
          <Button className="w-full h-12 text-base font-heading font-bold" size="lg">
            <LogIn className="h-5 w-5 mr-2" />
            Sign In
          </Button>
          <p className="text-center text-sm font-body text-muted-foreground">
            Authentication will be connected in the next phase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
