import { Lock, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useSubscription } from "../context/SubscriptionContext";

export default function SubscriptionModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { subscribe } = useSubscription();
  const [loading, setLoading] = useState(false);

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      subscribe();
      setLoading(false);
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="bg-[#f8f9fa] border-b border-slate-100 p-4 flex justify-between items-center">
            <div className="flex items-center gap-1">
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-xl">S</div>
                <span className="font-bold text-slate-900 text-xl tracking-tight">sumup<sup className="text-[8px]">®</sup></span>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
            </button>
        </div>

        <form onSubmit={handlePayment} className="p-8 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Payez en ligne</h2>
            <ShieldCheck className="text-slate-400" size={24} />
          </div>

          <div className="flex gap-2 opacity-80">
            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-4" alt="mastercard" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-4" alt="visa" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-4" alt="paypal" />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 ml-1">Nom sur la carte</label>
              <input 
                required
                type="text" 
                placeholder="Nom" 
                className="w-full bg-white border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500/20 focus:border-slate-900 outline-none transition-all text-slate-700 font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 ml-1">N° de carte</label>
              <div className="relative">
                <input 
                  required
                  type="text" 
                  placeholder=".... .... .... ...." 
                  className="w-full bg-white border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500/20 focus:border-slate-900 outline-none transition-all text-slate-700 font-medium tracking-widest"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-5 bg-slate-200 rounded-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 ml-1">Date d'expiration</label>
                <input 
                  required
                  type="text" 
                  placeholder="MM/AA" 
                  className="w-full bg-white border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500/20 focus:border-slate-900 outline-none transition-all text-slate-700 font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 ml-1">Cryptogramme visuel</label>
                <input 
                  required
                  type="text" 
                  placeholder="..." 
                  className="w-full bg-white border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500/20 focus:border-slate-900 outline-none transition-all text-slate-700 font-medium"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-[#307cff] text-white py-5 rounded-xl font-bold text-lg hover:bg-blue-600 transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-100 active:scale-95 disabled:opacity-70"
          >
            {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
                <>
                    <Lock size={20} fill="white" />
                    Payer 1 €
                </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
