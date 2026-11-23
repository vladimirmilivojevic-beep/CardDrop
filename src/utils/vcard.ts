import { Contact, ContactAddress, ContactEmail, ContactPhone, ContactSocial } from '../types/contact';

/**
 * Decode Quoted-Printable strings if present in legacy VCards (v2.1)
 */
function decodeQuotedPrintable(str: string): string {
  try {
    return str
      .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/=\r?\n/g, '');
  } catch {
    return str;
  }
}

/**
 * Parse raw VCard text (single or multi-contact)
 */
export function parseVCards(vcardText: string): Contact[] {
  if (!vcardText) return [];

  // Check if it's MECARD format
  if (vcardText.trim().startsWith('MECARD:')) {
    const contact = parseMeCard(vcardText.trim());
    return contact ? [contact] : [];
  }

  // Normalize line breaks
  const normalized = vcardText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Find all VCARD blocks
  const vcardRegex = /BEGIN:VCARD[\s\S]*?END:VCARD/gi;
  const blocks = normalized.match(vcardRegex);

  if (!blocks || blocks.length === 0) {
    // If not matching strict BEGIN/END, try to parse the entire text as one block if it has FN/N/TEL
    if (/(?:FN|N|TEL|EMAIL):/i.test(normalized)) {
      return [parseSingleVCard(normalized)];
    }
    return [];
  }

  return blocks.map((block) => parseSingleVCard(block));
}

/**
 * Parse MECARD format:
 * MECARD:N:Smith,John;TEL:5551234;EMAIL:john@example.com;NOTE:Met at conf;;
 */
function parseMeCard(raw: string): Contact | null {
  const content = raw.replace(/^MECARD:/i, '');
  const fields = content.split(';');
  
  let lastName = '';
  let firstName = '';
  let formattedName = '';
  const phones: ContactPhone[] = [];
  const emails: ContactEmail[] = [];
  const addresses: ContactAddress[] = [];
  const urls: string[] = [];
  let note = '';
  let organization = '';

  for (const field of fields) {
    const colonIdx = field.indexOf(':');
    if (colonIdx === -1) continue;
    const tag = field.substring(0, colonIdx).toUpperCase();
    const val = field.substring(colonIdx + 1).trim();

    if (tag === 'N') {
      const parts = val.split(',');
      lastName = parts[0] || '';
      firstName = parts[1] || '';
      formattedName = `${firstName} ${lastName}`.trim() || val;
    } else if (tag === 'TEL') {
      phones.push({ type: 'MOBILE', number: val });
    } else if (tag === 'EMAIL') {
      emails.push({ type: 'WORK', email: val });
    } else if (tag === 'ORG') {
      organization = val;
    } else if (tag === 'ADR') {
      addresses.push({ formatted: val });
    } else if (tag === 'URL') {
      urls.push(val);
    } else if (tag === 'NOTE') {
      note = val;
    }
  }

  if (!formattedName && phones.length === 0 && emails.length === 0) {
    return null;
  }

  const id = 'contact_' + Math.random().toString(36).substring(2, 9);
  return {
    id,
    firstName: firstName || formattedName,
    lastName,
    formattedName: formattedName || 'New Contact',
    organization,
    phones,
    emails,
    addresses,
    urls,
    note,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    source: 'scanned',
    rawVcard: raw,
  };
}

/**
 * Parse a single VCard string block
 */
