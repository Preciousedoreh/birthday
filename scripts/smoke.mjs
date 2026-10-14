import { chromium } from "playwright-core";

const siteUrl = process.env.SITE_URL || "http://127.0.0.1:3000";

const browser = await chromium.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  headless: true
});

const failures = [];
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 890 }, deviceScaleFactor: 1 });
  page.on("pageerror", error => failures.push(error.message));
  await page.goto(siteUrl, { waitUntil: "networkidle" });
  if (await page.getByRole("button", { name: /Skip intro/i }).count()) failures.push("Skip intro button still rendered");
  await page.getByRole("button", { name: /Begin your birthday surprise/i }).click();
  await page.locator(".intro").waitFor({ state: "detached" });
  await page.locator(".transition-fireworks").waitFor({ state: "detached" });
  const piano = await page.locator("audio").evaluate(el => ({ playing: !el.paused && el.currentTime > 0, loop: el.loop, duration: el.duration, error: el.error?.message }));
  if (!piano.playing || !piano.loop || piano.duration < 30 || piano.error) failures.push("Birthday piano did not start and loop after Begin");
  if (await page.locator(".music-controller, .music-toggle").count()) failures.push("Sound control still rendered");
  const invitationButton = await page.getByRole("button", { name: /Yes, that's me/i }).boundingBox();
  if (!invitationButton || invitationButton.y < 0 || invitationButton.y + invitationButton.height > 890) failures.push("Desktop invitation button is outside the single screen");
  await page.screenshot({ path: "preview-invitation.png" });
  if (await page.locator("#birthday, #confession").count()) failures.push("Later screens rendered before identity confirmation");
  await page.mouse.wheel(0, 700);
  await page.waitForTimeout(150);
  const invitationScroll = await page.evaluate(() => ({ y: window.scrollY, overflow: getComputedStyle(document.documentElement).overflow }));
  if (invitationScroll.y !== 0 || invitationScroll.overflow !== "hidden") failures.push("Invitation can scroll before confirmation");
  await page.getByRole("button", { name: /Yes, that's me/i }).click();
  if (!await page.locator(".transition-fireworks .transition-burst--center i").first().isVisible()) failures.push("Large fireworks transition did not appear after confirmation");
  await page.waitForTimeout(430);
  await page.screenshot({ path: "preview-transition.png" });
  await page.locator("#confession").waitFor({ state: "visible" });
  await page.locator(".transition-fireworks").waitFor({ state: "detached" });
  if (await page.locator("#birthday").count()) failures.push("Birthday story rendered before Continue");
  await page.mouse.wheel(0, 700);
  await page.waitForTimeout(150);
  const confessionScroll = await page.evaluate(() => ({ y: window.scrollY, overflow: getComputedStyle(document.documentElement).overflow, height: document.querySelector("#confession").getBoundingClientRect().height, viewport: window.innerHeight }));
  if (confessionScroll.y !== 0 || confessionScroll.overflow !== "hidden" || Math.abs(confessionScroll.height - confessionScroll.viewport) > 1) failures.push("Confession is not a fixed single screen");
  await page.waitForTimeout(1100);
  await page.screenshot({ path: "preview-confession.png" });
  await page.getByRole("button", { name: /^Continue/i }).click();
  if (!await page.locator(".transition-fireworks").isVisible()) failures.push("Fireworks transition did not appear before the story");
  await page.locator("#birthday").waitFor({ state: "visible" });
  await page.locator(".transition-fireworks").waitFor({ state: "detached" });
  const storyStart = await page.evaluate(() => ({ y: window.scrollY, scrollable: document.documentElement.scrollHeight > window.innerHeight, overflow: getComputedStyle(document.documentElement).overflow }));
  if (storyStart.y !== 0 || !storyStart.scrollable || storyStart.overflow === "hidden") failures.push("Birthday story did not open at the top with scrolling enabled");
  await page.locator("#birthday").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "preview-birthday.png" });

  if (await page.locator("#facts").count() !== 1) failures.push("Personal facts section is missing");
  const revealedFacts = new Set();
  for (let i = 0; i < 9; i++) {
    await page.getByRole("button", { name: i === 0 ? /Reveal a fact/i : /Next little fact/i }).click();
    await page.waitForTimeout(780);
    revealedFacts.add(await page.locator(".fact-message").innerText());
  }
  if (revealedFacts.size !== 9) failures.push(`Expected nine distinct facts, found ${revealedFacts.size}`);
  if (!await page.getByRole("button", { name: /Read them again/i }).isVisible()) failures.push("Fact list did not reach the last item");
  await page.screenshot({ path: "preview-facts.png" });

  for (const card of await page.locator(".reason-card").all()) {
    await card.click();
    if (!await card.evaluate(el => el.classList.contains("is-flipped"))) failures.push("Reason card did not flip");
    const clips = await card.evaluate(el => el.querySelector(".reason-back").scrollHeight > el.clientHeight + 2);
    if (clips) failures.push("A personal reason overflows its card");
  }
  const desktopCardHeights = await page.locator(".reason-card").evaluateAll(cards => cards.map(card => Math.round(card.getBoundingClientRect().height)));
  if (new Set(desktopCardHeights).size !== 1) failures.push("Desktop reason cards have unequal heights");
  if (!await page.locator(".falling-balloon").count()) failures.push("Falling red balloons are missing");
  const storyOrder = await page.evaluate(() => ["fireworks", "wish", "letter", "gift", "finale"].map(id => document.getElementById(id)?.offsetTop));
  if (storyOrder.some((position, i) => i > 0 && position <= storyOrder[i - 1])) failures.push("Wish, letter, and finale sections are out of order");
  if (await page.locator(".fireworks-canvas").count() !== 2) failures.push("Realistic fireworks are missing from the fireworks section or finale");
  await page.locator("#fireworks").scrollIntoViewIfNeeded();
  await page.waitForTimeout(2200);
  const litPixels = await page.locator("#fireworks .fireworks-canvas").evaluate(canvas => {
    const pixels = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    let count = 0;
    for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 0) count++;
    return count;
  });
  if (litPixels < 20) failures.push("Animated fireworks did not draw on the canvas");
  await page.screenshot({ path: "preview-fireworks.png" });
  await page.getByRole("button", { name: /Blow the candles/i }).click();
  if (!await page.getByText("May every wish your heart holds find its way to you.").isVisible()) failures.push("Wish message did not appear");
  await page.getByRole("button", { name: /Open your letter/i }).first().click();
  if (!await page.locator(".envelope-scene").evaluate(el => el.classList.contains("is-open"))) failures.push("Letter did not open");
  await page.waitForTimeout(1100);
  const desktopLetterFits = await page.locator(".letter-paper").evaluate(el => {
    const paper = el.getBoundingClientRect();
    const section = el.closest("section").getBoundingClientRect();
    return paper.top >= section.top && paper.bottom <= section.bottom;
  });
  if (!desktopLetterFits) failures.push("Opened letter does not fit its desktop section");
  if (!await page.getByText("Happy birthday, beautiful ♥").isVisible()) failures.push("New letter signoff is missing");
  if (!await page.locator(".letter-paper p").first().textContent().then(text => text.startsWith("Honestly, I don’t think you fully understand"))) failures.push("New personal letter is missing");
  await page.screenshot({ path: "preview-letter.png" });
  await page.getByRole("button", { name: /Open your birthday gift/i }).click();
  await page.getByText(/If I had to choose again/i).waitFor({ state: "visible" });
  if (!await page.locator("#finale h2").textContent().then(text => text.includes("all the happiness you deserve and I want to play a big part in it"))) failures.push("Updated final wish is missing");
  await page.locator("#finale").scrollIntoViewIfNeeded();
  await page.waitForTimeout(2200);
  const finaleLitPixels = await page.locator("#finale .fireworks-canvas").evaluate(canvas => {
    const pixels = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    let count = 0;
    for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 0) count++;
    return count;
  });
  if (finaleLitPixels < 20) failures.push("Finale fireworks did not draw on the canvas");
  await page.screenshot({ path: "preview-finale.png" });
  await page.getByRole("button", { name: /Experience the magic again/i }).click();
  if (!await page.locator(".intro").isVisible()) failures.push("Replay did not restart intro");
  if (!await page.locator("audio").evaluate(el => el.paused && el.currentTime === 0)) failures.push("Replay did not reset the piano");

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  mobile.on("pageerror", error => failures.push(`Mobile: ${error.message}`));
  await mobile.goto(siteUrl, { waitUntil: "networkidle" });
  await mobile.getByRole("button", { name: /Begin your birthday surprise/i }).click();
  await mobile.locator(".intro").waitFor({ state: "detached" });
  await mobile.locator(".transition-fireworks").waitFor({ state: "detached" });
  await mobile.screenshot({ path: "preview-mobile.png" });
  const mobileButton = await mobile.getByRole("button", { name: /Yes, that's me/i }).boundingBox();
  if (!mobileButton || mobileButton.y < 0 || mobileButton.y + mobileButton.height > 844) failures.push("Mobile invitation button is outside the single screen");
  const overflows = await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  if (overflows) failures.push("Mobile has horizontal overflow");
  await mobile.evaluate(() => window.scrollTo(0, 600));
  if (await mobile.evaluate(() => window.scrollY !== 0)) failures.push("Mobile invitation can scroll before confirmation");
  await mobile.getByRole("button", { name: /Yes, that's me/i }).click();
  await mobile.locator("#confession").waitFor({ state: "visible" });
  await mobile.locator(".transition-fireworks").waitFor({ state: "detached" });
  await mobile.evaluate(() => window.scrollTo(0, 600));
  const mobileConfession = await mobile.evaluate(() => ({ y: window.scrollY, height: document.querySelector("#confession").getBoundingClientRect().height, viewport: window.innerHeight }));
  if (mobileConfession.y !== 0 || Math.abs(mobileConfession.height - mobileConfession.viewport) > 1) failures.push("Mobile confession is not a fixed single screen");
  await mobile.waitForTimeout(1100);
  await mobile.screenshot({ path: "preview-confession-mobile.png" });
  await mobile.getByRole("button", { name: /^Continue/i }).click();
  await mobile.locator("#birthday").waitFor({ state: "visible" });
  await mobile.locator(".transition-fireworks").waitFor({ state: "detached" });
  if (await mobile.evaluate(() => getComputedStyle(document.documentElement).overflow === "hidden")) failures.push("Mobile story remains scroll locked");
  const mobileLongCard = mobile.locator(".reason-card--long").first();
  await mobileLongCard.click();
  if (await mobileLongCard.evaluate(el => el.querySelector(".reason-back").scrollHeight > el.clientHeight + 2)) failures.push("Long personal note overflows on mobile");
  const mobileCardHeights = await mobile.locator(".reason-card").evaluateAll(cards => cards.map(card => Math.round(card.getBoundingClientRect().height)));
  if (new Set(mobileCardHeights).size !== 1) failures.push("Mobile reason cards have unequal heights");
  await mobile.getByRole("button", { name: /Reveal a fact/i }).click();
  await mobile.waitForTimeout(780);
  await mobile.getByRole("button", { name: /Next little fact/i }).click();
  await mobile.waitForTimeout(780);
  await mobile.screenshot({ path: "preview-facts-mobile.png" });
  await mobile.getByRole("button", { name: /Open your letter/i }).first().click();
  if (!await mobile.locator(".envelope-scene").evaluate(el => el.classList.contains("is-open"))) failures.push("Mobile letter did not open");
  await mobile.waitForTimeout(1100);
  const mobileLetterFits = await mobile.locator(".letter-paper").evaluate(el => {
    const paper = el.getBoundingClientRect();
    const section = el.closest("section").getBoundingClientRect();
    return paper.top >= section.top && paper.bottom <= section.bottom;
  });
  if (!mobileLetterFits) failures.push("Opened letter does not fit its mobile section");
  await mobile.locator(".letter-paper").scrollIntoViewIfNeeded();
  await mobile.screenshot({ path: "preview-letter-mobile.png" });
  await mobile.close();
  const shortMobile = await browser.newPage({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await shortMobile.goto(siteUrl, { waitUntil: "networkidle" });
  await shortMobile.getByRole("button", { name: /Begin your birthday surprise/i }).click();
  await shortMobile.locator(".transition-fireworks").waitFor({ state: "detached" });
  const shortButton = await shortMobile.getByRole("button", { name: /Yes, that's me/i }).boundingBox();
  if (!shortButton || shortButton.y + shortButton.height > 667) failures.push("Invitation button is clipped on a short phone screen");
  await shortMobile.close();
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
