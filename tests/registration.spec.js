import { test, expect } from "@playwright/test";

test("registration validates passwords, normalizes emails, rejects duplicates, and opens an employee workspace", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const email = `registration-check-${Date.now()}@example.test`;
  await page.goto("/register");
  await page
    .getByRole("textbox", { name: "First name", exact: true })
    .fill("Registration");
  await page
    .getByRole("textbox", { name: "Last name", exact: true })
    .fill("Check");
  await page.getByLabel("Work email").fill(email.toUpperCase());
  await page.getByLabel(/^Password/).fill("short");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("password");
  await expect(
    page.getByRole("button", { name: "Create account", exact: true }),
  ).toBeEnabled();
  await page.getByLabel(/^Password/).fill("Registration@2026");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Account created");
  await expect(page.getByLabel(/^Password/)).toHaveCount(0);

  await page.reload();
  await page
    .getByRole("textbox", { name: "First name", exact: true })
    .fill("Registration");
  await page
    .getByRole("textbox", { name: "Last name", exact: true })
    .fill("Duplicate");
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel(/^Password/).fill("Registration@2026");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("already exists");

  await page.getByRole("link", { name: "Back to sign in" }).click();
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel(/^Password/).fill("Registration@2026");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.locator("#desktop-sidebar")).toBeVisible({
    timeout: 15000,
  });
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15000 });
  await expect(
    page
      .locator("#desktop-sidebar")
      .getByRole("link", { name: "People", exact: true }),
  ).toHaveCount(0);
  await expect(
    page
      .locator("#desktop-sidebar")
      .getByRole("link", { name: "Reports", exact: true }),
  ).toHaveCount(0);
  await page.goto("/hr");
  await expect(page).toHaveURL(/\/dashboard$/);
  await page
    .locator("#desktop-sidebar")
    .getByRole("link", { name: "My profile", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "My profile", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".profile-facts")).toContainText("Unassigned");
  expect(errors).toEqual([]);
});

for (const role of ["HR", "Manager"]) {
  test(`registration creates a ${role} workspace without an invitation`, async ({
    page,
  }) => {
    await page.goto("/register");
    await page
      .getByRole("textbox", { name: "First name", exact: true })
      .fill(role);
    await page
      .getByRole("textbox", { name: "Last name", exact: true })
      .fill("Check");
    await page
      .getByLabel("Work email")
      .fill(`${role.toLowerCase()}-check-${Date.now()}@example.test`);
    const email = await page.getByLabel("Work email").inputValue();
    await page.getByLabel(/^Password/).fill("Registration@2026");
    await page.getByLabel("Account type").click();
    for (const name of ["Employee", "HR", "Manager"]) {
      await expect(
        page.getByRole("option", { name, exact: true }),
      ).toBeVisible();
    }
    await page.getByRole("option", { name: role, exact: true }).click();
    await expect(page.getByLabel(/invitation/i)).toHaveCount(0);
    await page
      .getByRole("button", { name: "Create account", exact: true })
      .click();
    await expect(page.getByRole("alert")).toContainText("Account created");
    await page.getByRole("link", { name: "Back to sign in" }).click();
    await page.getByLabel("Work email").fill(email);
    await page.getByLabel(/^Password/).fill("Registration@2026");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.locator("#desktop-sidebar")).toBeVisible({
      timeout: 15000,
    });
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15000 });
    await expect(
      page
        .locator("#desktop-sidebar")
        .getByRole("link", { name: "People", exact: true }),
    ).toHaveCount(1);
    await expect(
      page
        .locator("#desktop-sidebar")
        .getByRole("link", { name: "Reports", exact: true }),
    ).toHaveCount(role === "HR" ? 1 : 0);
    await expect(
      page
        .locator("#desktop-sidebar")
        .getByRole("link", { name: "Learning & growth", exact: true }),
    ).toBeVisible();
  });
}
