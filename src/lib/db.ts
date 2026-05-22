/**
 * Database abstraction layer.
 * Uses Supabase when configured, falls back to localStorage for offline/demo mode.
 * This ensures the app works even before Supabase is set up.
 */
import { supabase, Reminder, Senior, Medicine, VitalRecord, CareLog, HealthProduct, ClothingItem } from './supabase';

const isSupabaseConfigured = () => 
  !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;

// --------- REMINDERS ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function getReminders(): Promise<Reminder[]> {
  if (!isSupabaseConfigured()) {
    const raw = localStorage.getItem('reminders');
    return raw ? JSON.parse(raw) : getDefaultReminders();
  }
  const { data, error } = await supabase.from('reminders').select('*').order('time');
  if (error) { console.error(error); return getDefaultReminders(); }
  return data as Reminder[];
}

export async function addReminder(r: Omit<Reminder, 'id' | 'created_at'>): Promise<Reminder | null> {
  if (!isSupabaseConfigured()) {
    const reminders = await getReminders();
    const newR = { ...r, id: crypto.randomUUID() };
    const updated = [...reminders, newR];
    localStorage.setItem('reminders', JSON.stringify(updated));
    return newR;
  }
  const { data, error } = await supabase.from('reminders').insert(r).select().single();
  if (error) { console.error(error); return null; }
  return data as Reminder;
}

export async function toggleReminder(id: string, active: boolean): Promise<void> {
  if (!isSupabaseConfigured()) {
    const reminders = await getReminders();
    const updated = reminders.map(r => r.id === id ? { ...r, active } : r);
    localStorage.setItem('reminders', JSON.stringify(updated));
    return;
  }
  await supabase.from('reminders').update({ active }).eq('id', id);
}

export async function deleteReminder(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const reminders = await getReminders();
    localStorage.setItem('reminders', JSON.stringify(reminders.filter(r => r.id !== id)));
    return;
  }
  await supabase.from('reminders').delete().eq('id', id);
}

// --------- SENIORS (Caregiver space) ------------------------------------------------------------------------------------------------------------------------------------------------

export async function getSeniors(): Promise<Senior[]> {
  if (!isSupabaseConfigured()) {
    const raw = localStorage.getItem('seniors');
    return raw ? JSON.parse(raw) : getDefaultSeniors();
  }
  const { data, error } = await supabase.from('seniors').select('*');
  if (error) { console.error(error); return getDefaultSeniors(); }
  return data as Senior[];
}

export async function addSenior(s: Omit<Senior, 'id' | 'created_at'>): Promise<Senior | null> {
  if (!isSupabaseConfigured()) {
    const seniors = await getSeniors();
    const newS = { ...s, id: crypto.randomUUID() };
    localStorage.setItem('seniors', JSON.stringify([...seniors, newS]));
    return newS;
  }
  const { data, error } = await supabase.from('seniors').insert(s).select().single();
  if (error) { console.error(error); return null; }
  return data as Senior;
}

export async function deleteSenior(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const seniors = await getSeniors();
    localStorage.setItem('seniors', JSON.stringify(seniors.filter(s => s.id !== id)));
    return;
  }
  await supabase.from('seniors').delete().eq('id', id);
}

// --------- MEDICINES ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function getMedicines(seniorId: string): Promise<Medicine[]> {
  const today = new Date().toISOString().split('T')[0];
  if (!isSupabaseConfigured()) {
    const raw = localStorage.getItem(`medicines_${seniorId}`);
    return raw ? JSON.parse(raw) : [];
  }
  const { data, error } = await supabase
    .from('medicines')
    .select('*')
    .eq('senior_id', seniorId)
    .eq('date', today);
  if (error) { console.error(error); return []; }
  return data as Medicine[];
}

