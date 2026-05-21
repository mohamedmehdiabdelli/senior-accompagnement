import { User, Phone, Video, Stethoscope, Star, Clock, Search, Plus, Calendar, Pill, MapPin, Building2, ChevronRight, Activity } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

// DELETE the entire hardcoded `const doctors = [...]` array at the top
// ADD this import at the top:
import { getDoctors } from '../lib/db';
import type { Doctor } from '../lib/db';

// REPLACE the useState/component opening with:
export default function Telemedicine() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [activeView, setActiveView] = useState<'doctors' | 'pharmacy'>('doctors');
  const [filter, setFilter] = useState('tous');
  const [medSearch, setMedSearch] = useState("");

  useEffect(() => {
    getDoctors().then(data => { setDoctors(data); setLoadingDoctors(false); });
  }, []);

const pharmacies = [
  { name: "Pharmacie de la Mairie", stock: ["Doliprane", "Spasfon", "Vix"], status: "En stock", address: "12 rue de la Paix", distance: "450m" },
  { name: "Pharmacie Centrale", stock: ["Doliprane", "Insuline", "Advils"], status: "Stock limité", address: "5 bld Raspail", distance: "800m" },
  { name: "Pharmacie du Parc", stock: ["Antibiotiques", "Ventoline"], status: "En stock", address: "24 avenue des Pins", distance: "1.2km" }
];

export default function Telemedicine() {
  const [activeView, setActiveView] = useState<'doctors' | 'pharmacy'>('doctors');
  const [filter, setFilter] = useState('tous');
  const [medSearch, setMedSearch] = useState("");

  const filteredPharmacies = pharmacies.filter(p => 
    p.stock.some(s => s.toLowerCase().includes(medSearch.toLowerCase())) || medSearch === ""
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full font-bold text-sm tracking-wide uppercase">
            <Stethoscope size={18} />
            Espace Santé
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 tracking-tight title-serif leading-none">Réseau Santé</h1>
          <p className="text-xl text-slate-500 max-w-xl italic">
            "Votre santé, notre priorité." Découvrez nos spécialistes et pharmacies partenaires.
          </p>
        </div>
        
        <div className="flex gap-2 p-2 bg-white rounded-3xl premium-shadow border border-slate-100">
           <button 
             onClick={() => setActiveView('doctors')}
             className={`px-8 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 ${activeView === 'doctors' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             <Stethoscope size={20} />
             Spécialistes
           </button>
           <button 
             onClick={() => setActiveView('pharmacy')}
             className={`px-8 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 ${activeView === 'pharmacy' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             <Pill size={20} />
             Pharmacies
           </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeView === 'doctors' ? (
          <motion.div 
            key="doctors"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-4 gap-8"
          >
            <aside className="space-y-8">
               <div className="bg-white p-8 rounded-[2.5rem] premium-shadow border border-slate-100 space-y-6">
                  <h3 className="font-bold text-xl title-serif">Spécialités</h3>
                  <div className="space-y-2">
                    {['tous', 'Généraliste', 'Cardiologue', 'Gériatre', 'Kinésithérapeute', 'Infirmière'].map(s => (
                      <button 
                        key={s}
                        onClick={() => setFilter(s)}
                        className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all ${filter === s ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
               </div>
               
               <div className="bg-orange-50 p-8 rounded-[2.5rem] border border-orange-100 space-y-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-600 shadow-sm">
                    <Video size={24} />
                  </div>
                  <h4 className="font-bold text-orange-900">Vidéo Consultation</h4>
                  <p className="text-sm text-orange-800 leading-relaxed">Stable, sécurisé et remboursé à 100%.</p>
               </div>
            </aside>

            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-8">
              {doctors.filter(d => filter === 'tous' || d.specialty === filter).map((doc) => (
                <motion.div
                  key={doc.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -8 }}
                  className="bg-white p-8 rounded-[3rem] premium-shadow border border-slate-50 flex flex-col items-center text-center space-y-6 group hover:border-blue-200 transition-all font-sans"
                >
                  <div className="relative">
                    <img src={doc.image} alt={doc.name} className="w-32 h-32 rounded-[2.5rem] object-cover shadow-2xl group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute -bottom-2 -right-2 bg-white px-2 py-1 rounded-lg border border-slate-100 flex items-center gap-1 shadow-md">
                       <Star size={14} className="text-yellow-400 fill-current" />
                       <span className="text-xs font-black">{doc.rating}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{doc.name}</h3>
                    <p className="text-blue-600 font-bold uppercase text-xs tracking-widest">{doc.specialty}</p>
                  </div>
                  <div className="w-full bg-slate-50 rounded-3xl p-5 flex justify-between items-center px-8 border border-slate-100">
                     <div className="text-left">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">Disponibilité</p>
                        <p className="text-sm font-bold text-slate-700">{doc.availability}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">Tarif</p>
                        <p className="text-sm font-bold text-slate-700">{doc.price}</p>
                     </div>
                  </div>
                  <button className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold text-lg hover:bg-black transition-all shadow-xl shadow-slate-100 flex items-center justify-center gap-3 active:scale-95">
                    <Video size={24} />
                    Appel Vidéo
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="pharmacy"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
             <div className="max-w-xl mx-auto relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={24} />
                <input 
                  type="text" 
                  value={medSearch}
                  onChange={(e) => setMedSearch(e.target.value)}
                  placeholder="Rechercher un médicament (ex: Doliprane...)" 
                  className="w-full bg-white p-6 pl-16 rounded-[2.5rem] premium-shadow border border-slate-100 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all text-lg font-medium"
                />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPharmacies.map((p, idx) => (
                  <motion.div 
                    key={p.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white p-8 rounded-[3rem] premium-shadow border border-slate-50 space-y-6 group hover:border-green-200 transition-all"
                  >
                    <div className="flex justify-between items-start">
                       <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                          <Building2 size={32} />
                       </div>
                       <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${p.status === 'En stock' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {p.status}
                       </div>
                    </div>
                    <div>
                       <h3 className="text-2xl font-bold text-slate-800 title-serif">{p.name}</h3>
                       <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
                          <MapPin size={16} />
                          {p.address} • {p.distance}
                       </p>
                    </div>
                    <div className="space-y-3">
                       <p className="text-xs font-black text-slate-400 uppercase tracking-widest">En stock actuellement :</p>
                       <div className="flex flex-wrap gap-2">
                          {p.stock.map(s => (
                            <span key={s} className="bg-slate-50 px-3 py-1 bg-white border border-slate-100 rounded-lg text-sm font-bold text-slate-700">
                               {s}
                            </span>
                          ))}
                       </div>
                    </div>
                    <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all">
                       Itinéraire
                       <ChevronRight size={20} />
                    </button>
                  </motion.div>
                ))}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-12 rounded-[3.5rem] text-white flex flex-col md:flex-row items-center gap-12 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex-1 space-y-4 text-center md:text-left">
           <div className="inline-block bg-blue-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-2">Service Mobile</div>
           <h3 className="text-4xl font-bold title-serif">Pharmacie à Domicile ?</h3>
           <p className="text-slate-400 max-w-2xl text-lg leading-relaxed">Commandez vos médicaments via l'application et faites-vous livrer en moins de 2 heures par nos coursiers certifiés.</p>
        </div>
        <button className="relative z-10 bg-white text-slate-900 px-12 py-5 rounded-2xl font-bold text-xl whitespace-nowrap hover:shadow-2xl hover:scale-105 transition-all">
          Commander
        </button>
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-green-600 rounded-full blur-[110px] opacity-10" />
      </div>
    </div>
  );
}
