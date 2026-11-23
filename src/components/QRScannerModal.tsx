import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeCameraScanConfig } from 'html5-qrcode';
import confetti from 'canvas-confetti';
import {
  Camera,
  Flashlight,
  FlashlightOff,
  FlipHorizontal,
  Upload,
  X,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  Globe,
  Check,
  AlertCircle,
  FileCheck,
  ExternalLink,
  MessageSquare,
  QrCode,
  CreditCard
} from 'lucide-react';
import { Contact } from '../types/contact';
import { parseVCards, downloadVCF } from '../utils/vcard';
import { sounds } from '../utils/audio';
import { PhysicalCardScanner } from './PhysicalCardScanner';
import { useLanguage } from '../i18n/LanguageContext';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveContact: (contact: Contact) => void;
  existingContacts: Contact[];
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onSaveContact,
  existingContacts,
}) => {
  const { t } = useLanguage();
  const [scanMode, setScanMode] = useState<'qr' | 'ocr'>('qr');
  const [scannerId] = useState(() => 'qr-reader-' + Math.random().toString(36).substring(2, 7));
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [fileScanError, setFileScanError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Scanned card result state
  const [scannedResult, setScannedResult] = useState<{
    rawText: string;
    contact: Contact | null;
  } | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const handleSwitchMode = async (newMode: 'qr' | 'ocr') => {
    if (newMode === scanMode) return;
    sounds.playTap();
    if (scannerRef.current) {
      if (scannerRef.current.isScanning) {
        try {
          await scannerRef.current.stop();
        } catch {}
      }
      try {
        scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
    setScanMode(newMode);
  };

  // Start QR Scanner (only when in QR mode)
  useEffect(() => {
    if (!isOpen || scanMode !== 'qr') {
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(() => {}).finally(() => {
            scannerRef.current?.clear();
            scannerRef.current = null;
          });
        } else {
          scannerRef.current.clear();
          scannerRef.current = null;
        }
      }
      return;
    }

    let isMounted = true;
    setCameraError(null);
    setScannedResult(null);
    setIsSaved(false);

    const initScanner = async () => {
      try {
        const scanner = new Html5Qrcode(scannerId);
        scannerRef.current = scanner;

        const config: Html5QrcodeCameraScanConfig = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        await scanner.start(
          { facingMode },
          config,
          (decodedText) => {
            if (!isMounted) return;
            handleScanSuccess(decodedText);
          },
          () => {
            // Ignore scan frame error
          }
        );

        if (isMounted) {
          setIsScanning(true);
          try {
            const capabilities = scanner.getRunningTrackCapabilities();
            if ('torch' in capabilities) {
              setHasTorch(true);
            }
          } catch {
            // Torch unsupported
          }
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : String(err);
        console.error('Camera start error:', msg);
        if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
          setCameraError(t('qrCamDenied'));
        } else if (msg.includes('NotFoundError')) {
          setCameraError(t('qrCamNotFound'));
        } else {
          setCameraError(t('qrCamError'));
        }
      }
    };

    const timer = setTimeout(initScanner, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(() => {}).finally(() => {
            scannerRef.current?.clear();
            scannerRef.current = null;
          });
        } else {
          scannerRef.current.clear();
          scannerRef.current = null;
        }
      }
    };
  }, [isOpen, scanMode, facingMode, scannerId]);

  const handleScanSuccess = (decodedText: string) => {
    sounds.playScanSuccess();
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.pause(true);
    }

    // Parse as VCard
    const parsed = parseVCards(decodedText);
    let contact: Contact | null = null;
    if (parsed.length > 0) {
      contact = {
        ...parsed[0],
        source: 'scanned',
      };
    } else {
      const isUrl = /^https?:\/\//i.test(decodedText.trim());
      contact = {
        id: 'contact_' + Math.random().toString(36).substring(2, 9),
        firstName: isUrl ? t('webLink') : t('scannedQrLabel'),
        lastName: '',
        formattedName: isUrl ? t('scannedLink') : t('scannedCode'),
        phones: [],
        emails: [],
        addresses: [],
        urls: isUrl ? [decodedText.trim()] : [],
        note: decodedText,
        source: 'scanned',
        rawVcard: decodedText,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }

    setScannedResult({ rawText: decodedText, contact });
    setIsSaved(false);
  };

  const handleFlipCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      await scannerRef.current.stop();
    }
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleToggleTorch = async () => {
    if (!scannerRef.current) return;
    try {
      const nextTorch = !torchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch } as MediaTrackConstraintSet],
      });
      setTorchOn(nextTorch);
    } catch (e) {
      console.warn('Torch failed:', e);
    }
  };

  // Handle Image File Scan fallback
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileScanError(null);

    try {
      const html5QrCode = new Html5Qrcode('file-qr-temp');
      const result = await html5QrCode.scanFile(file, true);
      html5QrCode.clear();
      handleScanSuccess(result);
    } catch {
      setFileScanError(t('qrNotFoundAlert'));
    } finally {
      e.target.value = '';
    }
  };

  const handleSaveScannedContact = () => {
    if (!scannedResult?.contact) return;
    onSaveContact(scannedResult.contact);
    setIsSaved(true);
    sounds.playSaveSuccess();

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#4f46e5', '#38bdf8', '#10b981', '#f59e0b'],
    });
  };

  const handleScanAnother = () => {
    setScannedResult(null);
    setIsSaved(false);
    if (scannerRef.current) {
      scannerRef.current.resume();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between animate-in fade-in">
      {/* Hidden container for file scan */}
      <div id="file-qr-temp" className="hidden" />

      {/* Top Controls Bar with Mode Switcher */}
      <div className="flex items-center justify-between p-3.5 z-20 bg-gradient-to-b from-black/90 to-transparent">
        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-inner">
          <button
            onClick={() => handleSwitchMode('qr')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              scanMode === 'qr'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>{t('modeQr')}</span>
          </button>
          <button
            onClick={() => handleSwitchMode('ocr')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              scanMode === 'ocr'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>{t('modeOcr')}</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {scanMode === 'qr' && (
            <>
              {hasTorch && (
                <button
                  onClick={handleToggleTorch}
                  className={`p-2 rounded-full transition ${
                    torchOn ? 'bg-amber-400 text-black' : 'bg-slate-800/80 text-white hover:bg-slate-700'
                  }`}
                  title={t('toggleFlashlight')}
                >
                  {torchOn ? <Flashlight className="w-4 h-4" /> : <FlashlightOff className="w-4 h-4" />}
                </button>
              )}

              <button
                onClick={handleFlipCamera}
                className="p-2 rounded-full bg-slate-800/80 text-white hover:bg-slate-700 transition"
                title={t('switchCamera')}
              >
                <FlipHorizontal className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800/80 text-white hover:bg-slate-700 transition"
            title={t('closeScanner')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mode 1: Physical Paper Card OCR Scanner */}
      {scanMode === 'ocr' && (
        <PhysicalCardScanner
          onSaveContact={(contact) => {
            onSaveContact(contact);
          }}
          onClose={onClose}
        />
      )}

      {/* Mode 2: QR Code Scanner View */}
      {scanMode === 'qr' && (
        <>
          <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden px-4">
            {/* Camera Feed Container */}
            <div
              id={scannerId}
              className="w-full max-w-[340px] aspect-square rounded-3xl overflow-hidden bg-slate-900 shadow-2xl relative border-2 border-indigo-500/40"
            >
              {isScanning && !scannedResult && (
                <div className="absolute inset-0 pointer-events-none z-10">
                  <div className="absolute top-4 left-4 w-7 h-7 border-t-4 border-l-4 border-indigo-400 rounded-tl-lg" />
                  <div className="absolute top-4 right-4 w-7 h-7 border-t-4 border-r-4 border-indigo-400 rounded-tr-lg" />
                  <div className="absolute bottom-4 left-4 w-7 h-7 border-b-4 border-l-4 border-indigo-400 rounded-bl-lg" />
                  <div className="absolute bottom-4 right-4 w-7 h-7 border-b-4 border-r-4 border-indigo-400 rounded-br-lg" />
                  <div className="absolute left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_12px_#818cf8] scanner-laser" />
                </div>
              )}
            </div>

            {/* Error Fallback */}
            {cameraError && (
              <div className="mt-4 max-w-sm mx-auto p-4 bg-slate-900/90 border border-rose-500/40 rounded-2xl text-slate-200 text-xs text-center space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-rose-400 font-semibold">
                  <AlertCircle className="w-4 h-4" />
                  <span>{t('cameraUnavailable')}</span>
                </div>
                <p className="text-slate-300">{cameraError}</p>
              </div>
            )}

            {fileScanError && (
              <div className="mt-3 max-w-sm mx-auto p-3 bg-amber-950/90 border border-amber-500/40 rounded-2xl text-amber-200 text-xs text-center flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{fileScanError}</span>
              </div>
            )}

            <p className="mt-3 text-xs text-slate-400 text-center font-medium">
              {t('qrAlignHint')}
            </p>
          </div>

          {/* Bottom Upload Button for QR mode */}
          <div className="p-4 z-20 bg-gradient-to-t from-black/90 to-transparent flex flex-col items-center gap-3">
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 cursor-pointer transition active:scale-95 shadow">
              <Upload className="w-4 h-4 text-indigo-400" />
              <span>{t('scanQrFromPhoto')}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>
        </>
      )}

      {/* Scanned QR Contact Detail Bottom Sheet */}
      {scannedResult && scannedResult.contact && (
        <div className="fixed inset-0 z-50 bg-black/70 flex flex-col justify-end p-0 sm:p-4 backdrop-blur-sm animate-in slide-in-from-bottom duration-300">
          <div className="w-full max-w-md mx-auto bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl text-slate-100 max-h-[85vh] overflow-y-auto">
            <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-4 sm:hidden" />

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {scannedResult.contact.firstName
                    ? scannedResult.contact.firstName[0].toUpperCase()
                    : 'C'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      {t('qrCaptured')}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-0.5">
                    {scannedResult.contact.formattedName}
                  </h3>
                  {(scannedResult.contact.title || scannedResult.contact.organization) && (
                    <p className="text-xs text-indigo-300 font-medium">
                      {[scannedResult.contact.title, scannedResult.contact.organization]
                        .filter(Boolean)
                        .join(' • ')}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={handleScanAnother}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contact Details */}
            <div className="mt-5 space-y-2.5 text-xs">
              {scannedResult.contact.phones.map((phone, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50"
                >
                  <div className="flex items-center gap-2.5 text-slate-200">
                    <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-semibold">{phone.number}</div>
                      <div className="text-[10px] text-slate-400 uppercase">{phone.type}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                      <a
                        href={`tel:${phone.number}`}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 font-medium text-[11px] transition"
                      >
                        {t('call')}
                      </a>
                      <a
                        href={`sms:${phone.number}`}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
                        title={t('sendSms')}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}

              {scannedResult.contact.emails.map((email, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50"
                >
                  <div className="flex items-center gap-2.5 text-slate-200 min-w-0">
                    <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                    <div className="truncate">
                      <div className="font-semibold truncate">{email.email}</div>
                      <div className="text-[10px] text-slate-400 uppercase">{email.type}</div>
                    </div>
                  </div>
                  <a
                    href={`mailto:${email.email}`}
                    className="px-2.5 py-1 rounded-lg bg-sky-600/20 text-sky-300 hover:bg-sky-600/30 font-medium text-[11px] transition shrink-0"
                  >
                    {t('email')}
                  </a>
                </div>
              ))}

              {scannedResult.contact.addresses.map((adr, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50"
                >
                  <div className="flex items-center gap-2.5 text-slate-200 min-w-0">
                    <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                    <div className="text-[11px] truncate">{adr.formatted}</div>
                  </div>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(adr.formatted || '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-slate-400 hover:text-slate-200 shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}

              {scannedResult.contact.urls.map((url, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50"
                >
                  <div className="flex items-center gap-2.5 text-slate-200 min-w-0">
                    <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="truncate text-[11px] text-indigo-300">{url}</span>
                  </div>
                  <a
                    href={url.startsWith('http') ? url : `https://${url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-slate-400 hover:text-slate-200 shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}

              {scannedResult.contact.note && (
                <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 text-slate-300 text-[11px]">
                  <span className="text-slate-400 block font-medium mb-0.5">{t('noteLabel')}</span>
                  {scannedResult.contact.note}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-2.5">
              {!isSaved ? (
                <button
                  onClick={handleSaveScannedContact}
                  className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{t('saveToLocalContacts')}</span>
                </button>
              ) : (
                <div className="w-full py-3 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 font-semibold text-sm flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>{t('contactSavedToList')}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (scannedResult.contact) {
                      downloadVCF(
                        scannedResult.contact.rawVcard || '',
                        scannedResult.contact.formattedName
                      );
                      sounds.playSaveSuccess();
                    }
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{t('downloadVcf')}</span>
                </button>

                <button
                  onClick={handleScanAnother}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                >
                  {t('scanAnother')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
