import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

// Load Puter.js if available
const loadPuter = () => {
  const script = document.createElement('script');
  script.src = 'https://js.puter.com/v2/';
  script.async = true;
  script.defer = true;
  script.onload = () => {
    try {
      (window as any).puter.quiet = true;
    } catch {}
    console.log('Puter.js loaded. AI generation available.');
  };
  script.onerror = () => {
    console.warn('Puter.js failed to load. Using fallback character generation.');
  };
  document.head.appendChild(script);
};

loadPuter();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);