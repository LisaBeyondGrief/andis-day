/* make-icons.js — crops the photo of Bartholomew into the app icons.

   Run: node assets/icons/make-icons.js

   The crop numbers below were measured from the photo: his ears span x 297-754
   (so his head is centred on x 526) and the top of his ears is at y 89. The
   crop is centred on that, with roughly a tenth of the tile as breathing room
   above his ears, because a head jammed against the edge looks wrong at the
   small sizes where the icon actually lives.

   To use a different photo: drop it in as bartholomew-source.jpg and adjust
   CROP until the previews look right. Uses Chromium's canvas via Playwright
   because this machine has no image library. */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const HERE = __dirname;
const SOURCE = path.join(HERE, 'bartholomew-source.jpg');
const CROP = { x: 209, y: 26, s: 635 };     // in source pixels
const SIZES = [192, 512, 180];
const CREAM = [242, 236, 226];               // app background, --bg

/* Android crops a "maskable" icon to its own mask shape — a circle, a squircle,
   a teardrop depending on the launcher — keeping only the middle ~80%. A
   full-bleed icon loses its edges to that, and a bear whose ears sit near the
   top edge comes back as a patch of fur. So the maskable version is drawn
   separately: same photo, scaled down inside a plain square of cream, with
   enough margin that every mask shape still shows the whole bear. */
const MASKABLE = { size: 512, scale: 0.62 };

(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext()).newPage();
  const jpg = fs.readFileSync(SOURCE).toString('base64');

  const out = await page.evaluate(async ({ jpg, CROP, SIZES, CREAM, MASKABLE }) => {
    const img = new Image();
    img.src = 'data:image/jpeg;base64,' + jpg;
    await img.decode();

    const results = {};
    for (const size of SIZES) {
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const g = c.getContext('2d');

      // Rounded square, full bleed, so it also works as a maskable icon.
      const r = size * 0.22;
      g.beginPath();
      g.moveTo(r, 0);
      g.arcTo(size, 0, size, size, r);
      g.arcTo(size, size, 0, size, r);
      g.arcTo(0, size, 0, 0, r);
      g.arcTo(0, 0, size, 0, r);
      g.closePath();
      g.clip();

      g.fillStyle = 'rgb(' + CREAM.join(',') + ')';
      g.fillRect(0, 0, size, size);
      g.imageSmoothingQuality = 'high';
      g.drawImage(img, CROP.x, CROP.y, CROP.s, CROP.s, 0, 0, size, size);

      // Warm the photo's white studio background to the app's cream, so the
      // icon sits with the rest of the palette instead of glaring next to it.
      // Only near-white pixels move; his fur is far below the threshold.
      const d = g.getImageData(0, 0, size, size);
      const px = d.data;
      for (let i = 0; i < px.length; i += 4) {
        if (px[i + 3] === 0) continue;
        let t = (Math.min(px[i], px[i + 1], px[i + 2]) - 236) / 14;
        if (t <= 0) continue;
        if (t > 1) t = 1;
        for (let k = 0; k < 3; k++) px[i + k] = px[i + k] * (1 - t) + CREAM[k] * t;
      }
      g.putImageData(d, 0, 0);

      results[size] = c.toDataURL('image/png');
    }

    // the maskable variant: square, padded, no rounded corners of its own
    (function () {
      const size = MASKABLE.size;
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const g = c.getContext('2d');
      g.fillStyle = 'rgb(' + CREAM.join(',') + ')';
      g.fillRect(0, 0, size, size);
      const inner = Math.round(size * MASKABLE.scale);
      const off = Math.round((size - inner) / 2);
      g.imageSmoothingQuality = 'high';
      g.drawImage(img, CROP.x, CROP.y, CROP.s, CROP.s, off, off, inner, inner);

      const d = g.getImageData(0, 0, size, size);
      const px = d.data;
      for (let i = 0; i < px.length; i += 4) {
        let t = (Math.min(px[i], px[i + 1], px[i + 2]) - 236) / 14;
        if (t <= 0) continue;
        if (t > 1) t = 1;
        for (let k = 0; k < 3; k++) px[i + k] = px[i + k] * (1 - t) + CREAM[k] * t;
      }
      g.putImageData(d, 0, 0);
      results.maskable = c.toDataURL('image/png');
    })();

    return results;
  }, { jpg, CROP, SIZES, CREAM, MASKABLE });

  for (const size of SIZES) {
    const file = path.join(HERE, 'icon-' + size + '.png');
    fs.writeFileSync(file, Buffer.from(out[size].split(',')[1], 'base64'));
    console.log('wrote', path.basename(file));
  }
  const maskFile = path.join(HERE, 'icon-maskable-512.png');
  fs.writeFileSync(maskFile, Buffer.from(out.maskable.split(',')[1], 'base64'));
  console.log('wrote', path.basename(maskFile));
  await browser.close();
})();
