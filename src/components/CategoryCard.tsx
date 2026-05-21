import { motion } from 'motion/react';
import { ChevronRight, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useSubscription } from '../context/SubscriptionContext';

interface CategoryCardProps {
  title: string;
  image: string;
  to: string;
  description: string;
  delay?: number;
  isFree?: boolean;
  onLockedClick?: () => void;
}

export default function CategoryCard({ title, image, to, description, delay = 0, isFree = false, onLockedClick }: CategoryCardProps) {
  const { isSubscribed } = useSubscription();
  const navigate = useNavigate();

  const isLocked = !isFree && !isSubscribed;

  const handleClick = (e: React.MouseEvent) => {
    if (isLocked) {
      e.preventDefault();
      onLockedClick?.();
    } else {
      navigate(to);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      whileHover={{ y: -8 }}
      className="group cursor-pointer"
      onClick={handleClick}
    >
      <div className="block bg-white rounded-[3rem] p-6 lg:p-10 premium-shadow border border-slate-100 hover:border-blue-200 transition-all h-full flex flex-col items-center relative overflow-hidden">
        {isLocked && (
            <div className="absolute top-6 right-6 bg-amber-50 text-amber-600 px-4 py-2 rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest animate-pulse border border-amber-100 shadow-sm z-10">
                <Lock size={12} fill="currentColor" />
                Abonnement requis
            </div>
        )}
        
        {isFree && (
            <div className="absolute top-6 right-6 bg-green-50 text-green-600 px-4 py-2 rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest border border-green-100 shadow-sm z-10">
                OFFERT
            </div>
        )}

        <div className="w-full flex justify-between items-center mb-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-800 tracking-tight title-serif">
            {title}
          </h2>
          <div className={cn(
            "p-3 rounded-2xl transition-all duration-300",
            isLocked ? "bg-slate-100 text-slate-300" : "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white"
          )}>
            <ChevronRight size={28} strokeWidth={2.5} />
          </div>
        </div>

        <div className="relative w-full aspect-[4/3] mb-8 overflow-hidden rounded-[2.5rem] bg-slate-50 flex items-center justify-center border border-slate-100">
          <img
            src={image}
            alt={title}
            className={cn(
              "w-full h-full object-cover transition-transform duration-700",
              isLocked ? "grayscale opacity-50" : "group-hover:scale-110"
            )}
            referrerPolicy="no-referrer"
          />
          {isLocked && (
              <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white/90 rounded-3xl flex items-center justify-center text-slate-900 shadow-xl border border-slate-100">
                      <Lock size={32} />
                  </div>
              </div>
          )}
        </div>

        <p className="text-slate-500 text-center text-lg leading-relaxed px-2 font-medium">
          {description}
        </p>
      </div>
    </motion.div>
  );
}
