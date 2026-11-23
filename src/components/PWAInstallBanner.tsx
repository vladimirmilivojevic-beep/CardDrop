import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2, MoreVertical, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstallDirect: () => void;
  isInstallable: boolean;
}

export const InstallGuideModal: React.FC<InstallGuideModalProps> = ({
  isOpen,
  onClose,
  onInstallDirect,
  isInstallable,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Install CardDrop</h3>
            <p className="text-xs text-slate-400">Install as native Android app</p>
          </div>
        </div>

        {isInstallable && (
          <button
            onClick={() => {
              onInstallDirect();
              onClose();
            }}
            className="w-full mb-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Click to Trigger Install Prompt</span>
          </button>
        )}

        <div className="space-y-3 text-xs text-slate-300">
          <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700/60 space-y-2">
            <div className="font-semibold text-indigo-400 flex items-center gap-1.5">
              <MoreVertical className="w-4 h-4 text-indigo-300" />
              <span>Pixel 8 / Chrome Instructions:</span>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-slate-300 text-xs">
              <li>
                Look at the <strong>very top right of Chrome</strong> (next to the address bar/tabs)
              </li>
              <li>
                Tap the <strong>⋮</strong> (three vertical dots menu icon)
              </li>
              <li>
                Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>
              </li>
              <li>
                Confirm by tapping <strong>"Add" / "Install"</strong>
              </li>
            </ol>
            <div className="text-[10px] text-amber-300/90 pt-1 border-t border-slate-700/50">
              💡 <strong>Tip</strong>: If Chrome says "This app cannot be installed", tap <strong>"Add to Home screen"</strong> in Chrome's menu instead. This creates the app icon on your home screen and runs in full-screen standalone mode.
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-emerald-400 pt-1">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Once added, it opens edge-to-edge without browser bars!</span>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <a
              href="/CardDrop.apk"
              download="CardDrop.apk"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow transition"
            >
              <Download className="w-4 h-4" />
              <span>Download CardDrop.apk directly</span>
            </a>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
        >
          Got it
        </button>
      </div>
    </div>
  );
};

export const PWAInstallHeaderButton: React.FC = () => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  // If already installed as standalone PWA
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold transition active:scale-95 shadow-sm"
        title="Install Android App"
      >
        <Download className="w-3.5 h-3.5 text-indigo-400" />
        <span>Install App</span>
      </button>

      <InstallGuideModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onInstallDirect={install}
        isInstallable={isInstallable}
      />
    </>
  );
};

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || dismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const res = await install();
      if (!res) setShowModal(true);
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <div className="mx-4 mt-2.5 mb-1 flex items-center justify-between gap-3 bg-gradient-to-r from-indigo-950/90 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-2.5 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Smartphone className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-white truncate">Install on Pixel 8</div>
            <div className="text-[10px] text-slate-400 truncate">Tap here or Chrome's ⋮ menu</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-slate-400 hover:text-slate-200"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <InstallGuideModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onInstallDirect={install}
        isInstallable={isInstallable}
      />
    </>
  );
};
