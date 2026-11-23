import { Contact, ContactPhone, ContactEmail, ContactAddress } from '../types/contact';

export interface ParsedCardData {
  fullName: string;
  firstName: string;
  lastName: string;
  title: string;
  organization: string;
  phones: ContactPhone[];
  emails: ContactEmail[];
  websites: string[];
  addresses: ContactAddress[];
  note: string;
  rawText: string;
  confidenceScore: number;
}

// Common job titles and keywords (English + Serbian)
const TITLE_KEYWORDS = [
  // English
  'ceo', 'cto', 'cfo', 'coo', 'cmo', 'cio', 'cpo', 'president', 'vice president', 'vp',
  'founder', 'co-founder', 'cofounder', 'owner', 'partner', 'managing partner', 'principal',
  'director', 'managing director', 'executive director', 'creative director', 'art director',
  'manager', 'general manager', 'sales manager', 'project manager', 'product manager',
  'lead', 'team lead', 'tech lead', 'head of', 'chief',
  'engineer', 'software engineer', 'senior engineer', 'staff engineer', 'developer', 'frontend', 'backend', 'full stack',
  'architect', 'solutions architect', 'designer', 'ui/ux', 'product designer', 'graphic designer',
  'consultant', 'senior consultant', 'advisor', 'analyst', 'specialist', 'coordinator',
  'attorney', 'lawyer', 'counsel', 'associate', 'broker', 'realtor', 'real estate',
  'account executive', 'business development', 'representative', 'officer',
  'doctor', 'physician', 'surgeon', 'professor', 'instructor', 'researcher', 'scientist',
  // Serbian (Latinica + ascii fallback)
  'direktor', 'generalni direktor', 'izvršni direktor', 'izvrsni direktor', 'tehnički direktor', 'tehnicki direktor',
  'finansijski direktor', 'komercijalni direktor', 'kreativni direktor', 'umetnički direktor',
  'menadžer', 'menadzer', 'menadžer prodaje', 'menadzer prodaje', 'projekt menadžer', 'rukovodilac', 'šef', 'sef',
  'vlasnik', 'suvlasnik', 'osnivač', 'osnivac', 'suosnivač', 'suosnivac', 'predsednik', 'potpredsednik',
  'inženjer', 'inzenjer', 'dipl. ing', 'dipl. inž', 'dipl. inz', 'softverski inženjer', 'programer',
  'arhitekta', 'projektant', 'dizajner', 'grafički dizajner', 'konsultant', 'savetnik', 'analitičar', 'analiticar',
  'specijalista', 'saradnik', 'koordinator', 'komercijalista', 'prodaja', 'marketing', 'računovođa', 'racunovodja',
  'knjigovođa', 'knjigovodja', 'advokat', 'pravnik', 'notar', 'javni beležnik', 'sudski tumač',
  'doktor', 'lekar', 'stomatolog', 'zubar', 'kardiolog', 'hirurg', 'profesor', 'predavač', 'istraživač', 'agent'
];

// Common corporate suffixes & identifiers (English + Serbian)
const COMPANY_SUFFIXES = [
  // English
  'inc', 'inc.', 'llc', 'llp', 'ltd', 'ltd.', 'corp', 'corp.', 'corporation',
  'company', 'co.', 'group', 'holdings', 'technologies', 'technology', 'tech',
  'solutions', 'studio', 'studios', 'agency', 'labs', 'consulting', 'enterprises',
  'ventures', 'capital', 'partners', 'associates', 'industries', 'international',
  'systems', 'logistics', 'services', 'bank', 'foundation', 'institute',
  // Serbian
  'd.o.o.', 'd.o.o', 'doo', 'a.d.', 'a.d', 'p.r.', 'p.r', 's.z.r.', 's.t.r.', 's.z.t.r.', 'o.d.', 'k.d.',
  'preduzeće', 'preduzece', 'kompanija', 'agencija', 'biro', 'kancelarija', 'ordinacija', 'poliklinika',
  'klinika', 'apoteka', 'banka', 'institut', 'centar', 'grupa', 'holding', 'udruženje', 'udruzenje',
  'fondacija', 'servis', 'promet', 'trgovina', 'inženjering', 'inzenjering', 'gradnja', 'transport'
];

