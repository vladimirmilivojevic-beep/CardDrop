import React, { useEffect, useRef, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Camera,
  FlipHorizontal,
  Flashlight,
  FlashlightOff,
  Upload,
  Sparkles,
  Check,
  AlertCircle,
  FileCheck,
  UserPlus,
  Phone,
  Mail,
  Building,
  MapPin,
  Globe,
  Briefcase,
  User,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Lock,
  ArrowRight
} from 'lucide-react';
import { Contact, ContactPhone, ContactEmail, ContactAddress } from '../types/contact';
import { scanBusinessCardImage, preprocessCardImage, OcrLanguage } from '../utils/ocrService';
import { ParsedCardData, parsedCardToContact } from '../utils/ocrParser';
import { generateSampleBusinessCard } from '../utils/sampleCards';
import { downloadVCF } from '../utils/vcard';
import { sounds } from '../utils/audio';
import { useLanguage } from '../i18n/LanguageContext';

interface PhysicalCardScannerProps {
  onSaveContact: (contact: Contact) => void;
  onClose: () => void;
}

type PermissionStatus = 'checking' | 'need_permission' | 'granted' | 'denied';

export const PhysicalCardScanner: React.FC<PhysicalCardScannerProps> = ({
  onSaveContact,
  onClose,
}) => {
  const { lang, t } = useLanguage();
  const [ocrLang, setOcrLang] = useState<OcrLanguage>(lang);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  // Permission & Stream state
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('checking');
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatusText, setOcrStatusText] = useState('');

  // Keep OCR language in sync when global language changes
  useEffect(() => {
    setOcrLang(lang);
  }, [lang]);

  // Result state
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedCardData | null>(null);
  const [showRawText, setShowRawText] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Editable fields for review
  const [editName, setEditName] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editOrg, setEditOrg] = useState('');
  const [editPhones, setEditPhones] = useState<ContactPhone[]>([]);
  const [editEmails, setEditEmails] = useState<ContactEmail[]>([]);
  const [editWebsites, setEditWebsites] = useState<string[]>([]);
  const [editAddress, setEditAddress] = useState('');
  const [editNote, setEditNote] = useState('');

  // Stop camera tracks cleanly
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setIsStartingCamera(false);
  }, []);

  // Start Camera Stream with progressive fallback
  const startCamera = useCallback(async () => {
    stopCameraStream();
    setIsStartingCamera(true);
    setCameraError(null);

    try {
      let stream: MediaStream | null = null;

      // 1. Try standard rear/user camera with responsive resolution
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (err1) {
        console.warn('First getUserMedia attempt failed, trying basic video:', err1);
        // 2. Fallback: try basic video
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode },
            audio: false,
          });
        } catch (err2) {
          console.warn('Second attempt failed, trying any video stream:', err2);
          // 3. Fallback: any video camera
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
      }

      if (!stream) {
        throw new Error('Unable to acquire camera video stream');
      }

      streamRef.current = stream;
      setPermissionStatus('granted');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video play deferred or blocked:', playErr);
        }
      }

      setCameraActive(true);
      setIsStartingCamera(false);

      // Check torch support
      const track = stream.getVideoTracks()[0];
      if (track && 'getCapabilities' in track) {
        const caps = (track.getCapabilities() as unknown) as { torch?: boolean };
        setHasTorch(!!caps.torch);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('Camera start error:', msg);
      setIsStartingCamera(false);
      setCameraActive(false);

      if (msg.includes('NotAllowedError') || msg.includes('Permission') || msg.includes('denied')) {
        setPermissionStatus('denied');
        setCameraError(t('camPermDenied'));
      } else if (msg.includes('NotFoundError') || msg.includes('DevicesNotFoundError')) {
        setPermissionStatus('denied');
        setCameraError(t('camNotFound'));
      } else {
        setPermissionStatus('denied');
        setCameraError(t('camBusy'));
      }
    }
  }, [facingMode, stopCameraStream, t]);

  // Request Camera Permission on user action
  const handleRequestPermission = async () => {
    sounds.playTap();

    // 1. If in native Android APK with AndroidBridge
    const win = window as unknown as { AndroidBridge?: { requestCameraPermission: () => void } };
    if (win.AndroidBridge && typeof win.AndroidBridge.requestCameraPermission === 'function') {
      try {
        win.AndroidBridge.requestCameraPermission();
      } catch (e) {
        console.warn('AndroidBridge call error:', e);
      }
    }

    // 2. Trigger browser / WebView getUserMedia prompt
    await startCamera();
  };

  // Initial Permission Check
  useEffect(() => {
    let isMounted = true;

    const checkInitialPermission = async () => {
      // 1. Check native AndroidBridge
      const win = window as unknown as {
        AndroidBridge?: { hasCameraPermission: () => boolean; requestCameraPermission: () => void };
        onCameraPermissionGranted?: () => void;
        onCameraPermissionDenied?: () => void;
      };

      win.onCameraPermissionGranted = () => {
        if (!isMounted) return;
        setPermissionStatus('granted');
        startCamera();
      };

      win.onCameraPermissionDenied = () => {
        if (!isMounted) return;
        setPermissionStatus('denied');
        setCameraError(t('camPermDeniedSettings'));
      };

      if (win.AndroidBridge && typeof win.AndroidBridge.hasCameraPermission === 'function') {
        const has = win.AndroidBridge.hasCameraPermission();
        if (has) {
          if (isMounted) {
            setPermissionStatus('granted');
            // Small delay to ensure any previous scanner released hardware
            setTimeout(startCamera, 150);
          }
          return;
        } else {
          if (isMounted) {
            setPermissionStatus('need_permission');
          }
          return;
        }
      }

      // 2. Check navigator.permissions query if available
      if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
        try {
          const status = await navigator.permissions.query({ name: 'camera' as PermissionName });
          if (!isMounted) return;

          if (status.state === 'granted') {
            setPermissionStatus('granted');
            setTimeout(startCamera, 150);
            return;
          } else if (status.state === 'denied') {
            setPermissionStatus('denied');
            setCameraError(t('camBlocked'));
            return;
          } else {
            // 'prompt'
            setPermissionStatus('need_permission');
            return;
          }
        } catch {
          // Permissions API unsupported on this browser
        }
      }

      // Fallback: try starting directly (will trigger native prompt)
      if (isMounted) {
        setPermissionStatus('need_permission');
      }
    };

    checkInitialPermission();

    return () => {
      isMounted = false;
      stopCameraStream();
    };
  }, [startCamera, stopCameraStream, t]);

  // Flip Camera
  const handleFlipCamera = () => {
    sounds.playTap();
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Toggle Torch
  const handleToggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && 'applyConstraints' in track) {
      try {
        const nextTorch = !torchOn;
        await track.applyConstraints({
          advanced: [{ torch: nextTorch } as MediaTrackConstraintSet],
        });
        setTorchOn(nextTorch);
      } catch (e) {
        console.warn('Torch toggle failed:', e);
      }
    }
  };

  // Run OCR on an image dataUrl
  const processImageForOCR = async (dataUrl: string, forceLang?: OcrLanguage) => {
    const activeOcrLang = forceLang || ocrLang;
    setIsProcessing(true);
    setOcrError(null);
    setOcrProgress(5);
    setOcrStatusText(t('ocrLoadingEngine'));
    setCapturedImage(dataUrl);

    try {
      const result = await scanBusinessCardImage(
        dataUrl,
        (progress, status) => {
          setOcrProgress(progress);
          if (status.includes('recognizing')) {
            setOcrStatusText(`${t('ocrReadingText')} ${progress}%`);
          } else if (status.includes('loading')) {
            setOcrStatusText(t('ocrLoadingModel'));
          } else {
            setOcrStatusText(t('ocrInit'));
          }
        },
        activeOcrLang
      );

      sounds.playScanSuccess();
      setParsedData(result.parsed);
      setEditName(result.parsed.fullName);
      setEditTitle(result.parsed.title);
      setEditOrg(result.parsed.organization);
      setEditPhones(result.parsed.phones);
      setEditEmails(result.parsed.emails);
      setEditWebsites(result.parsed.websites);
      setEditAddress(result.parsed.addresses[0]?.formatted || '');
      setEditNote(result.parsed.note);
      setIsSaved(false);
    } catch (err) {
      console.error('OCR processing error:', err);
      setCapturedImage(null);
      setOcrError(t('ocrFailedAlert'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Snap photo from live camera
  const handleSnapPhoto = () => {
    if (!videoRef.current || !cameraActive) return;
    sounds.playShutter();

    const video = videoRef.current;
    const vw = video.videoWidth || 1280;
    const vh = video.videoHeight || 720;

    // Crop center card region (3.5 : 2 ratio)
    const cardRatio = 3.5 / 2; // 1.75
    let cropW = vw * 0.85;
    let cropH = cropW / cardRatio;
    if (cropH > vh * 0.8) {
      cropH = vh * 0.8;
      cropW = cropH * cardRatio;
    }

    const cropX = (vw - cropW) / 2;
    const cropY = (vh - cropH) / 2;

    const { dataUrl } = preprocessCardImage(video, {
      x: cropX,
      y: cropY,
      width: cropW,
      height: cropH,
    });

    processImageForOCR(dataUrl);
  };

  // Upload card photo from gallery/files
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        processImageForOCR(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Test with Demo / Sample Cards
  const handleTestSample = (type: 'tech' | 'executive' | 'creative') => {
    sounds.playTap();
    const sampleDataUrl = generateSampleBusinessCard(type, ocrLang);
    if (sampleDataUrl) {
      processImageForOCR(sampleDataUrl, ocrLang);
    }
  };

  // Save the reviewed contact
  const handleSaveContact = () => {
    const nameParts = editName.trim().split(/\s+/);
    const firstName = nameParts[0] || t('untitledContact');
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    const newContact: Contact = {
      id: 'contact_ocr_' + Math.random().toString(36).substring(2, 9),
      firstName,
      lastName,
      formattedName: editName.trim() || t('untitledContact'),
      organization: editOrg.trim(),
      title: editTitle.trim(),
      phones: editPhones.filter((p) => p.number.trim().length > 0),
      emails: editEmails.filter((e) => e.email.trim().length > 0),
      addresses: editAddress.trim()
        ? [
            {
              type: 'WORK',
              formatted: editAddress.trim(),
              street: editAddress.trim(),
              city: '',
              state: '',
              postalCode: '',
              country: '',
            },
          ]
        : [],
      urls: editWebsites.filter((u) => u.trim().length > 0),
      note: editNote.trim(),
      photoUrl: capturedImage || undefined,
      source: 'scanned',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    onSaveContact(newContact);
    setIsSaved(true);
    sounds.playSaveSuccess();

    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.8 },
      colors: ['#4f46e5', '#38bdf8', '#10b981', '#f59e0b'],
    });
  };

  const handleScanAnother = () => {
    setCapturedImage(null);
    setParsedData(null);
    setIsSaved(false);
    startCamera();
  };

  return (
    <div className="flex-1 flex flex-col justify-between overflow-hidden relative">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Main Viewport: Live Camera Feed, Permission Card, or Result Image */}
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden px-4">
        {!capturedImage ? (
          <div className="w-full max-w-[360px] aspect-[1.75/1] rounded-3xl overflow-hidden bg-slate-900 shadow-2xl relative border-2 border-indigo-500/50 flex items-center justify-center">
            {/* 1. Need Permission or Denied Card */}
            {(permissionStatus === 'need_permission' || permissionStatus === 'denied') && (
              <div className="absolute inset-0 bg-slate-950/95 z-30 flex flex-col items-center justify-center p-5 text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 mb-3">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">
                  {t('camPermRequiredTitle')}
                </h4>
                <p className="text-[11px] text-slate-300 max-w-[260px] mb-4">
                  {cameraError || t('camPermDefaultDesc')}
                </p>

                <div className="flex flex-col gap-2 w-full max-w-[220px]">
                  <button
                    onClick={handleRequestPermission}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 transition active:scale-95"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{t('grantCameraAccess')}</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <Upload className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{t('chooseFromGallery')}</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2. Loading Camera Indicator */}
            {isStartingCamera && !cameraActive && permissionStatus === 'granted' && (
              <div className="absolute inset-0 bg-slate-950/90 z-20 flex flex-col items-center justify-center p-4">
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-2" />
                <span className="text-xs text-slate-300 font-medium">{t('openingCamera')}</span>
              </div>
            )}

            {/* 3. Live Video Element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  videoRef.current.play().catch(() => {});
                  setCameraActive(true);
                }
              }}
              onLoadedData={() => {
                setCameraActive(true);
                setIsStartingCamera(false);
              }}
            />

            {/* 4. Business Card Alignment Framing Guide */}
            {cameraActive && !capturedImage && (
              <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-4">
                <div className="flex justify-between">
                  <div className="w-8 h-8 border-t-4 border-l-4 border-indigo-400 rounded-tl-xl shadow-sm" />
                  <div className="w-8 h-8 border-t-4 border-r-4 border-indigo-400 rounded-tr-xl shadow-sm" />
                </div>

                <div className="text-center px-2.5 py-1 bg-black/60 rounded-full mx-auto backdrop-blur-sm border border-white/10">
                  <span className="text-[11px] font-medium text-white/90">
                    {t('alignPaperCard')}
                  </span>
                </div>

                <div className="flex justify-between">
                  <div className="w-8 h-8 border-b-4 border-l-4 border-indigo-400 rounded-bl-xl shadow-sm" />
                  <div className="w-8 h-8 border-b-4 border-r-4 border-indigo-400 rounded-br-xl shadow-sm" />
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Captured Card / Scanning state */
          <div className="w-full max-w-[360px] aspect-[1.75/1] rounded-3xl overflow-hidden bg-slate-900 shadow-2xl relative border-2 border-indigo-500/50 flex items-center justify-center">
            <img
              src={capturedImage}
              alt="Captured Business Card"
              className="w-full h-full object-contain bg-black/40"
            />
            {isProcessing && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
                <div className="absolute left-4 right-4 h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_16px_#818cf8] animate-pulse" />
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
                <div className="text-sm font-semibold text-white mb-1">
                  {t('scanningPaperCard')}
                </div>
                <div className="text-xs text-indigo-300 mb-3">{ocrStatusText || t('ocrInit')}</div>
                <div className="w-48 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-200"
                    style={{ width: `${Math.max(10, ocrProgress)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* OCR Error Banner */}
        {ocrError && !capturedImage && (
          <div className="mt-3 max-w-sm mx-auto p-3 bg-rose-950/90 border border-rose-500/40 rounded-2xl text-rose-200 text-xs text-center flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{ocrError}</span>
          </div>
        )}

        {/* OCR Language Toggle & Quick Sample Card Testing */}
        {!capturedImage && (
          <div className="mt-3 flex flex-col items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-medium">{t('ocrLangLabel')}</span>
              <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-900 border border-slate-700/80">
                <button
                  onClick={() => {
                    sounds.playTap();
                    setOcrLang('sr');
                  }}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition ${
                    ocrLang === 'sr'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t('ocrLangSr')}
                </button>
                <button
                  onClick={() => {
                    sounds.playTap();
                    setOcrLang('en');
                  }}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition ${
                    ocrLang === 'en'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t('ocrLangEn')}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              <span className="text-[10px] text-slate-400 font-medium mr-1">{t('testWithCard')}</span>
              <button
                onClick={() => handleTestSample('tech')}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-[11px] text-indigo-300 transition active:scale-95"
              >
                {t('sampleTech')}
              </button>
              <button
                onClick={() => handleTestSample('creative')}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-[11px] text-purple-300 transition active:scale-95"
              >
                {t('sampleCreative')}
              </button>
              <button
                onClick={() => handleTestSample('executive')}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-[11px] text-emerald-300 transition active:scale-95"
              >
                {t('sampleExecutive')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Shutter / Bottom Controls when taking photo */}
      {!capturedImage && (
        <div className="p-4 z-20 bg-gradient-to-t from-black/95 via-black/80 to-transparent flex flex-col items-center gap-3">
          <div className="flex items-center justify-around w-full max-w-xs">
            {/* Gallery Upload */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-1 text-slate-300 hover:text-white transition"
              title={t('uploadCardPhoto')}
            >
              <div className="w-11 h-11 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center">
                <Upload className="w-5 h-5 text-indigo-400" />
              </div>
              <span className="text-[10px] font-medium">{t('gallery')}</span>
            </button>

            {/* Shutter Button (Snap Card) */}
            <button
              onClick={handleSnapPhoto}
              disabled={!cameraActive}
              className={`w-18 h-18 rounded-full border-4 border-white/80 flex items-center justify-center transition active:scale-90 ${
                cameraActive
                  ? 'bg-gradient-to-tr from-indigo-600 to-indigo-500 shadow-[0_0_25px_rgba(79,70,229,0.5)] hover:scale-105 cursor-pointer'
                  : 'bg-slate-800 opacity-60 cursor-not-allowed'
              }`}
              title={t('captureCardPhoto')}
            >
              <Camera className="w-7 h-7 text-white" />
            </button>

            {/* Flip Camera */}
            <button
              onClick={handleFlipCamera}
              className="flex flex-col items-center gap-1 text-slate-300 hover:text-white transition"
              title={t('switchCamera')}
            >
              <div className="w-11 h-11 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center">
                <FlipHorizontal className="w-5 h-5 text-slate-300" />
              </div>
              <span className="text-[10px] font-medium">{t('flip')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Extracted Review & Edit Sheet */}
      {capturedImage && parsedData && !isProcessing && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col justify-end p-0 sm:p-4 backdrop-blur-md animate-in slide-in-from-bottom duration-300">
          <div className="w-full max-w-md mx-auto bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
            {/* Sheet Handle */}
            <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />

            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold text-lg shadow">
                  <Sparkles className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      {t('ocrExtracted')}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {parsedData.confidenceScore}{t('matchSuffix')}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    {t('reviewCardDetails')}
                  </h3>
                </div>
              </div>

              <button
                onClick={handleScanAnother}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium px-2 py-1 rounded-lg bg-indigo-950/60 border border-indigo-800/60"
              >
                {t('scanAnother')}
              </button>
            </div>

            {/* Editable Fields */}
            <div className="mt-4 space-y-3 text-xs">
              {/* Full Name */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mb-1">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{t('fullName')}</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder={t('fullNamePlaceholder')}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-white font-medium focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              {/* Title & Company Row */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mb-1">
                    <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                    <span>{t('jobTitle')}</span>
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder={t('jobTitlePlaceholder')}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-white font-medium focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mb-1">
                    <Building className="w-3.5 h-3.5 text-sky-400" />
                    <span>{t('company')}</span>
                  </label>
                  <input
                    type="text"
                    value={editOrg}
                    onChange={(e) => setEditOrg(e.target.value)}
                    placeholder={t('companyPlaceholder')}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-white font-medium focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
              </div>

              {/* Phones */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mb-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t('phoneNumbers')}</span>
                </label>
                {editPhones.length > 0 ? (
                  editPhones.map((phone, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 mb-1.5">
                      <input
                        type="text"
                        value={phone.number}
                        onChange={(e) => {
                          const updated = [...editPhones];
                          updated[idx] = { ...updated[idx], number: e.target.value };
                          setEditPhones(updated);
                        }}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                      />
                      <a
                        href={`tel:${phone.number}`}
                        className="px-2 py-2 rounded-xl bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 text-[11px] font-semibold"
                      >
                        {t('call')}
                      </a>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder={t('addPhonePlaceholder')}
                      onBlur={(e) => {
                        if (e.target.value.trim()) {
                          setEditPhones([{ type: 'MOBILE', number: e.target.value.trim() }]);
                          e.target.value = '';
                        }
                      }}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-300 text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Emails */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mb-1">
                  <Mail className="w-3.5 h-3.5 text-sky-400" />
                  <span>{t('emailAddresses')}</span>
                </label>
                {editEmails.length > 0 ? (
                  editEmails.map((email, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 mb-1.5">
                      <input
                        type="email"
                        value={email.email}
                        onChange={(e) => {
                          const updated = [...editEmails];
                          updated[idx] = { ...updated[idx], email: e.target.value };
                          setEditEmails(updated);
                        }}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                      />
                      <a
                        href={`mailto:${email.email}`}
                        className="px-2.5 py-2 rounded-xl bg-sky-600/20 text-sky-300 hover:bg-sky-600/30 text-[11px] font-semibold"
                      >
                        {t('email')}
                      </a>
                    </div>
                  ))
                ) : (
                  <input
                    type="email"
                    placeholder={t('addEmailPlaceholder')}
                    onBlur={(e) => {
                      if (e.target.value.trim()) {
                        setEditEmails([{ type: 'WORK', email: e.target.value.trim() }]);
                        e.target.value = '';
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-300 text-xs"
                  />
                )}
              </div>

              {/* Website */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mb-1">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{t('website')}</span>
                </label>
                {editWebsites.length > 0 ? (
                  editWebsites.map((site, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 mb-1.5">
                      <input
                        type="text"
                        value={site}
                        onChange={(e) => {
                          const updated = [...editWebsites];
                          updated[idx] = e.target.value;
                          setEditWebsites(updated);
                        }}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                      />
                      <a
                        href={site.startsWith('http') ? site : `https://${site}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))
                ) : (
                  <input
                    type="text"
                    placeholder={t('websitePlaceholder')}
                    onBlur={(e) => {
                      if (e.target.value.trim()) {
                        setEditWebsites([e.target.value.trim()]);
                        e.target.value = '';
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-300 text-xs"
                  />
                )}
              </div>

              {/* Physical Address */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>{t('address')}</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder={t('addressPlaceholder')}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                  {editAddress && (
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(editAddress)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                      title={t('openInMaps')}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* View Raw OCR text toggle */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowRawText(!showRawText)}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200"
                >
                  {showRawText ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  <span>{showRawText ? t('hideRawOcr') : t('viewRawOcr')}</span>
                </button>
                {showRawText && (
                  <pre className="mt-1.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[10px] text-slate-300 whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {parsedData.rawText || t('noTextRecognized')}
                  </pre>
                )}
              </div>
            </div>

            {/* Actions: Save, Export, Dismiss */}
            <div className="mt-5 space-y-2">
              {!isSaved ? (
                <button
                  onClick={handleSaveContact}
                  className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{t('saveToContacts')}</span>
                </button>
              ) : (
                <div className="w-full py-3 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 font-semibold text-xs flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>{t('savedToContacts')}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const temp = parsedCardToContact(parsedData, capturedImage || undefined);
                    temp.formattedName = editName;
                    temp.title = editTitle;
                    temp.organization = editOrg;
                    temp.phones = editPhones;
                    temp.emails = editEmails;
                    temp.urls = editWebsites;
                    downloadVCF(
                      `BEGIN:VCARD\nVERSION:3.0\nFN:${editName}\nORG:${editOrg}\nTITLE:${editTitle}\n${editPhones.map(p => `TEL;TYPE=${p.type}:${p.number}`).join('\n')}\n${editEmails.map(e => `EMAIL;TYPE=${e.type}:${e.email}`).join('\n')}\nEND:VCARD`,
                      editName
                    );
                    sounds.playSaveSuccess();
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
