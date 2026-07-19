import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

window.addEventListener('error', (e) => {
  if (e.message === 'ResizeObserver loop limit exceeded' || e.message === 'ResizeObserver loop completed with undelivered notifications.') {
    e.stopImmediatePropagation();
  }
});

const _logError = console.error;
console.error = function(...args) {
  if (args[0] && typeof args[0] === 'string' && (args[0].includes('ResizeObserver loop') || args[0].includes('ResizeObserver'))) {
    return;
  }
  _logError.apply(console, args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
