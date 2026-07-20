import { expect, test, type Page, type TestInfo } from "@playwright/test";

const SAVE_KEY = "ggs.active-game.v2";

async function startGame(page: Page, options: { rounds?: number; mode?: string } = {}) {
  await page.goto("/");
  await page.getByRole("button", { name: /enter the grow stage/i }).click();
  if (options.mode) await page.getByRole("button", { name: new RegExp(options.mode, "i") }).click();
  if (options.rounds) await page.getByLabel("Rounds").selectOption(String(options.rounds));
  await page.getByRole("button", { name: /light up the stage/i }).click();
  await expect(page.getByText(/tonight's contestants/i)).toBeVisible();
  await page.getByRole("button", { name: /begin quick clone/i }).click();
  await expect(page.getByRole("button", { name: /spin the wheel/i })).toBeEnabled();
}

async function savedAnswer(page: Page) {
  await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}").state?.puzzle?.answer || null, SAVE_KEY)).not.toBeNull();
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}").state.puzzle.answer as string, SAVE_KEY);
}

async function savedBonusAnswer(page: Page) {
  await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}").state?.bonusPuzzle?.answer || null, SAVE_KEY)).not.toBeNull();
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}").state.bonusPuzzle.answer as string, SAVE_KEY);
}

async function solveCurrent(page: Page, answer?: string) {
  const solve = answer ?? await savedAnswer(page);
  await page.getByRole("button", { name: /solve the full board/i }).click();
  await page.getByLabel("Your solve").fill(solve);
  await page.getByRole("button", { name: /lock in solve/i }).click();
}

function desktopOnly(testInfo: TestInfo) {
  test.skip(testInfo.project.name !== "desktop", "covered in the desktop critical-flow project");
}

test("starts a solo game from the landing page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /eight ways/i })).toBeVisible();
  await startGame(page);
});

test("completes a normal round and reveals its educational note", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await startGame(page, { rounds: 1, mode: "Terpene Sprint" });
  await solveCurrent(page);
  await expect(page.getByText(/knowledge unlocked/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /crown the winner/i })).toBeVisible();
});

test("hits Compost Pile through an angle-determined wheel spin", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.addInitScript(() => { Math.random = () => 0.06; });
  await startGame(page);
  await page.getByRole("button", { name: /spin the wheel/i }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("ggs.stats.v2") || "{}").compostCount || 0), { timeout: 8_000 }).toBeGreaterThan(0);
});

test("purchases a vowel and records the local statistic", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await startGame(page, { mode: "Terpene Sprint" });
  await page.evaluate((key) => {
    const saved = JSON.parse(localStorage.getItem(key)!);
    saved.state.players[0].roundPoints = 1000;
    localStorage.setItem(key, JSON.stringify(saved));
  }, SAVE_KEY);
  await page.reload();
  await page.getByRole("button", { name: /resume saved match/i }).click();
  await page.getByRole("button", { name: /buy vowel/i }).click();
  await page.getByRole("button", { name: "A", exact: true }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("ggs.stats.v2") || "{}").vowelsPurchased || 0)).toBe(1);
});

test("keeps the answer hidden after an incorrect solve", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await startGame(page, { mode: "Terpene Sprint" });
  await solveCurrent(page, "NOT THE ANSWER");
  await expect(page.getByText(/does not fit the board/i).first()).toBeVisible();
  await expect(page.getByText(/knowledge unlocked/i)).toHaveCount(0);
});

test("completes the Speed Trim final round", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await startGame(page, { rounds: 6, mode: "Terpene Sprint" });
  for (let round = 0; round < 6; round += 1) {
    if (round === 5) await expect(page.getByText(/Speed Trim Final/i).first()).toBeVisible();
    await solveCurrent(page);
    await expect(page.getByText(/knowledge unlocked/i)).toBeVisible();
    if (round < 5) {
      await page.getByRole("button", { name: /next round/i }).click();
      await page.getByRole("button", { name: /raise the board/i }).click();
    }
  }
  await page.getByRole("button", { name: /crown the winner/i }).click();
  await expect(page.getByText(/wins the match/i)).toBeVisible();
});

test("enters the Harvest Vault after winning a match", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await startGame(page, { rounds: 1, mode: "Terpene Sprint" });
  await solveCurrent(page);
  await page.getByRole("button", { name: /crown the winner/i }).click();
  await expect(page.getByRole("button", { name: /enter the Harvest Vault/i })).toBeVisible();
});

