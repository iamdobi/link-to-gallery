import { expect, test } from "@playwright/test";
import { buildBookmarklet } from "../../src/lib/bookmarklet";

test("lets a user choose a visible image from an ordinary page", async ({ page }) => {
  await page.context().route("https://gallery.example/**", (route) => route.fulfill({ body: "capture" }));
  await page.setContent(`
    <img alt="First image" src="https://images.example/first.jpg" style="width: 240px; height: 180px" />
    <img alt="Second image" src="https://images.example/second.jpg" style="width: 320px; height: 240px" />
  `);

  await page.evaluate((bookmarklet) => Function(bookmarklet.slice("javascript:".length))(), buildBookmarklet("https://gallery.example"));

  await expect(page.getByRole("button", { name: "Save image candidate 1" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save image candidate 2" })).toBeVisible();

  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Save image candidate 2" }).click();
  const popup = await popupPromise;
  await expect.poll(() => popup.url()).toBe("https://gallery.example/capture?url=https%3A%2F%2Fimages.example%2Fsecond.jpg");
});
