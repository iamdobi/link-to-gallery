import { expect, test } from "@playwright/test";
import { galleryUrl, getE2eSettings, resetOwnerGallery, seedImages } from "./support/gallery-fixtures";

const settings = getE2eSettings();
test.skip(!settings, "Set the E2E gallery environment before running authenticated acceptance tests.");
if (settings) test.use({ storageState: settings.storageState });

test.beforeEach(async () => {
  await resetOwnerGallery();
});

test("retries a broken image and returns from swipe-down viewer dismissal to the same masonry item", async ({ page }) => {
  const images = await seedImages(Array.from({ length: 24 }, (_, index) => ({
    originalUrl: `https://images.example/e2e-viewer-${index}.jpg`,
    loadStatus: index === 0 ? "broken" : "unknown",
  })));

  await page.goto(galleryUrl());
  await expect(page.getByText("Image unavailable").first()).toBeVisible();
  await page.getByRole("button", { name: "Retry" }).first().click();

  const target = page.locator(`#gallery-image-${images[12].id}`);
  await target.scrollIntoViewIfNeeded();
  const scrollBeforeOpen = await page.evaluate(() => window.scrollY);
  await target.click();
  await expect(page.getByRole("dialog", { name: "Full screen image viewer" })).toBeVisible();
  const viewer = page.getByRole("dialog", { name: "Full screen image viewer" });
  await viewer.dispatchEvent("pointerdown", { clientX: 180, clientY: 120 });
  await viewer.dispatchEvent("pointerup", { clientX: 180, clientY: 280 });
  await expect(viewer).toBeHidden();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(scrollBeforeOpen);
  await expect(target).toBeFocused();
});
