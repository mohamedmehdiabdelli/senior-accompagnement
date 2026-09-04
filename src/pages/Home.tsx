import CategoryCard from '../components/CategoryCard';
import { motion } from 'motion/react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2 } from 'lucide-react';

// First 6 categories: visible to elderly users
// Last category (Espace Aidants): visible to nursing_home users
const elderlyCategories = [
  {
    title: "Aide Santé",
    description: "Achat et vente de matériel : fauteuils, appareils de tension, etc.",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800",
    to: "/besoins",
    isFree: true
  },
  {
    title: "Psychique",
    description: "Parlez à notre compagnon IA ou prenez rendez-vous avec un psychologue.",
    image: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&q=80&w=800",
    to: "/psychique",
    isFree: true
  },
  {
    title: "Réseau Santé",
    description: "Consultez un médecin à distance, contrôles et rendez-vous simplifiés.",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800",
    to: "/telemedicine",
    isFree: true
  },
  {
    title: "Rappeler-moi",
    description: "Vos médicaments, rendez-vous, repas et moments de prière.",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800",
    to: "/rappels",
    isFree: true
  },
  {
    title: "Alerte",
    description: "Sécurité par GPS et alerte automatique pour votre famille.",
    image: "https://static.vecteezy.com/system/resources/thumbnails/050/787/074/small/mobile-phones-are-essential-for-timely-warnings-about-financial-risks-and-fraud-highlighting-the-need-for-caution-and-sound-judgment-in-investments-and-financial-decisions-for-safety-and-security-photo.jpg",
    to: "/alerte",
    isFree: true
  },
  {
    title: "Loisirs",
    description: "Livres, jeux, blagues et divertissements pour rester actif.",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800",
    to: "/loisirs",
    isFree: true
  }
];

const nursingHomeCategories = [
  {
    title: "Espace Aidants",
    description: "Pour les aidants : suivez quotidiennement la glycémie, le pouls, l'humeur et validez la prise de médicaments.",
    image: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=800",
    to: "/caregiver",
    isFree: true
  },
  {
    title: "Espace Vêtements",
    description: "Recherchez les vêtements des résidents par catégorie, taille, couleur et type.",
    image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&q=80&w=800",
    to: "/vetements",
    isFree: true
  }
];

export default function Home() {
  const { profile } = useAuth();

  const categories = profile?.role !== 'family' ? nursingHomeCategories : elderlyCategories;
  const greetingName = profile?.full_name ? `, ${profile.full_name}` : '';

  return (
    <div className="max-w-6xl mx-auto py-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-20 space-y-6"
      >
        <div className="px-6 py-2 rounded-full inline-flex items-center gap-2 font-bold text-sm tracking-wide uppercase transition-colors bg-green-50 text-green-700">
          <CheckCircle2 size={16} />
          Accès Complet
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight title-serif leading-none">
          {profile?.role !== 'family' ? (
            <>Votre espace <span className="text-blue-600 italic">aidants</span>{greetingName}</>
          ) : (
            <>Comment puis-je vous <br/> <span className="text-blue-600 italic">accompagner</span> aujourd'hui{greetingName} ?</>
          )}
        </h1>
        <p className="text-xl md:text-2xl text-slate-500 max-w-3xl mx-auto leading-relaxed">
          {profile?.role !== 'family'
            ? "Suivez vos résidents au quotidien : glycémie, pouls, humeur, médicaments."
            : "Un espace bienveillant conçu pour simplifier votre quotidien et prendre soin de vous, à chaque instant."}
        </p>
      </motion.div>

      <div className={`grid grid-cols-1 ${categories.length > 1 ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-1 max-w-2xl mx-auto'} gap-10`}>
        {categories.map((cat, idx) => (
          <CategoryCard
            key={cat.title}
            {...cat}
            delay={idx * 0.1}
          />
        ))}
      </div>

      <div className="mt-24 p-12 bg-slate-900 rounded-[3rem] text-white relative overflow-hidden flex flex-col md:flex-row items-center gap-8 shadow-2xl">
        <div className="relative z-10 max-w-xl text-center md:text-left">
          <h2 className="text-3xl font-bold mb-4 title-serif">Besoin d'assistance par téléphone ?</h2>
          <p className="text-slate-400 text-lg">Nos conseillers sont à votre écoute 24h/24 pour répondre à toutes vos questions ou vous aider à naviguer sur la plateforme.</p>
        </div>
        <div className="relative z-10 shrink-0">
          <button className="bg-white text-slate-900 px-10 py-5 rounded-2xl font-bold text-xl hover:scale-105 transition-transform shadow-xl">
            Appeler le 94 415 663
          </button>
        </div>
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-orange-600 rounded-full blur-[80px] opacity-10" />
      </div>
    </div>
  );
}
