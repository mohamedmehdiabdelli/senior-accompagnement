import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export type UserRole = 'super_admin' | 'admin' | 'caregiver' | 'family';

export interface TaminiProfile {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  facility_id: string | null;
  approved?: boolean;
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
  signUp: (email: string, password: string, role: UserRole, fullName?: string, facilityName?: string, facilityId?: string) => Promise<{ error: string | null; userId?: string }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  inviteStaff: (email: string, role: UserRole, facilityId: string) => Promise<{ error: string | null }>;
  revokeStaffAccess: (id: string) => Promise<{ error: string | null }>;
  getAllowedStaff: () => Promise<{ data: AllowedStaffEntry[] | null; error: string | null }>;
  getFacilities: () => Promise<{ data: Facility[] | null; error: string | null }>;
  getPendingWorkerRequests: () => Promise<{ data: TaminiProfile[] | null; error: string | null }>;
  approveWorkerRequest: (id: string) => Promise<{ error: string | null }>;
  rejectWorkerRequest: (id: string) => Promise<{ error: string | null }>;
  getFacilityStaff: () => Promise<{ data: TaminiProfile[] | null; error: string | null }>;
  removeWorker: (id: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
  approved?: boolean;
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

  const loadProfile = async (userId: string): Promise<TaminiProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (error) {
        console.error('Profile load error:', error);
        setProfile(null);
        return null;
      }
      if (!data) {
        console.warn(`No profile found for user ${userId}`);
        setProfile(null);
        return null;
      }
      const profileData = data as TaminiProfile;
      setProfile(profileData);
      return profileData;
    } catch (err) {
      console.error('Unexpected error loading profile:', err);
      setProfile(null);
      return null;
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
          approved: local.approved,
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

          const profileData = await loadProfile(session.user.id);
          if (profileData && profileData.role === 'caregiver' && profileData.approved === false) {
            console.warn('Caregiver account is not approved yet');
            await supabase.auth.signOut();
            setUser(null);
            setProfile(null);
            return;
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
          const profileData = await loadProfile(session.user.id);
          if (profileData && profileData.role === 'caregiver' && profileData.approved === false) {
            console.warn('Caregiver account is not approved yet');
            await supabase.auth.signOut();
            setUser(null);
            setProfile(null);
            return;
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

  const signUp: AuthContextType['signUp'] = async (email, password, role, fullName, facilityName, facilityId) => {
    try {
      const cleanEmail = email.toLowerCase().trim();

      // --- OFFLINE MODE ---
      if (!isSupabaseConfigured()) {
        const users = getLocalUsers();
        if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
          return { error: 'Un compte existe déjà avec cet email.' };
        }
        const id = crypto.randomUUID();
        const newUser: LocalUser = {
          id,
          email: cleanEmail,
          password,
          role,
          full_name: fullName,
          facility_id: facilityId || null,
          approved: role !== 'caregiver',
          created_at: new Date().toISOString()
        };
        saveLocalUsers([...users, newUser]);
        setLocalSession(newUser);
        setProfile({ ...newUser, approved: role !== 'caregiver' });
        return { error: null, userId: id };
      }

      // --- ONLINE SUPABASE MODE ---

      // 1. Check if user is an invited staff member using the VIP RPC (Bypasses RLS)
      const { data: invites, error: inviteError } = await supabase
        .rpc('get_staff_invite', { lookup_email: cleanEmail });

      const invite = invites && invites.length > 0 ? invites[0] : null;
      const finalRole = invite ? (invite.invited_role as UserRole) : role;
      const finalFacilityId = invite ? invite.invited_facility_id : facilityId || null;
      const isSuperAdmin = finalRole === 'super_admin';
      const isCaregiver = finalRole === 'caregiver';

      if (isCaregiver && !finalFacilityId) {
        return { error: 'Veuillez sélectionner une maison de retraite existante.' };
      }

      if (isSuperAdmin && !facilityName && !invite) {
        return { error: 'Veuillez saisir le nom de votre maison de retraite.' };
      }

      const approved = Boolean(invite || isSuperAdmin || role === 'family');

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            role: finalRole,
            facility_id: finalFacilityId || null,
            full_name: fullName || null,
            approved
          }
        }
      });

