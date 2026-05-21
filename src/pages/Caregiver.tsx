import React, { useState, useEffect } from "react";
import { 
  Heart, 
  Activity, 
  ClipboardList, 
  Phone, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  UserPlus, 
  TrendingUp, 
  ChevronRight, 
  Check, 
  X, 
  MessageSquare, 
  ChevronDown, 
  Smile, 
  Frown, 
  Meh, 
  Clock,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Types
interface Medicine {
  id: string;
  name: string;
  dosage: string;
  time: "Matin" | "Midi" | "Soir" | "Nuit";
  taken: boolean;
}

interface VitalRecord {
  date: string;
  heartRate: number;      // bpm
  bloodPressureSys: number; // mmHg
  bloodPressureDia: number; // mmHg
  bloodSugar: number;       // g/L
  temperature: number;      // °C
}

interface LogEntry {
  id: string;
  time: string;
  text: string;
  author: string;
  status: {
    mood: "Souriant" | "Calme" | "Fatigué" | "Agité";
    appetite: "Excellent" | "Moyen" | "Faible";
    sleep: "Bon" | "Agité" | "Mauvais";
  };
}

interface Senior {
  id: string;
  name: string;
  age: number;
  condition: string;
  image: string;
  medicines: Medicine[];
  vitals: VitalRecord[];
  logs: LogEntry[];
}

const INITIAL_SENIORS: Senior[] = [
  {
    id: "1",
    name: "Mme. Fatma Ben Ali",
    age: 82,
    condition: "Hypertension & Diabète de type 2",
    image: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&q=80&w=400",
    medicines: [
      { id: "m1", name: "Cardiocalm 10mg", dosage: "1 comprimé", time: "Matin", taken: true },
      { id: "m2", name: "Glucophage 850mg", dosage: "1/2 comprimé", time: "Midi", taken: false },
      { id: "m3", name: "Amlor 5mg", dosage: "1 comprimé", time: "Soir", taken: true },
      { id: "m4", name: "Insuline Lantus", dosage: "16 UI", time: "Nuit", taken: false }
    ],
    vitals: [
      { date: "16 Mai", heartRate: 72, bloodPressureSys: 132, bloodPressureDia: 80, bloodSugar: 1.10, temperature: 36.7 },
      { date: "17 Mai", heartRate: 78, bloodPressureSys: 138, bloodPressureDia: 84, bloodSugar: 1.25, temperature: 36.8 },
      { date: "18 Mai", heartRate: 74, bloodPressureSys: 130, bloodPressureDia: 79, bloodSugar: 1.18, temperature: 36.6 },
      { date: "19 Mai", heartRate: 81, bloodPressureSys: 141, bloodPressureDia: 86, bloodSugar: 1.34, temperature: 36.9 },
      { date: "20 Mai", heartRate: 76, bloodPressureSys: 129, bloodPressureDia: 81, bloodSugar: 1.08, temperature: 36.5 }
    ],
    logs: [
      {
        id: "l1",
        time: "Ce matin à 08:30",
        text: "Petit-déjeuner entièrement consommé. A pris ses médicaments du matin à temps. Très souriante aujourd'hui.",
        author: "Melek (Infirmier)",
        status: { mood: "Souriant", appetite: "Excellent", sleep: "Bon" }
      },
      {
        id: "l2",
        time: "Hier à 19:15",
        text: "Légère fatigue constatée en fin d'après-midi. La tension mesurée était légèrement haute mais est redescendue après repos.",
        author: "Rim (Fille / Aidante)",
        status: { mood: "Calme", appetite: "Moyen", sleep: "Agité" }
      }
    ]
  },
  {
    id: "2",
    name: "Mr. Béchir Mezghani",
    age: 79,
    condition: "Rééducation Post-AVC & Arthrose",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=400",
    medicines: [
      { id: "m2-1", name: "Kardegic 75mg", dosage: "1 sachet", time: "Matin", taken: true },
      { id: "m2-2", name: "Paracétamol", dosage: "1 comprimé", time: "Midi", taken: true },
      { id: "m2-3", name: "Tahor 20mg", dosage: "1 comprimé", time: "Soir", taken: false }
    ],
    vitals: [
      { date: "16 Mai", heartRate: 64, bloodPressureSys: 120, bloodPressureDia: 75, bloodSugar: 0.95, temperature: 36.4 },
      { date: "17 Mai", heartRate: 68, bloodPressureSys: 122, bloodPressureDia: 78, bloodSugar: 1.02, temperature: 36.5 },
      { date: "18 Mai", heartRate: 67, bloodPressureSys: 118, bloodPressureDia: 72, bloodSugar: 0.98, temperature: 36.6 },
      { date: "19 Mai", heartRate: 70, bloodPressureSys: 125, bloodPressureDia: 80, bloodSugar: 1.05, temperature: 36.5 },
      { date: "20 Mai", heartRate: 65, bloodPressureSys: 119, bloodPressureDia: 74, bloodSugar: 0.99, temperature: 36.4 }
    ],
    logs: [
      {
        id: "l2-1",
        time: "Hier à 14:00",
        text: "Séance de kinésithérapie productive. Marche d'environ 15 minutes avec assistance. Bon moral.",
        author: "Firas (Kinésithérapeute)",
        status: { mood: "Calme", appetite: "Moyen", sleep: "Bon" }
      }
    ]
  }
];

export default function Caregiver() {
  // Read from localized memory or initialize
  const [seniors, setSeniors] = useState<Senior[]>(() => {
    const saved = localStorage.getItem("senior_caregivers_data");
    return saved ? JSON.parse(saved) : INITIAL_SENIORS;
  });

  const [activeSeniorId, setActiveSeniorId] = useState<string>(seniors[0]?.id || "1");
  const [activeTab, setActiveTab] = useState<"meds" | "vitals" | "logs" | "team">("vitals");

  // Selection
  const activeSenior = seniors.find(s => s.id === activeSeniorId) || seniors[0];

  // Modals / forms toggle states
  const [isAddSeniorOpen, setIsAddSeniorOpen] = useState(false);
  const [isAddMedOpen, setIsAddMedOpen] = useState(false);
  const [isAddVitalOpen, setIsAddVitalOpen] = useState(false);
  const [isAddLogOpen, setIsAddLogOpen] = useState(false);

  // Form input variables
  const [newSeniorName, setNewSeniorName] = useState("");
  const [newSeniorAge, setNewSeniorAge] = useState("");
  const [newSeniorCondition, setNewSeniorCondition] = useState("");
  const [newSeniorImage, setNewSeniorImage] = useState("");

  const [newMedName, setNewMedName] = useState("");
  const [newMedDosage, setNewMedDosage] = useState("");
  const [newMedTime, setNewMedTime] = useState<"Matin" | "Midi" | "Soir" | "Nuit">("Matin");

  const [newHr, setNewHr] = useState("75");
  const [newBps, setNewBps] = useState("120");
  const [newBpd, setNewBpd] = useState("80");
  const [newSugar, setNewSugar] = useState("1.10");
  const [newTemp, setNewTemp] = useState("36.6");

  const [newLogText, setNewLogText] = useState("");
  const [newLogAuthor, setNewLogAuthor] = useState("");
  const [newLogMood, setNewLogMood] = useState<"Souriant" | "Calme" | "Fatigué" | "Agité">("Calme");
  const [newLogAppetite, setNewLogAppetite] = useState<"Excellent" | "Moyen" | "Faible">("Moyen");
  const [newLogSleep, setNewLogSleep] = useState<"Bon" | "Agité" | "Mauvais">("Bon");

  // Call modal state
  const [callingPerson, setCallingPerson] = useState<{name: string, role: string, tel: string} | null>(null);

  // Save changes to localStorage on seniors database change
  useEffect(() => {
    localStorage.setItem("senior_caregivers_data", JSON.stringify(seniors));
  }, [seniors]);

  if (!activeSenior) {
    return <div className="p-8 text-center font-bold">Base de données d'aidants corrompue.</div>;
  }

  // Toggle medicine status
  const handleToggleMedicine = (medId: string) => {
    setSeniors(prev => prev.map(s => {
      if (s.id === activeSenior.id) {
        return {
          ...s,
          medicines: s.medicines.map(m => m.id === medId ? { ...m, taken: !m.taken } : m)
        };
      }
      return s;
    }));
  };

  // Add treatment to active senior
  const handleAddMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName) return;

    const newMed: Medicine = {
      id: "med_" + Date.now(),
      name: newMedName,
      dosage: newMedDosage || "1 comprimé",
      time: newMedTime,
      taken: false
    };

    setSeniors(prev => prev.map(s => {
      if (s.id === activeSenior.id) {
        return {
          ...s,
          medicines: [...s.medicines, newMed]
        };
      }
      return s;
    }));

    // Reset inputs
    setNewMedName("");
    setNewMedDosage("");
    setNewMedTime("Matin");
    setIsAddMedOpen(false);
  };

  // Remove medication
  const handleRemoveMedicine = (medId: string) => {
    setSeniors(prev => prev.map(s => {
      if (s.id === activeSenior.id) {
        return {
          ...s,
          medicines: s.medicines.filter(m => m.id !== medId)
        };
      }
      return s;
    }));
  };

  // Add vital sign measurement
  const handleAddVitalRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date();
    const dateStr = today.getDate() + " " + today.toLocaleString("fr-FR", { month: "short" });

    const newRecord: VitalRecord = {
      date: dateStr,
      heartRate: parseInt(newHr) || 75,
      bloodPressureSys: parseInt(newBps) || 120,
      bloodPressureDia: parseInt(newBpd) || 80,
      bloodSugar: parseFloat(newSugar) || 1.0,
      temperature: parseFloat(newTemp) || 36.6
    };

    setSeniors(prev => prev.map(s => {
      if (s.id === activeSenior.id) {
        // Keep last 8 logs maximum, and append the new record
        return {
          ...s,
          vitals: [...s.vitals, newRecord].slice(-8)
        };
      }
      return s;
    }));

    setIsAddVitalOpen(false);
    // Note: inputs prefilled for next time
  };

  // Add transmission report
  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogText) return;

    const todayStr = "Aujourd'hui à " + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

    const newLog: LogEntry = {
      id: "log_" + Date.now(),
      time: todayStr,
      text: newLogText,
      author: newLogAuthor || "Aidant familial",
      status: {
        mood: newLogMood,
        appetite: newLogAppetite,
        sleep: newLogSleep
      }
    };

    setSeniors(prev => prev.map(s => {
      if (s.id === activeSenior.id) {
        return {
          ...s,
          logs: [newLog, ...s.logs]
        };
      }
      return s;
    }));

    setNewLogText("");
    setIsAddLogOpen(false);
  };

  // Add a new senior to manage
  const handleAddSenior = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeniorName) return;

    const newSenior: Senior = {
      id: "senior_" + Date.now(),
      name: newSeniorName,
      age: parseInt(newSeniorAge) || 75,
      condition: newSeniorCondition || "Surveillance générale",
      image: newSeniorImage || "https://images.unsplash.com/photo-1516534775068-ba3e7458af70?auto=format&fit=crop&q=80&w=400",
      medicines: [
        { id: "sm_1", name: "Compléments", dosage: "1 gélule", time: "Matin", taken: false }
      ],
      vitals: [
        { date: "Aujourd'hui", heartRate: 75, bloodPressureSys: 120, bloodPressureDia: 80, bloodSugar: 1.0, temperature: 36.6 }
      ],
      logs: [
        {
          id: "sl_1",
          time: "Créé aujourd'hui",
          text: "Intégration sur la plateforme. Prêt pour le suivi médical.",
          author: "Système",
          status: { mood: "Calme", appetite: "Moyen", sleep: "Bon" }
        }
      ]
    };

    setSeniors(prev => [...prev, newSenior]);
    setActiveSeniorId(newSenior.id);
    setIsAddSeniorOpen(false);

    // Reset fields
    setNewSeniorName("");
    setNewSeniorAge("");
    setNewSeniorCondition("");
    setNewSeniorImage("");
  };

  // Safe checks for data mapping
  const currentVitals = activeSenior.vitals || [];
  const latestVitals = currentVitals[currentVitals.length - 1] || {
    heartRate: 75,
    bloodPressureSys: 120,
    bloodPressureDia: 80,
    bloodSugar: 1.0,
    temperature: 36.6
  };

  // Compute stats color coding helper
  const getHeartRateStatus = (hr: number) => {
    if (hr < 55) return { label: "Lent (Bradycardie)", bg: "bg-blue-50 text-blue-700 border-blue-100", type: "info" };
    if (hr > 100) return { label: "Élevé (Tachycardie)", bg: "bg-red-50 text-red-700 border-red-100", type: "error" };
    if (hr > 90) return { label: "Plutôt élevé", bg: "bg-amber-50 text-amber-700 border-amber-100", type: "warning" };
    return { label: "Normal", bg: "bg-green-50 text-green-700 border-green-100", type: "success" };
  };

  const getTensionStatus = (sys: number, dia: number) => {
    if (sys >= 160 || dia >= 100) return { label: "Hypertension Sévère", bg: "bg-rose-50 text-rose-700 border-rose-200", type: "critical" };
    if (sys >= 140 || dia >= 90) return { label: "Hypertension Légère", bg: "bg-amber-50 text-amber-700 border-amber-100", type: "warning" };
    if (sys < 100) return { label: "Hypotension", bg: "bg-blue-50 text-blue-700 border-blue-100", type: "info" };
    return { label: "Normal (Parfait)", bg: "bg-green-50 text-green-700 border-green-100", type: "success" };
  };

  const getBloodSugarStatus = (g: number) => {
    if (g < 0.70) return { label: "Hypoglycémie", bg: "bg-orange-50 text-orange-700 border-orange-100", type: "warning" };
    if (g > 1.80) return { label: "Hyperglycémie critique", bg: "bg-rose-50 text-rose-700 border-rose-200", type: "critical" };
    if (g > 1.25) return { label: "Hyperglycémie légère", bg: "bg-amber-50 text-amber-700 border-amber-100", type: "warning" };
    return { label: "Normal (Stable)", bg: "bg-green-50 text-green-700 border-green-100", type: "success" };
  };

  const getTempStatus = (t: number) => {
    if (t >= 38.0) return { label: "Fièvre", bg: "bg-red-50 text-red-700 border-red-100", type: "error" };
    if (t < 36.0) return { label: "Hypothermie", bg: "bg-blue-50 text-blue-700 border-blue-100", type: "warning" };
    return { label: "Sain", bg: "bg-green-50 text-green-700 border-green-100", type: "success" };
  };

  // Call click simulation helper
  const triggerCallSimulate = (name: string, role: string, tel: string) => {
    setCallingPerson({ name, role, tel });
  };

  // Calculations for medication progress
  const totalMeds = activeSenior.medicines.length;
  const takenMeds = activeSenior.medicines.filter(m => m.taken).length;
  const progressPercent = totalMeds > 0 ? Math.round((takenMeds / totalMeds) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto py-4">
      
      {/* Caregiver Space Branding Header */}
      <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-emerald-700 p-8 md:p-12 rounded-[3rem] text-white shadow-xl relative overflow-hidden mb-12">
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="bg-teal-500/30 text-teal-100 px-4 py-1.5 rounded-full inline-flex items-center gap-2 font-black text-xs uppercase tracking-wider">
            <Activity size={14} className="animate-pulse" />
            Espace Aidants & Soignants
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-none title-serif">
            Suivi & Coordination <br/>
            <span className="italic text-teal-100">bienveillante</span>
          </h1>
          <p className="text-teal-50 text-base md:text-lg leading-relaxed">
            Un tableau de bord complet dédié à la famille et aux infirmiers. Gérez les prises de médicaments, suivez les constantes de santé et assurez-vous qu'aucun soin ne soit oublié.
          </p>
        </div>
        <div className="absolute -bottom-24 -right-12 w-96 h-96 bg-emerald-400 opacity-20 rounded-full blur-[90px]" />
      </div>

      {/* Senior Profile Selector and Multi-patient Controller */}
      <div className="bg-white rounded-[2.5rem] p-6 premium-shadow border border-slate-100 mb-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-xs block w-full md:w-auto md:mb-0">
              Aîné suivi :
            </span>
            <div className="flex flex-wrap gap-3">
              {seniors.map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveSeniorId(s.id);
                  }}
                  className={`flex items-center gap-3 px-5 py-3 rounded-2xl font-bold transition-all text-sm border ${
                    activeSeniorId === s.id
                      ? "bg-slate-900 border-slate-900 text-white shadow-lg"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  <img 
                    src={s.image} 
                    alt={s.name} 
                    className="w-7 h-7 rounded-lg object-cover bg-slate-200 border border-slate-100" 
                    referrerPolicy="no-referrer"
                  />
                  <span>{s.name}</span>
                </button>
              ))}

              <button
                onClick={() => setIsAddSeniorOpen(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-dashed border-teal-500 text-teal-600 hover:bg-teal-50 font-bold transition-all text-sm"
              >
                <UserPlus size={16} />
                <span>Nouveau Senior</span>
              </button>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-3 bg-teal-50 border border-teal-100 p-4 rounded-2xl">
            <CheckCircle2 className="text-teal-600 flex-shrink-0" size={20} />
            <div className="text-xs">
              <span className="font-bold text-teal-800 block">Dossiers d'aidants actifs</span>
              <span className="text-teal-600">Données synchronisées en local.</span>
            </div>
          </div>

        </div>

        {/* Selected Senior High-level Summary Info Card */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              {activeSenior.name}
              <span className="text-sm font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                {activeSenior.age} ans
              </span>
            </h2>
            <p className="text-xs font-bold text-teal-700 bg-teal-50/70 border border-teal-100/50 px-3 py-1 rounded-xl w-fit">
              Dossier : {activeSenior.condition}
            </p>
          </div>

          {/* Medicines progress summary stats */}
          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200/60 rounded-2xl p-4 w-full sm:w-auto">
            <div className="space-y-1 flex-1 sm:flex-none">
              <span className="text-xs font-bold text-slate-500 block">Traitement du jour</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-slate-800">{takenMeds} / {totalMeds}</span>
                <span className="text-xs text-slate-400">ordonnés pris</span>
              </div>
            </div>
            <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
              <svg className="w-12 h-12 transform -rotate-90">
                <circle 
                  cx="24" 
                  cy="24" 
                  r="20" 
                  className="stroke-slate-200 stroke-2 fill-none" 
                />
                <circle 
                  cx="24" 
                  cy="24" 
                  r="20" 
                  className="stroke-teal-600 stroke-2 fill-none transition-all duration-500" 
                  strokeDasharray="125.6"
                  strokeDashoffset={125.6 - (125.6 * progressPercent) / 100}
                />
              </svg>
              <span className="absolute text-[10px] font-black text-teal-700">{progressPercent}%</span>
            </div>
          </div>

        </div>
      </div>

      {/* Tabs Menu Navigation */}
      <div className="flex border-b border-slate-200 mb-8 overflow-x-auto gap-4 scrollbar-none">
        <button
          onClick={() => setActiveTab("vitals")}
          className={`pb-4 px-3 font-bold text-base md:text-lg flex items-center gap-2 whitespace-nowrap transition-all border-b-2 relative ${
            activeTab === "vitals"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <TrendingUp size={20} />
          <span>Suivi Constantes & Santé</span>
        </button>

        <button
          onClick={() => setActiveTab("meds")}
          className={`pb-4 px-3 font-bold text-base md:text-lg flex items-center gap-2 whitespace-nowrap transition-all border-b-2 relative ${
            activeTab === "meds"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ClipboardList size={20} />
          <span>Checklist Médicaments</span>
        </button>

        <button
          onClick={() => setActiveTab("logs")}
          className={`pb-4 px-3 font-bold text-base md:text-lg flex items-center gap-2 whitespace-nowrap transition-all border-b-2 relative ${
            activeTab === "logs"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <MessageSquare size={20} />
          <span>Cahier de Liaison</span>
        </button>

        <button
          onClick={() => setActiveTab("team")}
          className={`pb-4 px-3 font-bold text-base md:text-lg flex items-center gap-2 whitespace-nowrap transition-all border-b-2 relative ${
            activeTab === "team"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Phone size={20} />
          <span>Numéros Urgents & Soignants</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="mb-20">
        
        {/* Tab 1: VITALS TRACKER */}
        {activeTab === "vitals" && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Vitals Overview Banner with quick button */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black text-slate-800">Dernières Constantes Enregistrées</h3>
                <p className="text-slate-500 text-sm">Contrôle quotidien de la glycémie, tension et rythme cardiaque.</p>
              </div>
              <button
                onClick={() => setIsAddVitalOpen(true)}
                className="bg-emerald-600 text-white px-6 py-3.5 rounded-2xl font-bold text-sm hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-emerald-100"
              >
                <Plus size={16} />
                Enregistrer des Constantes
              </button>
            </div>

            {/* Core Metrics Cards (Heart, Sugar, Blood pressure, Temperature) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Heart rate bpm Card */}
              <div className="bg-white rounded-[2rem] p-6 premium-shadow border border-slate-100 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-red-50 text-red-500 rounded-2xl">
                    <Heart size={24} fill="currentColor" />
                  </div>
                  <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${getHeartRateStatus(latestVitals.heartRate).bg}`}>
                    {getHeartRateStatus(latestVitals.heartRate).label}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 text-xs font-bold block uppercase tracking-wide">Rythme Cardiaque</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-800">{latestVitals.heartRate}</span>
                    <span className="text-slate-500 text-sm font-semibold">BPM</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-50 text-[11px] text-slate-400 font-medium">
                  Cible médicale de repos : 60 - 90 bpm
                </div>
              </div>

              {/* Blood Pressure Card */}
              <div className="bg-white rounded-[2rem] p-6 premium-shadow border border-slate-100 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl">
                    <Activity size={24} />
                  </div>
                  <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${getTensionStatus(latestVitals.bloodPressureSys, latestVitals.bloodPressureDia).bg}`}>
                    {getTensionStatus(latestVitals.bloodPressureSys, latestVitals.bloodPressureDia).label}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 text-xs font-bold block uppercase tracking-wide">Tension Artérielle</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-800">
                      {latestVitals.bloodPressureSys}/{latestVitals.bloodPressureDia}
                    </span>
                    <span className="text-slate-500 text-xs font-semibold">mmHg</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-50 text-[11px] text-slate-400 font-medium">
                  Cible médicale : &lt; 140/90 mmHg
                </div>
              </div>

              {/* Blood Sugar Card (Glycemie) */}
              <div className="bg-white rounded-[2rem] p-6 premium-shadow border border-slate-100 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-teal-50 text-teal-500 rounded-2xl">
                    <TrendingUp size={24} />
                  </div>
                  <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${getBloodSugarStatus(latestVitals.bloodSugar).bg}`}>
                    {getBloodSugarStatus(latestVitals.bloodSugar).label}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 text-xs font-bold block uppercase tracking-wide">Glycémie (Sucre)</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-800">{latestVitals.bloodSugar.toFixed(2)}</span>
                    <span className="text-slate-500 text-sm font-semibold">g/L</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-50 text-[11px] text-slate-400 font-medium">
                  Cible à jeun : 0.80 - 1.20 g/L
                </div>
              </div>

              {/* Temperature card */}
              <div className="bg-white rounded-[2rem] p-6 premium-shadow border border-slate-100 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl">
                    <Activity size={24} />
                  </div>
                  <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${getTempStatus(latestVitals.temperature).bg}`}>
                    {getTempStatus(latestVitals.temperature).label}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 text-xs font-bold block uppercase tracking-wide">Température</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-800">{latestVitals.temperature.toFixed(1)}</span>
                    <span className="text-slate-500 text-sm font-semibold">°C</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-50 text-[11px] text-slate-400 font-medium">
                  Sain : 36.5°C - 37.5°C
                </div>
              </div>

            </div>

            {/* Custom Responsive SVG Graph showing Trends */}
            <div className="bg-white rounded-[2.5rem] p-6 md:p-8 premium-shadow border border-slate-100">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h4 className="text-xl font-bold text-slate-800">Historique des 5 derniers rapports</h4>
                  <p className="text-xs text-slate-400">Évolution de la Glycémie (g/L) et du Rythme Cardiaque (BPM)</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold">
                  <div className="flex items-center gap-1.5 text-teal-600">
                    <div className="w-3 h-3 rounded-full bg-teal-500" />
                    Glycémie (g/L)
                  </div>
                  <div className="flex items-center gap-1.5 text-red-500">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    Rythme Cardiaque
                  </div>
                </div>
              </div>

              {/* SVG Graphic Area */}
              <div className="w-full h-64 relative">
                {currentVitals.length < 2 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                    Ajoutez au moins 2 rapports pour afficher le graphique d'évolution.
                  </div>
                ) : (
                  <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="colorSugar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorHeart" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    <line x1="0" y1="50" x2="500" y2="50" stroke="#f1f5f9" strokeDasharray="3" />
                    <line x1="0" y1="100" x2="500" y2="100" stroke="#f1f5f9" strokeDasharray="3" />
                    <line x1="0" y1="150" x2="500" y2="150" stroke="#f1f5f9" strokeDasharray="3" />

                    {/* Sugar Line (Green) */}
                    <path
                      d={(() => {
                        const step = 500 / (currentVitals.length - 1);
                        return currentVitals.map((v, i) => {
                          // Scale Sugar: 0.5 to 2.0 mapped to 180 to 20
                          const sugarVal = Math.min(Math.max(v.bloodSugar, 0.5), 2.0);
                          const y = 180 - ((sugarVal - 0.5) / 1.5) * 160;
                          const x = i * step;
                          return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                        }).join(' ');
                      })()}
                      fill="none"
                      stroke="#14b8a6"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />

                    {/* Sugar Area */}
                    <path
                      d={(() => {
                        const step = 500 / (currentVitals.length - 1);
                        const points = currentVitals.map((v, i) => {
                          const sugarVal = Math.min(Math.max(v.bloodSugar, 0.5), 2.0);
                          const y = 180 - ((sugarVal - 0.5) / 1.5) * 160;
                          const x = i * step;
                          return `L ${x} ${y}`;
                        });
                        return `M 0 190 ${points.join(' ')} L 500 190 Z`;
                      })()}
                      fill="url(#colorSugar)"
                    />

                    {/* Heart Rate Line (Red) */}
                    <path
                      d={(() => {
                        const step = 500 / (currentVitals.length - 1);
                        return currentVitals.map((v, i) => {
                          // Scale Heart Rate: 50 to 120 bpm mapped to 180 to 20
                          const hrVal = Math.min(Math.max(v.heartRate, 50), 120);
                          const y = 180 - ((hrVal - 50) / 70) * 160;
                          const x = i * step;
                          return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                        }).join(' ');
                      })()}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2.5"
                      strokeDasharray="5 3"
                      strokeLinecap="round"
                    />

                    {/* Nodes representing each entry */}
                    {currentVitals.map((v, i) => {
                      const step = 500 / (currentVitals.length - 1);
                      const x = i * step;
                      const sugarVal = Math.min(Math.max(v.bloodSugar, 0.5), 2.0);
                      const sugarY = 180 - ((sugarVal - 0.5) / 1.5) * 160;
                      return (
                        <g key={i}>
                          <circle cx={x} cy={sugarY} r="5" fill="#14b8a6" stroke="#fff" strokeWidth="2" />
                          <text x={x} y={sugarY - 10} className="text-[10px] font-bold fill-teal-700" textAnchor="middle">
                            {v.bloodSugar.toFixed(2)}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                )}
              </div>

              {/* X axis dates */}
              <div className="flex justify-between mt-4 text-xs font-bold text-slate-400 border-t border-slate-100 pt-3">
                {currentVitals.map((v, i) => (
                  <span key={i}>{v.date}</span>
                ))}
              </div>
            </div>

            {/* Vital records historic log list */}
            <div className="bg-white rounded-[2.5rem] p-6 premium-shadow border border-slate-100">
              <h4 className="text-lg font-bold text-slate-800 mb-6">Journal Médical des Constantes</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold text-xs uppercase tracking-wider pb-3">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Rythme (BPM)</th>
                      <th className="py-3 px-4">Tension (SYS/DIA)</th>
                      <th className="py-3 px-4">Glycémie</th>
                      <th className="py-3 px-4">Température</th>
                      <th className="py-3 px-4">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentVitals.slice().reverse().map((v, idx) => {
                      const bpStatus = getTensionStatus(v.bloodPressureSys, v.bloodPressureDia);
                      return (
                        <tr key={idx} className="border-b border-slate-50 text-sm hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-4 font-bold text-slate-800">{v.date}</td>
                          <td className="py-4 px-4 font-mono">{v.heartRate} bpm</td>
                          <td className="py-4 px-4 font-mono">{v.bloodPressureSys}/{v.bloodPressureDia} mmHg</td>
                          <td className="py-4 px-4 font-mono text-teal-600 font-semibold">{v.bloodSugar.toFixed(2)} g/L</td>
                          <td className="py-4 px-4 font-mono">{v.temperature.toFixed(1)} °C</td>
                          <td className="py-4 px-4">
                            <span className={`text-[10px] font-bold px-3 py-1 rounded-xl border ${bpStatus.bg}`}>
                              {bpStatus.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: MEDICINE CHECKLIST */}
        {activeTab === "meds" && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black text-slate-800">Checklist Clinique du Jour</h3>
                <p className="text-slate-500 text-sm">Cochez les pilules prises par le patient pour garantir la rigueur du traitement ordonné.</p>
              </div>
              <button
                onClick={() => setIsAddMedOpen(true)}
                className="bg-emerald-600 text-white px-6 py-3.5 rounded-2xl font-bold text-sm hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-emerald-100"
              >
                <Plus size={16} />
                Ajouter un Traitement
              </button>
            </div>

            {/* Medicines grouped by Day Period */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Grouping periods display */}
              {["Matin", "Midi", "Soir", "Nuit"].map((period) => {
                const medsForPeriod = activeSenior.medicines.filter(m => m.time === period);
                
                return (
                  <div key={period} className="bg-white rounded-[2.5rem] p-6 md:p-8 premium-shadow border border-slate-100 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${
                            period === "Matin" ? "bg-amber-50 text-amber-600" :
                            period === "Midi" ? "bg-orange-50 text-orange-600" :
                            period === "Soir" ? "bg-indigo-50 text-indigo-600" : "bg-slate-900 text-slate-200"
                          }`}>
                            <Clock size={18} />
                          </div>
                          <span className="text-xl font-extrabold text-slate-800">{period}</span>
                        </div>
                        <span className="text-xs bg-slate-50 border border-slate-200 text-slate-500 px-3 py-1 rounded-xl font-bold">
                          {medsForPeriod.filter(m => m.taken).length} / {medsForPeriod.length} Pris
                        </span>
                      </div>

                      {medsForPeriod.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 font-medium text-sm">
                          Aucun médicament programmé pour le {period.toLowerCase()}.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {medsForPeriod.map((m) => (
                            <div 
                              key={m.id}
                              className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                                m.taken 
                                  ? "bg-emerald-50/50 border-emerald-200" 
                                  : "bg-slate-50 border-slate-200/60 hover:border-slate-300"
                              }`}
                            >
                              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                                <button
                                  onClick={() => handleToggleMedicine(m.id)}
                                  className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${
                                    m.taken 
                                      ? "bg-emerald-600 border-emerald-600 text-white" 
                                      : "border-slate-300 hover:border-emerald-600"
                                  }`}
                                >
                                  {m.taken && <Check size={16} strokeWidth={3} />}
                                </button>
                                <div className="min-w-0">
                                  <span className={`font-bold block truncate text-base ${m.taken ? "line-through text-slate-400" : "text-slate-800"}`}>
                                    {m.name}
                                  </span>
                                  <span className="text-xs text-slate-400">{m.dosage}</span>
                                </div>
                              </div>
                              <button 
                                onClick={() => handleRemoveMedicine(m.id)}
                                className="text-slate-300 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

            </div>

          </div>
        )}

        {/* Tab 3: CAHIER DE LIAISON (LOGS) */}
        {activeTab === "logs" && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black text-slate-800">Cahier de Liaison & Échanges</h3>
                <p className="text-slate-500 text-sm">Idéal pour l'alternance d'infirmiers et l'accompagnement des enfants.</p>
              </div>
              <button
                onClick={() => setIsAddLogOpen(true)}
                className="bg-emerald-600 text-white px-6 py-3.5 rounded-2xl font-bold text-sm hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-emerald-100"
              >
                <Plus size={16} />
                Écrire une Transmission
              </button>
            </div>

            {/* List of reports / log inputs */}
            <div className="space-y-6">
              {activeSenior.logs?.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-[2.5rem] border border-slate-100 premium-shadow">
                  <p className="text-slate-400 font-bold">Aucune transmission écrite pour le moment.</p>
                </div>
              ) : (
                activeSenior.logs?.map((log) => (
                  <div key={log.id} className="bg-white rounded-[2.5rem] p-6 md:p-8 premium-shadow border border-slate-100">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-black uppercase text-sm">
                          {log.author.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-800 leading-tight">{log.author}</h4>
                          <span className="text-xs text-slate-400 font-bold block">{log.time}</span>
                        </div>
                      </div>

                      {/* Diagnostic badges shown inside card */}
                      <div className="flex flex-wrap gap-2">
                        <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                          Humeur : {log.status.mood}
                        </span>
                        <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                          Appétit : {log.status.appetite}
                        </span>
                        <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                          Sommeil : {log.status.sleep}
                        </span>
                      </div>
                    </div>

                    <p className="text-slate-600 text-base leading-relaxed pl-1 whitespace-pre-line">
                      {log.text}
                    </p>
                  </div>
                ))
              )}
            </div>

          </div>
        )}

        {/* Tab 4: HEALTH TEAM DIRECT CONTACTS */}
        {activeTab === "team" && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h3 className="text-2xl font-black text-slate-800">Équipe Médicale & Contacts</h3>
              <p className="text-slate-500 text-sm">Joignez instantanément les soignants, docteurs ou numéros de secours.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              
              {/* Emergency SAMU card */}
              <div className="bg-rose-50 rounded-[2.5rem] p-8 border border-rose-100 flex flex-col justify-between shadow-xl shadow-rose-50 relative overflow-hidden">
                <div className="space-y-4">
                  <div className="p-3 bg-rose-600 text-white rounded-2xl w-fit">
                    <AlertCircle size={32} />
                  </div>
                  <div>
                    <h4 className="text-rose-900 text-2xl font-black tracking-tight">SAMU Urgences</h4>
                    <span className="text-rose-700 text-xs font-bold uppercase tracking-wider block mt-1">Numéro d'urgence national Tunisien</span>
                  </div>
                </div>
                <div className="mt-8 pt-6 border-t border-rose-200 flex items-center justify-between">
                  <span className="text-rose-900 font-black text-3xl">190</span>
                  <button
                    onClick={() => triggerCallSimulate("SAMU Urgences", "Secours médical d'urgence", "190")}
                    className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 text-sm"
                  >
                    Appeler d'Urgence
                  </button>
                </div>
                <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-rose-600 opacity-5 rounded-full" />
              </div>

              {/* Doctor Card */}
              <div className="bg-white rounded-[2.5rem] p-8 premium-shadow border border-slate-100 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl w-fit">
                    <Heart size={28} fill="currentColor" />
                  </div>
                  <div>
                    <h4 className="text-slate-800 text-xl font-bold leading-tight">Dr. Slim Slimane</h4>
                    <span className="text-slate-400 text-xs font-bold uppercase block mt-1">Médecin Généraliste Traitant</span>
                  </div>
                  <p className="text-slate-500 text-sm">En charge du protocole d'hypertension et ajustement d'insuline.</p>
                </div>
                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-slate-800 font-extrabold text-lg">71 890 123</span>
                  <button
                    onClick={() => triggerCallSimulate("Dr. Slim Slimane", "Médecin Traitant", "71 890 123")}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl font-semibold transition-all text-xs"
                  >
                    Contacter
                  </button>
                </div>
              </div>

              {/* Nurse Card */}
              <div className="bg-white rounded-[2.5rem] p-8 premium-shadow border border-slate-100 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl w-fit">
                    <Activity size={28} />
                  </div>
                  <div>
                    <h4 className="text-slate-800 text-xl font-bold leading-tight">Mme. Lobna Krichene</h4>
                    <span className="text-slate-400 text-xs font-bold uppercase block mt-1">Cabinet d'Infirmier à Domicile</span>
                  </div>
                  <p className="text-slate-500 text-sm">Visites quotidiennes à 08:00 pour injections et tests de glycémie.</p>
                </div>
                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-slate-800 font-extrabold text-lg">98 654 321</span>
                  <button
                    onClick={() => triggerCallSimulate("Mme. Lobna Krichene", "Cabinet d'Infirmier", "98 654 321")}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl font-semibold transition-all text-xs"
                  >
                    Contacter
                  </button>
                </div>
              </div>

              {/* Kine/Therapist */}
              <div className="bg-white rounded-[2.5rem] p-8 premium-shadow border border-slate-100 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl w-fit">
                    <Calendar size={28} />
                  </div>
                  <div>
                    <h4 className="text-slate-800 text-xl font-bold leading-tight">Mr. Firas Ghorbel</h4>
                    <span className="text-slate-400 text-xs font-bold uppercase block mt-1">Masseur Kinésithérapeute</span>
                  </div>
                  <p className="text-slate-500 text-sm">Séances de rééducation physique les mardis et vendredis à 14h.</p>
                </div>
                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-slate-800 font-extrabold text-lg">22 345 678</span>
                  <button
                    onClick={() => triggerCallSimulate("Mr. Firas Ghorbel", "Kinésithérapeute", "22 345 678")}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl font-semibold transition-all text-xs"
                  >
                    Contacter
                  </button>
                </div>
              </div>

              {/* Night Pharmacy / Pharmacy of Guard */}
              <div className="bg-white rounded-[2.5rem] p-8 premium-shadow border border-slate-100 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-fit">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h4 className="text-slate-800 text-xl font-bold leading-tight">Pharmacie Belvédère</h4>
                    <span className="text-slate-400 text-xs font-bold uppercase block mt-1">Pharmacie de garde h24</span>
                  </div>
                  <p className="text-slate-500 text-sm">Livraison possible de molécules de rechange ou insuline urgente.</p>
                </div>
                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-slate-800 font-extrabold text-lg">71 289 999</span>
                  <button
                    onClick={() => triggerCallSimulate("Pharmacie Belvédère", "Pharmacie h24", "71 289 999")}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl font-semibold transition-all text-xs"
                  >
                    Contacter
                  </button>
                </div>
              </div>

              {/* Core Emergency Contact relative */}
              <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-200/50 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="p-3 bg-slate-900 text-white rounded-2xl w-fit">
                    <Phone size={24} />
                  </div>
                  <div>
                    <h4 className="text-slate-800 text-xl font-bold leading-tight">Rim Ben Ali (Fille)</h4>
                    <span className="text-slate-400 text-xs font-bold uppercase block mt-1">Aidante Familiale Principale</span>
                  </div>
                  <p className="text-slate-500 text-sm">Premier contact familial en cas de hausse de tension ou malaise.</p>
                </div>
                <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-slate-800 font-extrabold text-lg">29 111 222</span>
                  <button
                    onClick={() => triggerCallSimulate("Rim Ben Ali", "Famille proche / Fille", "29 111 222")}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl font-semibold transition-all text-xs"
                  >
                    Contacter
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* --- POP-UPS & INPUT MODALS FOR FULL FUNCTIONALITY --- */}

      {/* 1. Modal: ADD SENIOR */}
      <AnimatePresence>
        {isAddSeniorOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl premium-shadow overflow-hidden"
            >
              <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-extrabold text-xl text-slate-800 flex items-center gap-2">
                  <UserPlus className="text-emerald-600" size={24} />
                  Nouveau Senior / Aîné
                </h3>
                <button onClick={() => setIsAddSeniorOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddSenior} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">Nom Complet</label>
                  <input 
                    required 
                    type="text" 
                    value={newSeniorName}
                    onChange={(e) => setNewSeniorName(e.target.value)}
                    placeholder="Ex: M. Habib Ghorbel" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:border-emerald-600 outline-none transition-all text-sm font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 block">Âge</label>
                    <input 
                      required 
                      type="number" 
                      value={newSeniorAge}
                      onChange={(e) => setNewSeniorAge(e.target.value)}
                      placeholder="Ex: 80" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:border-emerald-600 outline-none transition-all text-sm font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 block">Photo (Unsplash link)</label>
                    <input 
                      type="text" 
                      value={newSeniorImage}
                      onChange={(e) => setNewSeniorImage(e.target.value)}
                      placeholder="Laisser vide pour défaut" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:border-emerald-600 outline-none transition-all text-sm font-semibold text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block font-bold">Pathologie / Motif de surveillance</label>
                  <input 
                    type="text" 
                    value={newSeniorCondition}
                    onChange={(e) => setNewSeniorCondition(e.target.value)}
                    placeholder="Ex: Arthrose sévère & Insuffisance" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:border-emerald-600 outline-none transition-all text-sm font-semibold"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-700 transition-all text-sm shadow-md"
                >
                  Ajouter le Senior au Suivi
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Modal: ADD TREATMENT */}
      <AnimatePresence>
        {isAddMedOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl premium-shadow overflow-hidden"
            >
              <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-extrabold text-xl text-slate-800 flex items-center gap-2">
                  <ClipboardList className="text-emerald-600" size={24} />
                  Ajouter un Médicament
                </h3>
                <button onClick={() => setIsAddMedOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddMedicine} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">Nom de la molécule ou médicament</label>
                  <input 
                    required 
                    type="text" 
                    value={newMedName}
                    onChange={(e) => setNewMedName(e.target.value)}
                    placeholder="Ex: Doliprane 1000mg" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:border-emerald-600 outline-none transition-all text-sm font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 block">Dosage</label>
                    <input 
                      required
                      type="text" 
                      value={newMedDosage}
                      onChange={(e) => setNewMedDosage(e.target.value)}
                      placeholder="Ex: 1 comprimé" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:border-emerald-600 outline-none transition-all text-sm font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 block font-bold">Horaire de prise</label>
                    <select
                      value={newMedTime}
                      onChange={(e) => setNewMedTime(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:border-emerald-600 outline-none transition-all text-sm font-semibold"
                    >
                      <option value="Matin">Matin</option>
                      <option value="Midi">Midi</option>
                      <option value="Soir">Soir</option>
                      <option value="Nuit">Nuit</option>
                    </select>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-700 transition-all text-sm"
                >
                  Ajouter à l'ordonnance
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Modal: RECORD VITALS */}
      <AnimatePresence>
        {isAddVitalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl premium-shadow overflow-hidden"
            >
              <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-extrabold text-xl text-slate-800 flex items-center gap-2">
                  <Activity className="text-emerald-600" size={24} />
                  Enregistrer les Constantes
                </h3>
                <button onClick={() => setIsAddVitalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddVitalRecord} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 block">Pouls (BPM)</label>
                    <input 
                      required 
                      type="number" 
                      value={newHr}
                      onChange={(e) => setNewHr(e.target.value)}
                      placeholder="Ex: 75" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:border-emerald-600 outline-none transition-all text-sm font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 block">Température (°C)</label>
                    <input 
                      required 
                      type="number" 
                      step="0.1"
                      value={newTemp}
                      onChange={(e) => setNewTemp(e.target.value)}
                      placeholder="Ex: 36.6" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:border-emerald-600 outline-none transition-all text-sm font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 block">Tension Sys (élevé)</label>
                    <input 
                      required 
                      type="number" 
                      value={newBps}
                      onChange={(e) => setNewBps(e.target.value)}
                      placeholder="Ex: 120" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:border-emerald-600 outline-none transition-all text-sm font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 block">Tension Dia (basse)</label>
                    <input 
                      required 
                      type="number" 
                      value={newBpd}
                      onChange={(e) => setNewBpd(e.target.value)}
                      placeholder="Ex: 80" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:border-emerald-600 outline-none transition-all text-sm font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">Glycémie à jeun (g/L)</label>
                  <input 
                    required 
                    type="number" 
                    step="0.01"
                    value={newSugar}
                    onChange={(e) => setNewSugar(e.target.value)}
                    placeholder="Ex: 1.10" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:border-emerald-600 outline-none transition-all text-sm font-semibold"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-700 transition-all text-sm"
                >
                  Enregistrer les Constantes
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Modal: WRITE TRANSMISSION */}
      <AnimatePresence>
        {isAddLogOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl premium-shadow overflow-hidden"
            >
              <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-extrabold text-xl text-slate-800 flex items-center gap-2">
                  <MessageSquare className="text-emerald-600" size={24} />
                  Échanger une Transmission
                </h3>
                <button onClick={() => setIsAddLogOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddLog} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">Votre Nom / Fonction</label>
                  <input 
                    required 
                    type="text" 
                    value={newLogAuthor}
                    onChange={(e) => setNewLogAuthor(e.target.value)}
                    placeholder="Ex: Rim (Aidante familiale) ou Melek (Infirmier)" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:border-emerald-600 outline-none transition-all text-sm font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block font-bold">Rapport d'activité & Observations</label>
                  <textarea 
                    required 
                    rows={4}
                    value={newLogText}
                    onChange={(e) => setNewLogText(e.target.value)}
                    placeholder="Quelles sont vos observations sur l'aîné aujourd'hui (repas, fatigue, comportement, remarques) ?" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:border-emerald-600 outline-none transition-all text-sm font-semibold resize-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block uppercase font-bold">Humeur</label>
                    <select
                      value={newLogMood}
                      onChange={(e) => setNewLogMood(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-250 rounded-xl p-2.5 outline-none transition-all text-xs font-bold"
                    >
                      <option value="Calme">Calme</option>
                      <option value="Souriant">Souriant</option>
                      <option value="Fatigué">Fatigué</option>
                      <option value="Agité">Agité</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block uppercase font-bold">Appétit</label>
                    <select
                      value={newLogAppetite}
                      onChange={(e) => setNewLogAppetite(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-250 rounded-xl p-2.5 outline-none transition-all text-xs font-bold"
                    >
                      <option value="Moyen">Moyen</option>
                      <option value="Excellent">Excellent</option>
                      <option value="Faible">Faible</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block uppercase font-bold">Sommeil</label>
                    <select
                      value={newLogSleep}
                      onChange={(e) => setNewLogSleep(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-250 rounded-xl p-2.5 outline-none transition-all text-xs font-bold"
                    >
                      <option value="Bon">Bon</option>
                      <option value="Agité">Agité</option>
                      <option value="Mauvais">Mauvais</option>
                    </select>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-700 transition-all text-sm shadow-md"
                >
                  Publier la Transmission
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Simulating Calling Pop-up for working call back trigger */}
      <AnimatePresence>
        {callingPerson && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="bg-slate-950 text-white w-full max-w-xs rounded-[3rem] p-8 text-center border border-slate-800 shadow-2xl flex flex-col items-center space-y-8"
            >
              <div className="space-y-2">
                <span className="text-teal-400 font-bold uppercase tracking-widest text-[10px] bg-teal-950 border border-teal-900/50 px-3 py-1 rounded-full animate-pulse">
                  Appel en cours...
                </span>
                <h3 className="text-2xl font-black title-serif">{callingPerson.name}</h3>
                <p className="text-slate-400 text-xs font-medium">{callingPerson.role}</p>
                <p className="text-slate-300 font-mono tracking-widest mt-2">{callingPerson.tel}</p>
              </div>

              {/* Animated pulse waves */}
              <div className="relative w-28 h-28 flex items-center justify-center">
                <div className="absolute inset-0 bg-teal-500/10 rounded-full animate-ping" />
                <div className="absolute w-20 h-20 bg-teal-500/20 rounded-full animate-pulse" />
                <div className="w-16 h-16 bg-teal-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-teal-500/30 z-10">
                  <Phone size={32} fill="currentColor" className="animate-bounce" />
                </div>
              </div>

              <div className="w-full pt-4">
                <button
                  onClick={() => setCallingPerson(null)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/35"
                >
                  <X size={16} strokeWidth={3} />
                  Raccrocher
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
