import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { UserRole } from '@/types';
import type { Session, User } from '@supabase/supabase-js';

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
  onboarding_completed: boolean;
  snapshot_type: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
  hasMinRole: (role: UserRole) => boolean;
  refreshProfile: () => Promise<void>;
}

const ROLE_HIERARCHY: UserRole[] = ['member', 'facilitator', 'executive', 'ceo'];

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
  onboarding_completed: true,
  snapshot_type: 'advisor',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (data) {
      setProfile(data as unknown as Profile);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          // Use setTimeout to avoid Supabase client deadlock
          setTimeout(() => fetchProfile(currentSession.user.id), 0);
        } else {
          // No session — fall back to demo for now
          setProfile(DEMO_PROFILE);
        }
        setIsLoading(false);
      }
    );

    // THEN check existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      if (existingSession?.user) {
        setSession(existingSession);
        setUser(existingSession.user);
        fetchProfile(existingSession.user.id);
      } else {
        // No session — demo fallback
        setProfile(DEMO_PROFILE);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(DEMO_PROFILE);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const userRole = (profile?.role ?? 'member') as UserRole;
  const hasRole = (role: UserRole) => userRole === role;
  const hasMinRole = (role: UserRole) => {
    return ROLE_HIERARCHY.indexOf(userRole) >= ROLE_HIERARCHY.indexOf(role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isAuthenticated: !!profile,
        isLoading,
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
