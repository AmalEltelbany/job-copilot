import { expect, test } from "@playwright/test";
import { fileURLToPath } from "node:url";

const cvPath = fileURLToPath(new URL("../fixtures/cv.pdf", import.meta.url));

test("demo: review a match, draft a fact-checked letter, track the application", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Try the live demo" }).click();
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await expect(page.getByText(/simulated AI/)).toBeVisible();

  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Jobs" }).click();
  const firstJob = page.getByRole("link", { name: /Full-Stack Engineer \(TypeScript\)/ });
  await expect(firstJob).toContainText("Strong fit");
  // The intern posting was filtered out before scoring and is hidden by default.
  await expect(page.getByText("Software Engineering Intern")).toHaveCount(0);
  await page.getByLabel("Show filtered out").check();
  await expect(page.getByText("Filtered: Internship or graduate role")).toBeVisible();

  await firstJob.click();
  const fit = page.getByRole("region", { name: "Fit" });
  await expect(fit.getByText("must-have").first()).toBeVisible();

  const application = page.getByRole("region", { name: "Application" });
  await application.getByRole("button", { name: "Start application" }).click();
  await application.getByRole("button", { name: "Draft with AI" }).click();
  await expect(application.getByLabel("Cover letter")).toHaveValue(/Dear Lumen Pay team/);
  await expect(application.getByText("Every claim was checked against your profile.")).toBeVisible();

  await application.getByRole("button", { name: "I've applied" }).click();
  await expect(application.getByRole("combobox")).toHaveValue("APPLIED");

  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Applications" }).click();
  await expect(page.getByRole("region", { name: "APPLIED" }).getByText("Full-Stack Engineer (TypeScript)")).toBeVisible();
});

test("a new user uploads a CV, reviews the extracted profile and edits it", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Name").fill("Amal Tester");
  await page.getByLabel("Email").fill(`amal-${Date.now()}@example.com`);
  await page.getByLabel("Password").fill("correct horse battery");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();

  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Profile" }).click();
  await page.getByLabel("CV (PDF)").setInputFiles(cvPath);
  await expect(page.getByText("Version 1 · from cv.pdf")).toBeVisible();
  await expect(page.getByLabel("Skills (comma separated)")).toHaveValue(/TypeScript/);

  await page.getByLabel("Skills (comma separated)").fill("TypeScript, NestJS, Kubernetes");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText(/^Version 2/)).toBeVisible();
  await expect(page.getByLabel("Skills (comma separated)")).toHaveValue("TypeScript, NestJS, Kubernetes");
});

test("signed-out visitors are sent to the login page", async ({ page }) => {
  await page.goto("/app/jobs");
  await expect(page).toHaveURL(/\/login\?next=%2Fapp%2Fjobs/);
});
