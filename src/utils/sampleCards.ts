import { Language } from '../i18n/translations';

/**
 * Generates sample business card images as data URLs for instant testing of OCR functionality.
 */
export function generateSampleBusinessCard(
  type: 'tech' | 'executive' | 'creative' = 'tech',
  lang: Language = 'sr'
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1050;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  if (lang === 'sr') {
    if (type === 'tech') {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#4f46e5';
      ctx.fillRect(0, 0, 24, canvas.height);

      ctx.fillStyle = '#4f46e5';
      ctx.beginPath();
      ctx.roundRect(70, 70, 48, 48, 12);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('B', 83, 105);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('Balkan Tech d.o.o.', 136, 106);

      ctx.fillStyle = '#64748b';
      ctx.font = '500 18px sans-serif';
      ctx.fillText('SOFTVERSKA REŠENJA I CLOUD', 138, 134);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 44px sans-serif';
      ctx.fillText('Marko Petrović', 70, 270);

      ctx.fillStyle = '#4f46e5';
      ctx.font = '600 24px sans-serif';
      ctx.fillText('Tehnički direktor i arhitekta', 70, 310);

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(70, 345);
      ctx.lineTo(980, 345);
      ctx.stroke();

      ctx.fillStyle = '#334155';
      ctx.font = '22px sans-serif';
      ctx.fillText('Mob: +381 64 382 9104', 70, 410);
      ctx.fillText('Tel: +381 11 234 5678', 70, 460);
      ctx.fillText('Email: marko.petrovic@balkantech.rs', 70, 510);

      ctx.fillText('Web: https://balkantech.rs', 550, 410);
      ctx.fillText('Bulevar Mihajla Pupina 115', 550, 460);
      ctx.fillText('11070 Novi Beograd, Srbija', 550, 510);
    } else if (type === 'creative') {
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const grad = ctx.createLinearGradient(60, 0, 990, 0);
      grad.addColorStop(0, '#ec4899');
      grad.addColorStop(1, '#8b5cf6');
      ctx.fillStyle = grad;
      ctx.fillRect(60, 50, 120, 8);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 46px sans-serif';
      ctx.fillText('Jelena Kovačević', 60, 180);

      ctx.fillStyle = '#a855f7';
      ctx.font = '600 24px sans-serif';
      ctx.fillText('Kreativni direktor i dizajner', 60, 225);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('STUDIO SVETLO d.o.o.', 60, 320);

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(60, 360);
      ctx.lineTo(990, 360);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '22px sans-serif';
      ctx.fillText('Mobilni: +381 63 890 4412', 60, 425);
      ctx.fillText('Email: jelena@studiosvetlo.rs', 60, 475);
      ctx.fillText('Web: https://studiosvetlo.rs', 60, 525);

      ctx.fillText('Zmaj Jovina 24, sprat 2', 540, 425);
      ctx.fillText('21000 Novi Sad, Srbija', 540, 475);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 48px serif';
      ctx.fillText('Dr Milan Nikolić', 70, 190);

      ctx.fillStyle = '#059669';
      ctx.font = '600 24px sans-serif';
      ctx.fillText('Specijalista kardiolog i savetnik', 70, 235);

      ctx.fillStyle = '#475569';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('Poliklinika Medikus d.o.o.', 70, 320);

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(70, 355);
      ctx.lineTo(980, 355);
      ctx.stroke();

      ctx.fillStyle = '#334155';
      ctx.font = '22px sans-serif';
      ctx.fillText('Telefon: +381 11 324 0199', 70, 420);
      ctx.fillText('Email: m.nikolic@medikus.rs', 70, 470);
      ctx.fillText('Web: www.medikus.rs', 70, 520);

      ctx.fillText('Ul. Kralja Milana 42', 540, 420);
      ctx.fillText('11000 Beograd, Srbija', 540, 470);
    }

    return canvas.toDataURL('image/png');
  }

  // English sample cards
  if (type === 'tech') {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#4f46e5';
    ctx.fillRect(0, 0, 24, canvas.height);

    ctx.fillStyle = '#4f46e5';
    ctx.beginPath();
    ctx.roundRect(70, 70, 48, 48, 12);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('N', 83, 105);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('Nexus Systems Inc.', 136, 106);

    ctx.fillStyle = '#64748b';
    ctx.font = '500 18px sans-serif';
    ctx.fillText('ENTERPRISE CLOUD SOLUTIONS', 138, 134);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText('Marcus Vance', 70, 270);

    ctx.fillStyle = '#4f46e5';
    ctx.font = '600 24px sans-serif';
    ctx.fillText('VP of Engineering & Architecture', 70, 310);

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(70, 345);
    ctx.lineTo(980, 345);
    ctx.stroke();

    ctx.fillStyle = '#334155';
    ctx.font = '22px sans-serif';
    ctx.fillText('Phone: +1 (555) 382-9104', 70, 410);
    ctx.fillText('Mobile: +1 (555) 791-2345', 70, 460);
    ctx.fillText('Email: marcus.vance@nexussystems.io', 70, 510);

    ctx.fillText('Web: https://nexussystems.io', 550, 410);
    ctx.fillText('500 Howard Street, Suite 400', 550, 460);
    ctx.fillText('San Francisco, CA 94105', 550, 510);
  } else if (type === 'creative') {
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const grad = ctx.createLinearGradient(60, 0, 990, 0);
    grad.addColorStop(0, '#ec4899');
    grad.addColorStop(1, '#8b5cf6');
    ctx.fillStyle = grad;
    ctx.fillRect(60, 50, 120, 8);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 46px sans-serif';
    ctx.fillText('Elena Rostova', 60, 180);

    ctx.fillStyle = '#a855f7';
    ctx.font = '600 24px sans-serif';
    ctx.fillText('Lead Creative Director & Brand Strategist', 60, 225);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('LUMEN STUDIO LLC', 60, 320);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(60, 360);
    ctx.lineTo(990, 360);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '22px sans-serif';
    ctx.fillText('Direct: +1 (415) 890-4412', 60, 425);
    ctx.fillText('Email: elena@lumenstudio.design', 60, 475);
    ctx.fillText('Portfolio: https://lumenstudio.design', 60, 525);

    ctx.fillText('742 Evergreen Terrace, Suite 2B', 540, 425);
    ctx.fillText('Austin, TX 78701', 540, 475);
    ctx.fillText('LinkedIn: linkedin.com/in/elenarostova', 540, 525);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 48px serif';
    ctx.fillText('Dr. Julian Sterling, MD', 70, 190);

    ctx.fillStyle = '#059669';
    ctx.font = '600 24px sans-serif';
    ctx.fillText('Senior Medical Director & Health Advisor', 70, 235);

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('Sterling Healthcare Partners Group', 70, 320);

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(70, 355);
    ctx.lineTo(980, 355);
    ctx.stroke();

    ctx.fillStyle = '#334155';
    ctx.font = '22px sans-serif';
    ctx.fillText('Office: (212) 555-0199', 70, 420);
    ctx.fillText('Email: j.sterling@sterlinghealth.org', 70, 470);
    ctx.fillText('Website: www.sterlinghealth.org', 70, 520);

    ctx.fillText('450 Lexington Avenue, Floor 18', 540, 420);
    ctx.fillText('New York, NY 10017', 540, 470);
  }

  return canvas.toDataURL('image/png');
}