test("completes a full match and wins the Harvest Vault", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await startGame(page, { rounds: 1, mode: "Terpene Sprint" });
  await solveCurrent(page);
  await page.getByRole("button", { name: /crown the winner/i }).click();
  await page.getByRole("button", { name: /enter the Harvest Vault/i }).click();
  for (const letter of ["B", "C", "D", "A"]) await page.getByRole("button", { name: letter, exact: true }).click();
  const bonusAnswer = await savedBonusAnswer(page);
  await page.getByRole("button", { name: /start 30-second vault/i }).click();
  await page.getByLabel("Harvest Vault answer").fill(bonusAnswer);
  await page.getByRole("button", { name: /open the vault/i }).click();
  await expect(page.getByRole("heading", { name: /Golden Trichome unlocked/i })).toBeVisible();
});

test("persists and resumes a saved game", async ({ page }) => {
  await startGame(page, { mode: "Terpene Sprint" });
  await page.reload();
  await page.getByRole("button", { name: /resume saved match/i }).click();
  await expect(page.getByText(/save restored/i)).toBeVisible();
});

test("imports a validated custom puzzle pack", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /puzzle packs/i }).click();
  await page.getByRole("button", { name: /load example/i }).click();
  await page.getByRole("button", { name: /validate & import/i }).click();
  await expect(page.getByText(/imported with 1 validated puzzle/i)).toBeVisible();
});

test("mobile layout exposes navigation plus board and wheel tabs", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "mobile-only layout check");
  await page.goto("/");
  await expect(page.getByRole("button", { name: /puzzle packs/i })).toBeVisible();
  await startGame(page);
  await expect(page.getByRole("button", { name: /puzzle board/i })).toBeVisible();
  await page.getByRole("button", { name: /^view wheel$/i }).click();
  await expect(page.getByRole("img", { name: /prize wheel/i })).toBeVisible();
  await expect(page.locator(".wheel__labels > button")).toHaveCount(18);
  await page.getByRole("button", { name: /list view/i }).click();
  await expect(page.locator(".wheel-list button")).toHaveCount(18);
});

test("one request produces one angle-locked spin and waits for its letter", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.addInitScript(() => { Math.random = () => 0; });
  await startGame(page);
  const spin = page.locator(".action-button--spin");
  const wheel = page.locator(".wheel");
  const before = await wheel.getAttribute("style");
  await spin.evaluate((button) => { (button as HTMLButtonElement).click(); (button as HTMLButtonElement).click(); (button as HTMLButtonElement).click(); });
  await expect(page.getByText(/the wheel is spinning/i).first()).toBeVisible();
  await expect(spin).toBeDisabled();
  await expect(page.getByRole("heading", { name: /landed on: 500 grow points/i })).toBeVisible({ timeout: 6_000 });
  const stopped = await wheel.getAttribute("style");
  expect(stopped).not.toBe(before);
  await page.waitForTimeout(650);
  expect(await wheel.getAttribute("style")).toBe(stopped);
  await expect(page.getByText(/choose one unused consonant/i).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /choose a consonant/i })).toBeDisabled();
  await page.locator(".letter-picker button").first().click();
  await expect(page.getByText(/result resolved|your turn|waiting for/i).first()).toBeVisible({ timeout: 5_000 });
});

test("Terpene Tina takes an automated spin after the human turn ends", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.addInitScript(() => { Math.random = () => 0; });
  await startGame(page);
  const answer = await savedAnswer(page);
  const missingConsonant = "BCDFGHJKLMNPQRSTVWXYZ".split("").find((letter) => !answer.includes(letter));
  expect(missingConsonant).toBeTruthy();

  await page.getByRole("button", { name: /spin the wheel/i }).click();
  await expect(page.locator(".letter-picker")).toBeVisible({ timeout: 6_000 });
  await page.getByRole("button", { name: missingConsonant!, exact: true }).click();
  await expect(page.getByText(/waiting for Terpene Tina/i).first()).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText(/the wheel is spinning/i).first()).toBeVisible({ timeout: 5_000 });
});

test("every wedge is labeled and keyboard-inspectable", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await startGame(page);
  const wedges = page.locator(".wheel__labels > button");
  await expect(wedges).toHaveCount(18);
  for (let index = 0; index < 18; index += 1) {
    await expect(wedges.nth(index)).not.toHaveText("");
    await wedges.nth(index).focus();
  }
  await expect(page.getByRole("heading", { name: /wheel guide/i })).toBeVisible();
});