export function parseSingleVCard(vcardBlock: string): Contact {
  // Unfold folded lines (RFC 2426/6350: lines beginning with whitespace continue previous line)
  const lines: string[] = [];
  const rawLines = vcardBlock.split('\n');

  for (const line of rawLines) {
    if (/^[ \t]/.test(line) && lines.length > 0) {
      lines[lines.length - 1] += line.substring(1);
    } else {
      lines.push(line);
    }
  }

  let firstName = '';
  let lastName = '';
  let formattedName = '';
  let title = '';
  let organization = '';
  let department = '';
  const phones: ContactPhone[] = [];
  const emails: ContactEmail[] = [];
  const addresses: ContactAddress[] = [];
  const urls: string[] = [];
  const socials: ContactSocial[] = [];
  let note = '';
  let birthday = '';
  let photoUrl = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('BEGIN:') || trimmed.startsWith('END:') || trimmed.startsWith('VERSION:')) {
      continue;
    }

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    const propHeader = trimmed.substring(0, colonIdx);
    let value = trimmed.substring(colonIdx + 1).trim();

    // Decode Quoted-Printable if present in header
    if (/ENCODING=QUOTED-PRINTABLE/i.test(propHeader)) {
      value = decodeQuotedPrintable(value);
    }

    // Unescape common vCard characters
    value = value.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';');

    const [propName, ...params] = propHeader.split(';');
    const cleanProp = propName.toUpperCase().replace(/^ITEM\d+\./i, ''); // Strip iOS group prefixes like item1.TEL

    switch (cleanProp) {
      case 'FN':
        formattedName = value;
        break;

      case 'N': {
        const parts = value.split(';');
        lastName = parts[0]?.trim() || '';
        firstName = parts[1]?.trim() || '';
        // If FN wasn't provided, build from N
        if (!formattedName) {
          formattedName = [firstName, lastName].filter(Boolean).join(' ');
        }
        break;
      }

      case 'ORG': {
        const orgParts = value.split(';');
        organization = orgParts[0]?.trim() || '';
        if (orgParts[1]) department = orgParts[1].trim();
        break;
      }

      case 'TITLE':
      case 'ROLE':
        title = value;
        break;

      case 'TEL': {
        let pType: ContactPhone['type'] = 'MOBILE';
        const paramStr = params.join(' ').toUpperCase();
        if (paramStr.includes('WORK')) pType = 'WORK';
        else if (paramStr.includes('HOME')) pType = 'HOME';
        else if (paramStr.includes('MAIN')) pType = 'MAIN';
        else if (paramStr.includes('CELL') || paramStr.includes('MOBILE')) pType = 'MOBILE';

        // Clean phone number slightly but retain symbols
        const cleanNumber = value.trim();
        if (cleanNumber && !phones.some((p) => p.number === cleanNumber)) {
          phones.push({ type: pType, number: cleanNumber });
        }
        break;
      }

      case 'EMAIL': {
        let eType: ContactEmail['type'] = 'WORK';
        const paramStr = params.join(' ').toUpperCase();
        if (paramStr.includes('HOME') || paramStr.includes('PERSONAL')) eType = 'HOME';
        else if (paramStr.includes('WORK')) eType = 'WORK';

        const cleanEmail = value.trim();
        if (cleanEmail && !emails.some((e) => e.email.toLowerCase() === cleanEmail.toLowerCase())) {
          emails.push({ type: eType, email: cleanEmail });
        }
        break;
      }

      case 'ADR': {
        // ADR format: post-office-box;extended-address;street;locality(city);region(state);postal-code;country
        const adrParts = value.split(';');
        const street = [adrParts[1], adrParts[2]].filter(Boolean).map((s) => s.trim()).join(' ');
        const city = adrParts[3]?.trim() || '';
        const state = adrParts[4]?.trim() || '';
        const postalCode = adrParts[5]?.trim() || '';
        const country = adrParts[6]?.trim() || '';

        const formatted = [street, city, state, postalCode, country].filter(Boolean).join(', ');
        if (formatted) {
          let aType: ContactAddress['type'] = 'WORK';
          const paramStr = params.join(' ').toUpperCase();
          if (paramStr.includes('HOME')) aType = 'HOME';
          addresses.push({
            type: aType,
            street,
            city,
            state,
            postalCode,
            country,
            formatted,
          });
        }
        break;
      }

      case 'URL': {
        const urlVal = value.trim();
        if (urlVal && !urls.includes(urlVal)) {
          urls.push(urlVal);
          // Detect social platforms
          if (urlVal.includes('linkedin.com')) socials.push({ platform: 'linkedin', url: urlVal });
          else if (urlVal.includes('twitter.com') || urlVal.includes('x.com')) socials.push({ platform: 'twitter', url: urlVal });
          else if (urlVal.includes('github.com')) socials.push({ platform: 'github', url: urlVal });
          else if (urlVal.includes('instagram.com')) socials.push({ platform: 'instagram', url: urlVal });
          else if (urlVal.includes('t.me') || urlVal.includes('telegram.me')) socials.push({ platform: 'telegram', url: urlVal });
          else if (urlVal.includes('wa.me')) socials.push({ platform: 'whatsapp', url: urlVal });
        }
        break;
      }

      case 'X-SOCIALPROFILE': {
        const paramStr = params.join(' ').toLowerCase();
        let platform: ContactSocial['platform'] = 'website';
        if (paramStr.includes('linkedin')) platform = 'linkedin';
        else if (paramStr.includes('twitter')) platform = 'twitter';
        else if (paramStr.includes('github')) platform = 'github';
        else if (paramStr.includes('instagram')) platform = 'instagram';
        socials.push({ platform, url: value.trim() });
        break;
      }

      case 'NOTE':
        note = value;
        break;

      case 'BDAY':
        birthday = value;
        break;

      case 'PHOTO': {
        // Photo could be inline base64 or URI
        if (value.startsWith('http') || value.startsWith('data:image')) {
          photoUrl = value;
        } else {
          // Detect encoding
          const isBase64 = params.some((p) => /BASE64|B/i.test(p));
          let mime = 'image/jpeg';
          for (const p of params) {
            if (/TYPE=(PNG|JPEG|JPG|WEBP)/i.test(p)) {
              mime = `image/${p.split('=')[1].toLowerCase()}`;
            }
          }
          if (isBase64 || value.length > 100) {
            // Strip any whitespace
            const cleanBase64 = value.replace(/\s/g, '');
            photoUrl = `data:${mime};base64,${cleanBase64}`;
          }
        }
        break;
      }
    }
  }

  // Fallback name logic
  if (!formattedName) {
    if (firstName || lastName) {
      formattedName = `${firstName} ${lastName}`.trim();
    } else if (organization) {
      formattedName = organization;
    } else if (emails.length > 0) {
      formattedName = emails[0].email.split('@')[0];
    } else if (phones.length > 0) {
      formattedName = phones[0].number;
    } else {
      formattedName = 'Untitled Contact';
    }
  }

  const id = 'contact_' + Math.random().toString(36).substring(2, 9);
  return {
    id,
    firstName,
    lastName,
    formattedName,
    title,
    organization,
    department,
    phones,
    emails,
    addresses,
    urls,
    socials,
    note,
    birthday,
    photoUrl,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    source: 'imported',
    rawVcard: vcardBlock,
  };
}

