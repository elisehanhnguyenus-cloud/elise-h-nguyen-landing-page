// Tối ưu ảnh cho production: WebP + JPG fallback, favicon, ảnh OG.
// Chạy: npm run images
import sharp from 'sharp';
import { mkdir } from 'fs/promises';

const SRC = 'assets/images';
const OUT = 'assets/images/opt';
await mkdir(OUT, { recursive: true });

async function photo(name, width) {
  const src = `${SRC}/${name}.jpg`;
  await sharp(src).resize({ width }).webp({ quality: 78 }).toFile(`${OUT}/${name}.webp`);
  await sharp(src).resize({ width }).jpeg({ quality: 78, mozjpeg: true }).toFile(`${OUT}/${name}.jpg`);
  console.log('✓', name);
}

await photo('elise_hero_main', 1100);
await photo('elise_about_1', 800);
await photo('elise_about_2', 800);

// Logo (giữ nền trong suốt)
await sharp(`${SRC}/elise_logo_hanh.png`).resize({ height: 128 }).png().toFile(`${OUT}/logo.png`);

// Favicon + apple touch icon
await sharp(`${SRC}/elise_logo_hanh.png`).resize(48, 48, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile('favicon.png');
await sharp(`${SRC}/elise_logo_hanh.png`).resize(180, 180, { fit: 'contain', background: { r: 251, g: 248, b: 243, alpha: 1 } }).png().toFile('apple-touch-icon.png');

// Ảnh Open Graph 1200x630 (crop từ hero)
await sharp(`${SRC}/elise_hero_main.jpg`).resize(1200, 630, { fit: 'cover', position: 'attention' }).jpeg({ quality: 80, mozjpeg: true }).toFile(`${OUT}/og-cover.jpg`);

console.log('Hoàn tất tối ưu ảnh.');