export async function addMedicine(m: Omit<Medicine, 'id'>): Promise<Medicine | null> {
  if (!isSupabaseConfigured()) {
    const medicines = await getMedicines(m.senior_id);
    const newM = { ...m, id: crypto.randomUUID() };
    localStorage.setItem(`medicines_${m.senior_id}`, JSON.stringify([...medicines, newM]));
    return newM;
  }
  const { data, error } = await supabase.from('medicines').insert(m).select().single();
  if (error) { console.error(error); return null; }
  return data as Medicine;
}

export async function toggleMedicine(id: string, seniorId: string, taken: boolean): Promise<void> {
  if (!isSupabaseConfigured()) {
    const medicines = await getMedicines(seniorId);
    const updated = medicines.map(m => m.id === id ? { ...m, taken } : m);
    localStorage.setItem(`medicines_${seniorId}`, JSON.stringify(updated));
    return;
  }
  await supabase.from('medicines').update({ taken }).eq('id', id);
}

export async function deleteMedicine(id: string, seniorId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const medicines = await getMedicines(seniorId);
    localStorage.setItem(`medicines_${seniorId}`, JSON.stringify(medicines.filter(m => m.id !== id)));
    return;
  }
  await supabase.from('medicines').delete().eq('id', id);
}

// --------- VITALS ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function getVitals(seniorId: string): Promise<VitalRecord[]> {
  if (!isSupabaseConfigured()) {
    const raw = localStorage.getItem(`vitals_${seniorId}`);
    return raw ? JSON.parse(raw) : [];
  }
  const { data, error } = await supabase
    .from('vitals')
    .select('*')
    .eq('senior_id', seniorId)
    .order('date', { ascending: true })
    .limit(30);
  if (error) { console.error(error); return []; }
  return data as VitalRecord[];
}

export async function addVital(v: Omit<VitalRecord, 'id'>): Promise<VitalRecord | null> {
  if (!isSupabaseConfigured()) {
    const vitals = await getVitals(v.senior_id);
    const newV = { ...v, id: crypto.randomUUID() };
    localStorage.setItem(`vitals_${v.senior_id}`, JSON.stringify([...vitals, newV]));
    return newV;
  }
  const { data, error } = await supabase.from('vitals').insert(v).select().single();
  if (error) { console.error(error); return null; }
  return data as VitalRecord;
}

// --------- CARE LOGS ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function getCareLogs(seniorId: string): Promise<CareLog[]> {
  if (!isSupabaseConfigured()) {
    const raw = localStorage.getItem(`logs_${seniorId}`);
    return raw ? JSON.parse(raw) : [];
  }
  const { data, error } = await supabase
    .from('care_logs')
    .select('*')
    .eq('senior_id', seniorId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) { console.error(error); return []; }
  return data as CareLog[];
}

export async function addCareLog(log: Omit<CareLog, 'id' | 'created_at'>): Promise<CareLog | null> {
  if (!isSupabaseConfigured()) {
    const logs = await getCareLogs(log.senior_id);
    const newLog = { ...log, id: crypto.randomUUID() };
    localStorage.setItem(`logs_${log.senior_id}`, JSON.stringify([newLog, ...logs]));
    return newLog;
  }
  const { data, error } = await supabase.from('care_logs').insert(log).select().single();
  if (error) { console.error(error); return null; }
  return data as CareLog;
}

// --------- HEALTH PRODUCTS ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function getProducts(): Promise<HealthProduct[]> {
  if (!isSupabaseConfigured()) {
    const raw = localStorage.getItem('health_products');
    return raw ? JSON.parse(raw) : getDefaultProducts();
  }
  const { data, error } = await supabase.from('health_products').select('*').order('created_at', { ascending: false });
  if (error) { console.error(error); return getDefaultProducts(); }
  return data as HealthProduct[];
}

export async function addProduct(p: Omit<HealthProduct, 'id' | 'created_at'>): Promise<HealthProduct | null> {
  if (!isSupabaseConfigured()) {
    const products = await getProducts();
    const newP = { ...p, id: crypto.randomUUID() };
    localStorage.setItem('health_products', JSON.stringify([newP, ...products]));
    return newP;
  }
  const { data, error } = await supabase.from('health_products').insert(p).select().single();
  if (error) { console.error(error); return null; }
  return data as HealthProduct;
}

