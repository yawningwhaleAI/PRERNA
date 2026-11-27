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

test("default plan is the buyer-backed hybrid: floor 15 → ceiling 20; 100% bulk secured gives 20 of 20", async ({ page }) => {
  await page.goto("/command-centre");
  await expect(page.getByTestId("scenario-SH")).toHaveClass(/bg-navy/);
  await expect(page.getByTestId("floor")).toHaveText("15 / 20");
  await expect(page.getByTestId("ceiling")).toHaveText("20 / 20");
  await expect(page.getByTestId("kpi-competitive")).toHaveText("17");
  await page.getByTestId("bulk-secured").fill("100");
  await expect(page.getByTestId("demand-competitive")).toHaveText("20 of 20");
  await expect(page.getByTestId("kpi-competitive")).toHaveText("20");
});

test("/start is server-rendered with real numbers (QR path)", async ({ request }) => {
  const html = (await (await request.get("/start")).text()).replace(/<!-- -->/g, "");
  expect(html).not.toContain("Loading saved inputs");
  expect(html).toContain("15 / 20");
  expect(html).toContain("₹42,400");
  expect(html).toContain("GDi Partners");
  expect(html).not.toMatch(/\+91|70452/);
});

test("headroom price rise is hidden by default", async ({ page }) => {
  await page.goto("/inclusion");
  await expect(page.getByTestId("advanced-analysis")).not.toHaveAttribute("open", "");
  await expect(page.getByText("not part of the recommendation")).toBeVisible();
});

test("pilot tracker: scope, gates, unresolved working capital", async ({ page }) => {
  await page.goto("/pilot");
  await expect(page.getByText("11 SHGs")).toBeVisible();
  await expect(page.getByText("118 members, 71 earning today")).toBeVisible();
  await expect(page.getByText("Gate 3 · end-Sep 2027")).toBeVisible();
  await expect(page.getByText("Unresolved: working capital funding")).toBeVisible();
});

test("warehouse finances: ₹74,100 transfer and working capital at 30/60 days", async ({ page }) => {
  await page.goto("/ac-pnl");
  await expect(page.getByText("Re-linking moves ₹74,100 of gross markup from Bijnor to Lucknow")).toBeVisible();
  await expect(page.getByTestId("wc-unresolved")).toHaveText("Unresolved: who funds it.");
  await expect(page.getByTestId("wc-value")).toHaveText("₹10,34,407");
  await page.getByLabel("Institutional payment days").selectOption("60");
  await expect(page.getByTestId("wc-value")).toHaveText("₹13,68,928");
});
