import React, { useMemo, useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  Star,
  QrCode,
  Phone,
  Mail,
  UserCheck,
  Building,
  UserX,
  Sparkles,
  Camera
} from 'lucide-react';
import { Contact } from '../types/contact';
import { useLanguage } from '../i18n/LanguageContext';

interface ContactListViewProps {
  contacts: Contact[];
  onSelectContact: (contact: Contact) => void;
  onQuickQR: (contact: Contact) => void;
  onToggleFavorite: (id: string) => void;
  onOpenCreate: () => void;
  onOpenScanner: () => void;
}

export const ContactListView: React.FC<ContactListViewProps> = ({
  contacts,
  onSelectContact,
  onQuickQR,
  onToggleFavorite,
  onOpenCreate,
  onOpenScanner,
}) => {
  const { lang, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Favorites', 'Work', 'Personal', 'Networking', 'Scanned'];

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'All':
        return t('catAll');
      case 'Favorites':
        return t('catFavorites');
      case 'Work':
        return t('catWork');
      case 'Personal':
        return t('catPersonal');
      case 'Networking':
        return t('catNetworking');
      case 'Client':
        return t('catClient');
      case 'Other':
        return t('catOther');
      case 'Scanned':
        return t('catScanned');
      default:
        return cat;
    }
  };

  const formatContactCount = (count: number) => {
    if (lang === 'en') {
      return `${count} ${count === 1 ? t('contactSingular') : t('contactMany')}`;
    }
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return `${count} ${t('contactSingular')}`;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} ${t('contactFew')}`;
    return `${count} ${t('contactMany')}`;
  };

  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      // Category filter
      if (selectedCategory === 'Favorites' && !c.isFavorite) return false;
      if (
        selectedCategory !== 'All' &&
        selectedCategory !== 'Favorites' &&
        selectedCategory !== 'Scanned' &&
        c.category !== selectedCategory
      ) {
        return false;
      }
      if (selectedCategory === 'Scanned' && c.source !== 'scanned') return false;

      // Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchName = c.formattedName.toLowerCase().includes(q);
      const matchOrg = (c.organization || '').toLowerCase().includes(q);
      const matchTitle = (c.title || '').toLowerCase().includes(q);
      const matchPhone = c.phones.some((p) => p.number.includes(q));
      const matchEmail = c.emails.some((e) => e.email.toLowerCase().includes(q));
      const matchNotes = (c.note || '').toLowerCase().includes(q);

      return matchName || matchOrg || matchTitle || matchPhone || matchEmail || matchNotes;
    });
  }, [contacts, searchQuery, selectedCategory]);

  // Group contacts by first letter
  const sortedContacts = useMemo(() => {
    return [...filteredContacts].sort((a, b) =>
      a.formattedName.localeCompare(b.formattedName)
    );
  }, [filteredContacts]);

  const getInitials = (c: Contact) => {
    if (c.firstName && c.lastName) {
      return (c.firstName[0] + c.lastName[0]).toUpperCase();
    }
    return (c.formattedName || 'C').substring(0, 2).toUpperCase();
  };

  const getAvatarGradient = (name: string) => {
    const gradients = [
      'from-blue-600 to-indigo-600',
      'from-purple-600 to-pink-600',
      'from-emerald-600 to-teal-600',
      'from-amber-600 to-orange-600',
      'from-cyan-600 to-blue-600',
      'from-rose-600 to-red-600',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return gradients[Math.abs(hash) % gradients.length];
  };

  return (
    <div className="w-full max-w-sm px-4 pb-20 flex flex-col min-h-0">
      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition shadow-inner"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs px-1"
          >
            ×
          </button>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {getCategoryLabel(cat)}
          </button>
        ))}
      </div>

      {/* Contacts Counter */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 mb-2">
        <span>{formatContactCount(filteredContacts.length)}</span>
        {selectedCategory !== 'All' && (
          <button
            onClick={() => setSelectedCategory('All')}
            className="text-indigo-400 hover:underline"
          >
            {t('resetFilter')}
          </button>
        )}
      </div>

      {/* Contacts List */}
      {sortedContacts.length > 0 ? (
        <div className="space-y-2 overflow-y-auto">
          {sortedContacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => onSelectContact(contact)}
              className="p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800/80 hover:border-slate-700/80 flex items-center justify-between gap-3 text-xs cursor-pointer transition shadow-sm group active:scale-[0.99]"
            >
              {/* Left: Avatar & Info */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${getAvatarGradient(
                    contact.formattedName
                  )} flex items-center justify-center text-white font-bold text-xs shadow shrink-0`}
                >
                  {getInitials(contact)}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-white truncate text-[13px]">
                      {contact.formattedName}
                    </span>
                    {contact.isFavorite && (
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                    )}
                  </div>

                  {(contact.title || contact.organization) && (
                    <div className="text-[11px] text-slate-400 truncate">
                      {[contact.title, contact.organization].filter(Boolean).join(' • ')}
                    </div>
                  )}

                  {contact.phones[0] && (
                    <div className="text-[10px] text-indigo-400 font-mono mt-0.5 truncate">
                      {contact.phones[0].number}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Quick Actions */}
              <div
                className="flex items-center gap-1 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Quick Show QR */}
                <button
                  onClick={() => onQuickQR(contact)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-indigo-600/20 text-slate-400 hover:text-indigo-300 transition"
                  title="Show QR Code"
                >
                  <QrCode className="w-3.5 h-3.5" />
                </button>

                {/* Quick Phone Call */}
                {contact.phones[0] && (
                  <a
                    href={`tel:${contact.phones[0].number}`}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-emerald-600/20 text-slate-400 hover:text-emerald-300 transition"
                    title="Call"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="my-auto py-12 flex flex-col items-center justify-center text-center p-6 bg-slate-900/40 rounded-3xl border border-slate-800/60">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-3">
            <UserX className="w-7 h-7" />
          </div>
          <h3 className="font-semibold text-sm text-white mb-1">{t('noContactsFound')}</h3>
          <p className="text-xs text-slate-400 max-w-[220px] mb-4">
            {searchQuery
              ? `${t('noResultsFor')} "${searchQuery}"`
              : t('emptyContactsHint')}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenScanner}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{t('scanCardOrQr')}</span>
            </button>
            <button
              onClick={onOpenCreate}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('addManually')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button (Android Material FAB) */}
      <div className="fixed bottom-20 right-6 sm:absolute sm:bottom-20 sm:right-6 z-20">
        <button
          onClick={onOpenCreate}
          className="w-13 h-13 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-xl shadow-indigo-600/40 transition-transform active:scale-95"
          title={t('createNewContact')}
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
