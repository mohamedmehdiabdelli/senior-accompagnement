import { MapPin, AlertTriangle, ShieldCheck, Phone, Mail, UserPlus, Camera, CameraOff, RefreshCw } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

// DELETE the hardcoded array
// ADD imports:
import { useState, useRef, useEffect } from 'react'; // already there
import { getFamilyContacts, addFamilyContact, deleteFamilyContact } from '../lib/db';
import type { FamilyContact } from '../lib/db';
import { useAuth } from '../context/AuthContext';

// ADD inside the component:
const { user, profile } = useAuth();
const userId = user?.id || profile?.id || 'local';
const [familyContacts, setFamilyContacts] = useState<FamilyContact[]>([]);

useEffect(() => {
  getFamilyContacts(userId).then(setFamilyContacts);
}, [userId]);

export default function Alerte() {
  const [alertSent, setAlertSent] = useState(false);
  const [holding, setHolding] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const triggerAlert = () => {
    setAlertSent(true);
    setHolding(false);
    setTimeout(() => setAlertSent(false), 5000);
  };

  const toggleCamera = async () => {
    if (showCamera) {
      stream?.getTracks().forEach(track => track.stop());
      setStream(null);
      setShowCamera(false);
    } else {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(newStream);
        setShowCamera(true);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
      } catch (err) {
        console.error("Camera access denied", err);
        alert("Accès caméra refusé ou non disponible.");
      }
    }
  };

  useEffect(() => {
    if (showCamera && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [showCamera, stream]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto pb-20">
      <div className="space-y-10">
        <div className="space-y-4">
          <div className="inline-flex bg-red-50 text-red-600 px-4 py-1.5 rounded-full text-sm font-bold tracking-wide uppercase">
            Sécurité Connectée
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 tracking-tight title-serif leading-tight">Centre de Sécurité</h1>
          <p className="text-lg text-slate-500">Votre position et votre visuel peuvent être partagés en cas d'urgence.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
           <div className="bg-white rounded-[3rem] p-8 premium-shadow border border-slate-50 flex flex-col items-center text-center space-y-6 relative overflow-hidden h-full">
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-100">
               {holding && <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 1.5 }} className="h-full bg-red-600" />}
            </div>
            
            <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 shadow-inner">
              <AlertTriangle size={36} className={holding ? 'animate-bounce' : 'animate-pulse'} />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-800 title-serif">Bouton SOS</h2>
              <p className="text-slate-500 text-sm">Maintenir 2s pour alerter</p>
            </div>
            
            <motion.button
              onMouseDown={() => setHolding(true)}
              onMouseUp={() => setHolding(false)}
              onMouseLeave={() => setHolding(false)}
              onTouchStart={() => setHolding(true)}
              onTouchEnd={() => setHolding(false)}
              onPointerDown={() => setHolding(true)}
              onPointerUp={(e) => {
                if (holding) triggerAlert();
                setHolding(false);
              }}
              className={`w-full py-6 rounded-[2rem] text-xl font-black shadow-xl transition-all select-none touch-none ${
                alertSent ? 'bg-green-500 text-white shadow-green-100' : 'bg-red-600 text-white hover:bg-red-700 shadow-red-200'
              }`}
            >
              <AnimatePresence mode="wait">
                {alertSent ? (
                  <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="flex items-center justify-center gap-2">
                    <ShieldCheck size={28} />
                    ENVOYÉ
                  </motion.div>
                ) : holding ? (
                  "..."
                ) : (
                  "SOS"
                )}
              </AnimatePresence>
            </motion.button>
          </div>

          <div className="bg-white rounded-[3rem] p-8 premium-shadow border border-slate-50 flex flex-col items-center text-center space-y-6 relative overflow-hidden h-full">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-inner transition-colors ${showCamera ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}>
              <Camera size={36} />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-800 title-serif">Visio SOS</h2>
              <p className="text-slate-500 text-sm">{showCamera ? "Caméra activée" : "Activer la caméra"}</p>
            </div>
            <button 
              onClick={toggleCamera}
              className={`w-full py-6 rounded-[2rem] text-xl font-bold shadow-xl transition-all ${showCamera ? 'bg-slate-900 text-white' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'}`}
            >
              {showCamera ? "Désactiver" : "Activer"}
            </button>
          </div>
        </div>

        <div className="bg-slate-900 rounded-[3rem] p-10 text-white space-y-8 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 flex justify-between items-center">
            <h3 className="text-2xl font-bold title-serif">Ma Famille</h3>
            <button className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl transition-all">
              <UserPlus size={24} />
            </button>
          </div>
          <div className="space-y-4 relative z-10">
            {familyContacts.map((c, idx) => (
              <div key={idx} className="flex items-center justify-between bg-white/5 backdrop-blur-xl p-5 rounded-3xl border border-white/10 group hover:bg-white/10 transition-all">
                <div className="flex items-center gap-5">
                  <div className="relative">
                     <img src={c.image_url} alt={c.name} className="w-14 h-14 rounded-2xl border-2 border-white/20 group-hover:scale-110 transition-transform" />
                     <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">{c.name}</p>
                    <p className="text-sm text-slate-400">{c.phone}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="bg-white text-slate-900 p-3 rounded-xl hover:scale-110 transition-all shadow-lg">
                    <Phone size={20} />
                  </button>
                  <button className="bg-slate-800 text-white p-3 rounded-xl hover:scale-110 transition-all border border-white/10">
                    <Mail size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 rounded-full blur-[100px] opacity-10" />
        </div>
      </div>

      <div className="space-y-8">
        <div className="bg-slate-200 rounded-[3.5rem] relative overflow-hidden min-h-[400px] border-8 border-white shadow-2xl premium-shadow">
          {showCamera ? (
            <div className="absolute inset-0 bg-black flex items-center justify-center">
               <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
               <div className="absolute top-6 left-6 bg-red-600 text-white px-4 py-1 rounded-full text-xs font-black animate-pulse flex items-center gap-2">
                 <div className="w-2 h-2 bg-white rounded-full" />
                 DIRECT
               </div>
            </div>
          ) : (
            <>
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=1200')] bg-cover bg-center contrast-125 opacity-60 scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                <div className="relative">
                  <div className="absolute -inset-12 bg-blue-600/30 rounded-full animate-ping" />
                  <div className="bg-blue-600 p-5 rounded-[2rem] text-white shadow-2xl relative border-4 border-white">
                    <MapPin size={40} fill="currentColor" />
                  </div>
                </div>
              </div>
            </>
          )}
          
          <div className="absolute bottom-8 left-8 right-8 bg-white/80 backdrop-blur-2xl p-8 rounded-[3rem] shadow-2xl border border-white flex justify-between items-center z-30">
            <div className="flex items-center gap-6">
              <div className="relative">
                 <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                    <ShieldCheck size={28} />
                 </div>
              </div>
              <div>
                <p className="font-black text-xl text-slate-800 tracking-tight">{showCamera ? "Visuel sécurisé" : "Localisation active"}</p>
                <p className="text-sm font-bold text-slate-500">Mise à jour : à l'instant</p>
              </div>
            </div>
            <button onClick={showCamera ? toggleCamera : undefined} className="bg-slate-100 p-4 rounded-2xl hover:bg-slate-200 transition-all text-slate-600">
              <RefreshCw size={24} />
            </button>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3.5rem] premium-shadow border border-slate-50 space-y-6">
          <h3 className="text-2xl font-bold title-serif flex items-center gap-3">
             <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
               <ShieldCheck size={28} />
             </div>
             Journal de sécurité
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <div className="w-2 h-2 bg-green-500 rounded-full" />
               <p className="text-sm font-medium text-slate-600">Tout est en ordre pour le moment.</p>
               <span className="ml-auto text-xs font-bold text-slate-400">14:30</span>
            </div>
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <div className="w-2 h-2 bg-slate-300 rounded-full" />
               <p className="text-sm font-medium text-slate-600">Dernier test SOS effectué par Thomas.</p>
               <span className="ml-auto text-xs font-bold text-slate-400">Hier</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
