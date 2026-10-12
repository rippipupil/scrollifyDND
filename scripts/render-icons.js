// Renders assets/source/icon-art.svg into the app icon PNGs. Usage: node scripts/render-icons.js (needs playwright; CHROME may point to a Chromium binary).
const { chromium } = require('playwright');
const fs = require('fs');
const root = require('path').join(__dirname, '..', 'assets') + '/';
const art = fs.readFileSync(root + 'source/icon-art.svg', 'utf8').replace(/<!--[\s\S]*?-->/, '');
const inner = art.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const BG = '#3B2A1A';
const svg = ({ bg, scale = 1, mono = false, rounded = false }) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  ${bg ? `<defs><radialGradient id="g" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#5A3F25"/><stop offset="1" stop-color="${BG}"/></radialGradient></defs><rect width="1024" height="1024" ${rounded ? 'rx="220"' : ''} fill="url(#g)"/>` : ''}
  ${mono ? '<defs><filter id="m" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  -0.6 -1.2 -0.2 0 1.6"/><feComponentTransfer><feFuncA type="discrete" tableValues="0 1"/></feComponentTransfer><feComposite in2="SourceAlpha" operator="in"/></filter></defs>' : ''}
  <g transform="translate(512 512) scale(${scale}) translate(-512 -512)" ${mono ? 'filter="url(#m)"' : ''}>${inner}</g>
</svg>`;
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const p = await b.newPage({ viewport: { width: 1024, height: 1024 } });
  const shot = async (file, markup, size = 1024) => {
    await p.setViewportSize({ width: 1024, height: 1024 });
    await p.setContent(`<html><body style="margin:0;background:transparent">${markup}</body></html>`);
    const buf = await p.locator('svg').screenshot({ omitBackground: true });
    fs.writeFileSync(file, buf);
    if (size !== 1024) {
      await p.setContent(`<html><body style="margin:0;background:transparent"><img id="i" src="data:image/png;base64,${buf.toString('base64')}" width="${size}" height="${size}"></body></html>`);
      fs.writeFileSync(file, await p.locator('#i').screenshot({ omitBackground: true }));
    }
    console.log('wrote', file);
  };
  await shot(root + 'icon.png', svg({ bg: true, scale: 1.12 }));
  await shot(root + 'android-icon-foreground.png', svg({ scale: 0.76 }));
  await shot(root + 'android-icon-background.png', svg({ bg: true, scale: 0 }).replace(/<g transform[\s\S]*<\/g>/, ''));
  await shot(root + 'android-icon-monochrome.png', svg({ scale: 0.76, mono: true }));
  await shot(root + 'splash-icon.png', svg({ scale: 1 }));
  await shot(root + 'favicon.png', svg({ bg: true, scale: 1.12, rounded: true }), 64);
  await b.close();
})();
