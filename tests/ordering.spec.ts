import { test, expect, Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const addPizza = (page: Page) =>
  page
    .getByRole("button", {
      name: /^Add Artisanal Woodfired Paneer Tikka Pizza to cart/,
    })
    .click();
async function openReview(page: Page) {
  await addPizza(page);
  await page.getByRole("button", { name: /Open shopping cart/ }).click();
  await page.getByRole("button", { name: /Review Order/ }).click();
}
async function fillDetails(page: Page) {
  await page.getByLabel("Full name", { exact: true }).fill("Test Customer");
  await page
    .getByLabel("Mobile number", { exact: true })
    .fill("+91 98765 43210");
  await page
    .getByLabel("Street address", { exact: true })
    .fill("123 Sample Road");
  await page
    .getByLabel("Apartment or floor (optional)", { exact: true })
    .fill("4B");
  await page.getByLabel("City", { exact: true }).fill("Pune");
  await page.getByLabel("PIN code", { exact: true }).fill("411001");
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("corrupt cart recovers and forged stored prices are ignored", async ({
  page,
}) => {
  for (const value of [
    "{}",
    "not-json",
    "[null]",
    '{"version":1,"items":null}',
  ]) {
    await page.evaluate(
      (stored) => localStorage.setItem("soul_bites_cart", stored),
      value,
    );
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Open shopping cart with 0 items" }),
    ).toBeVisible();
  }
  await page.evaluate(() =>
    localStorage.setItem(
      "soul_bites_cart",
      JSON.stringify([{ item: { id: "sb-07", price: -100 }, quantity: 1 }]),
    ),
  );
  await page.reload();
  await page.getByRole("button", { name: /Open shopping cart/ }).click();
  await expect(page.getByRole("dialog")).toContainText("₹159.95");
  await expect(
    page.getByRole("button", { name: /Review Order/ }),
  ).toBeDisabled();
});

test("featured dish can be added with Enter and Space", async ({ page }) => {
  const button = page.getByRole("button", {
    name: /^Add to cart: Soul Fire Smash Burger/,
  });
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Open shopping cart with 1 item" }),
  ).toBeVisible();
  await expect(button).toBeVisible();
  await button.focus();
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("button", { name: "Open shopping cart with 2 items" }),
  ).toBeVisible();
});

