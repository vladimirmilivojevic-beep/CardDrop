import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

// Minimal standard PNG encoder
function createPNG(width, height, getPixel) {
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      let byte = buf[i];
      crc = crc ^ byte;
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
      }
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const typeBuf = Buffer.from(type);
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);

    const typeAndData = Buffer.concat([typeBuf, data]);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(typeAndData), 0);

    return Buffer.concat([len, typeAndData, crcBuf]);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Pixel sampler drawing CardDrop indigo / modern Android badge
function sampleCardIcon(x, y, w, h, isMaskable = false) {
  const nx = x / w;
  const ny = y / h;

  // Maskable padding check
  const margin = isMaskable ? 0.15 : 0.05;
  if (nx < margin || nx > 1 - margin || ny < margin || ny > 1 - margin) {
    if (isMaskable) {
      // solid indigo background for maskable
      return [30, 27, 75, 255]; // #1e1b4b
    }
  }

  // Background deep gradient #1e1b4b -> #4338ca
  const bgR = Math.round(30 + nx * 37);
  const bgG = Math.round(27 + ny * 29);
  const bgB = Math.round(75 + (nx + ny) * 63);

  // Business Card shape (normalized: center, top half)
  const cardLeft = isMaskable ? 0.22 : 0.16;
  const cardRight = isMaskable ? 0.78 : 0.84;
  const cardTop = isMaskable ? 0.20 : 0.16;
  const cardBottom = isMaskable ? 0.58 : 0.58;

  const inCard = nx >= cardLeft && nx <= cardRight && ny >= cardTop && ny <= cardBottom;

  // QR box in bottom center
  const qrLeft = isMaskable ? 0.28 : 0.24;
  const qrRight = isMaskable ? 0.72 : 0.76;
  const qrTop = isMaskable ? 0.48 : 0.48;
  const qrBottom = isMaskable ? 0.82 : 0.84;

  const inQr = nx >= qrLeft && nx <= qrRight && ny >= qrTop && ny <= qrBottom;

  if (inQr) {
    // White QR surface
    const qnx = (nx - qrLeft) / (qrRight - qrLeft);
    const qny = (ny - qrTop) / (qrBottom - qrTop);

    // QR 3 corner markers
    const inTopLeft = qnx <= 0.32 && qny <= 0.32;
    const inTopRight = qnx >= 0.68 && qny <= 0.32;
    const inBottomLeft = qnx <= 0.32 && qny >= 0.68;

    if (inTopLeft || inTopRight || inBottomLeft) {
      // 7x7 outer square, inner white, center dark
      const lx = inTopRight ? qnx - 0.68 : qnx;
      const ly = inBottomLeft ? qny - 0.68 : qny;
      const subX = (lx / 0.32) * 7;
      const subY = (ly / 0.32) * 7;

      const isBorder = subX < 1 || subX > 6 || subY < 1 || subY > 6;
      const isInnerWhite = (subX >= 1 && subX < 2) || (subX > 5 && subX <= 6) ||
                           (subY >= 1 && subY < 2) || (subY > 5 && subY <= 6);

      if (isInnerWhite && !isBorder) {
        return [255, 255, 255, 255];
      }
      return [49, 46, 129, 255]; // Indigo-900
    }

    // Grid matrix pattern
    const cellX = Math.floor(qnx * 14);
    const cellY = Math.floor(qny * 14);
    const hash = ((cellX * 17) ^ (cellY * 31) ^ (cellX + cellY)) % 5;
    if (hash === 0 || (cellX === 7 && cellY > 3 && cellY < 11)) {
      return [99, 102, 241, 255]; // Indigo-500
    }
    return [255, 255, 255, 255];
  }

  if (inCard) {
    // Gradient card #6366f1 to #7c3aed
    return [99, 102, 241, 255];
  }

  return [bgR, bgG, bgB, 255];
}

const outDir = path.resolve('public');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log('Generating PWA icons...');
const icon192 = createPNG(192, 192, (x, y, w, h) => sampleCardIcon(x, y, w, h, false));
fs.writeFileSync(path.join(outDir, 'pwa-192x192.png'), icon192);

const icon512 = createPNG(512, 512, (x, y, w, h) => sampleCardIcon(x, y, w, h, false));
fs.writeFileSync(path.join(outDir, 'pwa-512x512.png'), icon512);

const iconMaskable = createPNG(512, 512, (x, y, w, h) => sampleCardIcon(x, y, w, h, true));
fs.writeFileSync(path.join(outDir, 'pwa-maskable-512x512.png'), iconMaskable);

const appleTouch = createPNG(180, 180, (x, y, w, h) => sampleCardIcon(x, y, w, h, false));
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), appleTouch);

console.log('Done generating PNG icons.');
