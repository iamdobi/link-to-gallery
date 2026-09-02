import { expect, test } from "@playwright/test";
import { galleryUrl, getE2eSettings, resetOwnerGallery, seedFolders, seedImages } from "./support/gallery-fixtures";

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

test("opens the mobile gallery menu and signs out", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(galleryUrl());

  await page.getByRole("button", { name: "Open gallery menu" }).click();
  await expect(page.getByRole("dialog", { name: "Gallery menu" })).toBeVisible();
  await page.getByRole("button", { name: "Log out" }).click();

  await expect(page).toHaveURL(/\/login$/);
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

test("organizes an Inbox image and advances to the next image", async ({ page }) => {
  const [first, second] = await seedImages([
    { originalUrl: "https://images.example/e2e-triage-first.jpg" },
    { originalUrl: "https://images.example/e2e-triage-second.jpg" },
  ]);
  await seedFolders(["Reference"]);

  await page.goto(galleryUrl());
  await page.getByRole("button", { name: "Organize Inbox" }).click();
  await expect(page.getByRole("dialog", { name: "Organize Inbox" }).getByText(first.originalUrl)).toBeVisible();
  await page.getByRole("button", { name: "Add folders" }).click();
  const picker = page.getByRole("dialog", { name: "Add folders" });
  await picker.getByRole("checkbox", { name: "Reference" }).check();
  await picker.getByRole("button", { name: "Organize and continue" }).click();

  await expect(page.getByRole("dialog", { name: "Organize Inbox" }).getByText(second.originalUrl)).toBeVisible();
  await expect(page.getByText("1 Inbox").first()).toBeVisible();
});
