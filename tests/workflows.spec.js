import { test, expect } from "@playwright/test";
import assert from "node:assert/strict";
test("registration, protected role dashboards, and icon-only sidebar", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/register");
  await page
    .getByRole("textbox", { name: "First name", exact: true })
    .fill("Registration");
  await page
    .getByRole("textbox", { name: "Last name", exact: true })
    .fill("Test");
  const email = `browser-${Date.now()}@example.test`;
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel(/^Password/).fill("Browser@2026");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Account created");
  await page.getByRole("link", { name: "Back to sign in" }).click();
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel(/^Password/).fill("Browser@2026");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.locator("#desktop-sidebar")).toBeVisible();
  await page.goto("/hr");
  await expect(page).toHaveURL(/\/dashboard$/);
  await page
    .getByRole("button", { name: "Collapse sidebar", exact: true })
    .click();
  await expect(
    page.locator("#desktop-sidebar .nav-link span").first(),
  ).toBeHidden();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Expand sidebar", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Expand sidebar", exact: true })
    .click();
  await expect(
    page.locator("#desktop-sidebar .nav-link span").first(),
  ).toBeVisible();
  assert.deepEqual(errors, []);
});
test("complete HR, manager, employee and mobile workflows", async ({
  browser,
  baseURL,
}) => {
  const errors = [];
  const base = baseURL;
  const futureDate = (days) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(Date.now() + days * 86400000));
  async function pageFor(role, viewport = { width: 1440, height: 1000 }) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base);
    await page.getByRole("button", { name: role, exact: true }).click();
    await page.locator("h1").waitFor();
    return page;
  }
  async function nav(page, label) {
    await page
      .locator("aside.sidebar")
      .getByRole("link", { name: label, exact: true })
      .click();
    await page.locator("h1").waitFor();
  }
  const hr = await pageFor("HR");
  await hr.getByRole("heading", { name: "People overview" }).waitFor();
  await hr.locator(".donut-wrap .recharts-pie-sector").first().waitFor();
  await hr.screenshot({
    path: "test-results/staffsync-desktop.png",
    fullPage: true,
  });
  await nav(hr, "People");
  await hr.getByRole("button", { name: "Add employee", exact: true }).click();
  let dialog = hr.getByRole("dialog");
  await dialog.getByLabel("First name").fill("Anika");
  await dialog.getByLabel("Last name").fill("Verma");
  await dialog.getByLabel("Work email").fill("anika.qa@staffsync.demo");
  await dialog.getByLabel("Employee ID").fill("QA-2026");
  await dialog.getByLabel("Department").fill("Engineering");
  await dialog.getByLabel("Job title").fill("Quality Engineer");
  await dialog.getByLabel("Initial password").fill("StaffSync@2026");
  await dialog.getByLabel("Reporting manager").click();
  await hr.getByRole("option", { name: "Arjun Rao" }).click();
  await dialog
    .getByRole("button", { name: "Add employee", exact: true })
    .click();
  await hr.getByText("Anika Verma", { exact: true }).waitFor();
  await hr
    .getByRole("button", { name: "Edit Anika Verma", exact: true })
    .click();
  dialog = hr.getByRole("dialog");
  await dialog.getByLabel("Job title").fill("Senior Quality Engineer");
  await dialog
    .getByRole("button", { name: "Save changes", exact: true })
    .click();
  await hr.getByText("Senior Quality Engineer", { exact: true }).waitFor();
  await hr.getByPlaceholder("Search name, email, or employee ID").fill("Anika");
  await hr.getByText("Showing 1–1 of 1").waitFor();
  await nav(hr, "Announcements");
  await hr.getByRole("button", { name: "Post announcement" }).click();
  dialog = hr.getByRole("dialog");
  await dialog.getByLabel("Title").fill("QA: Your workspace is ready");
  await dialog
    .getByLabel("Your announcement")
    .fill("This is a browser verification announcement.");
  await dialog.getByRole("button", { name: "Publish announcement" }).click();
  await hr
    .getByRole("heading", { name: "QA: Your workspace is ready" })
    .waitFor();
  await nav(hr, "Reports");
  await hr.locator("table tbody tr").first().waitFor();
  const download = hr.waitForEvent("download");
  await hr.getByRole("button", { name: "Export CSV" }).click();
  assert.ok((await download).suggestedFilename().endsWith(".csv"));
  await nav(hr, "Settings");
  await hr.getByRole("button", { name: "Dark", exact: true }).click();
  await nav(hr, "Overview");
  await hr.getByRole("heading", { name: "People overview" }).waitFor();
  await hr.screenshot({
    path: "test-results/staffsync-dark.png",
    fullPage: true,
  });
  await nav(hr, "Settings");
  await hr.getByRole("button", { name: "Light", exact: true }).click();
  const manager = await pageFor("Manager");
  await nav(manager, "Learning & growth");
  await manager.getByRole("button", { name: "Create training" }).click();
  dialog = manager.getByRole("dialog");
  await dialog.getByLabel("Program title").fill("QA: Thoughtful collaboration");
  await dialog
    .getByLabel("Description")
    .fill("Practice clear communication and practical feedback.");
  await dialog.getByLabel("Due date").fill(futureDate(70));
  await dialog.getByLabel("Duration, e.g. 2 hours").fill("1 hour");
  await dialog.getByRole("checkbox", { name: "Maya Shah" }).check();
  await dialog.getByRole("button", { name: "Create & assign" }).click();
  await manager
    .getByRole("heading", { name: "QA: Thoughtful collaboration" })
    .waitFor();
  const employee = await pageFor("Employee");
  await nav(employee, "Learning & growth");
  let card = employee.locator("article").filter({
    has: employee.getByRole("heading", {
      name: "QA: Thoughtful collaboration",
    }),
  });
  await card.getByRole("button", { name: "Start learning" }).click();
  await card.getByRole("button", { name: "Mark complete" }).waitFor();
  await card.getByRole("button", { name: "Mark complete" }).click();
  await card.getByRole("button", { name: "Completed", exact: true }).waitFor();
  await nav(employee, "Time off");
  await employee.getByRole("button", { name: "Request leave" }).click();
  dialog = employee.getByRole("dialog");
  await dialog.getByLabel("Start date").fill(futureDate(60));
  await dialog.getByLabel("End date").fill(futureDate(61));
  await dialog.getByLabel("Reason").fill("QA: Planned personal time.");
  await dialog.getByRole("button", { name: "Submit request" }).click();
  await employee
    .getByText("QA: Planned personal time.", { exact: true })
    .waitFor();
  await nav(manager, "Time off");
  let row = manager
    .locator("tr")
    .filter({ hasText: "QA: Planned personal time." });
  await row.getByRole("button", { name: "Review", exact: true }).click();
  dialog = manager.getByRole("dialog");
  await dialog
    .getByLabel("Review comment (optional)")
    .fill("Approved after team coverage check.");
  await dialog.getByRole("button", { name: "Approve request" }).click();
  await manager
    .getByText("Approved after team coverage check.", { exact: true })
    .waitFor();
  await employee
    .getByText("Approved after team coverage check.", { exact: true })
    .waitFor();
  await nav(employee, "Attendance");
  await employee.getByRole("button", { name: "Check in", exact: true }).click();
  await employee
    .getByRole("button", { name: "Check out", exact: true })
    .waitFor();
  await employee
    .getByRole("button", { name: "Check out", exact: true })
    .click();
  await employee
    .getByRole("button", { name: "Day complete", exact: true })
    .waitFor();
  await nav(employee, "My profile");
  await employee
    .getByLabel("About me")
    .fill("Building thoughtful work with the team.");
  await employee.getByRole("button", { name: "Save changes" }).click();
  await employee.getByText("Profile updated.", { exact: true }).waitFor();
  await nav(hr, "Announcements");
  await hr
    .getByRole("button", { name: "Delete QA: Your workspace is ready" })
    .click();
  await hr
    .getByRole("dialog")
    .getByRole("button", { name: "Remove", exact: true })
    .click();
  await hr
    .getByRole("heading", { name: "QA: Your workspace is ready" })
    .waitFor({ state: "hidden" });
  await nav(manager, "Learning & growth");
  await manager
    .getByRole("button", { name: "Delete QA: Thoughtful collaboration" })
    .click();
  await manager
    .getByRole("dialog")
    .getByRole("button", { name: "Remove", exact: true })
    .click();
  await manager
    .getByRole("heading", { name: "QA: Thoughtful collaboration" })
    .waitFor({ state: "hidden" });
  await nav(hr, "People");
  await hr.getByRole("button", { name: "Remove Anika Verma" }).click();
  await hr
    .getByRole("dialog")
    .getByRole("button", { name: "Remove", exact: true })
    .click();
  await hr
    .getByText("Anika Verma", { exact: true })
    .waitFor({ state: "hidden" });
  const mobile = await pageFor("HR", { width: 390, height: 844 });
  await mobile.getByRole("heading", { name: "People overview" }).waitFor();
  await mobile.locator(".donut-wrap .recharts-pie-sector").first().waitFor();
  assert.equal(
    await mobile.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
    "Mobile has unintended horizontal scrolling",
  );
  await mobile.screenshot({
    path: "test-results/staffsync-mobile.png",
    fullPage: true,
  });
  await mobile.getByRole("button", { name: "Open navigation" }).click();
  await mobile.getByRole("link", { name: "People", exact: true }).click();
  await mobile.getByRole("heading", { name: "Your people" }).waitFor();
  assert.equal(
    await mobile.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await mobile.getByRole("button", { name: "Add employee" }).click();
  await mobile.getByRole("dialog").waitFor();
  await mobile.screenshot({
    path: "test-results/staffsync-mobile-form.png",
    fullPage: true,
  });
  console.log(
    JSON.stringify({
      status: "passed",
      checks: [
        "HR employee CRUD and search",
        "announcement publishing and removal",
        "CSV export",
        "dark theme",
        "manager training creation",
        "employee training progress",
        "leave submission and manager approval with live updates",
        "employee attendance check-in and check-out",
        "profile save",
        "mobile dashboard and navigation",
        "mobile form",
        "no horizontal overflow",
      ],
      browserErrors: errors,
    }),
  );
  assert.deepEqual(errors, []);
});