test("cart and review have named modal dialogs, trapped focus and Escape support", async ({
  page,
}) => {
  await addPizza(page);
  const trigger = page.getByRole("button", { name: /Open shopping cart/ });
  await trigger.click();
  await expect(
    page.getByRole("dialog", { name: "Your Order (1)" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      document.querySelector("dialog")?.contains(document.activeElement),
    ),
  ).toBe(true);
  await page.getByRole("button", { name: /Review Order/ }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Close cart" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.getByRole("button", { name: /Review Order/ }).click();
  await page.getByRole("button", { name: "Save order preview" }).focus();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Close dialog" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
});

test("validation associates errors and saving a preview clears its cart and survives refresh", async ({
  page,
}) => {
  await openReview(page);
  await page.getByRole("button", { name: "Save order preview" }).click();
  await expect(page.getByLabel("Full name", { exact: true })).toBeFocused();
  await expect(page.getByLabel("Full name", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await fillDetails(page);
  await page
    .getByLabel("Mobile number", { exact: true })
    .fill("abc12345678901234567890");
  await page.getByRole("button", { name: "Save order preview" }).click();
  await expect(
    page.getByLabel("Mobile number", { exact: true }),
  ).toHaveAttribute("aria-invalid", "true");
  await fillDetails(page);
  await page.getByRole("button", { name: "Save order preview" }).click();
  await expect(
    page.getByRole("heading", { name: "Your latest order preview" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open shopping cart with 0 items" }),
  ).toBeVisible();
  await expect(page.locator("#order-preview")).toContainText(
    "4B, Pune, 411001",
  );
  await expect(page.locator("#order-preview")).toContainText(
    "No order has been placed or paid for",
  );
  await page.reload();
  await page.getByRole("button", { name: "View preview" }).click();
  await expect(page.locator("#order-preview")).toContainText(
    "Artisanal Woodfired Paneer Tikka Pizza",
  );
  await page.getByRole("button", { name: "Clear preview" }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "View preview" })).toHaveCount(
    0,
  );
});

test("Back cancels a pending preview without clearing the cart or saving an order", async ({
  page,
}) => {
  await openReview(page);
  await fillDetails(page);
  await page.getByRole("button", { name: "Save order preview" }).click();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page.waitForTimeout(500);
  await expect(page.getByRole("button", { name: "View preview" })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("button", { name: "Open shopping cart with 1 item" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("soul_bites_order_preview"),
    ),
  ).toBeNull();
});

test("cart syncs across tabs and retains additions made while preview is saving", async ({
  page,
  context,
}) => {
  await openReview(page);
  await fillDetails(page);
  const other = await context.newPage();
  await other.goto("/");
  await expect(
    other.getByRole("button", { name: "Open shopping cart with 1 item" }),
  ).toBeVisible();
  await addPizza(other);
  await expect(
    page.getByRole("button", {
      name: "Open shopping cart with 2 items",
      includeHidden: true,
    }),
  ).toHaveCount(1);
  await page.getByRole("button", { name: "Save order preview" }).click();
  // A different tab can still change the cart while the first tab reviews its snapshot.
  await addPizza(other);
  await expect(
    page.getByRole("heading", { name: "Your latest order preview" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open shopping cart with 1 item" }),
  ).toBeVisible();
  await expect(
    other.getByRole("button", { name: "Open shopping cart with 1 item" }),
  ).toBeVisible();
});

test("simultaneous additions in two tabs are both retained", async ({
  page,
  context,
}) => {
  const other = await context.newPage();
  await other.goto("/");
  await Promise.all([addPizza(page), addPizza(other)]);
  for (const tab of [page, other]) {
    await expect(
      tab.getByRole("button", { name: "Open shopping cart with 2 items" }),
    ).toBeVisible();
  }
});

test("dietary filtering includes vegan items in vegetarian results", async ({
  page,
}) => {
  await page.getByLabel("Dietary preference").selectOption("veg");
  await expect(page.locator("[class*=menuGrid]")).not.toContainText(
    "Soul Fire Smash Burger",
  );
  await expect(page.locator("[class*=menuGrid]")).toContainText(
    "Golden Harvest Soul Bowl",
  );
  await page.getByRole("textbox", { name: "Search menu" }).fill("not-a-dish");
  await expect(page.getByText("No bites match your criteria")).toBeVisible();
  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(page.locator("[class*=menuGrid]")).toContainText(
    "Golden Harvest Soul Bowl",
  );
});

test("home, cart and review pass automated accessibility checks", async ({
  page,
}) => {
  const scan = async () => {
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa", "best-practice"])
      .analyze();
    expect(
      result.violations.map(({ id, nodes }) => ({
        id,
        nodes: nodes.map(({ html, failureSummary }) => ({
          html,
          failureSummary,
        })),
      })),
    ).toEqual([]);
  };
  await scan();
  await addPizza(page);
  await page.getByRole("button", { name: /Open shopping cart/ }).click();
  await scan();
  await page.getByRole("button", { name: /Review Order/ }).click();
  await scan();
});

test("reduced motion uses the still hero and keeps menu navigation available", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(
    page.getByRole("link", { name: "Explore the menu" }),
  ).toBeVisible();
  await expect(page.locator("#top")).not.toHaveAttribute(
    "data-motion",
    "webgl",
  );
  await expect(page.getByAltText(/Double smash burger/)).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("featured dishes follow the combined hero and advance and rewind with native scroll", async ({
  page,
}) => {
  const hero = page.locator("#top");
  await expect(hero.getByAltText(/Double smash burger/)).toBeVisible();
  await expect(hero.getByRole("img", { name: "Lime and mint mojito" })).toBeVisible();
  await expect(hero.getByRole("img", { name: "Charcoal truffle fries" })).toBeVisible();
  await expect(page.locator("#top + #featured")).toHaveCount(1);

  await page.getByRole("link", { name: "Featured", exact: true }).click();
  const featured = page.getByRole("region", { name: "Featured dishes", exact: true });
  const fries = featured.getByRole("button", {
    name: /^Add to cart: Charcoal Truffle/,
  });
  await expect(fries).toBeVisible();
  await expect.poll(() =>
    page.locator("#featured").evaluate((section) => {
      const nav = parseFloat(getComputedStyle(section).scrollMarginTop);
      return Math.abs(section.getBoundingClientRect().top - nav);
    }),
  ).toBeLessThan(3);
  await expect(featured.getByRole("button", { name: /rotation|featured dish/ })).toHaveCount(0);

  const scrollCarouselTo = (progress: number) =>
    featured.evaluate((track, progress) => {
      const nav = parseFloat(getComputedStyle(track).getPropertyValue("--nav-height"));
      const travel = track.clientHeight - track.firstElementChild!.clientHeight;
      window.scrollBy({
        top: track.getBoundingClientRect().top - nav + travel * progress,
        behavior: "instant",
      });
    }, progress);

  await scrollCarouselTo(0.25);
  await expect(
    featured.getByRole("button", { name: /^Add to cart: Warm Salted/ }),
  ).toBeVisible();
  await scrollCarouselTo(0);
  await expect(fries).toBeInViewport();
  await page.goto("/?entry=featured#featured");
  await expect(page.locator("#featured")).toBeInViewport({ ratio: 0.1 });
});

test("the sign-in page offers a guest route", async ({
  page,
}) => {
  await page.getByRole("link", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeVisible();
  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Send sign-in link" }),
  ).toBeVisible();
  await page.getByRole("link", { name: /Continue as guest/ }).click();
  await expect(page).toHaveURL(/#menu$/);
  await expect(
    page.getByRole("heading", { name: "Find your bite." }),
  ).toBeVisible();
});
