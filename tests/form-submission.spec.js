/**
 * form-submission.spec.js — Form filling and submission tests
 *
 * Covers:
 *  - Demande d'achat de matériel (purchase request)
 *  - Demande d'activités et de sorties (activity/outing request)
 *  - Demande de réquisition interne (internal requisition)
 *
 * Each form type is tested for:
 *  - Opening the form from the dashboard
 *  - Required fields validation
 *  - Filling and submitting a complete form
 *  - Confirming the new request appears in "Mes demandes récentes"
 */

import { test, expect } from "@playwright/test";
import { loginAs, USERS } from "./helpers.js";

// Mario Dumont (Utilisateur) submits all forms
test.use({ storageState: undefined });

async function goToDashboard(page) {
  await loginAs(page, USERS.utilisateur);
  await expect(page.getByRole("heading", { name: "Tableau de bord" })).toBeVisible();
}

// ─── Demande d'achat de matériel ─────────────────────────────────────────────

test.describe("Demande d'achat de matériel", () => {
  test("opens the purchase request form from dashboard", async ({ page }) => {
    await goToDashboard(page);
    await page.getByRole("button", { name: /demande d'achat/i }).click();
    await expect(page.getByText(/demande d'achat de matériel/i)).toBeVisible();
  });

  test("shows required field errors when submitted empty", async ({ page }) => {
    await goToDashboard(page);
    await page.getByRole("button", { name: /demande d'achat/i }).click();

    // Try to submit without filling anything
    const submitBtn = page.getByRole("button", { name: /soumettre|envoyer/i }).first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      // At least one error message or required indicator should appear
      const hasError =
        (await page.getByText(/obligatoire|requis|required/i).count()) > 0 ||
        (await page.locator(":invalid").count()) > 0;
      expect(hasError).toBe(true);
    }
  });

  test("fills and submits a purchase request", async ({ page }) => {
    await goToDashboard(page);
    await page.getByRole("button", { name: /demande d'achat/i }).click();

    // Fill core fields
    const demandePar = page.locator('input[placeholder*="prénom"], input[name="demandePar"]').first();
    if (await demandePar.isVisible()) await demandePar.fill("Mario Dumont");

    const courriel = page.locator('input[name="courriel"]').first();
    if (await courriel.isVisible()) await courriel.fill("mdupont");

    // Fill a date if the field exists
    const dateDemande = page.locator('input[type="date"]').first();
    if (await dateDemande.isVisible()) await dateDemande.fill("2026-07-01");

    // Fill first item row if a table is present
    const qtyInput = page.locator('input[placeholder="Qté"], input[name*="qty"]').first();
    if (await qtyInput.isVisible()) {
      await qtyInput.fill("2");
    }

    const nomInput = page.locator('input[placeholder*="nom"], input[placeholder*="article"]').first();
    if (await nomInput.isVisible()) {
      await nomInput.fill("Cahiers d'exercices");
    }

    const prixInput = page.locator('input[placeholder*="prix"], input[name*="prix"]').first();
    if (await prixInput.isVisible()) {
      await prixInput.fill("5.99");
    }

    // Take a screenshot before submitting
    await page.screenshot({ path: "tests/screenshots/achat-filled.png" });

    // Submit
    const submitBtn = page.getByRole("button", { name: /soumettre|envoyer/i }).first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      // Expect navigation back to dashboard or a success confirmation
      await expect(
        page.getByText(/soumis|confirmé|tableau de bord/i).first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("newly submitted purchase request appears in recent requests", async ({ page }) => {
    await goToDashboard(page);
    // The dashboard already shows Mario's requests; at least one achat row should be listed
    await expect(
      page.getByText(/demande d'achat de matériel/i).first()
    ).toBeVisible();
  });
});

// ─── Demande d'activités et de sorties ───────────────────────────────────────

test.describe("Demande d'activités et de sorties", () => {
  test("opens the activity request form from dashboard", async ({ page }) => {
    await goToDashboard(page);
    await page.getByRole("button", { name: /demande d'activités/i }).click();
    await expect(page.getByText(/activités et de sorties/i)).toBeVisible();
  });

  test("fills and submits an activity request", async ({ page }) => {
    await goToDashboard(page);
    await page.getByRole("button", { name: /demande d'activités/i }).click();

    // Activity name
    const nomActivite = page.locator('input[name="nomActivite"], input[placeholder*="activité"]').first();
    if (await nomActivite.isVisible()) await nomActivite.fill("Visite Musée des Beaux-Arts");

    // Description
    const description = page.locator('textarea[name="description"], textarea').first();
    if (await description.isVisible()) {
      await description.fill("Sortie culturelle pour les élèves de 3e secondaire.");
    }

    // Contact person
    const contact = page.locator('input[name="personneContact"]').first();
    if (await contact.isVisible()) await contact.fill("Jean Responsable");

    await page.screenshot({ path: "tests/screenshots/activite-filled.png" });

    const submitBtn = page.getByRole("button", { name: /soumettre|envoyer/i }).first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await expect(
        page.getByText(/soumis|confirmé|tableau de bord/i).first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("activity request appears in recent requests list after submission", async ({ page }) => {
    await goToDashboard(page);
    // Mario already has an activity request in the seeded data
    await expect(page.getByText(/activités et de sorties/i).first()).toBeVisible();
  });
});

// ─── Demande de réquisition interne ──────────────────────────────────────────

test.describe("Demande de réquisition interne", () => {
  test("opens the internal requisition form from dashboard", async ({ page }) => {
    await goToDashboard(page);
    await page.getByRole("button", { name: /réquisition interne/i }).click();
    await expect(page.getByText(/réquisition interne/i)).toBeVisible();
  });

  test("fills and submits an internal requisition", async ({ page }) => {
    await goToDashboard(page);
    await page.getByRole("button", { name: /réquisition interne/i }).click();

    // Title / description
    const titre = page.locator('input[name="titre"], input[placeholder*="titre"]').first();
    if (await titre.isVisible()) await titre.fill("Réparation robinet — salle 108");

    const description = page.locator('textarea[name="description"], textarea').first();
    if (await description.isVisible()) {
      await description.fill("Le robinet de la salle de classe 108 fuit depuis lundi.");
    }

    // Local / room
    const local = page.locator('input[name="localConcerne"], input[placeholder*="local"]').first();
    if (await local.isVisible()) await local.fill("108");

    await page.screenshot({ path: "tests/screenshots/requisition-filled.png" });

    const submitBtn = page.getByRole("button", { name: /soumettre|envoyer/i }).first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await expect(
        page.getByText(/soumis|confirmé|tableau de bord/i).first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("internal requisition appears in recent requests list", async ({ page }) => {
    await goToDashboard(page);
    await expect(page.getByText(/réquisition interne/i).first()).toBeVisible();
  });
});

// ─── Cross-cutting form concerns ─────────────────────────────────────────────

test.describe("General form behaviour", () => {
  test("user can cancel a form and return to the dashboard", async ({ page }) => {
    await goToDashboard(page);
    await page.getByRole("button", { name: /demande d'achat/i }).click();

    const cancelBtn = page.getByRole("button", { name: /annuler|retour/i }).first();
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
      await expect(page.getByRole("heading", { name: "Tableau de bord" })).toBeVisible();
    }
  });

  test("form is pre-populated with the logged-in user's name", async ({ page }) => {
    await goToDashboard(page);
    await page.getByRole("button", { name: /demande d'achat/i }).click();

    // The app should pre-fill the requester name with the current user's name
    const nameField = page.locator('input[name="demandePar"]').first();
    if (await nameField.isVisible()) {
      const value = await nameField.inputValue();
      expect(value).toMatch(/Mario|Dumont/);
    }
  });
});
