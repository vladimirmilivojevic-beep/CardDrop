import React, { useState } from 'react';
import {
  User,
  Plus,
  Edit3,
  Sliders,
  ChevronDown,
  Sparkles,
  Check,
  Smartphone
} from 'lucide-react';
import { Contact, QROptions } from '../types/contact';
import { QRCodeDisplay } from './QRCodeDisplay';
import { useLanguage } from '../i18n/LanguageContext';

interface MyCardViewProps {
  myCards: Contact[];
  activeCardId: string;
  onSelectActiveCard: (id: string) => void;
  onEditActiveCard: () => void;
  onCreateNewCard: () => void;
  qrOptions: QROptions;
  onOptionsChange: (options: QROptions) => void;
}

export const MyCardView: React.FC<MyCardViewProps> = ({
  myCards,
  activeCardId,
  onSelectActiveCard,
  onEditActiveCard,
  onCreateNewCard,
  qrOptions,
  onOptionsChange,
}) => {
  const { t } = useLanguage();
  const [showProfileSwitcher, setShowProfileSwitcher] = useState(false);

  const activeCard = myCards.find((c) => c.id === activeCardId) || myCards[0];

  return (
    <div className="w-full flex flex-col items-center pb-20">
      {/* Profile Selector Dropdown / Pill */}
      <div className="w-full max-w-sm px-4 mb-3 flex items-center justify-between">
        <div className="relative">
          <button
            onClick={() => setShowProfileSwitcher(!showProfileSwitcher)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-800 transition"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="truncate max-w-[150px]">
              {activeCard ? activeCard.formattedName : t('selectCard')}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Profile Switcher Menu */}
          {showProfileSwitcher && (
            <div className="absolute left-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-800 p-2 shadow-2xl z-40 text-xs space-y-1 animate-in fade-in">
              <div className="text-[10px] uppercase font-bold text-slate-500 px-2 py-1 tracking-wider">
                {t('myCardProfiles')}
              </div>
              {myCards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => {
                    onSelectActiveCard(card.id);
                    setShowProfileSwitcher(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition ${
                    card.id === activeCardId
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="truncate">
                    <div className="truncate">{card.formattedName}</div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {card.organization || t('personal')}
                    </div>
                  </div>
                  {card.id === activeCardId && <Check className="w-4 h-4 ml-2 shrink-0" />}
                </button>
              ))}

              <div className="border-t border-slate-800 pt-1 mt-1">
                <button
                  onClick={() => {
                    setShowProfileSwitcher(false);
                    onCreateNewCard();
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-xl text-indigo-400 hover:bg-indigo-600/10 font-medium flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('createAnotherCard')}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Edit Button */}
        <button
          onClick={onEditActiveCard}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition"
        >
          <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
          <span>{t('editCard')}</span>
        </button>
      </div>

      {/* Main QR Display */}
      {activeCard && (
        <QRCodeDisplay
          contact={activeCard}
          options={qrOptions}
          onOptionsChange={onOptionsChange}
          onEditContact={onEditActiveCard}
        />
      )}
    </div>
  );
};
