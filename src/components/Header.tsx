import { Home, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const { profile, signOut } = useAuth();

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 py-4 shadow-sm">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src="/logo.svg"
            alt="Tamini"
            className="w-10 h-10 rounded-xl group-hover:scale-110 transition-transform shadow"
          />
          <span className="text-xl md:text-2xl font-bold tracking-tight text-gray-800 title-serif">
            Tamini
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
