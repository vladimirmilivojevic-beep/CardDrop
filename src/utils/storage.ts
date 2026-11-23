import { Contact, QROptions } from '../types/contact';
import { generateVCardString } from './vcard';

const MY_CARDS_STORAGE_KEY = 'carddrop_my_cards_v1';
const ACTIVE_CARD_ID_KEY = 'carddrop_active_card_id_v1';
const CONTACTS_STORAGE_KEY = 'carddrop_contacts_v1';
const QR_OPTIONS_KEY = 'carddrop_qr_options_v1';

export const DEFAULT_QR_OPTIONS: QROptions = {
  errorCorrectionLevel: 'M',
  colorDark: '#0f172a',
  colorLight: '#ffffff',
  compactMode: false,
  showLogoBadge: true,
};

const INITIAL_MY_CARD: Contact = {
  id: 'my_primary_card',
  firstName: 'Alex',
  lastName: 'Rivera',
  formattedName: 'Alex Rivera',
  title: 'Senior Mobile Engineer',
  organization: 'Nova Mobile Labs',
  department: 'Android Platform',
  phones: [
    { type: 'MOBILE', number: '+1 (555) 234-5678' },
    { type: 'WORK', number: '+1 (555) 987-6543' },
  ],
  emails: [
    { type: 'WORK', email: 'alex.rivera@novamobile.dev' },
    { type: 'HOME', email: 'alex.rivera@gmail.com' },
  ],
  addresses: [
    {
      type: 'WORK',
      street: '400 Congress Ave, Suite 1200',
      city: 'Austin',
      state: 'TX',
      postalCode: '78701',
      country: 'USA',
      formatted: '400 Congress Ave, Suite 1200, Austin, TX 78701, USA',
    },
  ],
  urls: ['https://novamobile.dev', 'https://github.com/alexrivera-dev'],
  socials: [
    { platform: 'linkedin', url: 'https://linkedin.com/in/alex-rivera-tech' },
    { platform: 'github', url: 'https://github.com/alexrivera-dev' },
  ],
  note: 'Passionate about Kotlin, Jetpack Compose, high-performance mobile UI, and offline-first apps.',
  birthday: '1992-07-14',
  category: 'Work',
  source: 'manual',
  createdAt: Date.now() - 86400000 * 3,
  updatedAt: Date.now() - 86400000 * 3,
};

const SEED_CONTACTS: Contact[] = [
  {
    id: 'contact_seed_1',
    firstName: 'Sarah',
    lastName: 'Chen',
    formattedName: 'Sarah Chen',
    title: 'Principal Product Designer',
    organization: 'Apex Interactive',
    phones: [{ type: 'MOBILE', number: '+1 (415) 890-1234' }],
    emails: [{ type: 'WORK', email: 'sarah.chen@apexdesign.io' }],
    addresses: [
      {
        type: 'WORK',
        street: '550 Howard St',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        country: 'USA',
        formatted: '550 Howard St, San Francisco, CA 94105, USA',
      },
    ],
    urls: ['https://sarahchen.design'],
    socials: [
      { platform: 'linkedin', url: 'https://linkedin.com/in/sarahchendesign' },
      { platform: 'twitter', url: 'https://x.com/sarahdesigns' },
    ],
    note: 'Met at Droidcon SF 2026. Discussion on Material You dynamic color theming in Android 15.',
    isFavorite: true,
    category: 'Networking',
    source: 'scanned',
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'contact_seed_2',
    firstName: 'Marcus',
    lastName: 'Vance',
    formattedName: 'Marcus Vance',
    title: 'Founder & CTO',
    organization: 'HyperScale AI',
    phones: [{ type: 'MOBILE', number: '+1 (206) 555-7890' }],
    emails: [{ type: 'WORK', email: 'marcus@hyperscale.ai' }],
    addresses: [
      {
        type: 'WORK',
        street: '1201 3rd Ave',
        city: 'Seattle',
        state: 'WA',
        postalCode: '98101',
        country: 'USA',
        formatted: '1201 3rd Ave, Seattle, WA 98101, USA',
      },
    ],
    urls: ['https://hyperscale.ai'],
    socials: [
      { platform: 'linkedin', url: 'https://linkedin.com/in/marcusvance' },
      { platform: 'github', url: 'https://github.com/mvance-tech' },
    ],
    note: 'Interested in partnering on on-device machine learning for mobile camera processing.',
    isFavorite: true,
    category: 'Work',
    source: 'imported',
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 4,
  },
  {
    id: 'contact_seed_3',
    firstName: 'Elena',
    lastName: 'Rostova',
    formattedName: 'Elena Rostova',
    title: 'Cloud & Security Architect',
    organization: 'ShieldWave Global',
    phones: [{ type: 'MOBILE', number: '+44 20 7946 0912' }],
    emails: [{ type: 'WORK', email: 'elena.rostova@shieldwave.eu' }],
    addresses: [
      {
        type: 'WORK',
        street: '10 Gresham Street',
        city: 'London',
        postalCode: 'EC2V 7JD',
        country: 'United Kingdom',
        formatted: '10 Gresham Street, London, EC2V 7JD, UK',
      },
    ],
    urls: ['https://shieldwave.eu'],
    socials: [{ platform: 'linkedin', url: 'https://linkedin.com/in/elena-rostova-sec' }],
    note: 'Expert in end-to-end encryption and mobile app sandboxing.',
    isFavorite: false,
    category: 'Client',
    source: 'scanned',
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 5,
  },
];

export function getStoredMyCards(): Contact[] {
  try {
    const raw = localStorage.getItem(MY_CARDS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(MY_CARDS_STORAGE_KEY, JSON.stringify([INITIAL_MY_CARD]));
      return [INITIAL_MY_CARD];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [INITIAL_MY_CARD];
  } catch {
    return [INITIAL_MY_CARD];
  }
}

export function saveStoredMyCards(cards: Contact[]) {
  try {
    localStorage.setItem(MY_CARDS_STORAGE_KEY, JSON.stringify(cards));
  } catch (err) {
    console.error('Failed to save my cards to localStorage', err);
  }
}

export function getActiveCardId(): string {
  try {
    const id = localStorage.getItem(ACTIVE_CARD_ID_KEY);
    if (id) return id;
    const cards = getStoredMyCards();
    return cards[0]?.id || INITIAL_MY_CARD.id;
  } catch {
    return INITIAL_MY_CARD.id;
  }
}

export function saveActiveCardId(id: string) {
  try {
    localStorage.setItem(ACTIVE_CARD_ID_KEY, id);
  } catch (err) {
    console.error('Failed to save active card id', err);
  }
}

export function getStoredContacts(): Contact[] {
  try {
    const raw = localStorage.getItem(CONTACTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(SEED_CONTACTS));
      return SEED_CONTACTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_CONTACTS;
  } catch {
    return SEED_CONTACTS;
  }
}

export function saveStoredContacts(contacts: Contact[]) {
  try {
    localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(contacts));
  } catch (err) {
    console.error('Failed to save contacts to localStorage', err);
  }
}

export function getStoredQROptions(): QROptions {
  try {
    const raw = localStorage.getItem(QR_OPTIONS_KEY);
    if (!raw) return DEFAULT_QR_OPTIONS;
    return { ...DEFAULT_QR_OPTIONS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_QR_OPTIONS;
  }
}

export function saveStoredQROptions(options: QROptions) {
  try {
    localStorage.setItem(QR_OPTIONS_KEY, JSON.stringify(options));
  } catch (err) {
    console.error('Failed to save QR options', err);
  }
}
