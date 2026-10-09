import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dataHref, categoryIds, type Capture } from "../../lib/content/types";

const catalog = JSON.parse(
  readFileSync("content/generated/catalog.json", "utf8"),
) as Capture[];

test("library filters are interactive and do not fetch prompt bodies", async ({
  page,
}) => {
  const bodies: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/data/"))
      bodies.push(request.url());
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "System prompts", exact: true }),
  ).toBeVisible();
  if ((page.viewportSize()?.width ?? 0) >= 1024) {
    const first = catalog.find(
      (item) => item.id === "openai--codex--gpt-6.1-sol--runtime",
    )!;
    const category = categoryIds.find((id) => first.categoryTokens[id] > 0)!;
    const details = page.getByRole("button", {
      name: `Composition details, ${first.tokens.toLocaleString("en-US")} tokens`,
    });
    await details.focus();
    await expect(page.getByRole("tooltip")).toContainText(
      `${first.categoryTokens[category].toLocaleString("en-US")} tokens`,
    );
    await expect(page.getByRole("tooltip")).toContainText(
      `${first.categorySections[category]} section`,
    );
    await expect(page.getByRole("tooltip")).toContainText(
      `${((first.categoryTokens[category] / first.tokens) * 100).toFixed(1)}%`,
    );
    await page.keyboard.press("Escape");
  }
  await page.getByRole("textbox", { name: "Search library" }).fill("DeepSeek");
  await expect(
    page.locator("main").getByRole("link", { name: /GPT-/ }),
  ).toHaveCount(0);
  await expect(
    page.locator("main").getByRole("link", { name: /DeepSeek Chat/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear library search" }).click();
  await page
    .locator("main")
    .getByRole("button", { name: "Google", exact: true })
    .click();
  await expect(page).toHaveURL(/provider=Google/);
  await expect(
    page.locator("main").getByRole("link", { name: /Gemini/ }),
  ).toHaveCount(3);
  expect(bodies).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("reader preserves original text, copies it, and downloads it", async ({
  page,
}) => {
  const original = await readFile(
    ".repos/system_prompts_leaks/DeepSeek/deepseek-chat.md",
    "utf8",
  );
  await page.goto("/prompts/deepseek/deepseek-chat/");
  await expect(
    page.getByRole("heading", { name: "DeepSeek Chat", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Raw", exact: true }).click();
  await expect(page.getByTestId("raw-source")).toHaveText(original);
  await page.getByRole("button", { name: "Copy original prompt" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Original prompt copied.",
  );
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    original,
  );
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download original prompt" }).click();
  const download = await downloadEvent;
  expect(await readFile((await download.path())!, "utf8")).toBe(original);
  await page.reload();
  await expect(
    page.getByRole("tab", { name: "Raw", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
});

test("large captures keep byte integrity and section links work", async ({
  page,
}) => {
  const capture = catalog.find(
    (item) => item.id === "openai--codex--gpt-6.1-sol",
  )!;
  await page.goto("/prompts/openai/codex--gpt-6.1-sol/");
  await expect(
    page.getByRole("heading", { name: capture.title, exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Structure", exact: true }).click();
  await expect(
    page.getByRole("tabpanel").getByText("Section", { exact: true }),
  ).toBeVisible();
  await page.getByRole("tabpanel").getByRole("button").first().click();
  await expect(page).toHaveURL(/#section-1$/);
  await expect(
    page.getByRole("tab", { name: "Read", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page.getByRole("tab", { name: "Raw", exact: true }).click();
  const raw = await page.getByTestId("raw-source").textContent();
  expect(createHash("sha256").update(raw!).digest("hex")).toBe(capture.sha256);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("theme persists and keyboard search opens the selected capture", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "System prompts", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("textbox", { name: "Search all prompts" })
    .fill("DeepSeek");
  await page
    .getByRole("dialog")
    .getByRole("link", { name: /DeepSeek Chat/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "DeepSeek Chat", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("comparison loads only the requested pair when source text is opened", async ({
  page,
}) => {
  const left = catalog.find((item) => item.id === "deepseek--deepseek-chat")!;
  const right = catalog.find((item) => item.id === "openai--codex--gpt-5.6")!;
  const requests: string[] = [];
  page.on("request", (request) => {
    const pathname = new URL(request.url()).pathname;
    if (pathname.startsWith("/data/") && pathname.endsWith(".json"))
      requests.push(pathname);
  });
  await page.goto(`/compare/?left=${left.id}&right=${right.id}`);
  await expect(
    page.getByRole("combobox", { name: "First prompt" }),
  ).toContainText(left.title);
  await expect(
    page.getByRole("combobox", { name: "Second prompt" }),
  ).toContainText(right.title);
  expect(requests).toEqual([]);
  await page
    .getByRole("button", { name: "Show source text", exact: true })
    .click();
  await expect(page.locator("main pre")).toHaveCount(2);
  await expect(page.locator("main pre").first()).not.toBeEmpty();
  expect([...new Set(requests)].sort()).toEqual(
    [dataHref(left), dataHref(right)].sort(),
  );
  await page.getByRole("button", { name: "Equal width", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Equal width", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Swap comparison prompts" }).click();
  await expect(
    page.getByRole("combobox", { name: "First prompt" }),
  ).toContainText(right.title);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("library and raw reader meet core WCAG checks in both themes", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "System prompts", exact: true }),
  ).toBeVisible();
  const library = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    library.violations.map((item) => ({
      id: item.id,
      nodes: item.nodes.map((node) => node.target),
    })),
  ).toEqual([]);
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.goto("/prompts/deepseek/deepseek-chat/?view=raw");
  await expect(page.getByTestId("raw-source")).toBeVisible();
  const reader = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    reader.violations.map((item) => ({
      id: item.id,
      nodes: item.nodes.map((node) => node.target),
    })),
  ).toEqual([]);
});

test("removed Learn and unknown prompt routes return 404", async ({ page }) => {
  const learn = await page.goto("/learn/");
  expect(learn?.status()).toBe(404);
  await expect(
    page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Learn" }),
  ).toHaveCount(0);
  const response = await page.goto("/prompts/openai/does-not-exist/");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "This prompt isn’t here." }),
  ).toBeVisible();
});

test("token counts, composition details, and searchable contents agree with source", async ({
  page,
}) => {
  const capture = catalog.find((item) => item.id === "openai--codex--gpt-5.6")!;
  await page.goto("/prompts/openai/codex--gpt-5.6/");
  await expect(page.getByTestId("token-total")).toHaveText(
    capture.tokens.toLocaleString("en-US"),
  );
  await page.locator(".composition-disclosure summary").click();
  const tools = page
    .getByTestId("composition")
    .locator('[data-category="identity"]');
  await tools.focus();
  await expect(page.getByRole("tooltip")).toContainText(
    `${capture.categoryTokens.identity.toLocaleString("en-US")} tokens`,
  );
  await expect(page.getByRole("tooltip")).toContainText(
    `${capture.categorySections.identity} section`,
  );
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Bytes", exact: true }).click();
  await expect(tools).toHaveAttribute(
    "aria-label",
    new RegExp(
      `${capture.categoryBytes.identity.toLocaleString("en-US")} bytes`,
    ),
  );
  if ((page.viewportSize()?.width ?? 0) < 1024)
    await page.getByRole("button", { name: "Open table of contents" }).click();
  await page
    .getByRole("textbox", { name: "Search contents" })
    .fill("Final answer");
  const section = page
    .getByRole("navigation", { name: "Table of contents" })
    .getByRole("button")
    .first();
  await expect(section).toBeVisible();
  await section.click();
  await expect(page).toHaveURL(/#section-/);
  if ((page.viewportSize()?.width ?? 0) < 1024)
    await expect(
      page.getByRole("textbox", { name: "Search contents" }),
    ).toHaveCount(0);
  const id = new URL(page.url()).hash.slice(1);
  await expect(page.locator(`[id="${id}"]`)).toBeFocused();
  await page.reload();
  await expect(page.locator(`[id="${id}"]`)).toBeVisible();
});

test("comparison switches between exact token and byte differences", async ({
  page,
}) => {
  const left = catalog.find((item) => item.id === "deepseek--deepseek-chat")!;
  const right = catalog.find((item) => item.id === "openai--codex--gpt-5.6")!;
  await page.goto(`/compare/?left=${left.id}&right=${right.id}`);
  await expect(page.getByTestId("comparison-difference")).toContainText(
    `${(right.tokens - left.tokens).toLocaleString("en-US")} more tokens`,
  );
  await page.getByRole("button", { name: "Bytes", exact: true }).click();
  await expect(page.getByTestId("comparison-difference")).toContainText(
    `${(right.bytes - left.bytes).toLocaleString("en-US")} more bytes`,
  );
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Bytes", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("comparison pickers search variants and align the swap control", async ({
  page,
}) => {
  await page.goto("/compare/");
  const first = page.getByRole("combobox", { name: "First prompt" });
  const second = page.getByRole("combobox", { name: "Second prompt" });
  if ((page.viewportSize()?.width ?? 0) >= 1024) {
    const boxes = await Promise.all([
      first.boundingBox(),
      second.boundingBox(),
      page
        .getByRole("button", { name: "Swap comparison prompts" })
        .boundingBox(),
    ]);
    expect(Math.abs(boxes[0]!.y - boxes[1]!.y)).toBeLessThan(1);
    expect(
      Math.abs(
        boxes[0]!.y + boxes[0]!.height / 2 - boxes[2]!.y - boxes[2]!.height / 2,
      ),
    ).toBeLessThan(1);
  }
  await first.click();
  await page
    .getByRole("combobox", { name: "Search first prompt" })
    .fill("DeepSeek");
  await expect(page.getByRole("option")).toHaveCount(1);
  await page.keyboard.press("Enter");
  await expect(first).toContainText("DeepSeek Chat");
  await expect(page).toHaveURL(/left=deepseek--deepseek-chat/);
  await second.click();
  await page
    .getByRole("combobox", { name: "Search second prompt" })
    .fill("no such capture exists");
  await expect(
    page.getByText("No matching prompts.", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(second).toBeFocused();
});

test("runtime captures expose exact source boundaries and section reading", async ({
  page,
}) => {
  const capture = catalog.find(
    (item) => item.id === "anthropic--claude-sonnet-5.5",
  )!;
  await page.goto("/prompts/anthropic/claude-sonnet-5.5/");
  await expect(page.getByTestId("token-total")).toHaveText(
    capture.tokens.toLocaleString("en-US"),
  );
  expect(await page.locator("article.source-section").count()).toBeGreaterThan(
    0,
  );
  expect(await page.locator("article.source-section").count()).toBeLessThan(
    capture.sectionCount,
  );
  await page.getByRole("button", { name: "Next chapter", exact: true }).click();
  await expect(page).toHaveURL(/#section-/);
  expect(await page.locator("article.source-section").count()).toBeGreaterThan(
    0,
  );
  expect(await page.locator("article.source-section").count()).toBeLessThan(
    capture.sectionCount,
  );
  const destination = new URL(page.url()).hash;
  await page.reload();
  await expect(page.locator(destination)).toBeVisible();
  await page.getByRole("tab", { name: "Structure", exact: true }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "User message & memory",
  );
  await expect(page.getByRole("tabpanel")).toContainText("Explicit [system]");
  await page.getByRole("tab", { name: "Raw", exact: true }).click();
  const raw = await page.getByTestId("raw-source").textContent();
  expect(createHash("sha256").update(raw!).digest("hex")).toBe(capture.sha256);
  await page
    .getByRole("link", { name: "Published archive", exact: true })
    .click();
  await expect(page.getByTestId("token-total")).toHaveText("3,834");
});

test("dark surfaces are neutral and reader controls remain accessible", async ({
  page,
}) => {
  await page.goto("/compare/");
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  const colors = await page.evaluate(() =>
    [document.body, document.querySelector('[aria-label="First prompt"]')!].map(
      (element) => getComputedStyle(element).backgroundColor,
    ),
  );
  expect(colors).toEqual(["rgb(8, 8, 8)", "rgb(18, 18, 18)"]);
  await page.getByRole("combobox", { name: "First prompt" }).click();
  const report = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    report.violations.map((item) => ({
      id: item.id,
      nodes: item.nodes.map((node) => node.target),
    })),
  ).toEqual([]);
});

test("Contents stays reachable and reselecting the active section returns focus", async ({
  page,
}) => {
  await page.goto("/prompts/anthropic/claude-sonnet-5.5/#section-2");
  await expect(page.locator("#section-2")).toBeVisible();
  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight),
  );
  if ((page.viewportSize()?.width ?? 0) < 1024) {
    const trigger = page.getByRole("button", {
      name: "Open table of contents",
    });
    const bounds = await trigger.boundingBox();
    expect(bounds!.y).toBeGreaterThanOrEqual(64);
    expect(bounds!.y + bounds!.height).toBeLessThan(
      page.viewportSize()!.height,
    );
    await trigger.click();
  }
  await page
    .getByRole("navigation", { name: "Table of contents" })
    .locator('button[aria-current="location"]')
    .click();
  await expect(page.locator("#section-2")).toBeFocused();
  await expect
    .poll(async () => (await page.locator("#section-2").boundingBox())!.y)
    .toBeLessThan(180);
  const toolbar = await page.getByRole("tablist").locator("..").boundingBox();
  const destination = await page.locator("#section-2").boundingBox();
  expect(destination!.y).toBeGreaterThanOrEqual(toolbar!.y + toolbar!.height);
});

test("Contents docks at the right edge and preserves its resized width", async ({
  page,
}) => {
  await page.goto("/prompts/openai/codex--gpt-6.1-sol--runtime/");
  const separator = page.getByRole("separator", {
    name: "Resize table of contents",
  });
  if ((page.viewportSize()?.width ?? 0) < 1024) {
    await expect(separator).toBeHidden();
    await page.getByRole("button", { name: "Open table of contents" }).click();
    await expect(
      page.getByRole("textbox", { name: "Search contents" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    return;
  }
  const panel = page.locator("#reader-contents-panel");
  const initial = (await panel.boundingBox())!;
  expect(initial.x + initial.width).toBe(page.viewportSize()!.width);
  expect(initial.width).toBe(320);
  const handle = (await separator.boundingBox())!;
  await page.mouse.move(handle.x + handle.width / 2, handle.y + 200);
  await page.mouse.down();
  await page.mouse.move(handle.x + handle.width / 2 - 80, handle.y + 200, {
    steps: 8,
  });
  await page.mouse.up();
  await expect(separator).toHaveAttribute("aria-valuenow", "400");
  await page.reload();
  await expect(separator).toHaveAttribute("aria-valuenow", "400");
  await separator.focus();
  await separator.press("ArrowRight");
  await expect(separator).toHaveAttribute("aria-valuenow", "384");
  const resized = (await panel.boundingBox())!;
  const reader = (await page.locator(".reader-main").boundingBox())!;
  expect(reader.x + reader.width).toBeLessThanOrEqual(resized.x);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("large continuous reading loads nearby batches and searches text in a worker", async ({
  page,
}) => {
  const capture = catalog.find(
    (item) => item.id === "openai--codex--gpt-6.1-sol--runtime",
  )!;
  const requests: string[] = [];
  const workers: string[] = [];
  page.context().on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/data/"))
      requests.push(new URL(request.url()).pathname);
  });
  page.on("worker", (worker) => workers.push(worker.url()));
  const response = await page.goto(
    "/prompts/openai/codex--gpt-6.1-sol--runtime/",
  );
  expect((await response!.body()).length).toBeLessThan(300000);
  await page.getByRole("button", { name: "Continuous", exact: true }).click();
  await expect(page.locator("article.source-section")).toHaveCount(
    capture.sectionCount,
  );
  expect(
    await page.locator('article[data-loaded="true"]').count(),
  ).toBeLessThan(40);
  const last = page.locator("article.source-section").last();
  await last.scrollIntoViewIfNeeded();
  await expect(last).toHaveAttribute("data-loaded", "true");
  expect(requests).not.toContain(dataHref(capture));
  expect(requests.some((path) => path.endsWith(".txt"))).toBe(false);
  expect(workers).toEqual([]);
  if ((page.viewportSize()?.width ?? 0) < 1024)
    await page.getByRole("button", { name: "Open table of contents" }).click();
  await page
    .getByRole("textbox", { name: "Search contents" })
    .fill("responses may not excessively quote");
  await expect(
    page.getByRole("navigation", { name: "Table of contents" }),
  ).toContainText(/Word limits/i);
  expect(workers.some((url) => url.endsWith("/search-worker.js"))).toBe(true);
});

test("a failed section batch can retry and retain the deep-link destination", async ({
  page,
}) => {
  let failed = false;
  await page.route("**/batch-48.json", (route) => {
    if (!failed) {
      failed = true;
      return route.fulfill({ status: 503, body: "Unavailable" });
    }
    return route.continue();
  });
  await page.goto("/prompts/openai/codex--gpt-6.1-sol--runtime/#section-386");
  const section = page.locator("#section-386");
  await expect(section.getByRole("alert")).toContainText("503");
  await section.getByRole("button", { name: "Try again" }).click();
  await expect(section).toHaveAttribute("data-loaded", "true");
  await expect(section).toContainText("Responses may not excessively quote");
  await expect(section).toBeFocused();
  expect(failed).toBe(true);
});
