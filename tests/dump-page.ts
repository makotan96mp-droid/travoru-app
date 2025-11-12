import type { Page } from "@playwright/test";
import * as fs from "fs";
export async function dumpPage(page: Page, name = "dump") {
  const html = await page.content();
  fs.writeFileSync(`.tmp/${name}.html`, html);
}
