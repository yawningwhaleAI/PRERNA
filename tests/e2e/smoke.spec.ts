import { expect, test } from "@playwright/test";

test("open the app, switch S0 → S3: competitive products go 10 → 20", async ({ page }) => {
  await page.goto("/command-centre");
  await page.getByTestId("scenario-S0").click();
  await expect(page.getByTestId("kpi-competitive")).toHaveText("10");
  await page.getByTestId("scenario-S3").click();
  await expect(page.getByTestId("kpi-competitive")).toHaveText("20");
});

test("box builder blocks a mixed-AC box", async ({ page }) => {
  await page.goto("/buyers");
  await page.getByTestId("qty-SHG-01").fill("1");
  await page.getByTestId("qty-SHG-08").fill("1");
  await expect(page.getByTestId("box-status")).toContainText("Mixed-AC box blocked");
});
