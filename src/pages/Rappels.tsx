import { Bell, Clock, Calendar, Utensils, Heart, Trash2, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getReminders, addReminder, toggleReminder, deleteReminder } from "../lib/db";
import type { Reminder } from "../lib/supabase";

export default function Rappels() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', time: '08:00', type: 'medicine' as Reminder['type'], description: '' });

  useEffect(() => {
    getReminders().then(data => {
      setReminders(data);
      setLoading(false);
    });
  }, []);

  const handleToggle = async (id: string, current: boolean) => {
    await toggleReminder(id, !current);
    setReminders(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const handleDelete = async (id: string) => {
    await deleteReminder(id);
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const handleAdd = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const newR = await addReminder({
      user_id: 'local',
      type: form.type,
      title: form.title,
      time: form.time,
      description: form.description || 'Rappel ajouté',
      active: true
    });
    if (newR) {
      setReminders(prev => [...prev, newR].sort((a, b) => a.time.localeCompare(b.time)));
    }
    setForm({ title: '', time: '08:00', type: 'medicine', description: '' });
    setShowAdd(false);
    setSaving(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'medicine': return <Heart className="text-red-500" />;
      case 'meal': return <Utensils className="text-orange-500" />;
      case 'appointment': return <Calendar className="text-blue-500" />;
      case 'prayer': return <Bell className="text-amber-500" />;
      default: return <Clock className="text-gray-500" />;
    }
  };

  const prayerTimes = [
    { name: 'Fajr', time: '04:52' }, { name: 'Dhuhr', time: '12:31' },
    { name: 'Asr', time: '16:04' }, { name: 'Maghrib', time: '19:47' },
    { name: 'Isha', time: '21:18' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-4">
          <div className="inline-flex bg-amber-50 text-amber-700 px-4 py-1.5 rounded-full text-sm font-bold tracking-wide uppercase">
            Organisation Quotidienne
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 tracking-tight title-serif">Rappeler-moi</h1>
          <p className="text-lg text-slate-500">Votre compagnon pour ne jamais oublier l'essentiel du quotidien.</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center gap-2 group active:scale-95"
        >
          <Plus size={20} className={`transition-transform ${showAdd ? 'rotate-45' : ''}`} />
          Nouveau rappel
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6"
          >
            <h2 className="text-2xl font-bold title-serif">Ajouter un rappel</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input
                type="text"
                placeholder="Titre (ex: Médicament)"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
              />
              <input
                type="time"
                value={form.time}
                onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
              />
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as Reminder['type'] }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all appearance-none"
              >
                <option value="medicine">Médicament</option>
                <option value="meal">Repas</option>
                <option value="appointment">Rendez-vous</option>
                <option value="prayer">Prière</option>
                <option value="other">Autre</option>
              </select>
              <input
                type="text"
                placeholder="Description (optionnel)"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
              />
            </div>
            <div className="flex justify-end gap-4">
              <button onClick={() => setShowAdd(false)} className="px-8 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all">Annuler</button>
              <button
                onClick={handleAdd}
                disabled={saving || !form.title.trim()}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                Enregistrer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence>
            {reminders.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 text-slate-400">
                <Bell size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-xl font-medium">Aucun rappel. Ajoutez-en un !</p>
              </motion.div>
            )}
            {reminders.map((r, idx) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: idx * 0.05 }}
                className={`flex items-center gap-6 p-6 rounded-[2.5rem] border transition-all ${
                  r.active ? 'bg-white border-slate-100 shadow-xl' : 'bg-slate-50/50 border-slate-200 grayscale opacity-50'
                }`}
              >
                <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center shrink-0 text-lg font-black shadow-inner ${
                  r.active ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-400'
                }`}>
                  {r.time}
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-50 shadow-sm flex items-center justify-center shrink-0">
                  {getIcon(r.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-xl text-slate-800 truncate">{r.title}</h3>
                  <p className="text-slate-500 font-medium text-sm truncate">{r.description}</p>
                </div>
                <button
                  onClick={() => handleToggle(r.id, r.active)}
                  className={`w-16 h-9 rounded-full relative transition-colors shadow-inner shrink-0 ${r.active ? 'bg-green-500' : 'bg-slate-300'}`}
                >
                  <motion.div
                    animate={{ x: r.active ? 28 : 4 }}
                    className="absolute top-1 w-7 h-7 bg-white rounded-full shadow-md"
                  />
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="p-2 text-slate-300 hover:text-red-400 transition-colors shrink-0"
                >
                  <Trash2 size={18} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
        <div className="bg-white p-10 rounded-[3rem] border border-slate-50 shadow-2xl">
          <h2 className="text-3xl font-bold flex items-center gap-4 title-serif mb-6">
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600"><Calendar size={28} /></div>
            Bientôt
          </h2>
          <div className="space-y-4">
            {reminders.filter(r => r.active).slice(0, 3).map(r => (
              <div key={r.id} className="flex gap-4 items-start border-l-4 border-blue-600 pl-6 py-2 bg-blue-50/30 rounded-r-3xl">
                <div>
                  <p className="font-black text-lg text-slate-800">{r.title}</p>
                  <p className="text-slate-500 text-sm">Aujourd'hui à {r.time}</p>
                </div>
              </div>
            ))}
            {reminders.filter(r => r.active).length === 0 && (
              <p className="text-slate-400 text-sm">Pas de rappels actifs</p>
            )}
          </div>
        </div>

        <div className="bg-amber-50 p-10 rounded-[3rem] border border-amber-100 shadow-2xl relative overflow-hidden">
          <h2 className="text-3xl font-bold flex items-center gap-4 text-amber-900 title-serif mb-6">
            <div className="p-3 bg-white rounded-2xl text-amber-600 shadow-sm"><Bell size={28} /></div>
            Prières
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {prayerTimes.map(p => (
              <div key={p.name} className="bg-white/60 p-4 rounded-2xl flex justify-between items-center hover:bg-white transition-all shadow-sm">
                <p className="text-sm font-black text-amber-800 uppercase tracking-wider">{p.name}</p>
                <p className="font-black text-base text-slate-900">{p.time}</p>
              </div>
            ))}
          </div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-amber-200 rounded-full blur-[80px] opacity-20" />
        </div>
      </div>
    </div>
  );
}
