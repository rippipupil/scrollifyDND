// DM section smoke test against a web export served on :8081. Usage: node e2e/dm.js <screenshot-dir>
const { chromium } = require('playwright');
const out = process.argv[2];
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const p = await b.newPage({ viewport: { width: 412, height: 900 } });
  const errors = [];
  p.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  p.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()));
  p.on('dialog', (d) => d.accept());
  await p.goto('http://localhost:8081/', { waitUntil: 'networkidle' });
  await p.getByRole('tab', { name: /DM/ }).click();
  await p.waitForTimeout(400);
  // Copy a monster from the SRD bestiary
  await p.getByTestId('enemy-from-srd').click();
  await p.getByTestId('picker-search').fill('trasgo guerrero');
  await p.waitForTimeout(300);
  await p.getByText('Trasgo guerrero', { exact: true }).first().click();
  await p.waitForTimeout(600);
  await p.screenshot({ path: out + '/20-statblock.png', fullPage: true });
  await p.getByText('Ataque +4').first().click();
  await p.waitForTimeout(300);
  console.log('roll toast visible:', await p.getByText(/Trasgo guerrero: Scimitar/).first().isVisible());
  // Send 3 copies to combat
  await p.getByTestId('enemy-to-combat').click();
  for (let i = 0; i < 2; i++) await p.locator('text="+"').last().click();
  await p.getByTestId('confirm-add-enemy').click();
  await p.waitForTimeout(300);
  // Create a custom enemy
  await p.goBack();
  await p.waitForTimeout(400);
  await p.getByTestId('new-enemy').click();
  await p.waitForTimeout(600);
  await p.locator('input:visible').first().fill('Ogro del puente');
  await p.getByText('fuego', { exact: true }).first().click();
  await p.getByTestId('add-action').click();
  await p.waitForTimeout(200);
  const inputs = p.locator('input:visible');
  const n = await inputs.count();
  console.log('inputs in editor:', n);
  await p.getByTestId('enemy-edit-toggle').click();
  await p.waitForTimeout(400);
  console.log('custom vulnerabilities line:', await p.getByText(/Vulnerabilidades \(debilidades\)/).first().innerText());
  await p.screenshot({ path: out + '/21-custom.png', fullPage: true });
  await p.goBack();
  await p.waitForTimeout(400);
  console.log('bestiary has ogre:', await p.getByText('Ogro del puente').first().isVisible());
  // Combat
  await p.getByText('Combate', { exact: true }).click();
  await p.waitForTimeout(300);
  console.log('combatants:', await p.getByText(/^▶? ?Trasgo guerrero \d$/).count());
  await p.getByTestId('roll-init').click();
  await p.getByTestId('next-turn').click();
  await p.waitForTimeout(200);
  console.log('round:', await p.getByTestId('dm-round').innerText());
  await p.getByTestId('cmb-hp-Trasgo guerrero 1').click();
  await p.locator('input:visible').last().fill('30');
  await p.getByTestId('cmb-damage').click();
  await p.waitForTimeout(300);
  console.log('defeated badge:', await p.getByText('Derrotado').count());
  for (let i = 0; i < 3; i++) await p.getByTestId('next-turn').click();
  console.log('round after 3 more turns:', await p.getByTestId('dm-round').innerText());
  await p.getByTestId('cmb-Trasgo guerrero 2').click();
  await p.waitForTimeout(300);
  await p.screenshot({ path: out + '/22-combat.png', fullPage: true });
  // Reload: data persists
  await p.reload({ waitUntil: 'networkidle' });
  await p.getByRole('tab', { name: /DM/ }).click();
  await p.waitForTimeout(500);
  console.log('after reload round:', await p.getByTestId('dm-round').innerText().catch(() => 'not on combat view'));
  console.log('errors:', JSON.stringify(errors));
  await b.close();
})();
