import { test, expect } from "@playwright/test";

test("demo role cards fill credentials, announce selection, and recover after an error", async ({
  page,
}) => {
  let release;
  let requested;
  await page.route("**/api/auth/login", async (route) => {
    requested = route.request().postDataJSON();
    await new Promise((resolve) => {
      release = resolve;
    });
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ message: "Demo sign-in could not be completed." }),
    });
  });
  await page.goto("/login");
  await expect(
    page.getByRole("button", { name: "HR", exact: true }),
  ).toBeVisible();
  const hr = page.getByRole("button", { name: "HR", exact: true });
  await hr.focus();
  await page.keyboard.press("Enter");
  await expect(hr).toHaveAttribute("aria-pressed", "true");
  await expect(hr).toBeDisabled();
  await expect(page.getByLabel("Work email")).toHaveValue("hr@staffsync.demo");
  await expect(page.getByLabel(/^Password/)).toHaveValue("StaffSync@2026");
  await expect(page.getByRole("status")).toContainText(
    "Opening the HR workspace",
  );
  expect(requested).toEqual({
    email: "hr@staffsync.demo",
    password: "StaffSync@2026",
  });
  release();
  await expect(page.getByRole("alert")).toBeFocused();
  await expect(hr).toBeEnabled();
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(page.getByLabel(/^Password/)).toHaveAttribute("type", "text");
  await page.getByLabel("Work email").fill("changed@example.test");
  await expect(hr).toHaveAttribute("aria-pressed", "false");
});

test("login layout, helper contrast, focus, and reduced motion work across screen sizes", async ({
  page,
}) => {
  function luminance(rgb) {
    const v = rgb.slice(0, 3).map((n) => {
      const s = n / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  }
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const [name, width, height] of [
    ["desktop", 1440, 900],
    ["laptop", 1280, 720],
    ["mobile", 390, 844],
    ["narrow", 320, 740],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/login");
    await expect(
      page.getByRole("button", { name: "Employee", exact: true }),
    ).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator(".login-form-inner")).toHaveCSS("opacity", "1");
    await page.evaluate(async () => {
      await Promise.all(
        document
          .getAnimations()
          .map((animation) => animation.finished.catch(() => {})),
      );
    });
    if (width >= 721)
      expect(
        await page
          .locator(".login")
          .evaluate((element) => element.getBoundingClientRect().height),
      ).toBeLessThanOrEqual(height + 1);
    const style = await page
      .locator(".demo-role-copy > span")
      .first()
      .evaluate((element) => {
        const s = getComputedStyle(element);
        return {
          size: parseFloat(s.fontSize),
          color: s.color.match(/[\d.]+/g).map(Number),
          background: getComputedStyle(element.closest("button"))
            .backgroundColor.match(/[\d.]+/g)
            .map(Number),
          overflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
    expect(style.overflow).toBe(false);
    expect(style.size).toBeGreaterThanOrEqual(12);
    const l = [luminance(style.color), luminance(style.background)].sort(
      (a, b) => a - b,
    );
    expect((l[1] + 0.05) / (l[0] + 0.05)).toBeGreaterThanOrEqual(4.5);
    await page.screenshot({
      path: `test-results/login-${name}.png`,
      fullPage: true,
    });
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.reload();
  await expect(
    page.getByRole("button", { name: "HR", exact: true }),
  ).toBeVisible();
  expect(
    await page
      .locator(".login-form-inner")
      .evaluate((element) => getComputedStyle(element).animationName),
  ).toBe("none");
  await page.getByRole("button", { name: "HR", exact: true }).focus();
  expect(
    await page
      .getByRole("button", { name: "HR", exact: true })
      .evaluate((element) => getComputedStyle(element).outlineStyle),
  ).not.toBe("none");
  await page.evaluate(() => localStorage.setItem("staffsync-theme", "dark"));
  await page.reload();
  await expect(
    page.getByRole("button", { name: "HR", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/login-dark.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("production login hides demo cards and preserves manual sign-in", async ({
  page,
}) => {
  await page.route("**/api/config", (route) =>
    route.fulfill({ json: { demoEnabled: false } }),
  );
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "HR", exact: true }),
  ).toHaveCount(0);
  await page.getByLabel("Work email").fill("employee@staffsync.demo");
  await page.getByLabel(/^Password/).fill("StaffSync@2026");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.locator("#desktop-sidebar")).toBeVisible();
});
