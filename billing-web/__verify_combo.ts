import { chromium } from 'playwright';
import prisma from './lib/prisma';

const BASE = 'http://localhost:3000';
const TENANT_ID = '6a4cc16e-4cec-481b-b584-d40469cbc290';
const SLUG = 'system-administration';
const COLD_COFFEE_ID = '591bc4aa-2834-438e-91f5-576f71befe7e';
const COLD_COFFEE_SMALL = '9fd7ab11-104c-458e-971d-421a70f1e58e';
const MOMOS_ID = 'ef77d9a4-c223-4283-9126-be6d3a2fc0f4';
const MOMOS_SMALL = '3da37500-577e-4345-8e67-4c8810356b0a';
const FRIES_ID = '330f7c87-3559-4b2b-9d4d-45a25728ad7f';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const log = (...args: any[]) => console.log(...args);
  page.on('pageerror', (err) => log('PAGE ERROR:', err.message));

  try {
    await page.goto(`${BASE}/auth/login`);
    await page.fill('#email', 'combotest@example.com');
    await page.fill('#password', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    log('LOGIN OK');

    // ---- STEP 1: Combo Builder — variant-specific components + suggested price ----
    await page.goto(`${BASE}/products/add`);
    await page.waitForTimeout(1000);
    await page.selectOption('select[name="productType"]', 'COMBO');
    await page.fill('input[name="name"]', 'Combo 1');
    await page.waitForTimeout(500);

    const addItemBtn = page.locator('button', { hasText: 'Add Item' });
    await addItemBtn.click();
    await page.waitForTimeout(300);
    await addItemBtn.click();
    await page.waitForTimeout(300);

    const comboSelects = page.locator('select').filter({ hasText: 'Select item' });
    log('Combo item select rows found (expect 2):', await comboSelects.count());
    await comboSelects.nth(0).selectOption(`${COLD_COFFEE_ID}::${COLD_COFFEE_SMALL}`);
    await comboSelects.nth(1).selectOption(`${MOMOS_ID}::${MOMOS_SMALL}`);
    await page.waitForTimeout(500);

    const bodyText1 = await page.textContent('body');
    log('Suggested price shows ₹110.00:', bodyText1?.includes('110.00'));
    await page.locator('button', { hasText: 'Use this' }).click();
    await page.waitForTimeout(300);
    const salePriceValue = await page.inputValue('input[name="salePrice"]');
    log('Sale Price auto-filled to 110 via Use this:', salePriceValue);
    await page.fill('input[name="salePrice"]', '99');

    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    log('URL after combo save (expect /products):', page.url());

    const combo = await prisma.product.findFirst({
      where: { tenantId: TENANT_ID, name: 'Combo 1' },
      include: { comboComponents: { include: { component: true, componentVariant: true } } },
    });
    log('Combo created:', !!combo, 'salePrice:', combo?.salePrice, 'components:', combo?.comboComponents.map(c => `${c.component.name} (${c.componentVariant?.name})`));
    if (!combo) throw new Error('Combo not created — aborting');
    const comboId = combo.id;

    // ---- STEP 2: POS — tap combo shows Includes, cart shows Includes ----
    await page.goto(`${BASE}/billing`);
    await page.waitForTimeout(1200);
    await page.locator('button:has-text("Combo 1")').first().click();
    await page.waitForTimeout(600);
    const modalText = await page.textContent('body');
    log('POS modal shows Includes section:', modalText?.includes('Includes'));
    log('POS modal shows Cold Coffee (Small):', modalText?.includes('Cold Coffee') && modalText?.includes('Small'));
    log('POS modal shows Momos (Small):', modalText?.includes('Momos'));
    await page.locator('button', { hasText: /Add \d+ to Order/ }).click();
    await page.waitForTimeout(500);
    const cartText = await page.textContent('body');
    log('POS cart shows "Includes:" line:', cartText?.includes('Includes:'));

    await page.fill('input[placeholder="Table #"]', '5');
    await page.fill('input[placeholder*="Amount received" i]', '99');
    const posResponsePromise = page.waitForResponse((res) => res.url().includes('/api/transactions') && res.request().method() === 'POST');
    await page.locator('button:has-text("Place Order")').click();
    const posRes = await posResponsePromise;
    log('POS transaction created, status:', posRes.status());
    await page.waitForURL(/\/billing\/[a-f0-9-]+/, { timeout: 15000 });
    const receiptUrl = page.url();
    const txnId = receiptUrl.match(/\/billing\/([a-f0-9-]+)/)?.[1];

    // ---- STEP 3: Receipt shows combo breakdown ----
    await page.waitForTimeout(800);
    const receiptText = await page.textContent('body');
    log('Receipt shows combo breakdown (Cold Coffee):', receiptText?.includes('Cold Coffee'));
    log('Receipt shows combo breakdown (Momos):', receiptText?.includes('Momos'));

    // ---- STEP 4: Kitchen ticket (POS-origin) shows nested breakdown ----
    await page.goto(`${BASE}/kitchen`);
    await page.waitForTimeout(1200);
    const kitchenText = await page.textContent('body');
    log('Kitchen shows Combo 1:', kitchenText?.includes('Combo 1'));
    log('Kitchen shows nested Cold Coffee:', kitchenText?.includes('Cold Coffee'));
    log('Kitchen shows nested Momos:', kitchenText?.includes('Momos'));

    // ---- STEP 5: Snapshot/drift check — edit combo recipe, confirm old receipt unaffected ----
    await page.goto(`${BASE}/products/${comboId}/edit`);
    await page.waitForTimeout(1000);
    const editSelects = page.locator('select').filter({ hasText: /Select item|Cold Coffee|Momos/ });
    // Replace the Momos row (2nd) with Fries (simple, no variant)
    await editSelects.nth(1).selectOption(FRIES_ID);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);

    const comboAfterEdit = await prisma.product.findFirst({
      where: { id: comboId },
      include: { comboComponents: { include: { component: true } } },
    });
    log('Combo recipe after edit now includes Fries:', comboAfterEdit?.comboComponents.some(c => c.component.name.includes('fries')));

    await page.goto(receiptUrl);
    await page.waitForTimeout(800);
    const receiptAfterEditText = await page.textContent('body');
    log('Old receipt STILL shows original Momos (snapshot not rewritten):', receiptAfterEditText?.includes('Momos'));
    log('Old receipt does NOT show Fries (no retroactive change):', !receiptAfterEditText?.includes('__combo_test_fries') && !receiptAfterEditText?.includes('Fries'));

    // ---- STEP 6: Storefront stock bug fix ----
    await page.goto(`${BASE}/site/${SLUG}/shop`);
    await page.waitForTimeout(1200);
    let shopText = await page.textContent('body');
    if (!shopText?.includes('Combo 1')) {
      log('Storefront shop page did not load Combo 1 product list — page text snippet:', shopText?.slice(0, 200));
    } else {
      const outOfStockNearCombo = shopText.includes('Combo 1') && shopText.includes('Out of Stock');
      log('Storefront shows Combo 1:', true);
      // Scope check: find the combo's own card region text
      const comboCard = page.locator('div', { hasText: 'Combo 1' }).last();
      const comboCardText = await comboCard.textContent().catch(() => '');
      log('Combo card does NOT show Out of Stock:', !comboCardText?.includes('Out of Stock'));
    }

  } catch (err) {
    console.error('E2E TEST ERROR:', err);
    await page.screenshot({ path: '__combo_shot_error.png', fullPage: true }).catch(() => {});
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }
}

main();
