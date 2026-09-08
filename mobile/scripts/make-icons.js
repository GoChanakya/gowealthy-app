#!/usr/bin/env node
/**
 * Regenerates the app icons from assets/Logo.png.
 *
 * Outputs:
 *   assets/images/icon.png                     1024x1024  iOS + fallback
 *   assets/images/android-icon-foreground.png  1024x1024  mark, inside the safe zone
 *   assets/images/android-icon-background.png  1024x1024  flat brand black
 *   assets/images/splash-icon.png              1024x1024  mark on transparent
 *
 * Android masks adaptive icons to a circle/squircle and only the middle ~66%
 * is guaranteed visible, so the foreground is drawn at 60% and centred.
 *
 * Run: node ./scripts/make-icons.js   (then rebuild — icons are baked at build time)
 */
const fs = require('fs');
const path = require('path');
const Jimp = require('jimp-compact');

const ROOT = path.join(__dirname, '..');
/** Full-colour mark on the black plate — used for the opaque iOS icon. */
const SRC = path.join(ROOT, 'assets', 'Logo.png');
/** Same mark rendered from logo.svg with no plate — used wherever alpha matters. */
const SRC_MARK = path.join(ROOT, 'assets', 'logo-mark.png');
const OUT = (name) => path.join(ROOT, 'assets', 'images', name);

const SIZE = 1024;
const BRAND_BLACK = 0x000000ff;
/** Fraction of the canvas the mark occupies inside an adaptive icon's safe zone. */
const SAFE_SCALE = 0.6;
/** The full-bleed iOS icon can run the mark larger — no mask to worry about. */
const ICON_SCALE = 0.72;

/**
 * Logo.png is white-on-black with no alpha channel. For anything that sits on a
 * non-black ground (adaptive foreground, splash) the plate has to go, or it
 * shows as a rectangle. Keying near-black to transparent also correctly hollows
 * the inside of the "o", which is plate rather than ink.
 */
function dropBlackPlate(image, threshold = 40) {
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
    const [r, g, b] = [this.bitmap.data[idx], this.bitmap.data[idx + 1], this.bitmap.data[idx + 2]];
    if (r <= threshold && g <= threshold && b <= threshold) this.bitmap.data[idx + 3] = 0;
  });
  return image;
}

async function markScaledTo(fraction, { transparent = false } = {}) {
  // Prefer the pre-rendered transparent master; fall back to keying the plate
  // out of Logo.png if it isn't there.
  let mark;
  if (transparent && fs.existsSync(SRC_MARK)) {
    mark = await Jimp.read(SRC_MARK);
  } else {
    mark = await Jimp.read(SRC);
    if (transparent) dropBlackPlate(mark);
  }

  // Trim the logo's own black plate so scaling is measured on the mark itself.
  mark.autocrop({ tolerance: 0.02, cropOnlyFrames: false });

  const target = Math.round(SIZE * fraction);
  const ratio = Math.min(target / mark.bitmap.width, target / mark.bitmap.height);
  mark.resize(
    Math.round(mark.bitmap.width * ratio),
    Math.round(mark.bitmap.height * ratio),
    Jimp.RESIZE_BICUBIC
  );
  return mark;
}

function centre(canvas, mark) {
  return canvas.composite(
    mark,
    Math.round((SIZE - mark.bitmap.width) / 2),
    Math.round((SIZE - mark.bitmap.height) / 2)
  );
}

(async () => {
  // 1. iOS / fallback icon — mark on the brand black plate.
  const icon = new Jimp(SIZE, SIZE, BRAND_BLACK);
  centre(icon, await markScaledTo(ICON_SCALE));
  await icon.writeAsync(OUT('icon.png'));

  // 2. Adaptive foreground — transparent, mark kept inside the safe zone.
  const fg = new Jimp(SIZE, SIZE, 0x00000000);
  centre(fg, await markScaledTo(SAFE_SCALE, { transparent: true }));
  await fg.writeAsync(OUT('android-icon-foreground.png'));

  // 3. Adaptive background — flat black, so the mask crops cleanly at any shape.
  await new Jimp(SIZE, SIZE, BRAND_BLACK).writeAsync(OUT('android-icon-background.png'));

  // 4. Splash — mark on transparent; app.json paints the #08060a ground behind it.
  const splash = new Jimp(SIZE, SIZE, 0x00000000);
  centre(splash, await markScaledTo(0.45, { transparent: true }));
  await splash.writeAsync(OUT('splash-icon.png'));

  console.log('✓ icons written from', path.relative(ROOT, SRC));
})().catch((e) => {
  console.error('icon generation failed:', e);
  process.exit(1);
});
