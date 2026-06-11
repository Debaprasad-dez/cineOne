const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5174/ciner/');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'screenshot.png' });
  console.log('Screenshot saved');
  await browser.close();
})();
