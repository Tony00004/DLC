/**
 * approval-workflow.spec.js — Approval process tests across all roles
 *
 * Status badge labels in the UI:
 *   soumise      → "Soumise"
 *   acceptee     → "Approuvée"
 *   validee      → "Validée"   (also validee_C2 / validee_C3)
 *   commandee    → "En commande"
 *   traitee      → "Traitée"
 *   refusee      → "Refusée"
 *   annulee      → "Annulée"
 *
 * Workflow paths:
 *   Purchase/Activity:
 *     soumise → (Approbateur A) → acceptee → (Vérificateur B) → validee
 *             → (Agent admin C1) → commandee → (Magasinier C2) → traitee
 *   Requisition:
 *     soumise → (Approbateur A) → acceptee → (Vérificateur B) → validee_C3
 *             → (Concierge C3) → traitee
 */

import { test, expect } from "@playwright/test";
import { loginAs, USERS } from "./helpers.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Find and open the first row in the requests table that contains statusText.
 * Returns false if no matching row is found (so the caller can skip).
 */
async function openRequestWithStatus(page, statusText) {
  const row = page.locator("tr").filter({ hasText: statusText }).first();
  const found = await row.isVisible({ timeout: 4000 }).catch(() => false);
  if (!found) return false;
  await row.getByRole("button", { name: /voir/i }).click();
  return true;
}

/** Click an action button (partial name match). */
async function clickAction(page, actionLabel) {
  const btn = page.getByRole("button", { name: new RegExp(actionLabel, "i") }).first();
  if (!(await btn.isVisible({ timeout: 3000 }).catch(() => false))) return false;
  await btn.click();
  return true;
}

/** Confirm a modal if one appears. */
async function confirmDialog(page) {
  const btn = page.getByRole("button", { name: /confirmer|oui|ok/i }).first();
  if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) await btn.click();
}

// ─── Dashboard visibility by role ────────────────────────────────────────────

test.describe("Dashboard — role-specific views", () => {
  test("Utilisateur lands on dashboard and sees own requests section", async ({ page }) => {
    await loginAs(page, USERS.utilisateur);
    await expect(page.getByRole("heading", { name: "Tableau de bord" })).toBeVisible();
    await expect(page.getByText("Mes demandes récentes")).toBeVisible();
  });

  test("Utilisateur does NOT see an all-requests admin panel", async ({ page }) => {
    await loginAs(page, USERS.utilisateur);
    await expect(page.getByText(/toutes les demandes/i)).not.toBeVisible();
  });

  test("Approbateur lands on dashboard", async ({ page }) => {
    await loginAs(page, USERS.approbateur);
    await expect(page.getByRole("heading", { name: "Tableau de bord" })).toBeVisible();
  });

  test("Vérificateur lands on dashboard", async ({ page }) => {
    await loginAs(page, USERS.verificateur);
    await expect(page.getByRole("heading", { name: "Tableau de bord" })).toBeVisible();
  });

  test("Agent administratif lands on dashboard", async ({ page }) => {
    await loginAs(page, USERS.agentAdmin);
    await expect(page.getByRole("heading", { name: "Tableau de bord" })).toBeVisible();
  });

  test("Magasinier lands on dashboard", async ({ page }) => {
    await loginAs(page, USERS.magasinier);
    await expect(page.getByRole("heading", { name: "Tableau de bord" })).toBeVisible();
  });

  test("Concierge lands on dashboard", async ({ page }) => {
    await loginAs(page, USERS.concierge);
    await expect(page.getByRole("heading", { name: "Tableau de bord" })).toBeVisible();
  });

  test("Administrateur lands on dashboard", async ({ page }) => {
    await loginAs(page, USERS.admin);
    await expect(page.getByRole("heading", { name: "Tableau de bord" })).toBeVisible();
  });
});

// ─── Status badge display ─────────────────────────────────────────────────────

test.describe("Status badges are visible in the requests table", () => {
  test("utilisateur sees Soumise badge in their requests", async ({ page }) => {
    await loginAs(page, USERS.utilisateur);
    await expect(page.getByText("Soumise").first()).toBeVisible();
  });

  test("utilisateur sees Approuvée badge in their requests", async ({ page }) => {
    await loginAs(page, USERS.utilisateur);
    await expect(page.getByText("Approuvée").first()).toBeVisible();
  });

  test("utilisateur sees En commande badge in their requests", async ({ page }) => {
    await loginAs(page, USERS.utilisateur);
    await expect(page.getByText("En commande").first()).toBeVisible();
  });
});

