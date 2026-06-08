import { createClient } from '@supabase/supabase-js';

// Strip any trailing /rest/v1/ or trailing slash — supabase-js wants the bare project URL
const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
export const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export function isSupabaseConfigured() {
  return !!supabaseUrl && !!supabaseAnonKey;
}

export interface Facility {
  id: string;
  name: string;
  address: string;
  created_at?: string;
}

// Lazy singleton: createClient is deferred until first property access.
// This prevents the gotrue client's internal storage-recovery logic from
// deadlocking on cold boot. autoRefreshToken and detectSessionInUrl are
// disabled to eliminate background localStorage parsing during init.
let _client: ReturnType<typeof createClient> | null = null;

function getClient(): ReturnType<typeof createClient> {
  if (!_client) {
    if (supabaseUrl && supabaseAnonKey) {
      _client = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      });
    } else {
      _client = new Proxy({} as ReturnType<typeof createClient>, {
        get: () => () => ({ data: null, error: { message: 'Supabase not configured' } }),
      });
    }
  }
  return _client;
}

const NOOP_HANDLER: ProxyHandler<ReturnType<typeof createClient>> = {
  get(_, prop) {
    return Reflect.get(getClient(), prop);
  },
};

export const supabase = new Proxy({} as ReturnType<typeof createClient>, NOOP_HANDLER);

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
