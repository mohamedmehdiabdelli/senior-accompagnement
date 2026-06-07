import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export type UserRole = 'super_admin' | 'admin' | 'caregiver' | 'family';

export interface TaminiProfile {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  facility_id: string | null;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  profile: TaminiProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, role: UserRole, fullName?: string, facilityName?: string) => Promise<{ error: string | null; userId?: string }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isSupabaseConfigured = () =>
  !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;

const LOCAL_USERS_KEY = 'tamini_local_users';
const LOCAL_SESSION_KEY = 'tamini_local_session';

interface LocalUser {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  full_name?: string;
  facility_id: string | null;
  created_at: string;
}

function getLocalUsers(): LocalUser[] {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveLocalUsers(users: LocalUser[]) {
  try { localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users)); } catch {}
}
function getLocalSession(): LocalUser | null {
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function setLocalSession(u: LocalUser | null) {
  try {
    if (u) localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(u));
    else localStorage.removeItem(LOCAL_SESSION_KEY);
  } catch {}
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<TaminiProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (error) {
        console.error('Profile load error:', error);
        setProfile(null);
        return;
      }
      if (!data) {
        console.warn(`No profile found for user ${userId}`);
        setProfile(null);
        return;
      }
      setProfile(data as TaminiProfile);
    } catch (err) {
      console.error('Unexpected error loading profile:', err);
      setProfile(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        if (!isSupabaseConfigured()) {
          const local = getLocalSession();
          if (local && mounted) {
            setProfile({
              id: local.id,
              email: local.email,
              role: local.role,
              full_name: local.full_name,
              facility_id: local.facility_id,
              created_at: local.created_at
            });
          }
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          setUser(session.user);
          await loadProfile(session.user.id);
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (!mounted) return;
        if (session?.user) {
          setUser(session.user);
          await loadProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error('Auth state change error:', err);
      }
    });

    return () => {
      mounted = false;
      sub?.subscription.unsubscribe();
    };
  }, []);

  const signUp: AuthContextType['signUp'] = async (email, password, role, fullName, facilityName) => {
    try {
      if (!isSupabaseConfigured()) {
        const users = getLocalUsers();
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
          return { error: 'Un compte existe déjà avec cet email.' };
        }
        const id = crypto.randomUUID();
        const newUser: LocalUser = {
          id, email, password, role,
          full_name: fullName,
          facility_id: null,
          created_at: new Date().toISOString()
        };
        saveLocalUsers([...users, newUser]);
        setLocalSession(newUser);
        setProfile({
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          full_name: newUser.full_name,
          facility_id: newUser.facility_id,
          created_at: newUser.created_at
        });
        return { error: null, userId: id };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            full_name: fullName || null
          }
        }
      });
      if (error) return { error: error.message };
      if (!data.user) return { error: 'Erreur inconnue lors de la création du compte.' };

      const userId = data.user.id;

      if (role === 'super_admin' && facilityName) {
        const { data: facilityId, error: rpcError } = await supabase.rpc('create_tenant', {
          facility_name: facilityName
        });

        if (rpcError) {
          return { error: 'Erreur lors de la création de l\'établissement : ' + rpcError.message, userId };
        }
      }

      await loadProfile(userId);
      return { error: null, userId };
    } catch (err) {
      console.error('Sign up error:', err);
      return { error: 'Une erreur inattendue est survenue lors de l\'inscription.' };
    }
  };

  const signIn: AuthContextType['signIn'] = async (email, password) => {
    try {
      if (!isSupabaseConfigured()) {
        const users = getLocalUsers();
        const u = users.find(
          x => x.email.toLowerCase() === email.toLowerCase() && x.password === password
        );
        if (!u) return { error: 'Email ou mot de passe incorrect.' };
        setLocalSession(u);
        setProfile({
          id: u.id,
          email: u.email,
          role: u.role,
          full_name: u.full_name,
          facility_id: u.facility_id,
          created_at: u.created_at
        });
        return { error: null };
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };

      if (data.user) {
        await loadProfile(data.user.id);
      }
      return { error: null };
    } catch (err) {
      console.error('Sign in error:', err);
      return { error: 'Une erreur inattendue est survenue lors de la connexion.' };
    }
  };

  const signOut = async () => {
    try {
      if (!isSupabaseConfigured()) {
        setLocalSession(null);
        setProfile(null);
        return;
      }
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setUser(null);
      setProfile(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