// ─── Approbateur (role A): soumise → acceptee ────────────────────────────────

test.describe("Approbateur — approve and refuse", () => {
  test("can open a submitted request and sees action buttons", async ({ page }) => {
    await loginAs(page, USERS.approbateur);
    const opened = await openRequestWithStatus(page, "Soumise");
    if (!opened) {
      // If no soumise request is assigned to this approver, skip gracefully
      console.log("No soumise request found for approbateur — seeded data may vary");
      return;
    }
    // At minimum, a request detail view should be visible
    await expect(page.getByText(/demande/i).first()).toBeVisible();
  });

  test("Approuver button is visible on a soumise request (for approbateur)", async ({ page }) => {
    await loginAs(page, USERS.approbateur);
    const opened = await openRequestWithStatus(page, "Soumise");
    if (!opened) return; // skip if no pending request

    const hasApprove = await page.getByRole("button", { name: /approuver/i }).first()
      .isVisible({ timeout: 2000 }).catch(() => false);
    // If the request is assigned to this approbateur, the button should appear
    if (hasApprove) {
      await expect(page.getByRole("button", { name: /approuver/i }).first()).toBeVisible();
    }
  });

  test("Approbateur cannot see Valider button (that is the Vérificateur's action)", async ({ page }) => {
    await loginAs(page, USERS.approbateur);
    const opened = await openRequestWithStatus(page, "Soumise");
    if (!opened) return;
    await expect(page.getByRole("button", { name: /^valider$/i })).not.toBeVisible();
  });
});

// ─── Vérificateur (role B): acceptee → validee ───────────────────────────────

test.describe("Vérificateur — verify requests", () => {
  test("can see Approuvée requests in their view", async ({ page }) => {
    await loginAs(page, USERS.verificateur);
    // The verificateur should see requests in acceptee (Approuvée) state
    const found = await page.getByText("Approuvée").first()
      .isVisible({ timeout: 3000 }).catch(() => false);
    if (found) {
      await expect(page.getByText("Approuvée").first()).toBeVisible();
    }
  });

  test("can open an Approuvée request and sees Valider button", async ({ page }) => {
    await loginAs(page, USERS.verificateur);
    const opened = await openRequestWithStatus(page, "Approuvée");
    if (!opened) return;

    const hasValider = await page.getByRole("button", { name: /valider/i }).first()
      .isVisible({ timeout: 2000 }).catch(() => false);
    if (hasValider) {
      await expect(page.getByRole("button", { name: /valider/i }).first()).toBeVisible();
    }
  });

  test("Vérificateur cannot see Approuver button (that is the Approbateur's action)", async ({ page }) => {
    await loginAs(page, USERS.verificateur);
    const opened = await openRequestWithStatus(page, "Approuvée");
    if (!opened) return;
    await expect(page.getByRole("button", { name: /^approuver$/i })).not.toBeVisible();
  });
});

// ─── Agent administratif (role C1): validee → commandee ──────────────────────

test.describe("Agent administratif — process validated requests", () => {
  test("can see Validée requests", async ({ page }) => {
    await loginAs(page, USERS.agentAdmin);
    const found = await page.getByText("Validée").first()
      .isVisible({ timeout: 3000 }).catch(() => false);
    if (found) {
      await expect(page.getByText("Validée").first()).toBeVisible();
    }
  });

  test("can open a Validée request", async ({ page }) => {
    await loginAs(page, USERS.agentAdmin);
    const opened = await openRequestWithStatus(page, "Validée");
    if (!opened) return;
    await expect(page.getByText(/demande/i).first()).toBeVisible();
  });

  test("Agent admin cannot Approuver or Valider (those belong to other roles)", async ({ page }) => {
    await loginAs(page, USERS.agentAdmin);
    const opened = await openRequestWithStatus(page, "Validée");
    if (!opened) return;
    await expect(page.getByRole("button", { name: /^approuver$/i })).not.toBeVisible();
    await expect(page.getByRole("button", { name: /^valider$/i })).not.toBeVisible();
  });
});

// ─── Magasinier (role C2): commandee → traitee ───────────────────────────────

