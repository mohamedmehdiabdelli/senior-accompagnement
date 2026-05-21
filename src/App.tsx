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
          <img src="/logo.svg" alt="Tamini" className="w-20 h-20 rounded-3xl shadow-2xl animate-pulse" />
          <span className="text-white/70 text-sm font-medium tracking-wide">Tamini</span>
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
  const isNursingHome = profile.role === 'nursing_home';

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
              element={isNursingHome ? <Navigate to="/" replace /> : <PageWrapper><Besoins /></PageWrapper>}
            />
            <Route
              path="/psychique"
              element={isNursingHome ? <Navigate to="/" replace /> : <PageWrapper><Psychique /></PageWrapper>}
            />
            <Route
              path="/telemedicine"
              element={isNursingHome ? <Navigate to="/" replace /> : <PageWrapper><Telemedicine /></PageWrapper>}
            />
            <Route
              path="/rappels"
              element={isNursingHome ? <Navigate to="/" replace /> : <PageWrapper><Rappels /></PageWrapper>}
            />
            <Route
              path="/alerte"
              element={isNursingHome ? <Navigate to="/" replace /> : <PageWrapper><Alerte /></PageWrapper>}
            />
            <Route
              path="/loisirs"
              element={isNursingHome ? <Navigate to="/" replace /> : <PageWrapper><Loisirs /></PageWrapper>}
            />

            {/* Nursing-home-only route */}
            <Route
              path="/caregiver"
              element={!isNursingHome ? <Navigate to="/" replace /> : <PageWrapper><Caregiver /></PageWrapper>}
            />
            <Route
              path="/vetements"
              element={!isNursingHome ? <Navigate to="/" replace /> : <PageWrapper><Wardrobe /></PageWrapper>}
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
