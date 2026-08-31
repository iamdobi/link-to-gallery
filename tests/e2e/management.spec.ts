import { expect, test } from "@playwright/test";
import { assignTags, galleryUrl, getE2eSettings, resetOwnerGallery, seedFolders, seedImages, seedTags } from "./support/gallery-fixtures";

const settings = getE2eSettings();
test.skip(!settings, "Set the E2E gallery environment before running authenticated acceptance tests.");
if (settings) test.use({ storageState: settings.storageState });

test.beforeEach(async () => {
  await resetOwnerGallery();
});

test("assigns two folders, filters tag matches, and restores a trashed phone selection", async ({ page }) => {
  const [first, second, third] = await seedImages([
    { originalUrl: "https://images.example/e2e-red.jpg" },
    { originalUrl: "https://images.example/e2e-blue.jpg" },
    { originalUrl: "https://images.example/e2e-purple.jpg" },
  ]);
  await seedFolders(["Reference", "Inspiration"]);
  const tags = await seedTags(["Color", "Material"]);
  await assignTags(first.id, [tags[0].id]);
  await assignTags(second.id, [tags[1].id]);
  await assignTags(third.id, [tags[0].id, tags[1].id]);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(galleryUrl());
  await page.getByRole("button", { name: "Enter management mode" }).click();
  await page.getByRole("button", { name: "Toggle image selection" }).nth(0).click();
  await page.getByRole("button", { name: "Toggle image selection" }).nth(1).click();
  await page.getByRole("button", { name: "Add folders to selected images" }).click();
  await page.getByRole("checkbox", { name: "Reference" }).check();
  await page.getByRole("checkbox", { name: "Inspiration" }).check();
  await page.getByRole("button", { name: "Add to selected images" }).click();
  await expect(page.getByText("2 updated, 0 failed")).toBeVisible();

  await page.getByRole("button", { name: "Clear image selection" }).click();
  await page.getByRole("button", { name: "Return to viewer mode" }).click();
  await page.getByRole("button", { name: "Open filters" }).click();
  await page.getByRole("checkbox", { name: "Color" }).check();
  await page.getByRole("checkbox", { name: "Material" }).check();
  await page.getByRole("button", { name: "All" }).click();
  await expect(page.getByRole("button", { name: "Open image" })).toHaveCount(1);

  await page.getByRole("button", { name: "Enter management mode" }).click();
  await page.getByRole("button", { name: "Toggle image selection" }).click();
  await page.getByRole("button", { name: "Trash selected images" }).click();
  await page.getByRole("button", { name: "Move to trash" }).click();
  await page.getByRole("button", { name: "Open filters" }).click();
  await page.getByRole("checkbox", { name: "Trash only" }).check();
  await page.getByRole("button", { name: "Toggle image selection" }).click();
  await page.getByRole("button", { name: "Restore selected images" }).click();
  await expect(page.getByText("1 updated, 0 failed")).toBeVisible();
});