/**
 * Generate standard compliant vCard 3.0 string
 * Compatible with Android Contacts, Google Contacts, Apple Contacts, and QR barcode readers.
 */
export function generateVCardString(contact: Contact, compact = false): string {
  const lines: string[] = ['BEGIN:VCARD', 'VERSION:3.0'];

  // Formatted Name & Name
  const fn = contact.formattedName.trim() || `${contact.firstName} ${contact.lastName}`.trim() || 'Contact';
  lines.push(`FN:${escapeVCard(fn)}`);
  lines.push(`N:${escapeVCard(contact.lastName)};${escapeVCard(contact.firstName)};;;`);

  // Organization & Title
  if (contact.organization) {
    if (contact.department && !compact) {
      lines.push(`ORG:${escapeVCard(contact.organization)};${escapeVCard(contact.department)}`);
    } else {
      lines.push(`ORG:${escapeVCard(contact.organization)}`);
    }
  }
  if (contact.title) {
    lines.push(`TITLE:${escapeVCard(contact.title)}`);
  }

  // Phones
  if (contact.phones && contact.phones.length > 0) {
    for (const phone of contact.phones) {
      const type = phone.type || 'CELL';
      lines.push(`TEL;TYPE=${type},VOICE:${phone.number.trim()}`);
    }
  }

  // Emails
  if (contact.emails && contact.emails.length > 0) {
    for (const email of contact.emails) {
      const type = email.type || 'WORK';
      lines.push(`EMAIL;TYPE=${type},INTERNET:${email.email.trim()}`);
    }
  }

  // Addresses
  if (contact.addresses && contact.addresses.length > 0) {
    for (const adr of contact.addresses) {
      const type = adr.type || 'WORK';
      const street = escapeVCard(adr.street || '');
      const city = escapeVCard(adr.city || '');
      const state = escapeVCard(adr.state || '');
      const zip = escapeVCard(adr.postalCode || '');
      const country = escapeVCard(adr.country || '');
      lines.push(`ADR;TYPE=${type}:;;${street};${city};${state};${zip};${country}`);
    }
  }

  // URLs
  if (contact.urls && contact.urls.length > 0) {
    for (const url of contact.urls) {
      lines.push(`URL:${url.trim()}`);
    }
  }

  // Notes & Birthday (skip in compact mode for faster QR scanning)
  if (!compact) {
    if (contact.birthday) {
      lines.push(`BDAY:${contact.birthday}`);
    }
    if (contact.note) {
      lines.push(`NOTE:${escapeVCard(contact.note)}`);
    }
  }

  lines.push('END:VCARD');
  return lines.join('\r\n');
}

function escapeVCard(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Trigger browser file download of .vcf
 */
export function downloadVCF(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/vcard;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.vcf') ? filename : `${filename}.vcf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
