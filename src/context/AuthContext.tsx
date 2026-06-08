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

export interface AllowedStaffEntry {
  id: string;
  email: string;
  role: UserRole;
  facility_id: string;
  created_at?: string;
}

export interface Facility {
  id: string;
  name: string;
  address?: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  profile: TaminiProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: string | null; userId?: string }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  inviteStaff: (email: string, role: UserRole, facilityId: string) => Promise<{ error: string | null }>;
  revokeStaffAccess: (id: string) => Promise<{ error: string | null }>;
  getAllowedStaff: () => Promise<{ data: AllowedStaffEntry[] | null; error: string | null }>;
  getFacilities: () => Promise<{ data: Facility[] | null; error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isSupabaseConfigured = () =>
  !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;

const LOCAL_USERS_KEY = 'tamini_local_users';
const LOCAL_SESSION_KEY = 'tamini_local_session';
const LOCAL_ALLOWED_STAFF_KEY = 'tamini_local_allowed_staff';

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
function getLocalAllowedStaff(): { email: string; role: UserRole; facility_id: string }[] {
  try {
    const raw = localStorage.getItem(LOCAL_ALLOWED_STAFF_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveLocalAllowedStaff(list: { email: string; role: UserRole; facility_id: string }[]) {
  try { localStorage.setItem(LOCAL_ALLOWED_STAFF_KEY, JSON.stringify(list)); } catch {}
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

    if (!isSupabaseConfigured()) {
      const local = getLocalSession();
      if (local) {
        setProfile({
          id: local.id,
          email: local.email,
          role: local.role,
          full_name: local.full_name,
          facility_id: local.facility_id,
          created_at: local.created_at
        });
      }
      setLoading(false);
      return;
    }

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);

          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (data) {
            setProfile(data as TaminiProfile);
          } else {
            console.warn('Profile record missing or inaccessible, using metadata fallback', error);
            const meta = session.user.user_metadata;
            setProfile({
              id: session.user.id,
              email: session.user.email ?? '',
              role: (meta?.role as UserRole) ?? 'family',
              full_name: meta?.full_name ?? undefined,
              facility_id: meta?.facility_id ?? null,
            });
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') return;
      if (!mounted) return;

      try {
        if (session?.user) {
          setUser(session.user);
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (data) {
            setProfile(data as TaminiProfile);
          } else {
            const meta = session.user.user_metadata;
            setProfile({
              id: session.user.id,
              email: session.user.email ?? '',
              role: (meta?.role as UserRole) ?? 'family',
              full_name: meta?.full_name ?? undefined,
              facility_id: meta?.facility_id ?? null,
            });
          }
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

  const signUp: AuthContextType['signUp'] = async (email, password, fullName) => {
    try {
      if (!isSupabaseConfigured()) {
        const users = getLocalUsers();
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
          return { error: 'Un compte existe déjà avec cet email.' };
        }
        const allowed = getLocalAllowedStaff();
        const match = allowed.find(a => a.email.toLowerCase() === email.toLowerCase());
        const resolvedRole = match?.role ?? 'family';
        const resolvedFacilityId = match?.facility_id ?? null;
        const id = crypto.randomUUID();
        const newUser: LocalUser = {
          id, email, password,
          role: resolvedRole,
          full_name: fullName,
          facility_id: resolvedFacilityId,
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

      const { data: invite, error: inviteError } = await supabase
        .from('allowed_staff')
        .select('*')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (inviteError) {
        return { error: 'Erreur lors de la vérification de votre invitation. Veuillez réessayer.' };
      }

      if (!invite) {
        return { error: 'Cette adresse e-mail n\'est pas autorisée. Veuillez contacter votre administrateur.' };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: invite.role,
            facility_id: invite.facility_id,
            full_name: fullName || null
          }
        }
      });
      if (error) return { error: error.message };
      if (!data.user) return { error: 'Erreur inconnue lors de la création du compte.' };

      const userId = data.user.id;
      await loadProfile(userId);
      return { error: null, userId };
    } catch (err) {
      console.error('Sign up error:', err);
      return { error: 'Une erreur inattendue est survenue lors de l\'inscription.' };
    }
  };

  const inviteStaff: AuthContextType['inviteStaff'] = async (email, role, facilityId) => {
    try {
      if (!isSupabaseConfigured()) {
        const list = getLocalAllowedStaff();
        if (list.some(x => x.email.toLowerCase() === email.toLowerCase())) {
          return { error: 'Cet email a déjà été invité.' };
        }
        saveLocalAllowedStaff([...list, { email: email.toLowerCase(), role, facility_id: facilityId }]);
        return { error: null };
      }

      const { error } = await supabase
        .from('allowed_staff')
        .insert({ email: email.toLowerCase(), role, facility_id: facilityId });
      if (error) {
        if (error.code === '23505') {
          return { error: 'Cet email a déjà été invité.' };
        }
        return { error: error.message };
      }
      return { error: null };
    } catch (err) {
      console.error('Invite staff error:', err);
      return { error: 'Une erreur inattendue est survenue.' };
    }
  };

  const revokeStaffAccess: AuthContextType['revokeStaffAccess'] = async (id) => {
    try {
      if (!isSupabaseConfigured()) {
        const list = getLocalAllowedStaff();
        const idx = parseInt(id, 10);
        if (!isNaN(idx) && idx >= 0 && idx < list.length) {
          list.splice(idx, 1);
          saveLocalAllowedStaff(list);
        }
        return { error: null };
      }

      const { error } = await supabase
        .from('allowed_staff')
        .delete()
        .eq('id', id);
      if (error) return { error: error.message };
      return { error: null };
    } catch (err) {
      console.error('Revoke staff error:', err);
      return { error: 'Une erreur inattendue est survenue.' };
    }
  };

  const getAllowedStaff: AuthContextType['getAllowedStaff'] = async () => {
    try {
      if (!isSupabaseConfigured()) {
        const list = getLocalAllowedStaff();
        return { data: list.map((x, i) => ({ id: String(i), ...x })), error: null };
      }

      const { data, error } = await supabase
        .from('allowed_staff')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return { data: null, error: error.message };
      return { data: data as AllowedStaffEntry[], error: null };
    } catch (err) {
      console.error('Get allowed staff error:', err);
      return { data: null, error: 'Une erreur inattendue est survenue.' };
    }
  };

  const getFacilities: AuthContextType['getFacilities'] = async () => {
    try {
      if (!isSupabaseConfigured()) {
        return { data: null, error: 'Supabase n\'est pas configuré.' };
      }

      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .order('name', { ascending: true });
      if (error) return { data: null, error: error.message };
      return { data: data as Facility[], error: null };
    } catch (err) {
      console.error('Get facilities error:', err);
      return { data: null, error: 'Une erreur inattendue est survenue.' };
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
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, inviteStaff, revokeStaffAccess, getAllowedStaff, getFacilities }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
