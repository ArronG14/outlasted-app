import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Cache busting - log version info
const APP_VERSION = '2.0.1';
console.log(`OUTLASTED App v${APP_VERSION} - Cache Busting Enabled`);
console.log('Build timestamp:', new Date().toISOString());

// Set up proper error handling
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Clear any cached data
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => {
      caches.delete(name);
    });
  });
}

// Store version in window for debugging
(window as any).OUTLASTED_VERSION = APP_VERSION;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);