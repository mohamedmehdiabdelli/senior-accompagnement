import { createClient } from '@supabase/supabase-js';

// Strip any trailing /rest/v1/ or trailing slash — supabase-js wants the bare project URL
const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export function isSupabaseConfigured() {
  return !!supabaseUrl && !!supabaseAnonKey;
}

// Guard: createClient throws if either value is empty, which crashes the
// entire JS bundle and produces a blank page. Only create the real client
// when both values are present; otherwise return a no-op proxy so the app
// can fall back to its localStorage mode without crashing.
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (new Proxy({} as ReturnType<typeof createClient>, {
      get: () => () => ({ data: null, error: { message: 'Supabase not configured' } })
    }));

// Types matching our DB schema
export interface Reminder {
  id: string;
  user_id: string;
  type: 'medicine' | 'meal' | 'appointment' | 'prayer' | 'other';
  title: string;
  time: string;
  description: string;
  active: boolean;
  created_at?: string;
}

export interface Senior {
  id: string;
  caregiver_id: string;
  name: string;
  age: number;
  condition: string;
  image_url: string;
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
  item_name: string;
  category: 'Chemise' | 'Pantalon' | 'Robe' | 'Pyjama' | 'Veste' | 'T-shirt';
  size: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  color: 'Blanc' | 'Bleu' | 'Gris' | 'Beige' | 'Noir' | 'Rose';
  type: 'Jour' | 'Nuit' | 'Hiver' | 'Été' | 'Sortie';
  image_url: string;
  location: string;
  created_at?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  is_subscribed: boolean;
  subscription_date?: string;
}
