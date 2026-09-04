import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search, Filter, Shirt, Palette, Ruler, Sparkles, RefreshCcw, Users, Tag, PlusCircle, Trash2, Upload, CheckCircle2, ScanSearch } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { deleteClothingItem, getClothingItems, uploadClothingImage } from '../lib/db';
import type { ClothingItem } from '../lib/supabase';
import imageCompression from 'browser-image-compression';

type ClothingCategory = ClothingItem['category'];
type ClothingSize = ClothingItem['size'];
type ClothingColor = ClothingItem['color'];
type ClothingType = ClothingItem['type'];

const categories: Array<'Toutes' | ClothingCategory> = ['Toutes', 'Chemise', 'Pantalon', 'Robe', 'Pyjama', 'Veste', 'T-shirt'];
const sizes: Array<'Toutes' | ClothingSize> = ['Toutes', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];
const colors: Array<'Toutes' | ClothingColor> = ['Toutes', 'Blanc', 'Bleu', 'Gris', 'Beige', 'Noir', 'Rose'];
const types: Array<'Tous' | ClothingType> = ['Tous', 'Jour', 'Nuit', 'Hiver', 'Été', 'Sortie'];

export default function Wardrobe() {
  const { profile } = useAuth();
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ClothingItem | null>(null);
  const [selectedResident, setSelectedResident] = useState('Tous les résidents');
  const [selectedCategory, setSelectedCategory] = useState<'Toutes' | ClothingCategory>('Toutes');
  const [selectedSize, setSelectedSize] = useState<'Toutes' | ClothingSize>('Toutes');
  const [selectedColor, setSelectedColor] = useState<'Toutes' | ClothingColor>('Toutes');
  const [selectedType, setSelectedType] = useState<'Tous' | ClothingType>('Tous');
  const [query, setQuery] = useState('');
  const [showScanPanel, setShowScanPanel] = useState(false);
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [scanPreview, setScanPreview] = useState('');
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<Record<string, unknown> | string | null>(null);

  useEffect(() => {
    if (!scanFile) {
      setScanPreview('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setScanPreview(reader.result as string);
    };
    reader.readAsDataURL(scanFile);

    return () => {
      reader.abort();
    };
  }, [scanFile]);

  useEffect(() => {
    const loadItems = async () => {
      if (!profile) return;
      setLoading(true);
      const items = await getClothingItems(profile.id);
      setClothingItems(items);
      setLoading(false);
    };
    loadItems();
  }, [profile]);

  const handleScanFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setScanError(null);
    setScanResult(null);
    
    if (file) {
      const maxSizeInMB = 5;
      if (file.size > maxSizeInMB * 1024 * 1024) {
        setScanError(`Le fichier est trop volumineux. Taille maximale: ${maxSizeInMB}MB`);
        setScanFile(null);
        return;
      }
      
      try {
        const compressed = await imageCompression(file, {
          maxSizeMB: 0.2,
          maxWidthOrHeight: 800,
          useWebWorker: true,
        });
        setScanFile(compressed);
      } catch (err) {
        setScanError('Erreur lors de la compression de l\'image. Veuillez réessayer.');
        console.error('Image compression error:', err);
        setScanFile(null);
      }
    } else {
      setScanFile(null);
    }
  };

  const searchLostClothing = async (file: File) => {
    const endpoint = import.meta.env.VITE_HF_API_SEARCH_URL;
    const token = import.meta.env.VITE_HF_API_TOKEN;

    if (!endpoint || !token) {
      throw new Error('La configuration Hugging Face est incomplète.');
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(errorText || `Erreur Hugging Face: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      console.log("Scanner Result:", data);
      return data;
    }

    const text = await response.text();
    console.log("Scanner Result:", text);
    return text;
  };

  const handleScanSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setScanError(null);
    setScanResult(null);

    if (!scanFile) {
      setScanError('Veuillez sélectionner une image à analyser.');
      return;
    }

    try {
      setScanLoading(true);

      const result = await searchLostClothing(scanFile);
      setScanResult(result);
    } catch (error: unknown) {
      console.error('Lost clothing scan error:', error);
      setScanError(error instanceof Error ? error.message : 'Impossible d’analyser l’image. Veuillez réessayer.');
    } finally {
      setScanLoading(false);
    }
  };

  const getMatchedResidentName = () => {
    if (!scanResult) return '';

    if (typeof scanResult === 'string') {
      return scanResult;
    }

    const candidate =
      scanResult.predicted_owner ??
      scanResult.resident_name ??
      scanResult.matched_resident_name ??
      scanResult.match ??
      scanResult.resident ??
      scanResult.name;

    return typeof candidate === 'string' ? candidate : '';
  };

  const residents = ['Tous les résidents', ...Array.from(new Set(clothingItems.map(item => item.resident_name)))];

  const filteredItems = clothingItems.filter(item => {
    const matchesResident = selectedResident === 'Tous les résidents' || item.resident_name === selectedResident;
    const matchesCategory = selectedCategory === 'Toutes' || item.category === selectedCategory;
    const matchesSize = selectedSize === 'Toutes' || item.size === selectedSize;
    const matchesColor = selectedColor === 'Toutes' || item.color === selectedColor;
    const matchesType = selectedType === 'Tous' || item.type === selectedType;
    const search = query.trim().toLowerCase();
    const matchesQuery = !search || [item.resident_name, item.category, item.size, item.color, item.type, item.location].some(value => value.toLowerCase().includes(search));

    return matchesResident && matchesCategory && matchesSize && matchesColor && matchesType && matchesQuery;
  });

  const resetFilters = () => {
    setSelectedResident('Tous les résidents');
    setSelectedCategory('Toutes');
    setSelectedSize('Toutes');
    setSelectedColor('Toutes');
    setSelectedType('Tous');
    setQuery('');
  };

  const handleDelete = async (itemId: string) => {
    if (!profile) return;
    const previousItems = clothingItems;
    setClothingItems(currentItems => currentItems.filter(item => item.id !== itemId));
    setDeletingId(itemId);
    try {
      await deleteClothingItem(itemId, profile.id);
    } catch (error) {
      console.error('Delete clothing item error:', error);
      setClothingItems(previousItems);
    } finally {
      setDeletingId(null);
      setItemToDelete(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-slate-900 via-stone-900 to-emerald-950 p-8 md:p-12 rounded-[3rem] text-white shadow-xl relative overflow-hidden mb-10"
      >
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 px-4 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em]">
            <Shirt size={14} />
            Espace Vêtements
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none title-serif">
            Rechercher les vêtements <br />
            <span className="italic text-emerald-200">des résidents</span>
          </h1>
          <p className="text-white/75 text-base md:text-lg leading-relaxed max-w-2xl">
            Filtrez rapidement les habits par résident, catégorie, taille, couleur et type pour retrouver un vêtement en quelques secondes.
          </p>
          <div className="pt-4">
            <Link
              to="/vetements/ajouter"
              className="inline-flex items-center gap-2 rounded-full bg-white/20 border border-white/30 px-5 py-3 text-sm font-semibold uppercase tracking-[0.15em] hover:bg-white/30 transition"
            >
              <PlusCircle size={18} />
              Ajouter un vêtement
            </Link>
            <button
              type="button"
              onClick={() => setShowScanPanel((current) => !current)}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 border border-emerald-300/30 px-5 py-3 text-sm font-semibold uppercase tracking-[0.15em] hover:bg-emerald-500/30 transition"
            >
              <ScanSearch size={18} />
              Scanner un vêtement perdu
            </button>
          </div>
        </div>
        <div className="absolute -bottom-24 -right-12 w-96 h-96 bg-emerald-400 opacity-20 rounded-full blur-[90px]" />
        <div className="absolute -top-20 -left-16 w-64 h-64 bg-amber-300 opacity-10 rounded-full blur-[80px]" />
      </motion.div>

      {showScanPanel && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] p-6 md:p-8 premium-shadow border border-emerald-100 mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                <ScanSearch size={14} />
                Scanner un vêtement perdu
              </div>
              <h2 className="mt-4 text-2xl md:text-3xl font-black text-slate-900 title-serif">
                Téléverser une photo pour trouver le résident correspondant
              </h2>
              <p className="mt-3 text-slate-600 leading-relaxed">
                Choisissez une image d’un vêtement perdu. L’API Hugging Face analysera la photo et renverra la meilleure correspondance possible.
              </p>
            </div>

            <form onSubmit={handleScanSubmit} className="w-full max-w-xl space-y-4">
              <label className="block cursor-pointer rounded-[2rem] border border-dashed border-emerald-200 bg-emerald-50/60 p-6 text-center hover:border-emerald-300 transition">
                <input type="file" accept="image/*" className="hidden" onChange={handleScanFileChange} />
                <Upload size={30} className="mx-auto text-emerald-600" />
                <p className="mt-3 font-semibold text-slate-800">Choisir ou capturer une image</p>
                <p className="mt-1 text-sm text-slate-500">L’image est compressée puis analysée par l’API de recherche.</p>
              </label>

              {scanPreview && (
                <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-100">
                  <img src={scanPreview} alt="Prévisualisation du vêtement perdu" className="h-64 w-full object-cover" />
                </div>
              )}

              {scanError && (
                <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                  {scanError}
                </div>
              )}

              {scanResult && !scanError && (
                <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
                    <div className="space-y-2">
                      <p className="font-bold">Correspondance trouvée</p>
                      <p className="text-sm text-emerald-800">
                        {getMatchedResidentName()
                          ? `Le vêtement semble correspondre à ${getMatchedResidentName()}.`
                          : 'L’API a retourné une correspondance.'}
                      </p>
                      {typeof scanResult !== 'string' && !getMatchedResidentName() && (
                        <pre className="max-h-56 overflow-auto rounded-2xl bg-white/70 p-4 text-xs text-slate-700">
                          {JSON.stringify(scanResult, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={scanLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-emerald-700 px-8 py-4 font-semibold text-white hover:bg-emerald-800 transition disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <ScanSearch size={18} />
                {scanLoading ? 'Analyse en cours...' : 'Lancer la recherche'}
              </button>
            </form>
          </div>
        </motion.div>
      )}

      <div className="bg-white rounded-[2.5rem] p-6 md:p-8 premium-shadow border border-slate-100 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <label className="relative">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 block">Recherche</span>
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nom du vêtement, résident ou emplacement"
                className="w-full pl-11 pr-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-300 outline-none transition-all"
              />
            </div>
          </label>

          <label>
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 block">Résident</span>
            <select value={selectedResident} onChange={(e) => setSelectedResident(e.target.value)} className="w-full px-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-300 outline-none transition-all">
              {residents.map(resident => <option key={resident}>{resident}</option>)}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <label>
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 block flex items-center gap-2"><Filter size={14} /> Catégorie</span>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value as typeof selectedCategory)} className="w-full px-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-300 outline-none transition-all">
              {categories.map(category => <option key={category}>{category}</option>)}
            </select>
          </label>

          <label>
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 block flex items-center gap-2"><Ruler size={14} /> Taille</span>
            <select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value as typeof selectedSize)} className="w-full px-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-300 outline-none transition-all">
              {sizes.map(size => <option key={size}>{size}</option>)}
            </select>
          </label>

          <label>
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 block flex items-center gap-2"><Palette size={14} /> Couleur</span>
            <select value={selectedColor} onChange={(e) => setSelectedColor(e.target.value as typeof selectedColor)} className="w-full px-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-300 outline-none transition-all">
              {colors.map(color => <option key={color}>{color}</option>)}
            </select>
          </label>

          <label>
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 block flex items-center gap-2"><Tag size={14} /> Type</span>
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value as typeof selectedType)} className="w-full px-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-300 outline-none transition-all">
              {types.map(type => <option key={type}>{type}</option>)}
            </select>
          </label>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
            <Users size={16} className="text-emerald-600" />
            {loading ? 'Chargement des vêtements...' : `${filteredItems.length} vêtement${filteredItems.length > 1 ? 's' : ''} trouvé${filteredItems.length > 1 ? 's' : ''}`}
          </div>
          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
          >
            <RefreshCcw size={16} />
            Réinitialiser les filtres
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
        {filteredItems.map(item => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.25rem] p-6 border border-slate-100 premium-shadow"
          >
              <div className="relative overflow-hidden rounded-[2rem] mb-5 h-52 bg-slate-100">
              <img
                src={item.image_url || 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&q=80&w=800'}
                alt={`${item.category} - ${item.resident_name}`}
                className="h-full w-full object-cover"
              />
                <button
                  type="button"
                  onClick={() => setItemToDelete(item)}
                  disabled={deletingId === item.id}
                  className="absolute top-4 right-4 inline-flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md hover:bg-red-600/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Supprimer le vêtement"
                >
                  <Trash2 size={16} />
                  Supprimer
                </button>
            </div>
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-emerald-600 mb-2">{item.resident_name}</p>
                <h2 className="text-2xl font-black text-slate-800 title-serif">{item.category}</h2>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                  <Sparkles size={20} />
                </div>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4 bg-slate-50 rounded-2xl px-4 py-3">
                <span className="text-slate-500 font-semibold">Catégorie</span>
                <span className="font-black text-slate-800">{item.category}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-2xl px-4 py-3">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Taille</span>
                  <span className="font-black text-slate-800">{item.size}</span>
                </div>
                <div className="bg-slate-50 rounded-2xl px-4 py-3">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Couleur</span>
                  <span className="font-black text-slate-800">{item.color}</span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 bg-slate-50 rounded-2xl px-4 py-3">
                <span className="text-slate-500 font-semibold">Type</span>
                <span className="font-black text-slate-800">{item.type}</span>
              </div>
              <div className="bg-emerald-50 rounded-2xl px-4 py-3 text-emerald-800 font-semibold">
                {item.location}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-xl overflow-hidden rounded-[2.25rem] border border-white/10 bg-white shadow-2xl"
          >
            <div className="bg-gradient-to-r from-slate-900 via-stone-900 to-emerald-950 px-8 py-6 text-white">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.2em]">
                <Trash2 size={14} />
                Supprimer le vêtement
              </div>
              <h3 className="mt-4 text-3xl font-black tracking-tight title-serif">
                Confirmer la suppression
              </h3>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/75">
                Voulez-vous vraiment supprimer ce vêtement ? Cette action est définitive et le fera disparaître du vestiaire.
              </p>
            </div>

            <div className="flex flex-col gap-5 p-8 md:flex-row md:items-center">
              <div className="overflow-hidden rounded-[1.75rem] bg-slate-100 md:w-44 md:flex-shrink-0">
                <img
                  src={itemToDelete.image_url || 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&q=80&w=800'}
                  alt={`${itemToDelete.category} - ${itemToDelete.resident_name}`}
                  className="h-44 w-full object-cover"
                />
              </div>

              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-emerald-600">{itemToDelete.resident_name}</p>
                  <h4 className="mt-1 text-2xl font-black text-slate-800 title-serif">{itemToDelete.category}</h4>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Taille</span>
                    <span className="font-black text-slate-800">{itemToDelete.size}</span>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Couleur</span>
                    <span className="font-black text-slate-800">{itemToDelete.color}</span>
                  </div>
                </div>
                <p className="text-sm text-slate-500">Emplacement: {itemToDelete.location}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 px-8 py-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 font-bold text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => handleDelete(itemToDelete.id)}
                disabled={deletingId === itemToDelete.id}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Trash2 size={16} />
                {deletingId === itemToDelete.id ? 'Suppression...' : 'Supprimer définitivement'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {!loading && filteredItems.length === 0 && (
        <div className="bg-white rounded-[2.25rem] p-10 border border-dashed border-slate-200 text-center text-slate-500">
          Aucun vêtement ne correspond à vos filtres. Essayez de modifier la catégorie, la taille, la couleur ou le type.
        </div>
      )}
    </div>
  );
}
