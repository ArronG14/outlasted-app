import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { JoinPage } from './pages/JoinPage';
import { InvitePage } from './pages/InvitePage';
import { RoomPage } from './pages/RoomPage';
import { useAuth } from './hooks/useAuth';

function LandingWrapper() {
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next');
  
  return <Landing nextUrl={next} />;
}

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#171717] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E5A0]"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={user ? <Navigate to="/dashboard" replace /> : <LandingWrapper />} 
        />
        <Route 
          path="/dashboard" 
          element={user ? <Dashboard /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/join" 
          element={user ? <JoinPage /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/invite/:code" 
          element={<InvitePage />} 
        />
        <Route 
          path="/rooms/:id" 
          element={user ? <RoomPage /> : <Navigate to="/" replace />} 
        />
      </Routes>
    </Router>
  );
}

export default App;