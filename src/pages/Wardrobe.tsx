import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search, Filter, Shirt, Palette, Ruler, Sparkles, RefreshCcw, Users, Tag, PlusCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getClothingItems } from '../lib/db';
import type { ClothingItem } from '../lib/supabase';

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
  const [selectedResident, setSelectedResident] = useState('Tous les résidents');
  const [selectedCategory, setSelectedCategory] = useState<'Toutes' | ClothingCategory>('Toutes');
  const [selectedSize, setSelectedSize] = useState<'Toutes' | ClothingSize>('Toutes');
  const [selectedColor, setSelectedColor] = useState<'Toutes' | ClothingColor>('Toutes');
  const [selectedType, setSelectedType] = useState<'Tous' | ClothingType>('Tous');
  const [query, setQuery] = useState('');

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
          </div>
        </div>
        <div className="absolute -bottom-24 -right-12 w-96 h-96 bg-emerald-400 opacity-20 rounded-full blur-[90px]" />
        <div className="absolute -top-20 -left-16 w-64 h-64 bg-amber-300 opacity-10 rounded-full blur-[80px]" />
      </motion.div>

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
            <div className="overflow-hidden rounded-[2rem] mb-5 h-52 bg-slate-100">
              <img
                src={item.image_url || 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&q=80&w=800'}
                alt={`${item.category} - ${item.resident_name}`}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-emerald-600 mb-2">{item.resident_name}</p>
                <h2 className="text-2xl font-black text-slate-800 title-serif">{item.category}</h2>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                <Sparkles size={20} />
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

      {!loading && filteredItems.length === 0 && (
        <div className="bg-white rounded-[2.25rem] p-10 border border-dashed border-slate-200 text-center text-slate-500">
          Aucun vêtement ne correspond à vos filtres. Essayez de modifier la catégorie, la taille, la couleur ou le type.
        </div>
      )}
    </div>
  );
}
