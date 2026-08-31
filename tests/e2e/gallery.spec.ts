import { expect, test } from "@playwright/test";
import { galleryUrl, getE2eSettings, resetOwnerGallery } from "./support/gallery-fixtures";

const settings = getE2eSettings();
test.skip(!settings, "Set the E2E gallery environment before running authenticated acceptance tests.");
if (settings) test.use({ storageState: settings.storageState });

test.beforeEach(async () => {
  await resetOwnerGallery();
});

test("redirects an anonymous gallery visit to the private login page", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(galleryUrl());
  await expect(page).toHaveURL(/\/login\?next=%2Fgallery/);
  await expect(page.getByRole("heading", { name: "Link Gallery" })).toBeVisible();
  await context.close();
});

test("saves a pasted URL into Inbox and reports an active duplicate", async ({ page }) => {
  const imageUrl = "https://images.example/e2e-inbox.jpg";
  await page.goto(galleryUrl());
  await page.getByRole("button", { name: "Add image URL" }).click();
  await page.getByLabel("Image URL").fill(imageUrl);
  await page.getByRole("button", { name: "Save image" }).click();
  await expect(page.getByText("Image saved to Inbox.")).toBeVisible();

  await page.getByLabel("Image URL").fill(imageUrl);
  await page.getByRole("button", { name: "Save image" }).click();
  await expect(page.getByText("This image is already saved.")).toBeVisible();

  await page.getByRole("button", { name: "Close filters" }).click();
  await page.getByRole("button", { name: "Open filters" }).click();
  await page.getByRole("checkbox", { name: "Inbox only" }).check();
  await expect(page.getByRole("link", { name: imageUrl })).toBeVisible();
});
