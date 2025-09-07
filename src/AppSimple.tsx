import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { JoinPage } from './pages/JoinPage';
import { InvitePage } from './pages/InvitePage';
import { RoomPage } from './pages/RoomPage';
import { FixturesPage } from './pages/FixturesPage';
import { TestPage } from './pages/TestPage';
import { useAuthSimple } from './hooks/useAuthSimple';

function LandingWrapper() {
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next');
  
  return <Landing nextUrl={next} />;
}

function AppSimple() {
  const { user, loading } = useAuthSimple();

  // Cache busting effect
  useEffect(() => {
    const APP_VERSION = '2.0.2-SIMPLE';
    console.log(`AppSimple component mounted - Cache busting v${APP_VERSION}`);
    
    // Clear localStorage of any cached data
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('cache') || key.includes('temp'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Force reload if we detect we're in a cached state
    const lastReload = localStorage.getItem('lastReload');
    const now = Date.now();
    if (!lastReload || (now - parseInt(lastReload)) > 300000) { // 5 minutes
      localStorage.setItem('lastReload', now.toString());
    }
  }, []);

  console.log('AppSimple render:', { user: !!user, loading });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#171717] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E5A0] mx-auto mb-4"></div>
          <p className="text-white">Loading OUTLASTED v2.0.2-SIMPLE...</p>
          <p className="text-white/60 text-sm mt-2">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingWrapper />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/?next=/dashboard" />} />
        <Route path="/join" element={user ? <JoinPage /> : <Navigate to="/?next=/join" />} />
        <Route path="/invite/:code" element={user ? <InvitePage /> : <Navigate to="/" />} />
        <Route path="/rooms/:id" element={user ? <RoomPage /> : <Navigate to="/?next=/rooms" />} />
        <Route path="/fixtures" element={user ? <FixturesPage /> : <Navigate to="/?next=/fixtures" />} />
        <Route path="/test" element={<TestPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default AppSimple;
