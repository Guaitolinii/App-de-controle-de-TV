import fs from 'fs';
import path from 'path';

// Minimal PNG generator without external dependencies
// Creates clean 192x192 and 512x512 PNGs with red background and TV remote icon
function createSimplePng(size, r, g, b) {
  // Let's create an uncompressed / basic PNG or use zlib
  import('zlib').then(({ deflateSync }) => {
    const width = size;
    const height = size;
    
    // RGBA raw buffer
    const buffer = Buffer.alloc(height * (1 + width * 4));
    let offset = 0;
    
    const center = size / 2;
    const radius = size * 0.45;

    for (let y = 0; y < height; y++) {
      buffer[offset++] = 0; // Filter type None
      for (let x = 0; x < width; x++) {
        const dx = x - center;
        const dy = y - center;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Rounded squircle icon background
        const inCorner = (Math.abs(dx) > size * 0.38) && (Math.abs(dy) > size * 0.38);
        const cornerDist = Math.sqrt(Math.pow(Math.abs(dx) - size * 0.38, 2) + Math.pow(Math.abs(dy) - size * 0.38, 2));

        let isInside = true;
        if (inCorner && cornerDist > size * 0.08) {
          isInside = false;
        }

        // Draw remote / TV glyph in white
        const isRemoteBody = Math.abs(dx) < size * 0.18 && Math.abs(dy) < size * 0.32;
        const isDpad = Math.sqrt(dx * dx + Math.pow(dy + size * 0.05, 2)) < size * 0.08;
        const isPower = Math.sqrt(Math.pow(dx - size * 0.08, 2) + Math.pow(dy + size * 0.22, 2)) < size * 0.035;

        if (isInside) {
          if (isRemoteBody) {
            if (isDpad) {
              // Dark ring / red center
              const dpadDist = Math.sqrt(dx * dx + Math.pow(dy + size * 0.05, 2));
              if (dpadDist < size * 0.03) {
                // red dot
                buffer[offset++] = 239;
                buffer[offset++] = 68;
                buffer[offset++] = 68;
                buffer[offset++] = 255;
              } else {
                buffer[offset++] = 40;
                buffer[offset++] = 40;
                buffer[offset++] = 50;
                buffer[offset++] = 255;
              }
            } else if (isPower) {
              // red power button
              buffer[offset++] = 239;
              buffer[offset++] = 68;
              buffer[offset++] = 68;
              buffer[offset++] = 255;
            } else {
              // remote body metallic dark
              buffer[offset++] = 24;
              buffer[offset++] = 24;
              buffer[offset++] = 32;
              buffer[offset++] = 255;
            }
          } else {
            // Gradient red/rose brand background
            const grad = y / height;
            buffer[offset++] = Math.floor(229 - grad * 30); // R
            buffer[offset++] = Math.floor(9 + grad * 20);   // G
            buffer[offset++] = Math.floor(20 + grad * 40);  // B
            buffer[offset++] = 255;                         // A
          }
        } else {
          // Transparent
          buffer[offset++] = 0;
          buffer[offset++] = 0;
          buffer[offset++] = 0;
          buffer[offset++] = 0;
        }
      }
    }

    const compressed = deflateSync(buffer);

    function crc32(buf) {
      let c;
      const table = [];
      for (let n = 0; n < 256; n++) {
        c = n;
        for (let k = 0; k < 8; k++) {
          c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
        }
        table[n] = c;
      }
      let crc = 0 ^ (-1);
      for (let i = 0; i < buf.length; i++) {
        crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
      }
      return (crc ^ (-1)) >>> 0;
    }

    function makeChunk(type, data) {
      const len = Buffer.alloc(4);
      len.writeUInt32BE(data.length, 0);
      const typeBuf = Buffer.from(type, 'ascii');
      const crcBuf = Buffer.alloc(4);
      const crc = crc32(Buffer.concat([typeBuf, data]));
      crcBuf.writeUInt32BE(crc, 0);
      return Buffer.concat([len, typeBuf, data, crcBuf]);
    }

    const header = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(width, 0);
    ihdrData.writeUInt32BE(height, 4);
    ihdrData[8] = 8; // Bit depth
    ihdrData[9] = 6; // RGBA
    ihdrData[10] = 0; // Compression
    ihdrData[11] = 0; // Filter
    ihdrData[12] = 0; // Interlace
    const ihdr = makeChunk('IHDR', ihdrData);
    const idat = makeChunk('IDAT', compressed);
    const iend = makeChunk('IEND', Buffer.alloc(0));

    const png = Buffer.concat([header, ihdr, idat, iend]);
    
    const publicDir = path.resolve('public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    if (size === 192) {
      fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png);
      fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), png);
    } else if (size === 512) {
      fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png);
      fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), png);
    }
    console.log(`Generated ${size}x${size} PNG`);
  });
}

createSimplePng(192, 229, 9, 20);
createSimplePng(512, 229, 9, 20);
