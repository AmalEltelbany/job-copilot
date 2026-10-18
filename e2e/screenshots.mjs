// Captures README screenshots. Run with both apps up: node e2e/screenshots.mjs
import { chromium } from "@playwright/test";

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await context.newPage();

await page.goto("http://localhost:3100/");
await page.screenshot({ path: "docs/landing.png" });
await page.getByRole("button", { name: "Try the live demo" }).click();
await page.getByRole("heading", { name: "Overview" }).waitFor();
await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Jobs" }).click();
await page.getByLabel("Show filtered out").check();
await page.getByText("Filtered: Internship or graduate role").waitFor();
await page.screenshot({ path: "docs/jobs.png" });

await page.getByRole("link", { name: /Backend Engineer, Platform/ }).click();
const application = page.getByRole("region", { name: "Application" });
await application.getByRole("button", { name: "Start application" }).click();
await application.getByRole("button", { name: "Draft with AI" }).click();
await application.getByText("Every claim was checked against your profile.").waitFor();
await page.screenshot({ path: "docs/job-detail.png", fullPage: true });
await browser.close();
