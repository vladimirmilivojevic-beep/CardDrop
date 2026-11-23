import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  Wifi,
  BatteryMedium,
  Signal,
  Smartphone,
  Monitor,
  QrCode,
  Copy,
  Check,
  X,
  ExternalLink,
  Sparkles,
  Download,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface AndroidFrameProps {
  children: React.ReactNode;
  isFrameEnabled: boolean;
  onToggleFrame: () => void;
}

const DEV_APP_URL = 'https://ais-dev-73pd657nvusyqt3x2436fk-456344398853.europe-west2.run.app';

function getLiveUrl() {
  if (typeof window !== 'undefined' && window.location.origin && window.location.origin.startsWith('http')) {
    return window.location.origin;
  }
  return DEV_APP_URL;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  isFrameEnabled,
  onToggleFrame,
}) => {
  const { t } = useLanguage();
  const APP_URL = getLiveUrl();
  const [time, setTime] = useState('9:41');
  const [isRealMobile, setIsRealMobile] = useState(false);
  const [showPhoneTestModal, setShowPhoneTestModal] = useState(false);
  const [appQrDataUrl, setAppQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Detect if actually running on a physical mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isMobileWidth = window.innerWidth <= 640;
      const isTouch =
        typeof window !== 'undefined' &&
        ('ontouchstart' in window || navigator.maxTouchPoints > 0);
      setIsRealMobile(isMobileWidth || (isTouch && window.innerWidth <= 800));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [activeModalTab, setActiveModalTab] = useState<'apk' | 'web'>('apk');
  const [apkQrDataUrl, setApkQrDataUrl] = useState<string>('');
  const [apkSizeLabel, setApkSizeLabel] = useState<string>('');
  const [isDownloadingApk, setIsDownloadingApk] = useState(false);
  const [apkError, setApkError] = useState<string | null>(null);

  const apkUrl = `${APP_URL}/CardDrop.apk?v=1.2.1`;

  // Fetch actual APK size on mount so the UI shows the real binary size
  useEffect(() => {
    fetch(`/CardDrop.apk?v=1.2.1&t=${Date.now()}`, { method: 'HEAD', cache: 'no-store' })
      .then((res) => {
        const len = Number(res.headers.get('content-length') || 0);
        const ct = res.headers.get('content-type') || '';
        if (res.ok && len > 100_000 && !ct.includes('text/html')) {
          if (len >= 1024 * 1024) {
            setApkSizeLabel(`${(len / (1024 * 1024)).toFixed(2)} MB`);
          } else {
            setApkSizeLabel(`${Math.round(len / 1024)} KB`);
          }
        }
      })
      .catch(() => {
        // Ignore size probe failure
      });
  }, []);

  // Generate QR for the app URL and APK download URL
  useEffect(() => {
    QRCode.toDataURL(APP_URL, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setAppQrDataUrl(url))
      .catch((err) => console.error(err));

    QRCode.toDataURL(apkUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setApkQrDataUrl(url))
      .catch((err) => console.error(err));
  }, [APP_URL, apkUrl]);

  // Verified binary APK download (prevents SW/HTML interception from silently saving a tiny HTML file)
  const handleDownloadApk = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isDownloadingApk) return;
    setIsDownloadingApk(true);
    setApkError(null);

    try {
      const res = await fetch(`/CardDrop.apk?v=1.2.1&t=${Date.now()}`, {
        cache: 'no-store',
        credentials: 'same-origin',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const buf = await res.arrayBuffer();
      const bytes = new Uint8Array(buf);
      // Every valid Android APK is a ZIP archive starting with PK\x03\x04 and > 100 KB
      const isZipApk =
        bytes.length > 100_000 &&
        bytes[0] === 0x50 &&
        bytes[1] === 0x4b &&
        bytes[2] === 0x03 &&
        bytes[3] === 0x04;

      if (!isZipApk) {
        setApkError(t('apkInvalidError'));
        return;
      }

      const blob = new Blob([buf], { type: 'application/vnd.android.package-archive' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'CardDrop.apk';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch {
      setApkError(t('apkInvalidError'));
    } finally {
      setIsDownloadingApk(false);
    }
  };

  const handleCopyLink = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  // If on a physical phone, render native edge-to-edge view with zero fake frame
  if (isRealMobile) {
    return (
      <div className="h-[100dvh] w-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
        {children}
      </div>
    );
  }

  // If frame is disabled on desktop
  if (!isFrameEnabled) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        {/* Top bar on desktop */}
        <div className="flex items-center justify-between px-6 py-2 bg-slate-900/80 border-b border-slate-800 text-xs text-slate-300">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="font-semibold text-white">CardDrop</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">{t('fullWidthDesktopMode')}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPhoneTestModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>{t('scanToTestPixel')}</span>
            </button>
            <button
              onClick={onToggleFrame}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            >
              <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
              <span>{t('pixelFrame')}</span>
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col">{children}</div>

        {/* Modal for phone test */}
        {showPhoneTestModal && renderPhoneModal()}
      </div>
    );
  }

  function renderPhoneModal() {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
        <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 relative">
          <button
            onClick={() => setShowPhoneTestModal(false)}
            className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">{t('testOnPixel')}</h3>
              <p className="text-xs text-slate-400">{t('scanWithCameraOrUrl')}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-800/80 rounded-2xl mb-4 border border-slate-700/60">
            <button
              onClick={() => setActiveModalTab('apk')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition ${
                activeModalTab === 'apk'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('directApkDownload')}
            </button>
            <button
              onClick={() => setActiveModalTab('web')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition ${
                activeModalTab === 'web'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('webAppUrl')}
            </button>
          </div>

          {activeModalTab === 'apk' ? (
            <div>
              {/* QR Code to Download APK */}
              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-inner border border-slate-200 mb-4">
                {apkQrDataUrl ? (
                  <img
                    src={apkQrDataUrl}
                    alt="Scan to download CardDrop.apk"
                    className="w-44 h-44 object-contain"
                  />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center text-slate-400 text-xs">
                    {t('generatingQr')}
                  </div>
                )}
                <span className="text-[11px] font-semibold text-slate-800 mt-2 bg-indigo-50 text-indigo-700 px-3 py-0.5 rounded-full border border-indigo-200">
                  {t('scanToDownloadApk')}
                </span>
              </div>

              {/* Direct Verified Download Button */}
              <button
                type="button"
                onClick={handleDownloadApk}
                disabled={isDownloadingApk}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition active:scale-95 mb-3 cursor-pointer"
              >
                {isDownloadingApk ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>
                  {isDownloadingApk
                    ? t('downloadingApk')
                    : apkSizeLabel
                    ? `${t('downloadApkBtn')} (${apkSizeLabel})`
                    : t('downloadApkBtn')}
                </span>
              </button>

              {apkError && (
                <div className="mb-3 p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-[11px] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{apkError}</span>
                </div>
              )}

              {/* Pixel 8 APK Install Guide */}
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50 space-y-1.5 text-slate-300 text-[11px]">
                <div className="font-semibold text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> {t('howToInstallApk')}
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-300">
                  <li>{t('apkStep1')}</li>
                  <li>{t('apkStep2')}</li>
                  <li>{t('apkStep3')}</li>
                  <li>{t('apkStep4')}</li>
                </ol>
              </div>
            </div>
          ) : (
            <div>
              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-inner border border-slate-200 mb-4">
                {appQrDataUrl ? (
                  <img
                    src={appQrDataUrl}
                    alt="Scan to open on phone"
                    className="w-44 h-44 object-contain"
                  />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center text-slate-400 text-xs">
                    {t('generatingQr')}
                  </div>
                )}
                <span className="text-[11px] font-semibold text-slate-800 mt-2 bg-slate-100 px-3 py-0.5 rounded-full">
                  {t('openCameraPointQr')}
                </span>
              </div>

              {/* Copyable link */}
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 rounded-xl p-2 px-3">
                  <span className="text-slate-300 font-mono text-[11px] truncate flex-1">
                    {APP_URL}
                  </span>
                  <button
                    onClick={() => handleCopyLink(APP_URL)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] flex items-center gap-1 shrink-0 transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? t('copied') : t('copy')}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowPhoneTestModal(false)}
            className="mt-4 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            {t('close')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center p-0 sm:p-4 md:p-6 overflow-x-hidden">
      {/* Top control bar outside phone frame */}
      <div className="hidden sm:flex items-center justify-between w-full max-w-[430px] mb-2 px-2 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowPhoneTestModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition active:scale-95"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>{t('testOnPixel')}</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadApk}
            disabled={isDownloadingApk}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-semibold text-xs transition cursor-pointer disabled:opacity-60"
            title={t('directApkDownload')}
          >
            {isDownloadingApk ? (
              <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>{apkSizeLabel ? `APK (${apkSizeLabel})` : 'APK'}</span>
          </button>
        </div>

        <button
          onClick={onToggleFrame}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition shadow-sm text-xs"
        >
          <Monitor className="w-3.5 h-3.5 text-indigo-400" />
          <span>{t('fullWidth')}</span>
        </button>
      </div>

      {/* The Android Device Body */}
      <div className="w-full max-w-[430px] h-[100dvh] sm:h-[890px] bg-slate-950 sm:rounded-[46px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_0_12px_#1e293b,0_0_0_14px_#334155] border-0 sm:border-4 border-slate-900 flex flex-col relative overflow-hidden ring-1 ring-white/10">
        {/* Android Top Bezel / Status Bar (Only on desktop frame) */}
        <div className="h-11 w-full bg-slate-950/95 backdrop-blur-md flex items-center justify-between px-6 pt-1 select-none z-30 shrink-0 border-b border-slate-900/60">
          {/* Status Time */}
          <span className="text-[13px] font-semibold tracking-tight text-slate-200">
            {time}
          </span>

          {/* Android Camera Punch Hole */}
          <div className="w-3.5 h-3.5 rounded-full bg-black ring-2 ring-slate-800/80 shadow-inner flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-950/80"></div>
          </div>

          {/* Status Icons */}
          <div className="flex items-center gap-1.5 text-slate-300">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] font-mono text-slate-400">98%</span>
              <BatteryMedium className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Screen Content */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {children}
        </div>

        {/* Android Gesture Navigation Bar Pill */}
        <div className="h-5 w-full bg-slate-950 flex items-center justify-center shrink-0 z-30">
          <div className="w-32 h-1 bg-slate-600 rounded-full"></div>
        </div>
      </div>

      {/* Modal for phone test */}
      {showPhoneTestModal && renderPhoneModal()}
    </div>
  );
};
