import { test, expect } from "@playwright/test";

for (const setup of [
  { name: "desktop", width: 1260, height: 881, theme: "light" },
  { name: "mobile dark", width: 390, height: 700, theme: "dark" },
  { name: "short window", width: 768, height: 360, theme: "light" },
]) {
  test(`session loading stays compact and completes after reload on ${setup.name}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: setup.width, height: setup.height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(
      (theme) => localStorage.setItem("staffsync-theme", theme),
      setup.theme,
    );
    let release;
    await page.route("**/api/auth/me", async (route) => {
      await new Promise((resolve) => {
        release = resolve;
      });
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ message: "Please sign in." }),
      });
    });
    await page.goto("/login");
    for (let attempt = 0; attempt < 2; attempt++) {
      const status = page.getByRole("status", { name: "Opening StaffSync" });
      await expect(status).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute(
        "data-theme",
        setup.theme,
      );
      await expect(status).toContainText("Checking your session");
      await expect(
        status.getByLabel("StaffSync", { exact: true }),
      ).toBeVisible();
      await expect(status.locator(".MuiSkeleton-root")).toHaveCount(0);
      expect(
        await page.evaluate(() => ({
          vertical: document.documentElement.scrollHeight > innerHeight,
          horizontal: document.documentElement.scrollWidth > innerWidth,
        })),
      ).toEqual({ vertical: false, horizontal: false });
      if (attempt === 0)
        await page.screenshot({
          path: `../../work/reload-loading/${setup.name.replaceAll(" ", "-")}.png`,
        });
      await expect.poll(() => typeof release).toBe("function");
      release();
      await expect(page.getByLabel("Work email")).toBeVisible();
      if (attempt === 0) {
        release = undefined;
        await page.reload();
      }
    }
  });
}