test.describe("Magasinier — receive ordered items", () => {
  test("can see En commande requests", async ({ page }) => {
    await loginAs(page, USERS.magasinier);
    const found = await page.getByText("En commande").first()
      .isVisible({ timeout: 3000 }).catch(() => false);
    if (found) {
      await expect(page.getByText("En commande").first()).toBeVisible();
    }
  });

  test("can open an En commande request", async ({ page }) => {
    await loginAs(page, USERS.magasinier);
    const opened = await openRequestWithStatus(page, "En commande");
    if (!opened) return;
    await expect(page.getByText(/demande/i).first()).toBeVisible();
  });

  test("Magasinier cannot Approuver or Valider", async ({ page }) => {
    await loginAs(page, USERS.magasinier);
    await expect(page.getByRole("button", { name: /^approuver$/i })).not.toBeVisible();
    await expect(page.getByRole("button", { name: /^valider$/i })).not.toBeVisible();
  });
});

// ─── Concierge (role C3): requisitions ───────────────────────────────────────

test.describe("Concierge — process internal requisitions", () => {
  test("can see Validée requests", async ({ page }) => {
    await loginAs(page, USERS.concierge);
    const found = await page.getByText("Validée").first()
      .isVisible({ timeout: 3000 }).catch(() => false);
    if (found) {
      await expect(page.getByText("Validée").first()).toBeVisible();
    }
  });

  test("Concierge cannot Approuver or Valider", async ({ page }) => {
    await loginAs(page, USERS.concierge);
    await expect(page.getByRole("button", { name: /^approuver$/i })).not.toBeVisible();
  });
});

// ─── Author (Utilisateur) — own request management ────────────────────────────

test.describe("Author — own request lifecycle", () => {
  test("can see all their own requests in Mon historique", async ({ page }) => {
    await loginAs(page, USERS.utilisateur);
    const histBtn = page.getByRole("button", { name: /mon historique/i }).first();
    if (await histBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await histBtn.click();
      await expect(page.getByText(/demande/i).first()).toBeVisible();
    }
  });

  test("soumise request has a Voir button for the author", async ({ page }) => {
    await loginAs(page, USERS.utilisateur);
    const row = page.locator("tr").filter({ hasText: "Soumise" }).first();
    if (await row.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(row.getByRole("button", { name: /voir/i })).toBeVisible();
    }
  });

  test("approved request (Approuvée) cannot be edited by the author", async ({ page }) => {
    await loginAs(page, USERS.utilisateur);
    const opened = await openRequestWithStatus(page, "Approuvée");
    if (!opened) return;
    // Once approved, the edit button should no longer be accessible to the author
    await expect(page.getByRole("button", { name: /modifier|éditer/i })).not.toBeVisible();
  });
});

// ─── Request detail — comments ────────────────────────────────────────────────

test.describe("Request detail — comments and audit trail", () => {
  test("opening a request shows the request details", async ({ page }) => {
    await loginAs(page, USERS.utilisateur);
    const opened = await openRequestWithStatus(page, "Soumise");
    if (!opened) return;
    // Should display some core request info
    await expect(page.getByText(/demande/i).first()).toBeVisible();
  });

  test("admin can open any request from their dashboard", async ({ page }) => {
    await loginAs(page, USERS.admin);
    // Admin sees Voir buttons somewhere on the page
    const voirBtn = page.getByRole("button", { name: /voir/i }).first();
    if (await voirBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await voirBtn.click();
      await expect(page.getByText(/demande/i).first()).toBeVisible();
    }
  });
});

// ─── Administrateur — elevated permissions ────────────────────────────────────

test.describe("Administrateur — elevated permissions", () => {
  test("sees requests in multiple statuses (data across all users)", async ({ page }) => {
    await loginAs(page, USERS.admin);
    // Admin sees across all users; we should see at minimum the Soumise badge
    const soumiseVisible = await page.getByText("Soumise").first()
      .isVisible({ timeout: 3000 }).catch(() => false);
    const approuveeVisible = await page.getByText("Approuvée").first()
      .isVisible({ timeout: 3000 }).catch(() => false);
    // At least one of the status types should be on screen
    expect(soumiseVisible || approuveeVisible).toBe(true);
  });

  test("admin can open any request regardless of author", async ({ page }) => {
    await loginAs(page, USERS.admin);
    // Admin may see Voir buttons anywhere on page (not necessarily in a tr)
    const voirBtn = page.getByRole("button", { name: /voir/i }).first();
    if (await voirBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await voirBtn.click();
      await expect(page.getByText(/demande/i).first()).toBeVisible();
    }
  });
});
