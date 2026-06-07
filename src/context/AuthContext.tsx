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

// ── Local-storage fallback (used when Supabase isn't configured yet) ──
// This lets the app run end-to-end even before you wire up Supabase.
const LOCAL_USERS_KEY = 'tamini_local_users';
const LOCAL_SESSION_KEY = 'tamini_local_session';

interface LocalUser {
  id: string;
  email: string;
  password: string; // demo only, plaintext — replace with Supabase in prod
  role: UserRole;
  full_name?: string;
  facility_id: string | null;
  created_at: string;
}

function getLocalUsers(): LocalUser[] {
  const raw = localStorage.getItem(LOCAL_USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}
function saveLocalUsers(users: LocalUser[]) {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}
function getLocalSession(): LocalUser | null {
  const raw = localStorage.getItem(LOCAL_SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}
function setLocalSession(u: LocalUser | null) {
  if (u) localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(u));
  else localStorage.removeItem(LOCAL_SESSION_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<TaminiProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initial session check
  useEffect(() => {
    let mounted = true;

    const init = async () => {
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
        if (mounted) setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && mounted) {
        setUser(session.user);
        await loadProfile(session.user.id);
      }
      if (mounted) setLoading(false);

      const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!mounted) return;
        if (session?.user) {
          setUser(session.user);
          await loadProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
      });

      return () => sub.subscription.unsubscribe();
    };

    init();
    return () => { mounted = false; };
  }, []);

  const loadProfile = async (userId: string) => {
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
    setProfile((data as TaminiProfile | null) ?? null);
  };

  const signUp: AuthContextType['signUp'] = async (email, password, role, fullName, facilityName) => {
    if (!isSupabaseConfigured()) {
      const users = getLocalUsers();
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        return { error: 'Un compte existe déjà avec cet email.' };
      }
      const id = crypto.randomUUID();
      const newUser: LocalUser = {
        id,
        email,
        password,
        role,
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

    // Initial profile upsert (without facility_id — may be updated below)
    const { error: pErr } = await supabase.from('profiles').upsert({
      id: userId,
      email,
      role,
      full_name: fullName || null,
      facility_id: null
    }, { onConflict: 'id' });
    if (pErr) return { error: 'Compte créé mais profil non enregistré : ' + pErr.message, userId };

    // For super_admin, create the facility and attach it to the profile via a secure RPC
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
  };

  const signIn: AuthContextType['signIn'] = async (email, password) => {
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

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    if (!isSupabaseConfigured()) {
      setLocalSession(null);
      setProfile(null);
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
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
