import { ShoppingCart, Heart, Check, Phone, Plus, X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getProducts, addProduct } from "../lib/db";
import type { HealthProduct } from "../lib/supabase";

export default function Besoins() {
  const [products, setProducts] = useState<HealthProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [view, setView] = useState<'buy' | 'don' | 'sell'>('buy');
  const [filter, setFilter] = useState('tous');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'Mobilité', price: '', description: '', contact: '', image_url: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProducts().then(data => { setProducts(data); setLoading(false); });
  }, []);

  const filtered = products.filter(p => {
    const typeMatch = p.type === view;
    const catMatch = filter === 'tous' || p.category.toLowerCase() === filter.toLowerCase();
    return typeMatch && catMatch;
  });

  const categories = ['tous', ...Array.from(new Set(products.map(p => p.category)))];

  const handleAdd = async () => {
    if (!form.name.trim() || !form.price.trim()) return;
    setSaving(true);
    const newP = await addProduct({
      ...form,
      type: view,
      image_url: form.image_url || 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=800'
    });
    if (newP) setProducts(prev => [newP, ...prev]);
    setForm({ name: '', category: 'Mobilité', price: '', description: '', contact: '', image_url: '' });
    setShowAdd(false);
    setSaving(false);
  };

  const addToCart = (id: string) => {
    setCartCount(prev => prev + 1);
    setAddedId(id);
    setTimeout(() => setAddedId(null), 1500);
  };

  const viewLabels = { buy: 'Acheter', don: 'Dons', sell: 'Vendre' };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-4">
          <div className="inline-flex bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-bold tracking-wide uppercase">
            Matériel Médical
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 tracking-tight title-serif">Aide Santé</h1>
          <p className="text-lg text-slate-500">Achat, vente et dons de matériel médical entre particuliers.</p>
        </div>
        <div className="flex items-center gap-4">
          {cartCount > 0 && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-2xl font-bold">
              <ShoppingCart size={18} />
              {cartCount} article{cartCount > 1 ? 's' : ''}
            </div>
          )}
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all active:scale-95"
          >
            <Plus size={18} />
            Publier une annonce
          </button>
        </div>
      </div>

      {/* View tabs */}
      <div className="flex gap-2 p-2 bg-white rounded-3xl shadow-lg border border-slate-100 w-fit">
        {(['buy', 'don', 'sell'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-6 py-3 rounded-2xl font-bold transition-all ${view === v ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            {viewLabels[v]}
          </button>
        ))}
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold title-serif">Nouvelle annonce — {viewLabels[view]}</h2>
              <button onClick={() => setShowAdd(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Nom du produit *" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all" />
              <input type="text" placeholder="Prix (ex: 50 Dt)" value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all" />
              <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none appearance-none">
                <option>Mobilité</option><option>Santé</option><option>Confort</option><option>Autre</option>
              </select>
              <input type="text" placeholder="Contact (téléphone)" value={form.contact} onChange={e => setForm(f => ({...f, contact: e.target.value}))} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all" />
              <input type="text" placeholder="Description" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all md:col-span-2" />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">Annuler</button>
              <button onClick={handleAdd} disabled={saving || !form.name} className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold disabled:opacity-50 flex items-center gap-2">
                {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Publier
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`px-5 py-2 rounded-full font-bold text-sm capitalize transition-all ${filter === c ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-400'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {filtered.map((p, idx) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-[3rem] overflow-hidden shadow-lg border border-slate-50 group hover:shadow-2xl transition-all"
              >
                <div className="relative h-48 overflow-hidden">
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/90 backdrop-blur-sm text-slate-700 px-3 py-1 rounded-full text-xs font-bold">{p.category}</span>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="font-bold text-xl text-slate-800">{p.name}</h3>
                    <p className="text-sm text-slate-500 mt-1">{p.description}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-emerald-600">{p.price}</span>
                    <div className="flex gap-2">
                      {p.contact && (
                        <a href={`tel:${p.contact}`} className="flex items-center gap-1 bg-slate-50 text-slate-600 px-3 py-2 rounded-xl text-sm font-bold hover:bg-slate-100 transition-all">
                          <Phone size={14} />
                          Appeler
                        </a>
                      )}
                      {view === 'buy' && (
                        <button
                          onClick={() => addToCart(p.id)}
                          className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold transition-all ${addedId === p.id ? 'bg-emerald-500 text-white' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                        >
                          {addedId === p.id ? <Check size={14} /> : <ShoppingCart size={14} />}
                          {addedId === p.id ? 'Ajouté !' : 'Ajouter'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            {filtered.length === 0 && !loading && (
              <div className="col-span-3 text-center py-20 text-slate-400">
                <Heart size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-xl font-medium">Aucune annonce dans cette catégorie.</p>
                <p className="text-sm mt-2">Soyez le premier à publier !</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
