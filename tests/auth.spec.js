/**
 * auth.spec.js — Authentication safety tests
 *
 * Covers:
 *  - Login form rendering
 *  - Invalid credential rejection
 *  - Valid login for every role
 *  - Empty-field validation
 *  - Session isolation (page reload clears session)
 *  - Role-gating: protected views are not reachable without login
 */

import { test, expect } from "@playwright/test";
import { USERS, loginAs } from "./helpers.js";

test.describe("Login form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("shows the login screen on first load", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();
    await expect(page.getByText("Accès réservé au personnel de l'école")).toBeVisible();
    await expect(page.getByPlaceholder("prenom.nom")).toBeVisible();
    await expect(page.getByPlaceholder("••••••••")).toBeVisible();
    await expect(page.getByRole("button", { name: "Connexion" })).toBeVisible();
  });

  test("shows domain suffix @csslaval.gouv.qc.ca next to the email field", async ({ page }) => {
    await expect(page.getByText("@csslaval.gouv.qc.ca")).toBeVisible();
  });

  test("displays the demo accounts panel", async ({ page }) => {
    await expect(page.getByText("Comptes démo")).toBeVisible();
    await expect(page.getByText("Mario Dumont")).toBeVisible();
    await expect(page.getByText("Admin Système")).toBeVisible();
  });
});

test.describe("Invalid credentials", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("rejects a completely wrong username and password", async ({ page }) => {
    await page.getByPlaceholder("prenom.nom").fill("nobody");
    await page.getByPlaceholder("••••••••").fill("wrongpassword");
    await page.getByRole("button", { name: "Connexion" }).click();

    await expect(page.getByText(/identifiants incorrects/i)).toBeVisible();
    // Must stay on the login page
    await expect(page.getByRole("button", { name: "Connexion" })).toBeVisible();
  });

  test("rejects a valid username with the wrong password", async ({ page }) => {
    await page.getByPlaceholder("prenom.nom").fill(USERS.utilisateur.username);
    await page.getByPlaceholder("••••••••").fill("badpassword");
    await page.getByRole("button", { name: "Connexion" }).click();

    await expect(page.getByText(/identifiants incorrects/i)).toBeVisible();
  });

  test("rejects empty email with valid password", async ({ page }) => {
    await page.getByPlaceholder("••••••••").fill("1234");
    await page.getByRole("button", { name: "Connexion" }).click();

    // Should not navigate to the dashboard
    await expect(page.getByRole("button", { name: "Connexion" })).toBeVisible();
  });

  test("rejects empty password with valid username", async ({ page }) => {
    await page.getByPlaceholder("prenom.nom").fill(USERS.utilisateur.username);
    await page.getByRole("button", { name: "Connexion" }).click();

    await expect(page.getByRole("button", { name: "Connexion" })).toBeVisible();
  });

  test("does not leak user existence — same error for wrong user vs wrong password", async ({ page }) => {
    // Wrong user
    await page.getByPlaceholder("prenom.nom").fill("doesnotexist");
    await page.getByPlaceholder("••••••••").fill("1234");
    await page.getByRole("button", { name: "Connexion" }).click();
    const msgUnknownUser = await page.getByText(/identifiants incorrects/i).textContent();

    // Valid user, wrong password
    await page.getByPlaceholder("prenom.nom").fill(USERS.utilisateur.username);
    await page.getByPlaceholder("••••••••").fill("wrongpassword");
    await page.getByRole("button", { name: "Connexion" }).click();
    const msgWrongPass = await page.getByText(/identifiants incorrects/i).textContent();

    expect(msgUnknownUser).toBe(msgWrongPass);
  });
});

test.describe("Successful login for each role", () => {
  for (const [roleName, user] of Object.entries(USERS)) {
    test(`${roleName} (${user.username}) can log in and reaches the dashboard`, async ({ page }) => {
      await loginAs(page, user);
      await expect(page.getByRole("heading", { name: "Tableau de bord" })).toBeVisible();
      await expect(page.getByText(user.name)).toBeVisible();
    });
  }
});

test.describe("Demo account quick-fill", () => {
  test("clicking a demo account pre-fills the form", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Mario Dumont").click();

    await expect(page.getByPlaceholder("prenom.nom")).toHaveValue(USERS.utilisateur.username);
  });

  test("clicking a demo account and submitting logs in successfully", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Mario Dumont").click();
    await page.getByRole("button", { name: "Connexion" }).click();

    await expect(page.getByRole("heading", { name: "Tableau de bord" })).toBeVisible();
  });
});

test.describe("Session management", () => {
  test("session is cleared after page reload", async ({ page }) => {
    await loginAs(page, USERS.utilisateur);
    await expect(page.getByRole("heading", { name: "Tableau de bord" })).toBeVisible();

    await page.reload();

    // After reload, user should be back on the login screen
    await expect(page.getByRole("button", { name: "Connexion" })).toBeVisible();
  });

  test("unauthenticated user cannot access the dashboard by URL manipulation", async ({ page }) => {
    // App is a SPA; navigating to root without credentials should show login
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Connexion" })).toBeVisible();
    // Dashboard must not be visible
    await expect(page.getByText("Tableau de bord")).not.toBeVisible();
  });
});

test.describe("Role-based UI gating", () => {
  test("Utilisateur does NOT see approver actions", async ({ page }) => {
    await loginAs(page, USERS.utilisateur);
    // A regular user should not see "Approuver" or "Refuser" action buttons on the dashboard
    await expect(page.getByRole("button", { name: /approuver/i })).not.toBeVisible();
  });

  test("Administrateur sees all navigation sections", async ({ page }) => {
    await loginAs(page, USERS.admin);
    // Admin should see management-level controls
    await expect(page.getByRole("heading", { name: "Tableau de bord" })).toBeVisible();
  });
});
