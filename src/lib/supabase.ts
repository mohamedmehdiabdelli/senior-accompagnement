import { createClient } from '@supabase/supabase-js';

// Strip any trailing /rest/v1/ or trailing slash — supabase-js wants the bare project URL
const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as any); // AuthContext already guards with isSupabaseConfigured()

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

export interface UserProfile {
  id: string;
  email: string;
  is_subscribed: boolean;
  subscription_date?: string;
}
