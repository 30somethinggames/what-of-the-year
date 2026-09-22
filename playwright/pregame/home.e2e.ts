import { expect, test } from "@playwright/test";
import { testIds } from "test-ids";

const ITEM_HEIGHT = 90;

test("home: changing topic and year pickers updates navigation", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByTestId(testIds.picker.topic)).toBeVisible();
  await expect(page.getByTestId(testIds.picker.year)).toBeVisible();

  // Scroll topic picker to "Books" (index 2)
  const topicPicker = page.getByTestId(testIds.picker.topic);
  await topicPicker.evaluate((el, height) => {
    el.scrollTop = 2 * height;
    el.dispatchEvent(new Event("scrollend"));
  }, ITEM_HEIGHT);

  // Scroll year picker to previous year (index 1)
  const yearPicker = page.getByTestId(testIds.picker.year);
  await yearPicker.evaluate((el, height) => {
    el.scrollTop = 1 * height;
    el.dispatchEvent(new Event("scrollend"));
  }, ITEM_HEIGHT);

  const previousYear = new Date().getFullYear() - 1;

  await page.getByTestId(testIds.home.start).click();

  await expect(page).toHaveURL(new RegExp(`/books/${previousYear}`));
  await expect(page.getByText(`Book of ${previousYear}`)).toBeVisible();
});
