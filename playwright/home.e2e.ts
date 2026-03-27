import { expect, test } from "@playwright/test";

const ITEM_HEIGHT = 90;

test("home: changing topic and year pickers updates navigation", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByTestId("topic-picker")).toBeVisible();
  await expect(page.getByTestId("year-picker")).toBeVisible();

  // Scroll topic picker to "Books" (index 2)
  const topicPicker = page.getByTestId("topic-picker");
  await topicPicker.evaluate((el, height) => {
    el.scrollTop = 2 * height;
    el.dispatchEvent(new Event("scrollend"));
  }, ITEM_HEIGHT);

  // Scroll year picker to previous year (index 1)
  const yearPicker = page.getByTestId("year-picker");
  await yearPicker.evaluate((el, height) => {
    el.scrollTop = 1 * height;
    el.dispatchEvent(new Event("scrollend"));
  }, ITEM_HEIGHT);

  const previousYear = new Date().getFullYear() - 1;

  await page.getByTestId("home-start").click();

  await expect(page).toHaveURL(new RegExp(`/books/${previousYear}`));
  await expect(page.getByText(`Book of ${previousYear}`)).toBeVisible();
});