export async function deleteProduct(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const products = await getProducts();
    localStorage.setItem('health_products', JSON.stringify(products.filter(p => p.id !== id)));
    return;
  }
  await supabase.from('health_products').delete().eq('id', id);
}

export async function getClothingItems(ownerId?: string): Promise<ClothingItem[]> {
  if (!isSupabaseConfigured()) {
    return getLocalClothingItems(ownerId).map(normalizeClothingItem);
  }
  if (!ownerId) return [];
  const { data, error } = await supabase
    .from('clothing_items')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error(error);
    return [];
  }
  return ((data ?? []) as ClothingItem[]).map(normalizeClothingItem);
}

export async function addClothingItem(
  item: Omit<ClothingItem, 'id' | 'owner_id' | 'created_at'>,
  ownerId: string
): Promise<ClothingItem | null> {
  if (!isSupabaseConfigured()) {
    const items = getLocalClothingItems(ownerId);
    const newItem: ClothingItem = {
      ...item,
      id: crypto.randomUUID(),
      owner_id: ownerId,
      created_at: new Date().toISOString()
    };
    saveLocalClothingItems(ownerId, [newItem, ...items]);
    return newItem;
  }

  const { data, error } = await supabase
    .from('clothing_items')
    .insert({ ...item, owner_id: ownerId })
    .select()
    .single();
  if (error) {
    console.error('Supabase clothing insert error:', error);
    throw error;
  }
  return data as ClothingItem;
}

