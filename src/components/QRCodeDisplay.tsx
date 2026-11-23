import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  Download,
  Share2,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Sparkles,
  Zap,
  Sliders,
  Eye,
  FileText
} from 'lucide-react';
import { Contact, QROptions } from '../types/contact';
import { generateVCardString, downloadVCF } from '../utils/vcard';
import { sounds } from '../utils/audio';
import { useLanguage } from '../i18n/LanguageContext';

interface QRCodeDisplayProps {
  contact: Contact;
  options: QROptions;
  onOptionsChange?: (options: QROptions) => void;
  onEditContact?: () => void;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  contact,
  options,
  onOptionsChange,
  onEditContact,
}) => {
  const { t } = useLanguage();
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [viewMode, setViewMode] = useState<'qr' | 'card'>('qr');
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate VCard payload string
  const vcardString = React.useMemo(() => {
    return generateVCardString(contact, options.compactMode);
  }, [contact, options.compactMode]);

  useEffect(() => {
    let isCancelled = false;
    setIsGenerating(true);

    QRCode.toDataURL(vcardString, {
      errorCorrectionLevel: options.errorCorrectionLevel,
      margin: 2,
      width: 600,
      color: {
        dark: options.colorDark || '#0f172a',
        light: options.colorLight || '#ffffff',
      },
    })
      .then((url) => {
        if (!isCancelled) {
          setDataUrl(url);
          setIsGenerating(false);
        }
      })
      .catch((err) => {
        console.error('Failed to generate QR code', err);
        setIsGenerating(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [vcardString, options.errorCorrectionLevel, options.colorDark, options.colorLight]);

  const handleCopyVCard = async () => {
    try {
      await navigator.clipboard.writeText(vcardString);
      setCopied(true);
      sounds.playSaveSuccess();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownloadQR = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    const safeName = (contact.formattedName || 'contact').toLowerCase().replace(/\s+/g, '_');
    a.download = `${safeName}_qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    sounds.playSaveSuccess();
  };

  const handleShare = async () => {
    const fn = contact.formattedName || t('digitalCard');
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${fn} - ${t('shareTitle')}`,
          text: `${t('shareTextPrefix')} ${fn} (${contact.title || ''} ${contact.organization ? t('shareTextAt') + ' ' + contact.organization : ''})`,
        });
      } catch {
        // Dismissed or unsupported
      }
    } else {
      handleCopyVCard();
    }
  };

  const colorThemes = [
    { label: 'Obsidian', dark: '#0f172a', light: '#ffffff' },
    { label: 'Deep Indigo', dark: '#312e81', light: '#ffffff' },
    { label: 'Cyber Violet', dark: '#4c1d95', light: '#ffffff' },
    { label: 'Emerald Tech', dark: '#064e3b', light: '#ffffff' },
    { label: 'Crimson', dark: '#881337', light: '#ffffff' },
  ];

  return (
    <div className="flex flex-col items-center w-full">
      {/* Mode Switcher: QR Code vs Visual Business Card */}
      <div className="w-full max-w-sm px-4 mb-3 flex items-center justify-between">
        <div className="inline-flex p-1 bg-slate-900 border border-slate-800 rounded-2xl shadow-inner">
          <button
            onClick={() => setViewMode('qr')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              viewMode === 'qr'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('qrCode')}
          </button>
          <button
            onClick={() => setViewMode('card')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              viewMode === 'card'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('digitalCard')}
          </button>
        </div>

        {/* Customization & Quick Tools */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowCustomize(!showCustomize)}
            className={`p-2 rounded-xl border transition ${
              showCustomize
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title={t('customizeQr')}
          >
            <Sliders className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFullscreen(true)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition"
            title={t('fullscreenPresentation')}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Customize Drawer / Popover */}
      {showCustomize && (
        <div className="w-full max-w-sm px-4 mb-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-3 text-xs backdrop-blur-md shadow-xl animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" /> {t('qrStyling')}
              </span>
              <button
                onClick={() => setShowCustomize(false)}
                className="text-slate-500 hover:text-slate-300 text-[11px]"
              >
                {t('close')}
              </button>
            </div>

            {/* Color Palette */}
            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1.5">
                {t('qrAccentColor')}
              </label>
              <div className="flex items-center gap-2">
                {colorThemes.map((theme) => (
                  <button
                    key={theme.label}
                    onClick={() =>
                      onOptionsChange?.({
                        ...options,
                        colorDark: theme.dark,
                        colorLight: theme.light,
                      })
                    }
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      options.colorDark === theme.dark
                        ? 'border-indigo-400 scale-110 shadow-md ring-2 ring-indigo-500/30'
                        : 'border-slate-700 hover:scale-105'
                    }`}
                    style={{ backgroundColor: theme.dark }}
                    title={theme.label}
                  />
                ))}
              </div>
            </div>

            {/* Density switch: Compact vs Full */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <div className="font-medium text-slate-200 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t('highSpeedScanMode')}</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  {t('highSpeedScanDesc')}
                </div>
              </div>
              <button
                onClick={() =>
                  onOptionsChange?.({
                    ...options,
                    compactMode: !options.compactMode,
                  })
                }
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  options.compactMode ? 'bg-indigo-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    options.compactMode ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Error correction level */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">{t('errorCorrection')}</span>
              <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                {(['L', 'M', 'Q', 'H'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() =>
                      onOptionsChange?.({
                        ...options,
                        errorCorrectionLevel: level,
                      })
                    }
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                      options.errorCorrectionLevel === level
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Display: QR or Digital NFC Card */}
      <div className="w-full max-w-sm px-4">
        {viewMode === 'qr' ? (
          <div className="relative group bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80 rounded-3xl p-6 shadow-2xl flex flex-col items-center">
            {/* Ambient subtle glow around QR code */}
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-sky-500/20 to-purple-500/20 rounded-3xl blur-xl opacity-50 group-hover:opacity-80 transition duration-500"></div>

            {/* QR Card Container */}
            <div className="relative bg-white rounded-2xl p-4 shadow-xl border border-slate-100 flex flex-col items-center">
              {dataUrl ? (
                <div className="relative">
                  <img
                    src={dataUrl}
                    alt={`${contact.formattedName} QR Code`}
                    className="w-56 h-56 sm:w-60 sm:h-60 object-contain rounded-lg"
                  />
                  {/* Subtle Center Brand Dot / Icon badge */}
                  {options.showLogoBadge && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-md p-1 border border-slate-200 flex items-center justify-center">
                        <div className="w-full h-full rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                          {contact.firstName ? contact.firstName[0].toUpperCase() : 'V'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                  <span className="text-xs">{t('generatingQr')}</span>
                </div>
              )}

              {/* Ready to Scan indicator badge */}
              <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{t('scanAnyCamera')}</span>
              </div>
            </div>

            {/* Contact Name & Title under QR */}
            <div className="mt-4 text-center">
              <h2 className="text-lg font-bold text-white tracking-tight">
                {contact.formattedName || t('yourName')}
              </h2>
              {(contact.title || contact.organization) && (
                <p className="text-xs text-indigo-300 font-medium mt-0.5">
                  {[contact.title, contact.organization].filter(Boolean).join(' • ')}
                </p>
              )}
            </div>
          </div>
        ) : (
          /* Visual Digital Business Card View */
          <div className="relative group overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl text-white min-h-[300px] flex flex-col justify-between">
            {/* Background design pattern */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-sky-500/10 blur-2xl pointer-events-none" />

            {/* Top row: Chip & Logo */}
            <div className="flex items-center justify-between relative z-10">
              <div className="w-10 h-7 rounded-md bg-gradient-to-r from-amber-300 to-amber-500 p-1 flex items-center justify-center shadow">
                <div className="w-full h-full border border-amber-700/60 rounded-sm"></div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-semibold tracking-wider uppercase text-indigo-200">
                <Sparkles className="w-3 h-3 text-amber-300" />
                VCard 3.0
              </div>
            </div>

            {/* Center: Details */}
            <div className="my-6 relative z-10 space-y-1">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {contact.formattedName}
              </h2>
              {contact.title && (
                <p className="text-xs text-indigo-300 font-medium">
                  {contact.title}
                </p>
              )}
              {contact.organization && (
                <p className="text-xs text-slate-300">
                  {contact.organization}
                </p>
              )}

              {/* Quick icons */}
              <div className="pt-3 flex flex-wrap gap-2 text-xs text-slate-200">
                {contact.phones[0] && (
                  <div className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 flex items-center gap-1.5">
                    <span>📱</span>
                    <span>{contact.phones[0].number}</span>
                  </div>
                )}
                {contact.emails[0] && (
                  <div className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 flex items-center gap-1.5">
                    <span>✉️</span>
                    <span>{contact.emails[0].email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Row */}
            <div className="flex items-center justify-between relative z-10 text-[11px] text-indigo-200/80 border-t border-white/10 pt-3">
              <span>{t('digitalPass')}</span>
              <button
                onClick={() => setViewMode('qr')}
                className="flex items-center gap-1 font-semibold text-white hover:text-indigo-200 transition"
              >
                <span>{t('flipToQr')}</span>
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons: Download QR, Export VCF, Share, Copy VCF */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          <button
            onClick={handleDownloadQR}
            className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-2xl text-slate-200 transition active:scale-95 shadow-sm"
            title={t('saveQr')}
          >
            <Download className="w-4 h-4 text-indigo-400" />
            <span className="text-[10px] font-medium">{t('saveQr')}</span>
          </button>

          <button
            onClick={() => {
              downloadVCF(vcardString, `${contact.formattedName || 'contact'}`);
              sounds.playSaveSuccess();
            }}
            className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-2xl text-slate-200 transition active:scale-95 shadow-sm"
            title={t('exportVcf')}
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-medium">{t('exportVcf')}</span>
          </button>

          <button
            onClick={handleCopyVCard}
            className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-2xl text-slate-200 transition active:scale-95 shadow-sm"
            title={t('copy')}
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4 text-sky-400" />
            )}
            <span className="text-[10px] font-medium">{copied ? t('copied') : t('copy')}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-white transition active:scale-95 shadow-md shadow-indigo-600/30"
            title={t('share')}
          >
            <Share2 className="w-4 h-4" />
            <span className="text-[10px] font-medium">{t('share')}</span>
          </button>
        </div>
      </div>

      {/* Fullscreen High-Brightness Presentation Mode */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-white text-slate-950 flex flex-col items-center justify-between p-6 animate-in fade-in">
          {/* Top Bar */}
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-semibold text-sm tracking-wide text-slate-700">
                {t('maxBrightnessMode')}
              </span>
            </div>
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>

          {/* Large Center QR Code */}
          <div className="flex flex-col items-center my-auto">
            <div className="p-4 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-2 border-slate-200">
              <img
                src={dataUrl}
                alt="Presentation QR"
                className="w-72 h-72 sm:w-80 sm:h-80 object-contain"
              />
            </div>
            <div className="mt-5 text-center">
              <h2 className="text-2xl font-bold text-slate-900">
                {contact.formattedName}
              </h2>
              <p className="text-sm font-medium text-slate-500 mt-1">
                {[contact.title, contact.organization].filter(Boolean).join(' • ')}
              </p>
              <p className="text-xs text-indigo-600 font-semibold mt-2">
                {t('pointAnyCamera')}
              </p>
            </div>
          </div>

          {/* Bottom helper */}
          <button
            onClick={() => setIsFullscreen(false)}
            className="w-full max-w-xs py-3 rounded-2xl bg-slate-900 text-white font-semibold text-sm shadow hover:bg-slate-800 transition"
          >
            {t('exitPresentation')}
          </button>
        </div>
      )}
    </div>
  );
};
