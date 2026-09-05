import { Home, LogOut, Shield, Building2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function Header() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const { profile, signOut } = useAuth();
  const [facilityName, setFacilityName] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadFacility = async () => {
      if (!profile?.facility_id && profile?.role !== 'super_admin') {
        setFacilityName(null);
        return;
      }

      if (!isSupabaseConfigured()) {
        try {
          const raw = localStorage.getItem('tamini_local_facilities');
          const facilities = raw ? JSON.parse(raw) as { id: string; name: string }[] : [];
          const facility = facilities.find(item => item.id === profile.facility_id);
          if (mounted) setFacilityName(facility?.name ?? null);
        } catch {
          if (mounted) setFacilityName(null);
        }
        return;
      }

      let query = supabase
        .from('facilities')
        .select('name');

      const { data } = profile.facility_id
        ? await query.eq('id', profile.facility_id).maybeSingle()
        : await query.eq('owner_id', profile.id).maybeSingle();

      if (mounted) setFacilityName(data?.name ?? null);
    };

    loadFacility();
    return () => { mounted = false; };
  }, [profile?.facility_id]);

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 py-3 shadow-sm">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link to="/" className="flex items-center py-2 pr-2 group">
          <div className="flex items-center shrink-0 group-hover:scale-110 transition-transform">
            <img
              src="/tamini-logo.png"
              alt="Tamini"
              className="h-16 w-16 md:h-20 md:w-20 rounded-full object-cover"
            />
          </div>
        </Link>

        {facilityName && (
          <div className="flex min-w-0 max-w-[38%] md:max-w-[42%] items-center gap-2 rounded-2xl bg-emerald-50 px-2 md:px-4 py-2 text-emerald-800 border border-emerald-100">
            <Building2 size={18} className="shrink-0 text-emerald-600" />
            <div className="min-w-0">
              <span className="hidden md:block text-[10px] font-black uppercase tracking-wider text-emerald-600">Établissement</span>
              <span className="block truncate font-bold text-sm" title={facilityName}>{facilityName}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          {!isHome && (
            <Link
              to="/"
              className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-medium transition-colors bg-gray-50 px-4 py-2 rounded-full border border-gray-200"
            >
              <Home size={20} />
              <span className="hidden sm:inline">Accueil</span>
            </Link>
          )}
          {profile?.role === 'super_admin' && (
            <Link
              to="/admin/staff"
              className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-medium transition-colors bg-gray-50 px-4 py-2 rounded-full border border-gray-200"
              title="Gestion du personnel"
            >
              <Shield size={18} />
              <span className="hidden sm:inline">Personnel</span>
            </Link>
          )}
          {profile && (
            <button
              onClick={signOut}
              className="flex items-center gap-2 text-gray-500 hover:text-red-600 font-medium transition-colors bg-gray-50 px-4 py-2 rounded-full border border-gray-200"
              title="Se déconnecter"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
