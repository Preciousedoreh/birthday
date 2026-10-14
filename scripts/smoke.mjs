import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  headless: true
});

const failures = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  page.on("pageerror", error => failures.push(error.message));
  await page.goto("http://127.0.0.1:3000", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Skip intro/i }).click();
  await page.getByRole("button", { name: /Yes, that's me/i }).click();
  await page.locator("#birthday").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "preview-birthday.png" });

  await page.locator(".reason-card").first().click();
  if (!await page.locator(".reason-card").first().evaluate(el => el.classList.contains("is-flipped"))) failures.push("Reason card did not flip");
  await page.getByRole("button", { name: /Open your letter/i }).first().click();
  if (!await page.locator(".envelope-scene").evaluate(el => el.classList.contains("is-open"))) failures.push("Letter did not open");
  await page.getByRole("button", { name: /Blow the candles/i }).click();
  if (!await page.getByText("May every wish your heart holds find its way to you.").isVisible()) failures.push("Wish message did not appear");
  await page.getByRole("button", { name: /Open your birthday gift/i }).click();
  await page.getByText(/If I had to choose again/i).waitFor({ state: "visible" });
  await page.getByRole("button", { name: /Experience the magic again/i }).click();
  if (!await page.getByRole("button", { name: /Skip intro/i }).isVisible()) failures.push("Replay did not restart intro");

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  mobile.on("pageerror", error => failures.push(`Mobile: ${error.message}`));
  await mobile.goto("http://127.0.0.1:3000", { waitUntil: "networkidle" });
  await mobile.getByRole("button", { name: /Skip intro/i }).click();
  await mobile.locator(".intro").waitFor({ state: "detached" });
  await mobile.waitForTimeout(700);
  await mobile.screenshot({ path: "preview-mobile.png" });
  const overflows = await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  if (overflows) failures.push("Mobile has horizontal overflow");
  await mobile.getByRole("button", { name: /Yes, that's me/i }).click();
  await mobile.getByRole("button", { name: /Open your letter/i }).first().click();
  if (!await mobile.locator(".envelope-scene").evaluate(el => el.classList.contains("is-open"))) failures.push("Mobile letter did not open");
  await mobile.close();
  await page.close();
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Desktop and mobile birthday flows passed.");
}
