import { Home, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const { profile, signOut } = useAuth();

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 py-3 shadow-sm">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 sm:gap-3 py-2 pr-2 group">
          <div className="flex items-center shrink-0 group-hover:scale-110 transition-transform">
            <img
              src="/logo-tameni.png"
              alt="Tameni"
              className="h-10 md:h-12 w-auto object-contain shrink-0"
            />
          </div>
          <span className="text-lg sm:text-xl md:text-2xl leading-none font-bold tracking-tight text-gray-800 title-serif whitespace-nowrap">
            Tameni
          </span>
        </Link>

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
