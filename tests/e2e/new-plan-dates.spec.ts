import { test, expect, type Page } from "@playwright/test";
import { getDefaultPlanDates } from "../../app/lib/plan-dates";

// Explicit offsets keep the test runner's timezone out of the frozen instant.
const cases = [
  ["Tokyo midnight", "Asia/Tokyo", "2026-10-30T00:00:00+09:00", "2026-10-30", "2026-10-31"],
  ["reported reproduction", "Asia/Tokyo", "2026-10-30T00:30:00+09:00", "2026-10-30", "2026-10-31"],
  ["before UTC midnight", "Asia/Tokyo", "2026-10-30T08:59:59+09:00", "2026-10-30", "2026-10-31"],
  ["at UTC midnight", "Asia/Tokyo", "2026-10-30T09:00:00+09:00", "2026-10-30", "2026-10-31"],
  ["month end", "Asia/Tokyo", "2026-04-30T00:01:00+09:00", "2026-04-30", "2026-05-01"],
  ["year end", "Asia/Tokyo", "2026-12-31T23:59:59+09:00", "2026-12-31", "2027-01-01"],
  ["leap day", "Asia/Tokyo", "2028-02-28T00:01:00+09:00", "2028-02-28", "2028-02-29"],
  ["leap month end", "Asia/Tokyo", "2028-02-29T00:01:00+09:00", "2028-02-29", "2028-03-01"],
  ["UTC", "UTC", "2026-10-30T00:00:00Z", "2026-10-30", "2026-10-31"],
  [
    "western late evening",
    "America/Los_Angeles",
    "2026-10-30T23:30:00-07:00",
    "2026-10-30",
    "2026-10-31",
  ],
  ["UTC minus ten", "Pacific/Honolulu", "2026-12-31T23:30:00-10:00", "2026-12-31", "2027-01-01"],
  [
    "UTC plus fourteen",
    "Pacific/Kiritimati",
    "2026-10-30T00:01:00+14:00",
    "2026-10-30",
    "2026-10-31",
  ],
  ["fractional offset", "Asia/Kathmandu", "2026-10-30T00:01:00+05:45", "2026-10-30", "2026-10-31"],
  // Adding 24 hours to these instants can skip tomorrow or stay on today.
  [
    "US spring forward",
    "America/New_York",
    "2026-03-07T23:30:00-05:00",
    "2026-03-07",
    "2026-03-08",
  ],
  ["US fall back", "America/New_York", "2026-11-01T00:30:00-04:00", "2026-11-01", "2026-11-02"],
  [
    "Europe spring forward",
    "Europe/Berlin",
    "2026-03-28T23:30:00+01:00",
    "2026-03-28",
    "2026-03-29",
  ],
  ["Europe fall back", "Europe/Berlin", "2026-10-25T00:30:00+02:00", "2026-10-25", "2026-10-26"],
  [
    "southern fall back",
    "Australia/Sydney",
    "2026-04-05T00:30:00+11:00",
    "2026-04-05",
    "2026-04-06",
  ],
  ["half-hour DST", "Australia/Lord_Howe", "2026-10-03T23:45:00+10:30", "2026-10-03", "2026-10-04"],
] as const;

async function submitAndReadBody(page: Page) {
  // Test the real form's request without coupling date tests to POI generation.
  await page.route("**/api/plan", (route) => route.fulfill({ json: { items: [] } }));
  await page.route("**/demo-itinerary?*", (route) =>
    route.fulfill({ contentType: "text/html", body: "<p>Generated</p>" }),
  );
  const requestPromise = page.waitForRequest(
    (request) => new URL(request.url()).pathname === "/api/plan" && request.method() === "POST",
  );
  await page.getByRole("button", { name: "この条件で行程を作る" }).click();
  const request = await requestPromise;
  await page.waitForURL("**/demo-itinerary?*");
  return request.postDataJSON();
}

