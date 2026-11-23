import React, { useState } from 'react';
import {
  X,
  Phone,
  Mail,
  MapPin,
  Globe,
  Share2,
  QrCode,
  Edit2,
  Trash2,
  Star,
  ExternalLink,
  MessageSquare,
  FileDown,
  Building,
  Calendar,
  Briefcase
} from 'lucide-react';
import { Contact, QROptions } from '../types/contact';
import { generateVCardString, downloadVCF } from '../utils/vcard';
import { QRCodeDisplay } from './QRCodeDisplay';
import { sounds } from '../utils/audio';
import { useLanguage } from '../i18n/LanguageContext';

interface ContactDetailModalProps {
  contact: Contact | null;
  onClose: () => void;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  qrOptions: QROptions;
}

export const ContactDetailModal: React.FC<ContactDetailModalProps> = ({
  contact,
  onClose,
  onEdit,
  onDelete,
  onToggleFavorite,
  qrOptions,
}) => {
  const { t } = useLanguage();
  const [showQR, setShowQR] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!contact) return null;

  const translateCategory = (cat?: string) => {
    switch (cat) {
      case 'Work': return t('catWork');
      case 'Personal': return t('catPersonal');
      case 'Networking': return t('catNetworking');
      case 'Client': return t('catClient');
      case 'Other': return t('catOther');
      default: return cat || '';
    }
  };

  const translatePhoneType = (type: string) => {
    switch (type) {
      case 'MOBILE': return t('typeMOBILE');
      case 'WORK': return t('typeWORK');
      case 'HOME': return t('typeHOME');
      case 'MAIN': return t('typeMAIN');
      default: return t('typeOTHER');
    }
  };

  const translateEmailType = (type: string) => {
    switch (type) {
      case 'WORK': return t('emailWORK');
      case 'HOME': return t('emailHOME');
      default: return t('emailOTHER');
    }
  };

  const translateSource = (src: string) => {
    if (src === 'scanned') return t('sourceScanned');
    if (src === 'imported') return t('sourceImported');
    return t('sourceManual');
  };

  const handleExportVCF = () => {
    const vcard = generateVCardString(contact);
    downloadVCF(vcard, contact.formattedName || 'contact');
    sounds.playSaveSuccess();
  };

  const getInitials = () => {
    if (contact.firstName && contact.lastName) {
      return (contact.firstName[0] + contact.lastName[0]).toUpperCase();
    }
    return (contact.formattedName || 'C').substring(0, 2).toUpperCase();
  };

  const categoryColors: Record<string, string> = {
    Work: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Personal: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Networking: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    Client: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Top Header & Actions */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onToggleFavorite(contact.id)}
              className={`p-2 rounded-xl transition ${
                contact.isFavorite
                  ? 'text-amber-400 hover:text-amber-300 bg-amber-400/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={contact.isFavorite ? t('removeFavorite') : t('markFavorite')}
            >
              <Star
                className="w-5 h-5"
                fill={contact.isFavorite ? 'currentColor' : 'none'}
              />
            </button>

            <button
              onClick={() => setShowQR(!showQR)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                showQR
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>{showQR ? t('details') : t('showQr')}</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(contact)}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              title={t('editContact')}
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* If showing QR code */}
        {showQR ? (
          <div className="py-4">
            <QRCodeDisplay contact={contact} options={qrOptions} />
          </div>
        ) : (
          /* Normal Details View */
          <div className="py-4 space-y-5">
            {/* Contact Hero Info */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white font-bold text-xl shadow-lg ring-2 ring-indigo-500/30 shrink-0">
                {getInitials()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-white tracking-tight truncate">
                    {contact.formattedName}
                  </h2>
                  {contact.category && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        categoryColors[contact.category] ||
                        'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {translateCategory(contact.category)}
                    </span>
                  )}
                </div>
                {(contact.title || contact.organization) && (
                  <p className="text-xs text-indigo-300 font-medium mt-0.5 truncate">
                    {[contact.title, contact.organization].filter(Boolean).join(' • ')}
                  </p>
                )}
                {contact.source && (
                  <p className="text-[10px] text-slate-500 mt-1">
                    {t('addedVia')} {translateSource(contact.source)}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Action Buttons Row */}
            <div className="grid grid-cols-4 gap-2">
              {contact.phones[0] ? (
                <a
                  href={`tel:${contact.phones[0].number}`}
                  className="flex flex-col items-center justify-center gap-1 py-2.5 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs font-medium transition"
                >
                  <Phone className="w-4 h-4" />
                  <span className="text-[10px]">{t('call')}</span>
                </a>
              ) : (
                <div className="opacity-30 flex flex-col items-center justify-center gap-1 py-2.5 bg-slate-800/40 rounded-2xl text-slate-400 text-xs font-medium">
                  <Phone className="w-4 h-4" />
                  <span className="text-[10px]">{t('call')}</span>
                </div>
              )}

              {contact.phones[0] ? (
                <a
                  href={`sms:${contact.phones[0].number}`}
                  className="flex flex-col items-center justify-center gap-1 py-2.5 bg-sky-600/10 hover:bg-sky-600/20 border border-sky-500/20 rounded-2xl text-sky-400 text-xs font-medium transition"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-[10px]">{t('message')}</span>
                </a>
              ) : (
                <div className="opacity-30 flex flex-col items-center justify-center gap-1 py-2.5 bg-slate-800/40 rounded-2xl text-slate-400 text-xs font-medium">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-[10px]">{t('message')}</span>
                </div>
              )}

              {contact.emails[0] ? (
                <a
                  href={`mailto:${contact.emails[0].email}`}
                  className="flex flex-col items-center justify-center gap-1 py-2.5 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 rounded-2xl text-indigo-400 text-xs font-medium transition"
                >
                  <Mail className="w-4 h-4" />
                  <span className="text-[10px]">{t('email')}</span>
                </a>
              ) : (
                <div className="opacity-30 flex flex-col items-center justify-center gap-1 py-2.5 bg-slate-800/40 rounded-2xl text-slate-400 text-xs font-medium">
                  <Mail className="w-4 h-4" />
                  <span className="text-[10px]">{t('email')}</span>
                </div>
              )}

              <button
                onClick={handleExportVCF}
                className="flex flex-col items-center justify-center gap-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-2xl text-slate-200 text-xs font-medium transition"
              >
                <FileDown className="w-4 h-4 text-indigo-400" />
                <span className="text-[10px]">{t('exportVcf')}</span>
              </button>
            </div>

            {/* Field Details */}
            <div className="space-y-3 text-xs">
              {/* Phone Numbers */}
              {contact.phones.length > 0 && (
                <div className="bg-slate-800/50 rounded-2xl p-3 border border-slate-700/50 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t('phoneNumbers')}</span>
                  </div>
                  {contact.phones.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-slate-200 pt-1"
                    >
                      <div>
                        <span className="font-semibold">{p.number}</span>
                        <span className="text-[10px] text-slate-500 ml-2 uppercase">
                          {translatePhoneType(p.type)}
                        </span>
                      </div>
                      <a
                        href={`tel:${p.number}`}
                        className="text-emerald-400 hover:text-emerald-300 text-[11px] font-semibold"
                      >
                        {t('call')}
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {/* Emails */}
              {contact.emails.length > 0 && (
                <div className="bg-slate-800/50 rounded-2xl p-3 border border-slate-700/50 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-sky-400" />
                    <span>{t('emailAddresses')}</span>
                  </div>
                  {contact.emails.map((e, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-slate-200 pt-1"
                    >
                      <div className="truncate mr-2">
                        <span className="font-semibold truncate block">{e.email}</span>
                        <span className="text-[10px] text-slate-500 uppercase">
                          {translateEmailType(e.type)}
                        </span>
                      </div>
                      <a
                        href={`mailto:${e.email}`}
                        className="text-sky-400 hover:text-sky-300 text-[11px] font-semibold shrink-0"
                      >
                        {t('send')}
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {/* Organization & Dept */}
              {(contact.organization || contact.title || contact.department) && (
                <div className="bg-slate-800/50 rounded-2xl p-3 border border-slate-700/50 space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{t('workAndRole')}</span>
                  </div>
                  <div className="text-slate-200 font-medium">
                    {contact.title}
                  </div>
                  {contact.organization && (
                    <div className="text-slate-400 text-[11px]">
                      {contact.organization} {contact.department ? `(${contact.department})` : ''}
                    </div>
                  )}
                </div>
              )}

              {/* Addresses */}
              {contact.addresses.length > 0 && (
                <div className="bg-slate-800/50 rounded-2xl p-3 border border-slate-700/50 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span>{t('address')}</span>
                  </div>
                  {contact.addresses.map((a, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-slate-200 pt-1"
                    >
                      <div className="text-[11px] pr-2">{a.formatted}</div>
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(a.formatted || '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-rose-400 hover:text-rose-300 text-[11px] font-semibold shrink-0 flex items-center gap-1"
                      >
                        {t('map')} <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {/* Websites */}
              {contact.urls.length > 0 && (
                <div className="bg-slate-800/50 rounded-2xl p-3 border border-slate-700/50 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{t('webAndProfiles')}</span>
                  </div>
                  {contact.urls.map((u, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-slate-200 pt-1"
                    >
                      <span className="truncate text-indigo-300 text-[11px] pr-2">
                        {u}
                      </span>
                      <a
                        href={u.startsWith('http') ? u : `https://${u}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 text-[11px] shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {/* Notes */}
              {contact.note && (
                <div className="bg-slate-800/50 rounded-2xl p-3 border border-slate-700/50">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    {t('notes')}
                  </div>
                  <p className="text-slate-300 text-[11px] whitespace-pre-wrap">
                    {contact.note}
                  </p>
                </div>
              )}
            </div>

            {/* Danger Zone: Delete Contact */}
            <div className="pt-2">
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-full py-2.5 rounded-xl border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('deleteContact')}</span>
                </button>
              ) : (
                <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl space-y-2 text-center animate-in fade-in">
                  <p className="text-xs text-rose-200">
                    {t('deleteConfirm')} {contact.formattedName}?
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onDelete(contact.id);
                        onClose();
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs"
                    >
                      {t('yesDelete')}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                    >
                      {t('cancel')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
