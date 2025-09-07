import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function TestPage() {
  const navigate = useNavigate();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clear all caches
    try {
      localStorage.clear();
      sessionStorage.clear();
      
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name);
          });
        });
      }
    } catch (error) {
      console.error('Error clearing caches:', error);
    }

    // Gather debug info
    const info = {
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      localStorage: Object.keys(localStorage).length,
      sessionStorage: Object.keys(sessionStorage).length,
      cookies: document.cookie.length,
      online: navigator.onLine,
      language: navigator.language,
      platform: navigator.platform
    };

    setDebugInfo(info);
    setLoading(false);
  }, []);

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  const goToRoom = () => {
    // Try to get room ID from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('roomId');
    if (roomId) {
      navigate(`/rooms/${roomId}`);
    } else {
      navigate('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E5A0] mx-auto mb-4"></div>
          <p className="text-white">Clearing caches and loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#00E5A0] mb-4">OUTLASTED</h1>
          <h2 className="text-2xl font-semibold mb-2">Cache Bypass Test Page</h2>
          <p className="text-[#737373]">This page bypasses all caching issues</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#171717] rounded-xl p-6 border border-[#404040]">
            <h3 className="text-lg font-semibold mb-4 text-[#00E5A0]">✅ Status</h3>
            <p className="text-green-400 mb-2">Page loaded successfully!</p>
            <p className="text-[#D4D4D4] text-sm">All caches have been cleared</p>
          </div>

          <div className="bg-[#171717] rounded-xl p-6 border border-[#404040]">
            <h3 className="text-lg font-semibold mb-4 text-[#00E5A0]">🚀 Actions</h3>
            <div className="space-y-3">
              <button
                onClick={goToDashboard}
                className="w-full bg-[#00E5A0] text-black py-2 px-4 rounded hover:bg-[#00d490] font-semibold"
              >
                Go to Dashboard
              </button>
              <button
                onClick={goToRoom}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 font-semibold"
              >
                Go to Room (if roomId in URL)
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 font-semibold"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>

        {debugInfo && (
          <div className="bg-[#171717] rounded-xl p-6 border border-[#404040]">
            <h3 className="text-lg font-semibold mb-4 text-[#00E5A0]">🔍 Debug Information</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>URL:</strong> {debugInfo.url}</p>
                <p><strong>Timestamp:</strong> {debugInfo.timestamp}</p>
                <p><strong>Online:</strong> {debugInfo.online ? 'Yes' : 'No'}</p>
                <p><strong>Language:</strong> {debugInfo.language}</p>
              </div>
              <div>
                <p><strong>Platform:</strong> {debugInfo.platform}</p>
                <p><strong>LocalStorage:</strong> {debugInfo.localStorage} items</p>
                <p><strong>SessionStorage:</strong> {debugInfo.sessionStorage} items</p>
                <p><strong>Cookies:</strong> {debugInfo.cookies} characters</p>
              </div>
            </div>
            <details className="mt-4">
              <summary className="cursor-pointer text-[#00E5A0]">Show User Agent</summary>
              <pre className="mt-2 p-3 bg-[#0A0A0A] rounded text-xs overflow-auto">
                {debugInfo.userAgent}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
