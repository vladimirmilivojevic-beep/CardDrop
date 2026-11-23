import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Check, User, Phone, Mail, Building, MapPin, Globe, FileText } from 'lucide-react';
import { Contact, ContactPhone, ContactEmail, ContactAddress } from '../types/contact';
import { useLanguage } from '../i18n/LanguageContext';

interface EditContactModalProps {
  initialContact?: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (contact: Contact) => void;
  titleText?: string;
}

export const EditContactModal: React.FC<EditContactModalProps> = ({
  initialContact,
  isOpen,
  onClose,
  onSave,
  titleText,
}) => {
  const { t } = useLanguage();
  const [firstName, setFirstName] = useState(initialContact?.firstName || '');
  const [lastName, setLastName] = useState(initialContact?.lastName || '');
  const [title, setTitle] = useState(initialContact?.title || '');
  const [organization, setOrganization] = useState(initialContact?.organization || '');
  const [department, setDepartment] = useState(initialContact?.department || '');
  const [category, setCategory] = useState<Contact['category']>(initialContact?.category || 'Work');
  const [note, setNote] = useState(initialContact?.note || '');

  const [phones, setPhones] = useState<ContactPhone[]>(
    initialContact?.phones?.length
      ? initialContact.phones
      : [{ type: 'MOBILE', number: '' }]
  );

  const [emails, setEmails] = useState<ContactEmail[]>(
    initialContact?.emails?.length
      ? initialContact.emails
      : [{ type: 'WORK', email: '' }]
  );

  const [address, setAddress] = useState<ContactAddress>(
    initialContact?.addresses?.[0] || {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    }
  );

  const [url, setUrl] = useState(initialContact?.urls?.[0] || '');

  useEffect(() => {
    if (!isOpen) return;
    setFirstName(initialContact?.firstName || '');
    setLastName(initialContact?.lastName || '');
    setTitle(initialContact?.title || '');
    setOrganization(initialContact?.organization || '');
    setDepartment(initialContact?.department || '');
    setCategory(initialContact?.category || 'Work');
    setNote(initialContact?.note || '');
    setPhones(
      initialContact?.phones?.length
        ? initialContact.phones
        : [{ type: 'MOBILE', number: '' }]
    );
    setEmails(
      initialContact?.emails?.length
        ? initialContact.emails
        : [{ type: 'WORK', email: '' }]
    );
    setAddress(
      initialContact?.addresses?.[0] || {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
      }
    );
    setUrl(initialContact?.urls?.[0] || '');
  }, [initialContact, isOpen]);

  if (!isOpen) return null;

  const translateCategory = (cat: string) => {
    switch (cat) {
      case 'Work': return t('catWork');
      case 'Personal': return t('catPersonal');
      case 'Networking': return t('catNetworking');
      case 'Client': return t('catClient');
      default: return t('catOther');
    }
  };

  const handleAddPhone = () => {
    setPhones([...phones, { type: 'MOBILE', number: '' }]);
  };

  const handleRemovePhone = (index: number) => {
    setPhones(phones.filter((_, i) => i !== index));
  };

  const handleAddEmail = () => {
    setEmails([...emails, { type: 'WORK', email: '' }]);
  };

  const handleRemoveEmail = (index: number) => {
    setEmails(emails.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formattedName =
      [firstName, lastName].filter(Boolean).join(' ') ||
      organization ||
      t('untitledContact');

    const validPhones = phones.filter((p) => p.number.trim());
    const validEmails = emails.filter((e) => e.email.trim());

    const formattedAdr = [
      address.street,
      address.city,
      address.state,
      address.postalCode,
      address.country,
    ]
      .filter(Boolean)
      .join(', ');

    const validAddresses = formattedAdr
      ? [
          {
            ...address,
            formatted: formattedAdr,
          },
        ]
      : [];

    const validUrls = url.trim() ? [url.trim()] : [];

    const updatedContact: Contact = {
      id: initialContact?.id || 'contact_' + Math.random().toString(36).substring(2, 9),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      formattedName,
      title: title.trim(),
      organization: organization.trim(),
      department: department.trim(),
      phones: validPhones,
      emails: validEmails,
      addresses: validAddresses,
      urls: validUrls,
      note: note.trim(),
      category,
      source: initialContact?.source || 'manual',
      isFavorite: initialContact?.isFavorite || false,
      createdAt: initialContact?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    onSave(updatedContact);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-400" />
            {titleText || t('editContact')}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-4 text-xs">
          {/* Category Pill Select */}
          <div>
            <label className="text-slate-400 block mb-1.5 font-medium">{t('category')}</label>
            <div className="flex flex-wrap gap-1.5">
              {(['Work', 'Personal', 'Networking', 'Client', 'Other'] as const).map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                    category === cat
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {translateCategory(cat)}
                </button>
              ))}
            </div>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-slate-400 block mb-1 font-medium">{t('firstName')}</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={t('firstNamePlaceholder')}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1 font-medium">{t('lastName')}</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={t('lastNamePlaceholder')}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
              />
            </div>
          </div>

          {/* Work / Organization */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-slate-400 block mb-1 font-medium flex items-center gap-1">
                <Building className="w-3 h-3 text-indigo-400" /> {t('organization')}
              </label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder={t('orgPlaceholder')}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1 font-medium">{t('titleRole')}</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('titlePlaceholder')}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
              />
            </div>
          </div>

          {/* Phones */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-400 font-medium flex items-center gap-1">
                <Phone className="w-3 h-3 text-emerald-400" /> {t('phoneNumbers')}
              </label>
              <button
                type="button"
                onClick={handleAddPhone}
                className="text-indigo-400 hover:text-indigo-300 text-[11px] font-semibold flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" /> {t('addPhone')}
              </button>
            </div>
            {phones.map((phone, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <select
                  value={phone.type}
                  onChange={(e) => {
                    const next = [...phones];
                    next[idx].type = e.target.value as ContactPhone['type'];
                    setPhones(next);
                  }}
                  className="px-2 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="MOBILE">{t('typeMOBILE')}</option>
                  <option value="WORK">{t('typeWORK')}</option>
                  <option value="HOME">{t('typeHOME')}</option>
                  <option value="MAIN">{t('typeMAIN')}</option>
                </select>
                <input
                  type="tel"
                  value={phone.number}
                  onChange={(e) => {
                    const next = [...phones];
                    next[idx].number = e.target.value;
                    setPhones(next);
                  }}
                  placeholder={t('phonePlaceholder')}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
                />
                {phones.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePhone(idx)}
                    className="p-1.5 text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Emails */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-400 font-medium flex items-center gap-1">
                <Mail className="w-3 h-3 text-sky-400" /> {t('emailAddresses')}
              </label>
              <button
                type="button"
                onClick={handleAddEmail}
                className="text-indigo-400 hover:text-indigo-300 text-[11px] font-semibold flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" /> {t('addEmail')}
              </button>
            </div>
            {emails.map((email, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <select
                  value={email.type}
                  onChange={(e) => {
                    const next = [...emails];
                    next[idx].type = e.target.value as ContactEmail['type'];
                    setEmails(next);
                  }}
                  className="px-2 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="WORK">{t('emailWORK')}</option>
                  <option value="HOME">{t('emailHOME')}</option>
                  <option value="OTHER">{t('emailOTHER')}</option>
                </select>
                <input
                  type="email"
                  value={email.email}
                  onChange={(e) => {
                    const next = [...emails];
                    next[idx].email = e.target.value;
                    setEmails(next);
                  }}
                  placeholder={t('emailPlaceholder')}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
                />
                {emails.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveEmail(idx)}
                    className="p-1.5 text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <label className="text-slate-400 font-medium flex items-center gap-1">
              <MapPin className="w-3 h-3 text-rose-400" /> {t('address')}
            </label>
            <input
              type="text"
              value={address.street || ''}
              onChange={(e) => setAddress({ ...address, street: e.target.value })}
              placeholder={t('streetPlaceholder')}
              className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={address.city || ''}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                placeholder={t('cityPlaceholder')}
                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
              />
              <input
                type="text"
                value={address.state || ''}
                onChange={(e) => setAddress({ ...address, state: e.target.value })}
                placeholder={t('statePlaceholder')}
                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
              />
              <input
                type="text"
                value={address.country || ''}
                onChange={(e) => setAddress({ ...address, country: e.target.value })}
                placeholder={t('countryPlaceholder')}
                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
              />
            </div>
          </div>

          {/* Website */}
          <div>
            <label className="text-slate-400 block mb-1 font-medium flex items-center gap-1">
              <Globe className="w-3 h-3 text-indigo-400" /> {t('websiteLabel')}
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t('websitePlaceholder')}
              className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
            />
          </div>

          {/* Note */}
          <div>
            <label className="text-slate-400 block mb-1 font-medium flex items-center gap-1">
              <FileText className="w-3 h-3 text-amber-400" /> {t('notes')}
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('notesPlaceholder')}
              className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs resize-none"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{t('saveContact')}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