export async function uploadClothingImage(file: File, ownerId: string): Promise<string> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase storage is not configured.');
  }

  const bucket = 'clothing-images';
  const filePath = `${ownerId}/${crypto.randomUUID()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, { cacheControl: '3600', upsert: false });

  if (uploadError) {
    console.error('Supabase storage upload error:', uploadError);
    throw uploadError;
  }

  const urlResponse = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  if (!urlResponse.data?.publicUrl) {
    console.error('Supabase storage public URL error: missing publicUrl');
    throw new Error('Unable to retrieve public image URL.');
  }

  return urlResponse.data.publicUrl;
}

function getLocalClothingItems(ownerId?: string): ClothingItem[] {
  if (!ownerId) return getDefaultClothingItems();
  const raw = localStorage.getItem(`clothing_items_${ownerId}`);
  if (!raw) return getDefaultClothingItems();
  try {
    return JSON.parse(raw) as ClothingItem[];
  } catch (error) {
    console.error('Failed to parse local clothing items', error);
    return getDefaultClothingItems();
  }
}

function saveLocalClothingItems(ownerId: string, items: ClothingItem[]) {
  localStorage.setItem(`clothing_items_${ownerId}`, JSON.stringify(items));
}

export function getDefaultClothingItems(): ClothingItem[] {
  return [
    {
      id: 'cl-1',
      owner_id: 'local',
      resident_name: 'Mme. Fatma Ben Ali',
      name: 'Chemise en coton',
      category: 'Chemise',
      size: 'L',
      color: 'Blanc',
      type: 'Jour',
      image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800',
      location: 'Armoire A - étagère 2'
    },
    {
      id: 'cl-2',
      owner_id: 'local',
      resident_name: 'Mme. Fatma Ben Ali',
      name: 'Pyjama chaud',
      category: 'Pyjama',
      size: 'XL',
      color: 'Bleu',
      type: 'Nuit',
      image_url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=800',
      location: 'Armoire A - tiroir 1'
    },
    {
      id: 'cl-3',
      owner_id: 'local',
      resident_name: 'Mr. Béchir Mezghani',
      name: 'Veste légère',
      category: 'Veste',
      size: 'M',
      color: 'Gris',
      type: 'Sortie',
      image_url: 'https://images.unsplash.com/photo-1520975929533-8c6bbd91e2a1?auto=format&fit=crop&q=80&w=800',
      location: 'Armoire B - portants'
    }
  ];
}

function normalizeClothingItem(item: ClothingItem & { item_name?: string }): ClothingItem {
  return {
    ...item,
    name: item.name || item.item_name || ''
  };
}

// --------- SUBSCRIPTION ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

export function getSubscriptionStatus(): boolean {
  return localStorage.getItem('is_subscribed') === 'true';
}

export function setSubscriptionStatus(value: boolean): void {
  localStorage.setItem('is_subscribed', String(value));
}

// --------- DEFAULT DATA ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

function getDefaultReminders(): Reminder[] {
  return [
    { id: '1', user_id: 'local', type: 'medicine', title: 'Doliprane 500mg', time: '08:00', description: 'Après le petit déjeuner', active: true },
    { id: '2', user_id: 'local', type: 'meal', title: 'Petit Déjeuner', time: '08:30', description: 'Penser aux fibres', active: true },
    { id: '3', user_id: 'local', type: 'appointment', title: 'Dr Mansouri', time: '15:30', description: 'Visioconférence', active: true },
    { id: '4', user_id: 'local', type: 'prayer', title: 'Prière Asr', time: '16:45', description: 'Moment calme', active: true }
  ];
}

function getDefaultSeniors(): Senior[] {
  return [
    {
      id: '1',
      caregiver_id: 'local',
      name: 'Mme. Fatma Ben Ali',
      age: 82,
      condition: 'Hypertension & Diabète de type 2',
      image_url: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&q=80&w=400'
    }
  ];
}

function getDefaultProducts(): HealthProduct[] {
  return [
    { id: '1', name: 'Chaise roulante pliable', category: 'Mobilité', price: '152 Dt', image_url: 'https://images.unsplash.com/photo-1544216717-3bbf52512659?auto=format&fit=crop&q=80&w=800', description: 'Légère, pliable et robuste.', contact: '29 636 686', type: 'buy' },
    { id: '2', name: 'Béquilles ergonomiques', category: 'Mobilité', price: '11 Dt', image_url: 'https://images.unsplash.com/photo-1579684453423-f84349ef1afb?auto=format&fit=crop&q=80&w=800', description: 'Réglables et confortables.', contact: '29 636 686', type: 'buy' },
    { id: '3', name: 'Ceinture lombaire', category: 'Santé', price: '37 Dt', image_url: 'https://images.unsplash.com/photo-1587854692152-cbe660dbbb88?auto=format&fit=crop&q=80&w=800', description: 'Soutien du dos ergonomique.', contact: '29 636 686', type: 'buy' },
    { id: '4', name: 'Attelle bras complet', category: 'Santé', price: '32 Dt', image_url: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&q=80&w=800', description: 'Immobilisation complète du bras.', contact: '29 636 686', type: 'buy' },
  ];
}
// --------- DOCTORS ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  image_url: string;
  availability: string;
  phone: string;
  price: string;
  rating: number;
  active: boolean;
}

export async function getDoctors(): Promise<Doctor[]> {
  if (!isSupabaseConfigured()) return getDefaultDoctors();
  const { data, error } = await supabase
    .from('doctors')
    .select('*')
    .eq('active', true)
    .order('created_at');
  if (error) { console.error(error); return getDefaultDoctors(); }
  return data as Doctor[];
}

function getDefaultDoctors(): Doctor[] {
  return [
    { id: '1', name: 'Dr Sarah Mansouri',  specialty: 'Généraliste',      image_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400', availability: "Aujourd'hui, 14:00", phone: '01 44 55 66 77', price: '25---',    rating: 4.9, active: true },
    { id: '2', name: 'Dr Jean Dupont',     specialty: 'Cardiologue',       image_url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400', availability: 'Demain, 09:30',       phone: '01 22 33 44 55', price: '50---',    rating: 4.8, active: true },
    { id: '3', name: 'Dr Marc Lefebvre',   specialty: 'Gériatre',          image_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400', availability: 'Vendredi, 11:15',     phone: '01 77 88 99 00', price: '40---',    rating: 5.0, active: true },
    { id: '4', name: 'M. Karim Haddad',    specialty: 'Kinésithérapeute',  image_url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400', availability: "Aujourd'hui, 16:00", phone: '01 88 77 66 55', price: '35---',    rating: 4.7, active: true },
    { id: '5', name: 'Mme Clara Rossi',    specialty: 'Infirmière',        image_url: 'https://images.unsplash.com/photo-1590611380053-9da423dc03bb?auto=format&fit=crop&q=80&w=400', availability: "Aujourd'hui, 17:45", phone: '01 66 55 44 33', price: 'Gratuit', rating: 4.9, active: true },
  ];
}

// --------- PSYCHOLOGISTS ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

export interface Psychologist {
  id: string;
  name: string;
  specialty: string;
  image_url: string;
  availability: string;
  phone: string;
  price: string;
  active: boolean;
}

export async function getPsychologists(): Promise<Psychologist[]> {
  if (!isSupabaseConfigured()) return getDefaultPsychologists();
  const { data, error } = await supabase
    .from('psychologists')
    .select('*')
    .eq('active', true)
    .order('created_at');
  if (error) { console.error(error); return getDefaultPsychologists(); }
  return data as Psychologist[];
}

function getDefaultPsychologists(): Psychologist[] {
  return [
    { id: '1', name: 'Dr. Marie Laurent', specialty: 'Gérontopsychologue', image_url: 'https://images.unsplash.com/photo-1559839734-2b71f15367ef?auto=format&fit=crop&q=80&w=200', availability: 'Disponible demain',        phone: '01 23 45 67 89', price: '60--- / séance', active: true },
    { id: '2', name: 'Dr. Jean Dupont',   specialty: 'Thérapie Cognitive', image_url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200', availability: 'Disponible cette semaine', phone: '01 98 76 54 32', price: '55--- / séance', active: true },
  ];
}

// --------- FAMILY CONTACTS ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------

export interface FamilyContact {
  id: string;
  user_id: string;
  name: string;
  relation: string;
  phone: string;
  image_url: string;
}

export async function getFamilyContacts(userId: string): Promise<FamilyContact[]> {
  if (!isSupabaseConfigured()) {
    const raw = localStorage.getItem(`family_contacts_${userId}`);
    return raw ? JSON.parse(raw) : getDefaultContacts();
  }
  const { data, error } = await supabase
    .from('family_contacts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at');
  if (error) { console.error(error); return []; }
  return data as FamilyContact[];
}

export async function addFamilyContact(c: Omit<FamilyContact, 'id'>): Promise<FamilyContact | null> {
  if (!isSupabaseConfigured()) {
    const contacts = await getFamilyContacts(c.user_id);
    const newC = { ...c, id: crypto.randomUUID() };
    localStorage.setItem(`family_contacts_${c.user_id}`, JSON.stringify([...contacts, newC]));
    return newC;
  }
  const { data, error } = await supabase.from('family_contacts').insert(c).select().single();
  if (error) { console.error(error); return null; }
  return data as FamilyContact;
}

export async function deleteFamilyContact(id: string, userId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const contacts = await getFamilyContacts(userId);
    localStorage.setItem(`family_contacts_${userId}`, JSON.stringify(contacts.filter(c => c.id !== id)));
    return;
  }
  await supabase.from('family_contacts').delete().eq('id', id);
}

function getDefaultContacts(): FamilyContact[] {
  return [
    { id: '1', user_id: 'local', name: 'Marie (Fille)', relation: 'Fille', phone: '06 12 34 56 78', image_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100' },
    { id: '2', user_id: 'local', name: 'Thomas (Fils)', relation: 'Fils',  phone: '06 98 76 54 32', image_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100' },
  ];
}
