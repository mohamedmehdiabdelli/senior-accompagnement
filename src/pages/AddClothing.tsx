import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Camera, ArrowLeft, Upload, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { addClothingItem, uploadClothingImage } from '../lib/db';
import { isSupabaseConfigured } from '../lib/supabase';
import type { ClothingItem } from '../lib/supabase';

const categories: ClothingItem['category'][] = ['Chemise', 'Pantalon', 'Robe', 'Pyjama', 'Veste', 'T-shirt'];
const sizes: ClothingItem['size'][] = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const colors: ClothingItem['color'][] = ['Blanc', 'Bleu', 'Gris', 'Beige', 'Noir', 'Rose'];
const types: ClothingItem['type'][] = ['Jour', 'Nuit', 'Hiver', 'Été', 'Sortie'];

export default function AddClothing() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [residentName, setResidentName] = useState('');
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState<ClothingItem['category']>('Chemise');
  const [size, setSize] = useState<ClothingItem['size']>('M');
  const [color, setColor] = useState<ClothingItem['color']>('Blanc');
  const [type, setType] = useState<ClothingItem['type']>('Jour');
  const [location, setLocation] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(photoFile);

    return () => {
      reader.abort();
    };
  }, [photoFile]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setPhotoFile(file);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!profile) {
      setError('Vous devez être connecté pour ajouter un vêtement.');
      return;
    }

    if (!residentName.trim() || !itemName.trim() || !location.trim() || !photoFile) {
      setError('Veuillez remplir tous les champs et choisir une photo.');
      return;
    }

    setSaving(true);

    let imageUrl = photoPreview;
    if (photoFile && isSupabaseConfigured()) {
      try {
        imageUrl = await uploadClothingImage(photoFile, profile.id);
      } catch (uploadError) {
        console.warn('Image upload failed, saving inline preview instead:', uploadError);
        if (!photoPreview) {
          setError('Impossible de charger l’image. Veuillez réessayer.');
          return;
        }
        imageUrl = photoPreview;
      }
    }

    try {
      const newItem = await addClothingItem(
        {
          resident_name: residentName.trim(),
          item_name: itemName.trim(),
          category,
          size,
          color,
          type,
          location: location.trim(),
          image_url: imageUrl
        },
        profile.id
      );

      if (!newItem) {
        setError('Impossible d’ajouter le vêtement. Veuillez réessayer.');
        return;
      }

      setMessage('Le vêtement a bien été ajouté.');
      setResidentName('');
      setItemName('');
      setLocation('');
      setPhotoFile(null);
      setPhotoPreview('');

      setTimeout(() => {
        navigate('/vetements');
      }, 800);
    } catch (error: any) {
      console.error('AddClothing submit error:', error);
      setError(error?.message ?? 'Impossible d’ajouter le vêtement. Veuillez réessayer.');
    } finally {
      setSaving(false);
    }
    setResidentName('');
    setItemName('');
    setLocation('');
    setPhotoFile(null);
    setPhotoPreview('');

    setTimeout(() => {
      navigate('/vetements');
    }, 800);
  };

  return (
    <div className="max-w-5xl mx-auto py-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 p-8 md:p-12 rounded-[3rem] text-white shadow-xl relative overflow-hidden mb-10"
      >
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 px-4 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em]">
            <Camera size={14} />
            Ajouter un vêtement
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none title-serif">
            Prendre une photo et enregistrer <br />
            <span className="italic text-emerald-200">les détails du vêtement</span>
          </h1>
          <p className="text-white/75 text-base md:text-lg leading-relaxed max-w-2xl">
            Capturez une image du vêtement, renseignez le résident, la catégorie, la taille, la couleur et l'emplacement, puis enregistrez-le dans l'armoire.
          </p>
          <button
            type="button"
            onClick={() => navigate('/vetements')}
            className="inline-flex items-center gap-2 text-slate-900 bg-white px-5 py-3 rounded-full font-semibold uppercase tracking-[0.15em] hover:bg-slate-100 transition"
          >
            <ArrowLeft size={18} />
            Retour à l'espace vêtements
          </button>
        </div>
        <div className="absolute -bottom-24 -right-12 w-96 h-96 bg-emerald-400 opacity-20 rounded-full blur-[90px]" />
        <div className="absolute -top-20 -left-16 w-64 h-64 bg-amber-300 opacity-10 rounded-full blur-[80px]" />
      </motion.div>

      <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl border border-slate-100">
        <div className="grid gap-6 lg:grid-cols-2">
          <label className="space-y-3">
            <span className="text-sm font-bold text-slate-700">Nom du résident</span>
            <input
              value={residentName}
              onChange={(e) => setResidentName(e.target.value)}
              placeholder="Mme. Fatma Ben Ali"
              className="w-full px-4 py-4 rounded-3xl border border-slate-200 bg-slate-50 focus:bg-white outline-none transition"
            />
          </label>

          <label className="space-y-3">
            <span className="text-sm font-bold text-slate-700">Nom du vêtement</span>
            <input
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Chemise en coton"
              className="w-full px-4 py-4 rounded-3xl border border-slate-200 bg-slate-50 focus:bg-white outline-none transition"
            />
          </label>

          <label className="space-y-3">
            <span className="text-sm font-bold text-slate-700">Catégorie</span>
            <select value={category} onChange={(e) => setCategory(e.target.value as ClothingItem['category'])} className="w-full px-4 py-4 rounded-3xl border border-slate-200 bg-slate-50 focus:bg-white outline-none transition">
              {categories.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>

          <label className="space-y-3">
            <span className="text-sm font-bold text-slate-700">Taille</span>
            <select value={size} onChange={(e) => setSize(e.target.value as ClothingItem['size'])} className="w-full px-4 py-4 rounded-3xl border border-slate-200 bg-slate-50 focus:bg-white outline-none transition">
              {sizes.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>

          <label className="space-y-3">
            <span className="text-sm font-bold text-slate-700">Couleur</span>
            <select value={color} onChange={(e) => setColor(e.target.value as ClothingItem['color'])} className="w-full px-4 py-4 rounded-3xl border border-slate-200 bg-slate-50 focus:bg-white outline-none transition">
              {colors.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>

          <label className="space-y-3">
            <span className="text-sm font-bold text-slate-700">Type</span>
            <select value={type} onChange={(e) => setType(e.target.value as ClothingItem['type'])} className="w-full px-4 py-4 rounded-3xl border border-slate-200 bg-slate-50 focus:bg-white outline-none transition">
              {types.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>

          <label className="space-y-3">
            <span className="text-sm font-bold text-slate-700">Emplacement</span>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Armoire A - étagère 2"
              className="w-full px-4 py-4 rounded-3xl border border-slate-200 bg-slate-50 focus:bg-white outline-none transition"
            />
          </label>
        </div>

        <div className="mt-8">
          <label className="relative flex min-h-[220px] items-center justify-center rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-center cursor-pointer hover:border-blue-300 transition">
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
            <div className="space-y-4">
              <Upload size={32} className="mx-auto text-slate-500" />
              <p className="text-slate-700 font-semibold">Prendre une photo ou choisir un fichier</p>
              <p className="text-sm text-slate-500">La photo sera enregistrée avec le vêtement.</p>
            </div>
          </label>
          {photoPreview && (
            <div className="mt-6 rounded-[2rem] overflow-hidden border border-slate-200 bg-slate-100">
              <img src={photoPreview} alt="Prévisualisation du vêtement" className="w-full object-cover max-h-96" />
            </div>
          )}
        </div>

        {error && (
          <div className="mt-6 rounded-3xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-6 rounded-3xl bg-emerald-50 border border-emerald-200 px-5 py-4 text-sm text-emerald-800 flex items-center gap-2">
            <CheckCircle2 size={18} />
            {message}
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-3xl bg-emerald-700 px-8 py-4 text-white font-semibold hover:bg-emerald-800 transition disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Camera size={18} />
            {saving ? 'Enregistrement...' : 'Enregistrer le vêtement'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/vetements')}
            className="inline-flex items-center justify-center gap-2 rounded-3xl border border-slate-200 px-8 py-4 text-slate-700 font-semibold hover:bg-slate-100 transition"
          >
            Retour à l'espace vêtements
          </button>
        </div>
      </form>
    </div>
  );
}