// Street address indicators (English + Serbian)
const ADDRESS_KEYWORDS = [
  // English
  'street', 'st.', 'st', 'avenue', 'ave.', 'ave', 'boulevard', 'blvd.', 'blvd',
  'road', 'rd.', 'rd', 'drive', 'dr.', 'dr', 'lane', 'ln.', 'ln', 'way', 'court', 'ct.', 'ct',
  'circle', 'cir.', 'cir', 'parkway', 'pkwy', 'suite', 'ste.', 'ste', 'floor', 'fl.', 'fl',
  'unit', 'building', 'bldg', 'p.o. box', 'po box', 'box', 'plaza', 'hwy', 'highway',
  // Serbian
  'ul.', 'ulica', 'bulevar', 'bul.', 'trg', 'bb', 'sprat', 'stan', 'lokal', 'lamela', 'ulaz',
  'beograd', 'novi beograd', 'zemun', 'novi sad', 'niš', 'nis', 'kragujevac', 'subotica',
  'pančevo', 'pancevo', 'čačak', 'cacak', 'kraljevo', 'smederevo', 'zrenjanin', 'šabac', 'sabac',
  'užice', 'uzice', 'valjevo', 'kruševac', 'krusevac', 'leskovac', 'srbija', 'serbia', 'crna gora', 'podgorica'
];

// US State abbreviations
const US_STATES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA',
  'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT',
  'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
]);

/**
 * Parses raw OCR text lines from a physical business card (Serbian or English) into structured contact data.
 */
