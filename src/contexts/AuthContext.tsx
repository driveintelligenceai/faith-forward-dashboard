import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import type { UserRole } from '@/types';

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  chapter: string | null;
  role: string;
  linkedin_id: string | null;
  linkedin_url: string | null;
  linkedin_headline: string | null;
  linkedin_company: string | null;
  linkedin_title: string | null;
  linkedin_bio: string | null;
  linkedin_connected_at: string | null;
  company_name: string | null;
  company_title: string | null;
  city: string | null;
  state: string | null;
  bio: string | null;
  phone: string | null;
}

interface AuthContextType {
  user: SupabaseUser | null;
  profile: Profile | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signup: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  loginWithGoogle: () => Promise<{ error: string | null }>;
  sendMagicLink: (email: string) => Promise<{ error: string | null }>;
  loginAsDemo: () => void;
  logout: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  hasMinRole: (role: UserRole) => boolean;
  refreshProfile: () => Promise<void>;
}

const ROLE_HIERARCHY: UserRole[] = ['member', 'facilitator', 'executive', 'ceo'];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    setProfile(data as Profile | null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) fetchProfile(s.user.id);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signup = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    return { error: error?.message ?? null };
  };

  const loginWithGoogle = async () => {
    try {
      const { lovable } = await import('@/integrations/lovable/index');
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      });
      if (result.error) return { error: String(result.error) };
      return { error: null };
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Google sign-in failed' };
    }
  };

  const sendMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    return { error: error?.message ?? null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setDemoMode(false);
  };

  const [demoMode, setDemoMode] = useState(false);
  const DEMO_PROFILE: Profile = {
    id: 'demo',
    user_id: 'demo',
    full_name: 'Jonathan Almanzar',
    email: 'jonathan@ironforums.org',
    avatar_url: null,
    chapter: 'Suwanee Forum',
    role: 'ceo',
    linkedin_id: null,
    linkedin_url: null,
    linkedin_headline: null,
    linkedin_company: null,
    linkedin_title: null,
    linkedin_bio: null,
    linkedin_connected_at: null,
    company_name: 'Iron Forums',
    company_title: 'CEO',
    city: 'Suwanee',
    state: 'Georgia',
    bio: null,
    phone: null,
  };

  const loginAsDemo = () => {
    setDemoMode(true);
    setProfile(DEMO_PROFILE);
    setIsLoading(false);
  };

  const activeProfile = demoMode ? DEMO_PROFILE : profile;

  const userRole = (activeProfile?.role ?? 'member') as UserRole;
  const hasRole = (role: UserRole) => userRole === role;
  const hasMinRole = (role: UserRole) => {
    return ROLE_HIERARCHY.indexOf(userRole) >= ROLE_HIERARCHY.indexOf(role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile: activeProfile,
        session,
        isAuthenticated: !!session || demoMode,
        isLoading,
        login,
        signup,
        loginWithGoogle,
        sendMagicLink,
        loginAsDemo,
        logout,
        hasRole,
        hasMinRole,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
