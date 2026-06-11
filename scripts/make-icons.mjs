// make-icons.mjs — generate placeholder flower icons (192px & 512px) with no
// external image libraries (pure Node, built-in zlib). Run: node scripts/make-icons.mjs
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

// --- tiny PNG encoder ------------------------------------------------------
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // raw with filter byte 0 per scanline
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// --- draw a simple flower --------------------------------------------------
function hex(h) {
  return [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
}
const BG = hex("#2F4A3C"); // deep green background
const PETAL = hex("#F4E5E6"); // blush soft
const PETAL2 = hex("#C2737C"); // blush
const CENTER = hex("#B98A3E"); // gold
const STEM = hex("#E6EDE3"); // sage

function draw(size) {
  const buf = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size * 0.44;
  const set = (x, y, [r, g, b], a = 255) => {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    buf[i] = r;
    buf[i + 1] = g;
    buf[i + 2] = b;
    buf[i + 3] = a;
  };
  // background fill
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) set(x, y, BG);

  // stem
  const stemW = size * 0.04;
  for (let y = cy; y < size * 0.9; y++)
    for (let x = cx - stemW; x <= cx + stemW; x++) set(x, y, STEM);

  // two leaves
  const leaf = (dir) => {
    const ly = size * 0.7;
    for (let t = 0; t < size * 0.18; t++) {
      const w = (size * 0.08) * Math.sin((t / (size * 0.18)) * Math.PI);
      for (let o = 0; o < w; o++) set(cx + dir * (t * 0.8), ly - t * 0.4 - o, STEM);
    }
  };
  leaf(1);
  leaf(-1);

  // petals (5) as filled circles around the center
  const petalR = size * 0.16;
  const ringR = size * 0.17;
  for (let p = 0; p < 6; p++) {
    const ang = (p / 6) * Math.PI * 2;
    const px = cx + Math.cos(ang) * ringR;
    const py = cy + Math.sin(ang) * ringR;
    for (let y = -petalR; y <= petalR; y++)
      for (let x = -petalR; x <= petalR; x++)
        if (x * x + y * y <= petalR * petalR)
          set(px + x, py + y, p % 2 === 0 ? PETAL : PETAL2);
  }
  // flower center
  const cR = size * 0.13;
  for (let y = -cR; y <= cR; y++)
    for (let x = -cR; x <= cR; x++)
      if (x * x + y * y <= cR * cR) set(cx + x, cy + y, CENTER);

  return encodePNG(size, size, buf);
}

mkdirSync("public/icons", { recursive: true });
writeFileSync("public/icons/icon-192.png", draw(192));
writeFileSync("public/icons/icon-512.png", draw(512));
console.log("wrote public/icons/icon-192.png and icon-512.png");