export function parseBusinessCardOCR(rawText: string): ParsedCardData {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const emails: ContactEmail[] = [];
  const phones: ContactPhone[] = [];
  const websites: string[] = [];
  const addressLines: string[] = [];
  const noteLines: string[] = [];

  let candidateName = '';
  let candidateTitle = '';
  let candidateOrg = '';

  const usedLines = new Set<number>();

  // 1. Extract Emails
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  lines.forEach((line, idx) => {
    const matches = line.match(emailRegex);
    if (matches) {
      matches.forEach((email) => {
        const cleanEmail = email.toLowerCase().replace(/[.,;:]$/, '');
        if (!emails.some((e) => e.email === cleanEmail)) {
          emails.push({
            type: emails.length === 0 ? 'WORK' : 'HOME',
            email: cleanEmail,
          });
        }
      });
      const remainder = line
        .replace(emailRegex, '')
        .replace(/\b(e-?mail|imejl|mail|e-?pošta|eposta)\b/gi, '')
        .replace(/[|/•\-:,\s]/g, '');
      if (remainder.length < 3) {
        usedLines.add(idx);
      }
    }
  });

  // 2. Extract Websites (including .rs, .co.rs, .org.rs, .ba, .hr, .me, .eu)
  const urlRegex = /\b(?:https?:\/\/|www\.)[^\s/$.?#].[^\s]*/gi;
  const domainRegex = /\b[a-zA-Z0-9-]+\.(?:co\.rs|org\.rs|edu\.rs|in\.rs|ac\.rs|rs|com|org|net|io|co|ai|dev|app|edu|gov|me|ba|hr|si|mk|eu|info|biz|ca|uk|de|tech|design|agency|cloud|store|xyz)\b(?:\/[^\s]*)?/gi;

  lines.forEach((line, idx) => {
    const lineWithoutEmails = line.replace(emailRegex, '');
    const urlMatches = lineWithoutEmails.match(urlRegex) || [];
    const domainMatches = lineWithoutEmails.match(domainRegex) || [];
    const allMatches = [...urlMatches, ...domainMatches];

    allMatches.forEach((site) => {
      let clean = site.trim().replace(/[.,;:]$/, '');
      if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
        clean = 'https://' + clean;
      }
      const normalized = clean.replace(/^https?:\/\/www\./i, 'https://').toLowerCase();
      if (!websites.some((w) => w.replace(/^https?:\/\/www\./i, 'https://').toLowerCase() === normalized)) {
        websites.push(clean);
      }
    });

    const remainder = lineWithoutEmails
      .replace(urlRegex, '')
      .replace(domainRegex, '')
      .replace(/\b(web|veb|website|sajt|portfolio|linkedin)\b/gi, '')
      .replace(/[|/•\-:,\s]/g, '');
    if (allMatches.length > 0 && remainder.length < 3) {
      usedLines.add(idx);
    }
  });

  // 3. Extract Phone Numbers (supports +381 64 123 4567, 064/123-4567, +1 (555) 123-4567, etc.)
  const phoneRegex = /(?:(?:\+|00)\d{1,3}[\s./-]?)?(?:\(?\d{2,4}\)?[\s./-]?)?\d{3,4}[\s./-]?\d{3,4}(?:[\s./-]?\d{1,4})?/g;

  lines.forEach((line, idx) => {
    const lower = line.toLowerCase();
    const hasPhoneLabel = /\b(tel|telefon|phone|mob|mobilni|mobile|cell|direct|direktno|office|kancelarija|fiksni|work|posao|fax|faks|ph|m|t|p|d|o)\s*[:.]/i.test(line);

    const digitsOnly = line.replace(/\D/g, '');
    if (digitsOnly.length >= 7 && (hasPhoneLabel || digitsOnly.length <= 15)) {
      const isLikelyAddress = ADDRESS_KEYWORDS.some((kw) => {
        const regex = new RegExp(`\\b${kw.replace('.', '\\.')}\\b`, 'i');
        return regex.test(lower);
      });
      if (!isLikelyAddress || hasPhoneLabel) {
        const matches = line.match(phoneRegex);
        if (matches) {
          matches.forEach((num) => {
            const numClean = num.trim();
            const cleanDigits = numClean.replace(/\D/g, '');
            if (cleanDigits.length >= 7 && cleanDigits.length <= 15) {
              let type: 'WORK' | 'MOBILE' | 'HOME' | 'OTHER' = 'WORK';
              if (/mobile|mobilni|\bmob\b|cell|\bm\b|\+381\s*6|06\d/i.test(line)) type = 'MOBILE';
              else if (/home|kućni|kucni/i.test(line)) type = 'HOME';
              else if (/fax|faks/i.test(line)) type = 'OTHER';

              if (!phones.some((p) => p.number.replace(/\D/g, '') === cleanDigits)) {
                phones.push({
                  type,
                  number: numClean,
                });
              }
            }
          });

          const remainder = line
            .replace(phoneRegex, '')
            .replace(/\b(tel|telefon|phone|mob|mobilni|mobile|cell|direct|direktno|office|kancelarija|fiksni|work|posao|fax|faks|ph)\b/gi, '')
            .replace(/[|/•\-:.,\s]/g, '');
          if (hasPhoneLabel || remainder.length < 4) {
            usedLines.add(idx);
          }
        }
      }
    }
  });

  // 4. Extract Physical Address lines
  lines.forEach((line, idx) => {
    if (usedLines.has(idx)) return;
    const lower = line.toLowerCase();

    const hasAddressWord = ADDRESS_KEYWORDS.some((kw) => {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(^|[\\s,])${escaped}($|[\\s,.])`, 'i');
      return regex.test(lower);
    });
    const hasZip = /\b\d{5}(?:-\d{4})?\b/.test(line);
    const hasStateZip = Array.from(US_STATES).some((st) => new RegExp(`\\b${st}\\s+\\d{5}`, 'i').test(line));

    if (hasAddressWord || hasZip || hasStateZip) {
      addressLines.push(line);
      usedLines.add(idx);
    }
  });

  // 5. Identify Job Title from remaining lines
  lines.forEach((line, idx) => {
    if (usedLines.has(idx) || candidateTitle) return;
    const lower = line.toLowerCase();

    for (const kw of TITLE_KEYWORDS) {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(^|[\\s,/&-])${escaped}($|[\\s.,/&-])`, 'i');
      if (regex.test(lower)) {
        candidateTitle = cleanText(line);
        usedLines.add(idx);
        break;
      }
    }
  });

  // 6. Identify Company / Organization from remaining lines
  lines.forEach((line, idx) => {
    if (usedLines.has(idx) || candidateOrg) return;
    const lower = line.toLowerCase();

    for (const suffix of COMPANY_SUFFIXES) {
      const escaped = suffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(^|[\\s,])${escaped}($|[\\s.,])`, 'i');
      if (regex.test(lower)) {
        candidateOrg = cleanText(line);
        usedLines.add(idx);
        break;
      }
    }
  });

  // 7. Extract Person Name from top remaining lines (supports Serbian Latin letters ČĆĐŠŽčćđšž)
  for (let idx = 0; idx < lines.length; idx++) {
    if (usedLines.has(idx)) continue;
    const line = lines[idx];

    if (/\d/.test(line)) continue;
    if (/[@/:_#=]/.test(line)) continue;

    const words = line.split(/\s+/).filter(Boolean);
    if (words.length >= 2 && words.length <= 4) {
      const isLikelyName = words.every(
        (w) =>
          /^[A-ZČĆĐŠŽ][a-zA-ZČĆĐŠŽčćđšžÀ-ÿ'.-]*$/.test(w) ||
          /^[A-ZČĆĐŠŽ]\.?$/.test(w) ||
          /^(dr|mr|prof|ing)\.?$/i.test(w)
      );
      if (isLikelyName || (!candidateName && words.length >= 2)) {
        candidateName = cleanText(line);
        usedLines.add(idx);
        break;
      }
    }
  }

  // If still no name, grab the first non-used line that is clean
  if (!candidateName) {
    for (let idx = 0; idx < lines.length; idx++) {
      if (!usedLines.has(idx) && lines[idx].length > 2 && lines[idx].length < 35 && !/\d/.test(lines[idx])) {
        candidateName = cleanText(lines[idx]);
        usedLines.add(idx);
        break;
      }
    }
  }

  // If no company found yet, check first 3 lines if they weren't used
  if (!candidateOrg) {
    for (let idx = 0; idx < Math.min(3, lines.length); idx++) {
      if (!usedLines.has(idx) && lines[idx] !== candidateName && lines[idx].length > 2) {
        candidateOrg = cleanText(lines[idx]);
        usedLines.add(idx);
        break;
      }
    }
  }

  // Collect any remaining unused lines into notes
  lines.forEach((line, idx) => {
    if (!usedLines.has(idx)) {
      noteLines.push(line);
    }
  });

  const nameParts = candidateName.split(/\s+/);
  const firstName = nameParts.length > 0 ? nameParts[0] : '';
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

  const addresses: ContactAddress[] = [];
  if (addressLines.length > 0) {
    addresses.push({
      type: 'WORK',
      formatted: addressLines.join(', '),
      street: addressLines[0] || '',
      city: addressLines.length > 1 ? addressLines[1] : '',
      state: '',
      postalCode: '',
      country: '',
    });
  }

  let confidence = 20;
  if (candidateName) confidence += 25;
  if (candidateTitle) confidence += 15;
  if (candidateOrg) confidence += 10;
  if (phones.length > 0) confidence += 15;
  if (emails.length > 0) confidence += 15;

  return {
    fullName: candidateName || 'Scanned Contact',
    firstName,
    lastName,
    title: candidateTitle,
    organization: candidateOrg,
    phones,
    emails,
    websites,
    addresses,
    note: noteLines.join('\n'),
    rawText,
    confidenceScore: Math.min(100, confidence),
  };
}

function cleanText(text: string): string {
  return text
    .replace(/[|•~_—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Converts parsed card data into a ready-to-save Contact object
 */
export function parsedCardToContact(data: ParsedCardData, cardPhotoUrl?: string): Contact {
  const id = 'contact_ocr_' + Math.random().toString(36).substring(2, 9);
  const now = Date.now();

  return {
    id,
    firstName: data.firstName || data.fullName,
    lastName: data.lastName,
    formattedName: data.fullName || 'Business Card Contact',
    organization: data.organization,
    title: data.title,
    phones: data.phones,
    emails: data.emails,
    addresses: data.addresses,
    urls: data.websites,
    note: data.note ? `[OCR]\n${data.note}` : '',
    photoUrl: cardPhotoUrl,
    source: 'scanned',
    createdAt: now,
    updatedAt: now,
  };
}
