import React, { useState, useEffect } from 'react';
import {
  Upload,
  FileCode,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  Copy,
  Plus,
  UserCheck,
  Users,
  Sparkles,
  Database,
  ArrowRight
} from 'lucide-react';
import { Contact } from '../types/contact';
import { parseVCards, generateVCardString, downloadVCF } from '../utils/vcard';
import { sounds } from '../utils/audio';
import { useLanguage } from '../i18n/LanguageContext';

interface VCardImportExportProps {
  onImportContacts: (contacts: Contact[]) => void;
  onSetAsMyCard: (contact: Contact) => void;
  contacts: Contact[];
  myCard: Contact;
}

export const VCardImportExport: React.FC<VCardImportExportProps> = ({
  onImportContacts,
  onSetAsMyCard,
  contacts,
  myCard,
}) => {
  const { lang, t } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);
  const [parsedCards, setParsedCards] = useState<Contact[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [rawText, setRawText] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'backup' | 'kotlin'>('upload');
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleFile = (file: File) => {
    if (!file) return;
    setFileName(file.name);
    setStatusMessage(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      processVCFContent(content, file.name);
    };
    reader.onerror = () => {
      setStatusMessage({ type: 'error', text: t('errorReadingFile') });
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    (window as any).onVcfFileReceived = (content: string, name: string) => {
      setFileName(name || 'Imported File');
      processVCFContent(content, name || 'Imported File');
      setActiveTab('upload');
    };
    return () => {
      delete (window as any).onVcfFileReceived;
    };
  }, []);

  const processVCFContent = (content: string, sourceName = 'vCard') => {
    try {
      const cards = parseVCards(content);
      if (cards.length === 0) {
        setStatusMessage({
          type: 'error',
          text: `${t('noValidContacts')} ${sourceName}. ${t('makeSureValidVcf')}`,
        });
        setParsedCards([]);
        return;
      }
      setParsedCards(cards);
      setStatusMessage({
        type: 'success',
        text: `${t('foundContactsReady')} ${cards.length}`,
      });
      sounds.playSaveSuccess();
    } catch (err) {
      console.error('Parse error:', err);
      setStatusMessage({
        type: 'error',
        text: t('failedParseVcard'),
      });
    }
  };

  const handleImportToContacts = () => {
    if (parsedCards.length === 0) return;
    onImportContacts(parsedCards);
    setStatusMessage({
      type: 'success',
      text: `${t('addedToLocalList')} ${parsedCards.length}`,
    });
    setParsedCards([]);
    sounds.playSaveSuccess();
  };

  const handleSetPrimary = (contact: Contact) => {
    onSetAsMyCard(contact);
    setStatusMessage({
      type: 'success',
      text: `"${contact.formattedName}" ${t('nowActiveQrCard')}`,
    });
    sounds.playSaveSuccess();
  };

  const handleExportAllVCF = () => {
    if (contacts.length === 0) return;
    const combined = contacts
      .map((c) => generateVCardString(c))
      .join('\r\n\r\n');
    downloadVCF(combined, `CardDrop_contacts_${new Date().toISOString().slice(0, 10)}`);
    sounds.playSaveSuccess();
  };

  const handleLoadSampleVCF = () => {
    const sampleVCF =
      lang === 'sr'
        ? `BEGIN:VCARD
VERSION:3.0
FN:Ana Jovanović
N:Jovanović;Ana;;;
ORG:Dunav Digital d.o.o.;Razvoj softvera
TITLE:Direktor proizvoda
TEL;TYPE=CELL,VOICE:+381 64 432 8765
EMAIL;TYPE=WORK,INTERNET:ana.jovanovic@dunavdigital.rs
ADR;TYPE=WORK:;;Bulevar oslobođenja 88;Novi Sad;;21000;Srbija
URL:https://dunavdigital.rs
NOTE:Upoznali se na IT konferenciji u Novom Sadu.
END:VCARD

BEGIN:VCARD
VERSION:3.0
FN:Nikola Đorđević
N:Đorđević;Nikola;;;
ORG:BeoCloud sistemi d.o.o.;Arhitektura
TITLE:Glavni inženjer za mobilne aplikacije
TEL;TYPE=CELL,VOICE:+381 63 512 4567
EMAIL;TYPE=WORK,INTERNET:nikola@beocloud.rs
URL:https://beocloud.rs
NOTE:Saradnja na Android i Kotlin projektima.
END:VCARD`
        : `BEGIN:VCARD
VERSION:3.0
FN:Maya Lin
N:Lin;Maya;;;
ORG:Zenith Robotics;Autonomous Systems
TITLE:Lead AI Perception Researcher
TEL;TYPE=CELL,VOICE:+1-555-432-8765
EMAIL;TYPE=WORK,INTERNET:maya.lin@zenithrobotics.ai
ADR;TYPE=WORK:;;220 Tech Blvd;Boston;MA;02110;USA
URL:https://zenithrobotics.ai
NOTE:Specialist in edge computer vision and robotic spatial SLAM.
END:VCARD

BEGIN:VCARD
VERSION:3.0
FN:Dmitri Sokolov
N:Sokolov;Dmitri;;;
ORG:Nordic FinTech;Core Payments
TITLE:VP of Mobile Architecture
TEL;TYPE=CELL,VOICE:+46-8-123-4567
EMAIL;TYPE=WORK,INTERNET:dmitri@nordicfintech.se
URL:https://nordicfintech.se
NOTE:Keynote speaker on Kotlin Multiplatform for enterprise banking.
END:VCARD`;

    processVCFContent(sampleVCF, lang === 'sr' ? 'Probni VCF' : 'Sample Multi-Contact VCF');
  };

  return (
    <div className="w-full max-w-sm px-4 pb-6 space-y-4">
      {/* Sub Tabs */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
        <button
          onClick={() => setActiveTab('upload')}
          className={`py-1.5 text-[11px] font-semibold rounded-xl transition ${
            activeTab === 'upload'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {t('tabImport')}
        </button>
        <button
          onClick={() => setActiveTab('paste')}
          className={`py-1.5 text-[11px] font-semibold rounded-xl transition ${
            activeTab === 'paste'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {t('tabPaste')}
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`py-1.5 text-[11px] font-semibold rounded-xl transition ${
            activeTab === 'backup'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {t('tabBackup')}
        </button>
        <button
          onClick={() => setActiveTab('kotlin')}
          className={`py-1.5 text-[11px] font-semibold rounded-xl transition ${
            activeTab === 'kotlin'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {t('tabKotlin')}
        </button>
      </div>

      {/* Tab 1: Upload .vcf */}
      {activeTab === 'upload' && (
        <div className="space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files[0];
              if (file) handleFile(file);
            }}
            className={`border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center text-center transition ${
              isDragging
                ? 'border-indigo-400 bg-indigo-950/30'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-sm text-white mb-1">
              {t('selectOrDropVcf')}
            </h3>
            <p className="text-[11px] text-slate-400 mb-4 max-w-[220px]">
              {t('uploadVcfDesc')}
            </p>

            <label className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer shadow-md transition active:scale-95">
              {t('chooseFile')}
              <input
                type="file"
                accept=".vcf,.vcard,text/vcard,text/x-vcard,text/plain,*/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </label>
          </div>

          {/* Quick Sample File Button */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{t('needTestContacts')}</span>
            </div>
            <button
              onClick={handleLoadSampleVCF}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[11px] font-semibold transition"
            >
              {t('loadSampleVcf')}
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Paste Raw VCF Text */}
      {activeTab === 'paste' && (
        <div className="space-y-3">
          <div className="text-[11px] text-slate-400">
            {t('pasteVcfPrompt')}
          </div>
          <textarea
            rows={6}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="BEGIN:VCARD&#10;VERSION:3.0&#10;FN:Marko Petrović&#10;TEL:+381641234567&#10;EMAIL:marko@primer.rs&#10;END:VCARD"
            className="w-full px-3 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-600 font-mono text-[11px] focus:outline-none focus:border-indigo-500 resize-none"
          />
          <button
            onClick={() => processVCFContent(rawText, lang === 'sr' ? 'Nalepljeni tekst' : 'Pasted Text')}
            disabled={!rawText.trim()}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold text-xs shadow transition"
          >
            {t('parseVcardText')}
          </button>
        </div>
      )}

      {/* Tab 3: Backup & Export */}
      {activeTab === 'backup' && (
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-xs text-white">{t('exportAllContacts')}</h4>
                <p className="text-[11px] text-slate-400">
                  {contacts.length} {t('savedInLocalStorage')}
                </p>
              </div>
            </div>

            <button
              onClick={handleExportAllVCF}
              disabled={contacts.length === 0}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow transition"
            >
              <Download className="w-4 h-4" />
              <span>{t('downloadCombinedVcf')}</span>
            </button>
          </div>

          {/* Android import instructions */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>{t('importingAndroidTitle')}</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-300">
              <li>{t('importStep1')}</li>
              <li>{t('importStep2')}</li>
              <li>{t('importStep3')}</li>
              <li>{t('importStep4')}</li>
            </ol>
          </div>
        </div>
      )}

      {/* Tab 4: Native Android Kotlin Project */}
      {activeTab === 'kotlin' && (
        <div className="space-y-3 text-xs animate-in fade-in">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/30 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-white">{t('nativeAndroidTitle')}</h4>
                <p className="text-[10px] text-slate-400">
                  {t('nativeAndroidSub')} <code className="text-indigo-300">/android</code>
                </p>
              </div>
            </div>

            <div className="space-y-1.5 text-[11px] text-slate-300 pt-1">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span><strong>UI</strong>: Jetpack Compose + Material 3</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span><strong>Scanner</strong>: CameraX + Google ML Kit Barcode API</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span><strong>QR Engine</strong>: ZXing Bitmap Matrix Generator</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span><strong>Database</strong>: Room ORM + Coroutines Flow</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Generated Source Files:
              </span>
              <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 font-mono text-[10px] text-indigo-300 space-y-1">
                <div>android/app/src/main/java/com/carddrop/app/</div>
                <div className="pl-3 text-slate-300">├── MainActivity.kt</div>
                <div className="pl-3 text-slate-300">├── ui/MyCardScreen.kt</div>
                <div className="pl-3 text-slate-300">├── ui/QRScannerScreen.kt</div>
                <div className="pl-3 text-slate-300">├── ui/ContactListScreen.kt</div>
                <div className="pl-3 text-slate-300">├── vcard/VCardManager.kt</div>
                <div className="pl-3 text-slate-300">└── data/Contact.kt, ContactDao.kt</div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-1.5 text-[11px] text-slate-300">
              <span className="font-semibold text-slate-200">How to run on Pixel 8 via Android Studio:</span>
              <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[10px]">
                <li>Open <strong>Android Studio</strong></li>
                <li>Choose <strong>Open</strong> → select the <code className="text-indigo-300">android/</code> directory</li>
                <li>Connect your <strong>Pixel 8</strong> via USB debugging</li>
                <li>Click <strong>Run 'app'</strong> to compile directly to your phone</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`p-3 rounded-2xl border text-xs flex items-start gap-2 animate-in fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Parsed Cards Preview List */}
      {parsedCards.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200">
              {t('detectedContacts')} ({parsedCards.length})
            </span>
            <button
              onClick={handleImportToContacts}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow flex items-center gap-1 transition"
            >
              <Users className="w-3.5 h-3.5" />
              <span>{t('importAll')}</span>
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {parsedCards.map((card, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-white truncate">
                    {card.formattedName}
                  </div>
                  {(card.title || card.organization) && (
                    <div className="text-[11px] text-slate-400 truncate">
                      {[card.title, card.organization].filter(Boolean).join(' • ')}
                    </div>
                  )}
                  {card.phones[0] && (
                    <div className="text-[10px] text-indigo-400 mt-0.5">
                      {card.phones[0].number}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleSetPrimary(card)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-[11px] font-semibold transition"
                    title={t('displayAsMyQr')}
                  >
                    {t('setAsMyQr')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