for (const [name, timezoneId, instant, startDate, endDate] of cases) {
  test.describe(name, () => {
    test.use({ timezoneId });

    test("calculates local calendar defaults", () => {
      // Playwright's timezoneId applies to browsers; set the Node timezone too.
      // This synchronous test restores it before another test can run.
      const previousTimezone = process.env.TZ;
      try {
        process.env.TZ = timezoneId;
        const now = new Date(instant);
        const timestamp = now.getTime();
        const dates = getDefaultPlanDates(now);
        expect(dates).toEqual({ startDate, endDate });
        expect(dates.endDate > dates.startDate).toBe(true);
        expect(now.getTime()).toBe(timestamp);
      } finally {
        if (previousTimezone === undefined) delete process.env.TZ;
        else process.env.TZ = previousTimezone;
      }
    });

    test("shows and submits the user's today and next calendar day", async ({ page }) => {
      const hydrationErrors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error" && /hydrat/i.test(message.text())) {
          hydrationErrors.push(message.text());
        }
      });
      page.on("pageerror", (error) => hydrationErrors.push(error.message));
      await page.clock.setFixedTime(new Date(instant));
      await page.goto("/new");

      const start = page.getByLabel("開始日", { exact: true });
      const end = page.getByLabel("終了日", { exact: true });
      await expect(start).toHaveValue(startDate);
      await expect(end).toHaveValue(endDate);
      expect((await end.inputValue()) > (await start.inputValue())).toBe(true);
      expect(await submitAndReadBody(page)).toMatchObject({
        city: "osaka",
        startDate,
        endDate,
        purposes: ["観光", "グルメ"],
        options: { autoTransfer: true },
      });
      expect(hydrationErrors).toEqual([]);
    });
  });
}

test("SSR does not expose server dates or enable submission before initialization", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  try {
    const page = await context.newPage();
    await page.goto("/new");
    for (const label of ["開始日", "終了日"]) {
      await expect(page.getByLabel(label, { exact: true })).toHaveValue("");
      await expect(page.getByLabel(label, { exact: true })).toBeDisabled();
    }
    await expect(page.getByRole("button", { name: "この条件で行程を作る" })).toBeDisabled();
  } finally {
    await context.close();
  }
});

test.describe("edited dates", () => {
  test.use({ timezoneId: "Asia/Tokyo" });

  for (const [name, startDate, endDate] of [
    ["same day", "2027-01-02", "2027-01-02"],
    ["multiple days", "2027-01-02", "2027-01-05"],
    // Characterize existing behavior; adding reversed-range rejection is separate.
    ["reversed range remains unchanged", "2027-01-05", "2027-01-02"],
  ]) {
    test(name, async ({ page }) => {
      await page.clock.setFixedTime(new Date("2026-10-30T23:59:59+09:00"));
      await page.goto("/new");
      await expect(page.getByLabel("開始日", { exact: true })).toHaveValue("2026-10-30");
      await page.getByLabel("開始日", { exact: true }).fill(startDate);
      await page.getByLabel("終了日", { exact: true }).fill(endDate);

      // An unrelated rerender after midnight must not overwrite the user's edits.
      await page.clock.setFixedTime(new Date("2026-10-31T00:00:01+09:00"));
      await page.getByLabel("都市", { exact: true }).selectOption("kyoto");
      await expect(page.getByLabel("開始日", { exact: true })).toHaveValue(startDate);
      await expect(page.getByLabel("終了日", { exact: true })).toHaveValue(endDate);
      expect(await submitAndReadBody(page)).toMatchObject({ city: "kyoto", startDate, endDate });
    });
  }
});

test.describe("existing API date-range behavior", () => {
  for (const [name, startDate, endDate, lastOffset] of [
    ["same day", "2027-01-02", "2027-01-02", 0],
    ["multiple days", "2027-01-02", "2027-01-05", 3],
    ["reversed dates clamp to day zero", "2027-01-05", "2027-01-02", 0],
  ] as const) {
    test(name, async ({ request }) => {
      const response = await request.post("/api/plan", {
        data: { city: "osaka", startDate, endDate, options: { autoTransfer: true } },
      });
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toMatchObject({ startDate, endDate });
      expect(
        body.items.find((item: { title: string }) => item.title === "出発 / トランスファ"),
      ).toMatchObject({ meta: { dayOffset: lastOffset } });
    });
  }

  test("missing dates still return 400", async ({ request }) => {
    const response = await request.post("/api/plan", { data: { city: "osaka" } });
    expect(response.status()).toBe(400);
  });
});
