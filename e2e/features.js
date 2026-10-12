// Smoke test of the wiki editions, spell rules cards, notes, timed effects and full attacks,
// against a web export served on :8081. Usage: node e2e/features.js <screenshot-dir>
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

  // Wiki: 2014 legacy subclasses
  await p.getByRole('tab', { name: /Wiki/ }).click();
  await p.waitForTimeout(400);
  await p.getByText('Subclases', { exact: true }).first().click();
  await p.getByText('5e (2014, legado)', { exact: true }).click();
  await p.waitForTimeout(400);
  console.log('legacy subclasses:', await p.getByText(/resultados$/).first().innerText());
  await p.screenshot({ path: out + '/30-wiki-legacy.png' });
  await p.getByText('Senda del Guardián Ancestral', { exact: true }).click();
  await p.waitForTimeout(500);
  console.log('legacy note:', await p.getByText(/Opción de 5e \(2014\)/).count());
  await p.screenshot({ path: out + '/31-legacy-entry.png', fullPage: true });
  await p.goBack();
  await p.waitForTimeout(400);

  // Spell rules card, notes and favourite
  await p.getByText('Todas las ediciones', { exact: true }).click();
  await p.getByText('Conjuros', { exact: true }).first().click();
  await p.getByTestId('wiki-search').fill('silvery barbs');
  await p.waitForTimeout(400);
  await p.locator('text=/Púas|Silvery/').first().click();
  await p.waitForTimeout(500);
  console.log('rules card:', await p.getByText('Ficha de reglas (resumen propio, no oficial)').count());
  await p.getByTestId('entry-notes').fill('Guardarlo para el crítico del jefe');
  await p.getByTestId('toggle-favorite').click();
  await p.waitForTimeout(300);
  await p.screenshot({ path: out + '/32-rules-card.png', fullPage: true });
  await p.goBack();
  await p.waitForTimeout(300);
  await p.locator('text=/Púas|Silvery/').first().click();
  await p.waitForTimeout(400);
  console.log('note kept:', await p.getByTestId('entry-notes').inputValue());
  console.log('favourite star:', await p.getByTestId('toggle-favorite').innerText());

  await p.goBack();
  await p.waitForTimeout(400);

  // DM: two goblins, a timed effect that runs out, and a full attack between them
  await p.getByRole('tab', { name: /DM/ }).click();
  await p.waitForTimeout(400);
  await p.getByTestId('enemy-from-srd').click();
  await p.getByTestId('picker-search').fill('trasgo guerrero');
  await p.waitForTimeout(300);
  await p.getByText('Trasgo guerrero', { exact: true }).first().click();
  await p.waitForTimeout(500);
  await p.getByTestId('enemy-to-combat').click();
  await p.locator('text="+"').last().click();
  await p.getByTestId('confirm-add-enemy').click();
  await p.waitForTimeout(300);
  await p.goBack();
  await p.waitForTimeout(300);
  await p.getByText('Combate', { exact: true }).click();
  await p.getByTestId('roll-init').click();
  await p.getByTestId('add-effect').click();
  await p.getByTestId('effect-name').fill('Bendición');
  await p.locator('input:visible').nth(1).fill('1');
  await p.getByText('Trasgo guerrero 2', { exact: true }).last().click();
  await p.getByTestId('effect-add').click();
  await p.waitForTimeout(300);
  console.log('effect badge:', await p.getByText('Bendición · 1').count());
  await p.getByTestId('next-turn').click(); // start
  await p.getByTestId('next-turn').click();
  await p.getByTestId('next-turn').click();
  await p.waitForTimeout(300);
  console.log('expired notice:', await p.getByTestId('effects-expired').count() ? await p.getByTestId('effects-expired').innerText() : 'none');
  await p.screenshot({ path: out + '/33-effects.png', fullPage: true });
  await p.getByTestId('cmb-Trasgo guerrero 1').click();
  await p.waitForTimeout(300);
  await p.getByText('⚔ Ataque completo').first().click();
  await p.waitForTimeout(300);
  await p.getByText(/^Trasgo guerrero 2 \(CA/).click();
  await p.getByTestId('full-attack-roll').click();
  await p.waitForTimeout(300);
  console.log('attack total:', await p.getByTestId('full-attack-total').innerText());
  await p.screenshot({ path: out + '/34-full-attack.png' });
  const apply = p.getByText(/^Aplicar \d+ de daño/);
  if (await apply.count()) {
    await apply.click();
    console.log('applied damage');
  } else console.log('missed: nothing to apply');
  console.log('errors:', JSON.stringify(errors.slice(0, 10)));
  await b.close();
})();
