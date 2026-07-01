// Shared test helpers and user accounts

export const BASE_URL = "http://localhost:5173";
export const API_URL = "http://localhost:3001/api";

export const USERS = {
  utilisateur: { username: "mdupont", password: "1234", name: "Mario Dumont", roles: [] },
  approbateur: { username: "jmartin", password: "1234", name: "Jean Martin", roles: ["A"] },
  approbateur2: { username: "plefebvre", password: "1234", name: "Pierre Lefebvre", roles: ["A"] },
  verificateur: { username: "sbernard", password: "1234", name: "Sophie Bernard", roles: ["B"] },
  agentAdmin: { username: "ltremblay", password: "1234", name: "Luc Tremblay", roles: ["C1"] },
  magasinier: { username: "pgagnon", password: "1234", name: "Paula Gagnon", roles: ["C2"] },
  concierge: { username: "mcaron", password: "1234", name: "Michel Caron", roles: ["C3"] },
  admin: { username: "admin", password: "admin", name: "Admin Système", roles: ["D"] },
};

/**
 * Log in as a given user via the login form.
 * @param {import('@playwright/test').Page} page
 * @param {{ username: string, password: string }} user
 */
export async function loginAs(page, user) {
  await page.goto("/");
  await page.getByPlaceholder("prenom.nom").fill(user.username);
  await page.getByPlaceholder("••••••••").fill(user.password);
  await page.getByRole("button", { name: "Connexion" }).click();
  // Wait until the dashboard is visible
  await page.waitForSelector("h2:has-text('Tableau de bord')", { timeout: 5000 });
}

/** Log out by reloading (app uses in-memory state, page reload clears session). */
export async function logout(page) {
  await page.goto("/");
}
