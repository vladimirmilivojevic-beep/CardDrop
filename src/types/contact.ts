export interface ContactPhone {
  type: 'MOBILE' | 'WORK' | 'HOME' | 'MAIN' | 'OTHER';
  number: string;
}

export interface ContactEmail {
  type: 'WORK' | 'HOME' | 'OTHER';
  email: string;
}

export interface ContactAddress {
  type?: 'WORK' | 'HOME' | 'OTHER';
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  formatted?: string;
}

export interface ContactSocial {
  platform: 'linkedin' | 'twitter' | 'github' | 'instagram' | 'telegram' | 'whatsapp' | 'website';
  url: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  formattedName: string;
  title?: string;
  organization?: string;
  department?: string;
  phones: ContactPhone[];
  emails: ContactEmail[];
  addresses: ContactAddress[];
  urls: string[];
  socials?: ContactSocial[];
  note?: string;
  birthday?: string;
  photoUrl?: string; // Data URL or base64
  isFavorite?: boolean;
  category?: 'Personal' | 'Work' | 'Networking' | 'Client' | 'Other';
  source?: 'imported' | 'scanned' | 'manual';
  rawVcard?: string;
  createdAt: number;
  updatedAt: number;
}

export interface QROptions {
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  colorDark: string;
  colorLight: string;
  compactMode: boolean; // Omits extra notes/photo for denser, easily scannable QR
  showLogoBadge: boolean;
}