      if (error) return { error: error.message };
      if (!data.user) return { error: 'Erreur inconnue lors de la création du compte.' };

      const userId = data.user.id;

      if (isSuperAdmin && facilityName && !invite) {
        const { error: rpcError } = await supabase.rpc('create_tenant', {
          facility_name: facilityName
        });

        if (rpcError) {
          return { error: "Erreur lors de la création de l'établissement : " + rpcError.message };
        }
      }

      await loadProfile(userId);
      return { error: null, userId };
    } catch (err) {
      console.error('Sign up error:', err);
      const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
      return { error: `Une erreur inattendue est survenue lors de l'inscription: ${errorMsg}` };
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

  const getPendingWorkerRequests: AuthContextType['getPendingWorkerRequests'] = async () => {
    try {
      if (!isSupabaseConfigured()) {
        const users = getLocalUsers().filter(u => u.role === 'caregiver' && u.approved === false);
        return { data: users.map(u => ({ ...u, approved: false })), error: null };
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'caregiver')
        .eq('approved', false);
      if (error) return { data: null, error: error.message };
      return { data: data as TaminiProfile[], error: null };
    } catch (err) {
      console.error('Get pending worker requests error:', err);
      return { data: null, error: 'Une erreur inattendue est survenue.' };
    }
  };

  const approveWorkerRequest: AuthContextType['approveWorkerRequest'] = async (id) => {
    try {
      if (!isSupabaseConfigured()) {
        const users = getLocalUsers().map(user => user.id === id ? { ...user, approved: true } : user);
        saveLocalUsers(users);
        return { error: null };
      }
      const { error } = await supabase
        .from('profiles')
        .update({ approved: true })
        .eq('id', id);
      if (error) return { error: error.message };
      return { error: null };
    } catch (err) {
      console.error('Approve worker request error:', err);
      return { error: 'Une erreur inattendue est survenue.' };
    }
  };

  const rejectWorkerRequest: AuthContextType['rejectWorkerRequest'] = async (id) => {
    try {
      if (!isSupabaseConfigured()) {
        saveLocalUsers(getLocalUsers().filter(user => user.id !== id));
        return { error: null };
      }
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);
      if (error) return { error: error.message };
      return { error: null };
    } catch (err) {
      console.error('Reject worker request error:', err);
      return { error: 'Une erreur inattendue est survenue.' };
    }
  };

  const getFacilityStaff: AuthContextType['getFacilityStaff'] = async () => {
    try {
      if (!isSupabaseConfigured()) {
        const users = getLocalUsers().filter(u => u.role !== 'family' && u.approved !== false);
        return { data: users as TaminiProfile[], error: null };
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'family')
        .eq('approved', true);
      if (error) return { data: null, error: error.message };
      return { data: data as TaminiProfile[], error: null };
    } catch (err) {
      console.error('Get facility staff error:', err);
      return { data: null, error: 'Une erreur inattendue est survenue.' };
    }
  };

  const removeWorker: AuthContextType['removeWorker'] = async (id) => {
    try {
      if (!isSupabaseConfigured()) {
        saveLocalUsers(getLocalUsers().filter(user => user.id !== id));
        return { error: null };
      }
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);
      if (error) return { error: error.message };
      return { error: null };
    } catch (err) {
      console.error('Remove worker error:', err);
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
        return { data: [{ id: 'local', name: 'Maison de retraite de démonstration' }], error: null };
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
        const profileData = await loadProfile(data.user.id);
        if (profileData && profileData.role === 'caregiver' && profileData.approved === false) {
          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);
          return { error: 'Votre compte est en attente d\'approbation.' };
        }
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
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signUp,
      signIn,
      signOut,
      inviteStaff,
      revokeStaffAccess,
      getAllowedStaff,
      getFacilities,
      getPendingWorkerRequests,
      approveWorkerRequest,
      rejectWorkerRequest,
      getFacilityStaff,
      removeWorker
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
