import { expect, test, type Page } from '@playwright/test';

const CELL_SIZE = 28;
const GRID_WIDTH = 20 * CELL_SIZE + 30;
const GRID_HEIGHT = 20 * CELL_SIZE + 30;

async function cellCenter(page: Page, column: number, row: number) {
  const canvas = page.getByRole('application', { name: 'Colorwork chart canvas' });
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Chart canvas is not visible');
  const offsetX = box.width > GRID_WIDTH ? (box.width - GRID_WIDTH) / 2 : 0;
  const offsetY = box.height > GRID_HEIGHT ? (box.height - GRID_HEIGHT) / 2 : 0;
  return {
    x: box.x + offsetX + column * CELL_SIZE + CELL_SIZE / 2,
    y: box.y + offsetY + row * CELL_SIZE + CELL_SIZE / 2,
  };
}

async function dragCells(page: Page, start: [number, number], end: [number, number]) {
  const from = await cellCenter(page, start[0], start[1]);
  const to = await cellCenter(page, end[0], end[1]);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 4 });
  await page.mouse.up();
}

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'KnitLab' })).toBeVisible();
});

test('keeps wheel navigation deliberate', async ({ page }) => {
  const canvas = page.getByRole('application', { name: 'Colorwork chart canvas' });
  await canvas.hover();

  await page.mouse.wheel(0, -300);
  await expect(page.getByText('100%', { exact: true })).toBeVisible();

  await page.keyboard.down('Control');
  await page.mouse.wheel(0, -300);
  await page.keyboard.up('Control');
  await expect(page.getByText('125%', { exact: true })).toBeVisible();
});

test('authors with line, rectangle, and flood fill as atomic gestures', async ({ page }) => {
  await page.getByRole('button', { name: 'Red', exact: true }).click();
  await page.getByRole('button', { name: 'Draw line' }).click();
  await dragCells(page, [0, 0], [4, 2]);
  await expect(page.locator('[title="Red - Used: 5"]')).toBeVisible();

  await page.getByRole('button', { name: 'Draw rectangle' }).click();
  await dragCells(page, [7, 0], [10, 3]);
  await expect(page.locator('[title="Red - Used: 17"]')).toBeVisible();

  await page.getByRole('button', { name: 'Gold', exact: true }).click();
  await page.getByRole('button', { name: 'Flood fill' }).click();
  const inside = await cellCenter(page, 8, 1);
  await page.mouse.click(inside.x, inside.y);
  await expect(page.locator('[title="Gold - Used: 4"]')).toBeVisible();

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('[title="Gold - Used: 4"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Redo' }).click();
  await expect(page.locator('[title="Gold - Used: 4"]')).toBeVisible();
});

test('saves and reopens an editable chart', async ({ page }) => {
  await page.getByRole('button', { name: 'Red', exact: true }).click();
  await page.getByRole('button', { name: 'Draw line' }).click();
  await dragCells(page, [1, 1], [5, 1]);
  await expect(page.locator('[title="Red - Used: 5"]')).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save chart' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.knitlab$/);
  const path = await download.path();
  if (!path) throw new Error('Saved chart did not produce a local file');

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'New chart' }).click();
  await expect(page.locator('[title="Red - Used: 5"]')).toHaveCount(0);

  await page.locator('input[type="file"]').setInputFiles(path);
  await expect(page.locator('[title="Red - Used: 5"]')).toBeVisible();
});

test('exports the interchange artifact and exact PNG', async ({ page }) => {
  await page.getByRole('button', { name: 'Export colorwork' }).click();
  await expect(page.getByText('20 x 20 cells')).toBeVisible();

  const pngPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PNG' }).click();
  expect((await pngPromise).suggestedFilename()).toMatch(/\.png$/);

  const jsonPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download chart data' }).click();
  expect((await jsonPromise).suggestedFilename()).toMatch(/\.json$/);

  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.getByRole('button', { name: 'Import image' }).click();
  await expect(page.getByRole('heading', { name: 'Import image' })).toBeVisible();
  await page.getByRole('button', { name: 'Close modal' }).click();
});

test('keeps the mobile workspace within the viewport', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'Mobile layout check');
  await expect(page.getByRole('button', { name: 'Draw line' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sheets' })).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(dimensions.document).toBe(dimensions.viewport);
  await expect(page).toHaveScreenshot('chart-mobile.png', { animations: 'disabled' });

  await page.getByRole('button', { name: 'Red', exact: true }).click();
  await page.getByRole('button', { name: 'Flood fill' }).click();
  const firstCell = await cellCenter(page, 0, 0);
  await page.touchscreen.tap(firstCell.x, firstCell.y);
  await expect(page.locator('[title="Red - Used: 400"]')).toBeVisible();
});
