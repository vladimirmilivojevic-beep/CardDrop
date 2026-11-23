import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { LanguageProvider } from './i18n/LanguageContext';

// Clean up any stale dev service worker that could intercept APK downloads
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => {
      if (reg.active?.scriptURL?.includes('dev-sw.js')) {
        reg.unregister().catch(() => {});
      }
    });
  }).catch(() => {});
}

// Register Service Worker for offline support (skip in offline file:// APK WebView)
if (typeof window !== 'undefined' && window.location.protocol !== 'file:') {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('App update available');
    },
    onOfflineReady() {
      console.log('App ready to work offline');
    },
  });
}

createRoot(document.getElementById('root')!).render(
  <LanguageProvider>
    <App />
  </LanguageProvider>
);

