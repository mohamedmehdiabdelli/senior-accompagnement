/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Home from './pages/Home';
import Besoins from './pages/Besoins';
import Psychique from './pages/Psychique';
import Telemedicine from './pages/Telemedicine';
import Rappels from './pages/Rappels';
import Alerte from './pages/Alerte';
import Loisirs from './pages/Loisirs';
import Caregiver from './pages/Caregiver';
import Wardrobe from './pages/Wardrobe';
import AddClothing from './pages/AddClothing';
import StaffManagement from './pages/StaffManagement';
import Landing from './pages/Landing';
import Header from './components/Header';
import AuthModal from './components/AuthModal';
import { motion, AnimatePresence } from 'motion/react';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { AuthProvider, useAuth } from './context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <Router>
          <AppShell />
        </Router>
      </SubscriptionProvider>
    </AuthProvider>
  );
}

function AppShell() {
  const { profile, loading } = useAuth();
  const [authModal, setAuthModal] = useState<{ open: boolean; mode: 'signin' | 'signup' }>({
    open: false,
    mode: 'signin'
  });

  // Initial app boot — show a soft splash while we check the session
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-20 flex items-center justify-center animate-pulse">
            <img src="/tamini-logo.png" alt="Tamini" className="h-16 w-auto object-contain" />
          </div>
          <span className="text-white/70 text-sm font-medium tracking-wide">Tameni</span>
        </div>
      </div>
    );
  }

  // Not signed in → Netflix-style landing page
  if (!profile) {
    return (
      <>
        <Landing
          onSignIn={() => setAuthModal({ open: true, mode: 'signin' })}
          onSignUp={() => setAuthModal({ open: true, mode: 'signup' })}
        />
        <AuthModal
          isOpen={authModal.open}
          initialMode={authModal.mode}
          onClose={() => setAuthModal({ ...authModal, open: false })}
        />
      </>
    );
  }

  // Signed in → full app with role-aware routing
  const isFacilityStaff = ['super_admin', 'admin', 'caregiver'].includes(profile.role);

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans text-gray-900 overflow-x-hidden">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />

            {/* Elderly-only routes */}
            <Route
              path="/besoins"
              element={profile?.role === 'family' ? <PageWrapper><Besoins /></PageWrapper> : <Navigate to="/" replace />}
            />
            <Route
              path="/psychique"
              element={profile?.role === 'family' ? <PageWrapper><Psychique /></PageWrapper> : <Navigate to="/" replace />}
            />
            <Route
              path="/telemedicine"
              element={profile?.role === 'family' ? <PageWrapper><Telemedicine /></PageWrapper> : <Navigate to="/" replace />}
            />
            <Route
              path="/rappels"
              element={profile?.role === 'family' ? <PageWrapper><Rappels /></PageWrapper> : <Navigate to="/" replace />}
            />
            <Route
              path="/alerte"
              element={profile?.role === 'family' ? <PageWrapper><Alerte /></PageWrapper> : <Navigate to="/" replace />}
            />
            <Route
              path="/loisirs"
              element={profile?.role === 'family' ? <PageWrapper><Loisirs /></PageWrapper> : <Navigate to="/" replace />}
            />

            {/* Nursing-home-only route */}
            <Route
              path="/caregiver"
              element={!isFacilityStaff ? <Navigate to="/" replace /> : <PageWrapper><Caregiver /></PageWrapper>}
            />
            <Route
              path="/vetements"
              element={!isFacilityStaff ? <Navigate to="/" replace /> : <PageWrapper><Wardrobe /></PageWrapper>}
            />
            <Route
              path="/vetements/ajouter"
              element={!isFacilityStaff ? <Navigate to="/" replace /> : <PageWrapper><AddClothing /></PageWrapper>}
            />
            <Route
              path="/admin/staff"
              element={profile.role !== 'super_admin' ? <Navigate to="/" replace /> : <PageWrapper><StaffManagement /></PageWrapper>}
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
