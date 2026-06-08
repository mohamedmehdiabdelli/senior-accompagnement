import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
export const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export function isSupabaseConfigured() {
  return !!supabaseUrl && !!supabaseAnonKey;
}

// Bypasses the Web Locks API to entirely eradicate navigatorLock deadlocks and timeout bugs
const noOpLock = async (name: string, acquireTimeout: number, fn: () => Promise<any>) => {
  return await fn();
};

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        lock: noOpLock,
      },
    })
  : new Proxy({} as ReturnType<typeof createClient>, {
      get: () => () => ({ data: null, error: { message: 'Supabase not configured' } }),
    });

export interface Facility {
  id: string;
  name: string;
  address: string;
  created_at?: string;
}

// Types matching our DB schema
export interface Reminder {
  id: string;
  user_id: string | null;
  type: 'medicine' | 'meal' | 'appointment' | 'prayer' | 'other';
  title: string;
  time: string;
  description: string;
  active: boolean;
  facility_id: string;
  created_at?: string;
}

export interface Senior {
  id: string;
  caregiver_id: string | null;
  name: string;
  age: number;
  condition: string;
  image_url: string;
  facility_id: string;
  created_at?: string;
}

export interface Medicine {
  id: string;
  senior_id: string;
  name: string;
  dosage: string;
  time_of_day: 'Matin' | 'Midi' | 'Soir' | 'Nuit';
  taken: boolean;
  date: string;
}

export interface VitalRecord {
  id: string;
  senior_id: string;
  date: string;
  heart_rate: number;
  blood_pressure_sys: number;
  blood_pressure_dia: number;
  blood_sugar: number;
  temperature: number;
}

export interface CareLog {
  id: string;
  senior_id: string;
  time_label: string;
  text: string;
  author: string;
  mood: 'Souriant' | 'Calme' | 'Fatigué' | 'Agité';
  appetite: 'Excellent' | 'Moyen' | 'Faible';
  sleep: 'Bon' | 'Agité' | 'Mauvais';
  created_at?: string;
}

export interface HealthProduct {
  id: string;
  name: string;
  category: string;
  price: string;
  image_url: string;
  description: string;
  contact: string;
  type: 'buy' | 'don' | 'sell';
  created_at?: string;
}

export interface ClothingItem {
  id: string;
  owner_id: string;
  resident_name: string;
  category: 'Chemise' | 'Pantalon' | 'Robe' | 'Pyjama' | 'Veste' | 'T-shirt';
  size: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  color: 'Blanc' | 'Bleu' | 'Gris' | 'Beige' | 'Noir' | 'Rose';
  type: 'Jour' | 'Nuit' | 'Hiver' | 'Été' | 'Sortie';
  image_url: string;
  location: string;
  facility_id: string;
  senior_id?: string;
  ai_metadata?: Record<string, unknown>;
  created_at?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'caregiver' | 'family';
  full_name?: string;
  facility_id: string | null;
  is_subscribed?: boolean;
  created_at?: string;
}
