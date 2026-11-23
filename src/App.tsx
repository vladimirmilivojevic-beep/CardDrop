import React, { useEffect, useState } from 'react';
import {
  QrCode,
  Camera,
  Users,
  FileUp,
  Languages
} from 'lucide-react';
import { useLanguage } from './i18n/LanguageContext';
import { Contact, QROptions } from './types/contact';
import {
  getStoredMyCards,
  saveStoredMyCards,
  getActiveCardId,
  saveActiveCardId,
  getStoredContacts,
  saveStoredContacts,
  getStoredQROptions,
  saveStoredQROptions,
} from './utils/storage';
import { AndroidFrame } from './components/AndroidFrame';
import { MyCardView } from './components/MyCardView';
import { ContactListView } from './components/ContactListView';
import { QRScannerModal } from './components/QRScannerModal';
import { ContactDetailModal } from './components/ContactDetailModal';
import { EditContactModal } from './components/EditContactModal';
import { VCardImportExport } from './components/VCardImportExport';
import { ErrorBoundary } from './components/ErrorBoundary';
import { sounds } from './utils/audio';

type Tab = 'mycard' | 'scan' | 'contacts' | 'import';

export default function App() {
  const { lang, toggleLang, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>('mycard');
  const [myCards, setMyCards] = useState<Contact[]>(getStoredMyCards);
  const [activeCardId, setActiveCardId] = useState<string>(getActiveCardId);
  const [contacts, setContacts] = useState<Contact[]>(getStoredContacts);
  const [qrOptions, setQrOptions] = useState<QROptions>(getStoredQROptions);

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editTarget, setEditTarget] = useState<'mycard' | 'contact'>('mycard');

  // Frame toggle for desktop users
  const [isFrameEnabled, setIsFrameEnabled] = useState(true);

  // Save changes to storage
  useEffect(() => {
    saveStoredMyCards(myCards);
  }, [myCards]);

  useEffect(() => {
    saveActiveCardId(activeCardId);
  }, [activeCardId]);

  useEffect(() => {
    saveStoredContacts(contacts);
  }, [contacts]);

  useEffect(() => {
    saveStoredQROptions(qrOptions);
  }, [qrOptions]);

  const activeMyCard = myCards.find((c) => c.id === activeCardId) || myCards[0];

  // Contact list management handlers
  const handleSaveContact = (newOrUpdated: Contact) => {
    setContacts((prev) => {
      const idx = prev.findIndex((c) => c.id === newOrUpdated.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = newOrUpdated;
        return next;
      }
      return [newOrUpdated, ...prev];
    });
  };

  const handleDeleteContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    if (selectedContact?.id === id) {
      setSelectedContact(null);
    }
  };

  const handleToggleFavorite = (id: string) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isFavorite: !c.isFavorite } : c))
    );
    if (selectedContact?.id === id) {
      setSelectedContact((prev) => (prev ? { ...prev, isFavorite: !prev.isFavorite } : null));
    }
  };

  // Import handler
  const handleImportContacts = (imported: Contact[]) => {
    setContacts((prev) => {
      // Filter out exact duplicate names/phones
      const existingIds = new Set(prev.map((c) => c.id));
      const fresh = imported.filter((c) => !existingIds.has(c.id));
      return [...fresh, ...prev];
    });
    setActiveTab('contacts');
  };

  // Set as My Card from imported VCF
  const handleSetAsMyCard = (card: Contact) => {
    setMyCards((prev) => [card, ...prev.filter((c) => c.id !== card.id)]);
    setActiveCardId(card.id);
    setActiveTab('mycard');
  };

  // My Card editing
  const handleEditActiveCard = () => {
    if (activeMyCard) {
      setEditingContact(activeMyCard);
      setEditTarget('mycard');
      setIsEditModalOpen(true);
    }
  };

  const handleCreateNewMyCard = () => {
    setEditingContact(null);
    setEditTarget('mycard');
    setIsEditModalOpen(true);
  };

  // General contact editing
  const handleEditContact = (c: Contact) => {
    setEditingContact(c);
    setEditTarget('contact');
    setIsEditModalOpen(true);
  };

  const handleCreateContact = () => {
    setEditingContact(null);
    setEditTarget('contact');
    setIsEditModalOpen(true);
  };

  const handleSaveFromEditor = (contact: Contact) => {
    if (editTarget === 'mycard') {
      setMyCards((prev) => {
        const idx = prev.findIndex((c) => c.id === contact.id);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = contact;
          return next;
        }
        return [contact, ...prev];
      });
      setActiveCardId(contact.id);
    } else {
      handleSaveContact(contact);
      if (selectedContact?.id === contact.id) {
        setSelectedContact(contact);
      }
    }
    sounds.playSaveSuccess();
  };

  return (
    <AndroidFrame
      isFrameEnabled={isFrameEnabled}
      onToggleFrame={() => setIsFrameEnabled(!isFrameEnabled)}
    >
      <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 overflow-hidden relative">
        {/* App Bar (Android Material 3 Header) */}
        <header className="px-5 pt-3 pb-2.5 flex items-center justify-between shrink-0 border-b border-slate-900 bg-slate-950/90 backdrop-blur-md z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>CardDrop</span>
                <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded-md border border-indigo-500/20">
                  VCF QR
                </span>
              </h1>
              <p className="text-[10px] text-slate-400">{t('appSubtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                sounds.playTap();
                toggleLang();
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-[11px] font-bold transition active:scale-95"
              title={lang === 'sr' ? 'Switch to English' : 'Prebaci na srpski'}
            >
              <Languages className="w-3.5 h-3.5 text-indigo-400" />
              <span>{lang === 'sr' ? 'SR' : 'EN'}</span>
            </button>
            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition active:scale-95"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{t('scanCardQr')}</span>
            </button>
          </div>
        </header>

        {/* Screen Body */}
        <main className="flex-1 overflow-y-auto pt-3">
          <ErrorBoundary>
            {activeTab === 'mycard' && (
              <MyCardView
                myCards={myCards}
                activeCardId={activeCardId}
                onSelectActiveCard={setActiveCardId}
                onEditActiveCard={handleEditActiveCard}
                onCreateNewCard={handleCreateNewMyCard}
                qrOptions={qrOptions}
                onOptionsChange={setQrOptions}
              />
            )}

            {activeTab === 'contacts' && (
              <ContactListView
                contacts={contacts}
                onSelectContact={(c) => setSelectedContact(c)}
                onQuickQR={(c) => setSelectedContact(c)}
                onToggleFavorite={handleToggleFavorite}
                onOpenCreate={handleCreateContact}
                onOpenScanner={() => setIsScannerOpen(true)}
              />
            )}

            {activeTab === 'import' && (
              <VCardImportExport
                onImportContacts={handleImportContacts}
                onSetAsMyCard={handleSetAsMyCard}
                contacts={contacts}
                myCard={activeMyCard}
              />
            )}
          </ErrorBoundary>
        </main>

        {/* Android Material 3 Bottom Navigation Bar */}
        <nav className="h-16 bg-slate-950/95 border-t border-slate-900/90 backdrop-blur-lg flex items-center justify-around px-2 shrink-0 z-20">
          {/* Tab 1: My Card */}
          <button
            onClick={() => setActiveTab('mycard')}
            className="flex flex-col items-center justify-center flex-1 h-full py-1 text-xs group"
          >
            <div
              className={`px-4 py-1 rounded-full transition-all duration-200 ${
                activeTab === 'mycard'
                  ? 'bg-indigo-600/20 text-indigo-400'
                  : 'text-slate-400 group-hover:text-slate-200'
              }`}
            >
              <QrCode className="w-5 h-5" />
            </div>
            <span
              className={`text-[11px] font-medium mt-0.5 ${
                activeTab === 'mycard' ? 'text-indigo-400 font-semibold' : 'text-slate-400'
              }`}
            >
              {t('navMyCard')}
            </span>
          </button>

          {/* Tab 2: Scan (Center Action) */}
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex flex-col items-center justify-center flex-1 h-full py-1 text-xs group"
          >
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 group-active:scale-95 transition-all">
              <Camera className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-slate-200 mt-0.5">
              {t('navScan')}
            </span>
          </button>

          {/* Tab 3: Contacts */}
          <button
            onClick={() => setActiveTab('contacts')}
            className="flex flex-col items-center justify-center flex-1 h-full py-1 text-xs group"
          >
            <div
              className={`px-4 py-1 rounded-full transition-all duration-200 ${
                activeTab === 'contacts'
                  ? 'bg-indigo-600/20 text-indigo-400'
                  : 'text-slate-400 group-hover:text-slate-200'
              }`}
            >
              <Users className="w-5 h-5" />
            </div>
            <span
              className={`text-[11px] font-medium mt-0.5 ${
                activeTab === 'contacts' ? 'text-indigo-400 font-semibold' : 'text-slate-400'
              }`}
            >
              {t('navContacts')} ({contacts.length})
            </span>
          </button>

          {/* Tab 4: VCF Import & Tools */}
          <button
            onClick={() => setActiveTab('import')}
            className="flex flex-col items-center justify-center flex-1 h-full py-1 text-xs group"
          >
            <div
              className={`px-4 py-1 rounded-full transition-all duration-200 ${
                activeTab === 'import'
                  ? 'bg-indigo-600/20 text-indigo-400'
                  : 'text-slate-400 group-hover:text-slate-200'
              }`}
            >
              <FileUp className="w-5 h-5" />
            </div>
            <span
              className={`text-[11px] font-medium mt-0.5 ${
                activeTab === 'import' ? 'text-indigo-400 font-semibold' : 'text-slate-400'
              }`}
            >
              {t('navImport')}
            </span>
          </button>
        </nav>

        {/* Live QR Camera Scanner Modal */}
        <QRScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onSaveContact={(c) => {
            handleSaveContact(c);
          }}
          existingContacts={contacts}
        />

        {/* Selected Contact Detail Drawer */}
        <ContactDetailModal
          contact={selectedContact}
          onClose={() => setSelectedContact(null)}
          onEdit={(c) => {
            setSelectedContact(null);
            handleEditContact(c);
          }}
          onDelete={handleDeleteContact}
          onToggleFavorite={handleToggleFavorite}
          qrOptions={qrOptions}
        />

        {/* Contact / My Card Editor Modal */}
        <EditContactModal
          initialContact={editingContact}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveFromEditor}
          titleText={
            editTarget === 'mycard'
              ? editingContact
                ? t('editMyCard')
                : t('createNewMyCard')
              : editingContact
              ? t('editContact')
              : t('addContact')
          }
        />
      </div>
    </AndroidFrame>
  );
}
