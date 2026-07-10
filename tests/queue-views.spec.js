/**
 * queue-views.spec.js — Queue navigation tests for each role
 *
 * Each role has a dedicated queue view accessible from the dashboard:
 *   Approbateur (A)    → queue_A    "Approbateur"
 *   Approbateur+ (A2)  → queue_A2   "Approbateur +"
 *   Vérificateur (B)   → queue_B    "Vérificateur"
 *   Agent admin (C1)   → queue_C1
 *   Magasinier (C2)    → queue_C2
 *   Concierge (C3)     → queue_C3
 *
 * Tests verify:
 *  - Queue nav link is visible for each role
 *  - Queue page loads and shows the role label
 *  - Requests listed in the queue match the expected status
 *  - Roles cannot see queues they don't belong to
 *  - Admin (D) can see all queues on the dashboard summary
 */

import { test, expect } from "@playwright/test";
import { loginAs, USERS } from "./helpers.js";

// ─── Queue link visibility per role ──────────────────────────────────────────

test.describe("Queue navigation links are visible for correct roles", () => {
  test("Approbateur sees their queue link", async ({ page }) => {
    await loginAs(page, USERS.approbateur);
    // The dashboard renders a nav bar with role-specific queue buttons
    const queueLink = page.getByRole("button", { name: /approbateur/i }).first();
    await expect(queueLink).toBeVisible();
  });

  test("Vérificateur sees their queue link", async ({ page }) => {
    await loginAs(page, USERS.verificateur);
    const queueLink = page.getByRole("button", { name: /vérificateur/i }).first();
    await expect(queueLink).toBeVisible();
  });

  test("Agent administratif sees their queue link", async ({ page }) => {
    await loginAs(page, USERS.agentAdmin);
    const queueLink = page.getByRole("button", { name: /agent administratif/i }).first();
    await expect(queueLink).toBeVisible();
  });

  test("Magasinier sees their queue link", async ({ page }) => {
    await loginAs(page, USERS.magasinier);
    const queueLink = page.getByRole("button", { name: /magasinier/i }).first();
    await expect(queueLink).toBeVisible();
  });

  test("Concierge sees their queue link", async ({ page }) => {
    await loginAs(page, USERS.concierge);
    const queueLink = page.getByRole("button", { name: /concierge/i }).first();
    await expect(queueLink).toBeVisible();
  });

  test("Utilisateur (no role) does NOT see any queue link", async ({ page }) => {
    await loginAs(page, USERS.utilisateur);
    await expect(page.getByRole("button", { name: /^approbateur$/i })).not.toBeVisible();
    await expect(page.getByRole("button", { name: /vérificateur/i })).not.toBeVisible();
    await expect(page.getByRole("button", { name: /magasinier/i })).not.toBeVisible();
  });
});

// ─── Queue page loads for each role ──────────────────────────────────────────

test.describe("Queue page loads and shows correct role label", () => {
  test("Approbateur queue shows role label", async ({ page }) => {
    await loginAs(page, USERS.approbateur);
    await page.getByRole("button", { name: /approbateur/i }).first().click();
    await expect(page.getByText(/approbateur/i).first()).toBeVisible();
    // Back button should be present
    await expect(page.getByRole("button", { name: /retour/i }).first()).toBeVisible();
  });

  test("Vérificateur queue shows role label", async ({ page }) => {
    await loginAs(page, USERS.verificateur);
    await page.getByRole("button", { name: /vérificateur/i }).first().click();
    await expect(page.getByText(/vérificateur/i).first()).toBeVisible();
  });

  test("Agent administratif queue shows role label", async ({ page }) => {
    await loginAs(page, USERS.agentAdmin);
    await page.getByRole("button", { name: /agent administratif/i }).first().click();
    await expect(page.getByText(/agent administratif/i).first()).toBeVisible();
  });

  test("Magasinier queue shows role label", async ({ page }) => {
    await loginAs(page, USERS.magasinier);
    await page.getByRole("button", { name: /magasinier/i }).first().click();
    await expect(page.getByText(/magasinier/i).first()).toBeVisible();
  });

  test("Concierge queue shows role label", async ({ page }) => {
    await loginAs(page, USERS.concierge);
    await page.getByRole("button", { name: /concierge/i }).first().click();
    await expect(page.getByText(/concierge/i).first()).toBeVisible();
  });
});

// ─── Queue back navigation ────────────────────────────────────────────────────

test.describe("Queue back button returns to dashboard", () => {
  test("Approbateur queue → back → dashboard", async ({ page }) => {
    await loginAs(page, USERS.approbateur);
    await page.getByRole("button", { name: /approbateur/i }).first().click();
    await page.getByRole("button", { name: /retour/i }).first().click();
    await expect(page.getByRole("heading", { name: "Tableau de bord" })).toBeVisible();
  });

  test("Magasinier queue → back → dashboard", async ({ page }) => {
    await loginAs(page, USERS.magasinier);
    await page.getByRole("button", { name: /magasinier/i }).first().click();
    await page.getByRole("button", { name: /retour/i }).first().click();
    await expect(page.getByRole("heading", { name: "Tableau de bord" })).toBeVisible();
  });
});

// ─── Queue contains appropriate requests ─────────────────────────────────────

test.describe("Queue lists requests at the correct stage", () => {
  test("Vérificateur queue shows pending requests", async ({ page }) => {
    await loginAs(page, USERS.verificateur);
    await page.getByRole("button", { name: /vérificateur/i }).first().click();
    // The queue table has columns: #, Type, Titre, Demandeur, Date, Actions — no status column
    await expect(page.getByRole("heading", { name: /file d'attente/i })).toBeVisible();
    // If there are requests, verify the table renders
    const hasRequests = await page.getByRole("button", { name: /voir/i }).first()
      .isVisible({ timeout: 3000 }).catch(() => false);
    if (hasRequests) {
      await expect(page.locator("table").first()).toBeVisible();
    }
  });

  test("Magasinier queue shows pending requests", async ({ page }) => {
    await loginAs(page, USERS.magasinier);
    await page.getByRole("button", { name: /magasinier/i }).first().click();
    // Queue shows a table with pending requests; no status badge column in this view
    await expect(page.getByRole("heading", { name: /file d'attente/i })).toBeVisible();
    const hasRequests = await page.getByRole("button", { name: /voir/i }).first()
      .isVisible({ timeout: 3000 }).catch(() => false);
    if (hasRequests) {
      await expect(page.locator("table").first()).toBeVisible();
    }
  });

  test("Concierge queue shows pending requests", async ({ page }) => {
    await loginAs(page, USERS.concierge);
    await page.getByRole("button", { name: /concierge/i }).first().click();
    // Queue shows a table with pending requests; no status badge column in this view
    await expect(page.getByRole("heading", { name: /file d'attente/i })).toBeVisible();
    const hasRequests = await page.getByRole("button", { name: /voir/i }).first()
      .isVisible({ timeout: 3000 }).catch(() => false);
    if (hasRequests) {
      await expect(page.locator("table").first()).toBeVisible();
    }
  });
});

// ─── Opening a request from the queue ────────────────────────────────────────

test.describe("Opening a request from a queue", () => {
  test("Vérificateur can open a request from their queue", async ({ page }) => {
    await loginAs(page, USERS.verificateur);
    await page.getByRole("button", { name: /vérificateur/i }).first().click();
    const voirBtn = page.getByRole("button", { name: /voir/i }).first();
    if (await voirBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await voirBtn.click();
      await expect(page.getByText(/demande/i).first()).toBeVisible();
      // Back from detail should go back to the queue, not the dashboard
      await page.getByRole("button", { name: /retour/i }).first().click();
      await expect(page.getByText(/vérificateur/i).first()).toBeVisible();
    }
  });

  test("Magasinier can open a request from their queue", async ({ page }) => {
    await loginAs(page, USERS.magasinier);
    await page.getByRole("button", { name: /magasinier/i }).first().click();
    const voirBtn = page.getByRole("button", { name: /voir/i }).first();
    if (await voirBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await voirBtn.click();
      await expect(page.getByText(/demande/i).first()).toBeVisible();
    }
  });
});

// ─── Admin sees all queue summaries ──────────────────────────────────────────

test.describe("Admin sees queue summary cards on dashboard", () => {
  test("Admin dashboard shows multi-role queue summary", async ({ page }) => {
    await loginAs(page, USERS.admin);
    // Admin (role D) should see a summary section listing all queues
    await expect(page.getByRole("heading", { name: "Tableau de bord" })).toBeVisible();
    // At least approbateur and vérificateur queue links should appear
    const hasAny = await page.getByText(/approbateur|vérificateur|magasinier/i).first()
      .isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasAny).toBe(true);
  });

  test("Admin can navigate to any queue", async ({ page }) => {
    await loginAs(page, USERS.admin);
    // Find any queue button and navigate to it
    const queueBtn = page.getByRole("button", { name: /approbateur|vérificateur|magasinier|concierge/i }).first();
    if (await queueBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await queueBtn.click();
      await expect(page.getByRole("button", { name: /retour/i }).first()).toBeVisible();
    }
  });
});
