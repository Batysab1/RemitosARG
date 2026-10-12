import { chromium } from "playwright-core";

const BASE = "http://localhost:3000";
const DEMO = { email: "vendedor@remitosarg.com.ar", password: "RemitosDemo123" };
const EXE = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

let failures = 0;
function check(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

const browser = await chromium.launch({ executablePath: EXE, args: ["--no-sandbox", "--disable-setuid-sandbox"] });

// 1. Landing -> registro con velo
{
  const ctx = await browser.newContext();
  const errors = [];
  const page = await ctx.newPage();
  page.setDefaultTimeout(25000);
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 150)));
  await page.addInitScript(() => sessionStorage.setItem("remitosarg-intro-seen", "1"));
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.getByRole("link", { name: "Empezar ahora" }).first().click();
  await page.locator(".route-veil").waitFor({ state: "visible", timeout: 8000 }).catch(() => {});
  check("velo aparece al navegar", (await page.locator(".route-veil").count()) > 0);
  await page.waitForURL("**/registro", { timeout: 25000 });
  check("llega a /registro", true, page.url());
  await page.locator(".route-veil").waitFor({ state: "detached", timeout: 8000 }).catch(() => {});
  check("velo se retira", (await page.locator(".route-veil").count()) === 0);
  check("sin pageerrors", errors.length === 0, errors[0] ?? "");
  await ctx.close();
}

// 2. Hash link: sin velo, scroll suave
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.setDefaultTimeout(25000);
  await page.addInitScript(() => sessionStorage.setItem("remitosarg-intro-seen", "1"));
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.getByRole("link", { name: "Ver cómo funciona" }).click();
  await page.waitForTimeout(800);
  check("hash sin velo", (await page.locator(".route-veil").count()) === 0, page.url());
  await ctx.close();
}

// 3. Dashboard: sidebar con velo + reduced sin velo
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.setDefaultTimeout(25000);
  await page.goto(`${BASE}/login`);
  await page.getByPlaceholder("hola@tuempresa.com").fill(DEMO.email);
  await page.getByPlaceholder("Mínimo 10 caracteres").fill(DEMO.password);
  await page.locator("form.auth-form .auth-submit").click();
  await page.waitForURL("**/dashboard", { timeout: 25000 });
  // programático (login) no usa velo: llega directo
  await page.goto(`${BASE}/dashboard`);
  await page.getByRole("link", { name: "Clientes" }).click();
  await page.locator(".route-veil").waitFor({ state: "visible", timeout: 8000 }).catch(() => {});
  check("sidebar Clientes con velo", (await page.locator(".route-veil").count()) > 0);
  await page.waitForURL("**/dashboard/clientes", { timeout: 25000 });
  check("llega a clientes", true);
  await ctx.close();

  const ctxR = await browser.newContext({ reducedMotion: "reduce" });
  const pageR = await ctxR.newPage();
  pageR.setDefaultTimeout(25000);
  await pageR.goto(`${BASE}/login`);
  await pageR.getByPlaceholder("hola@tuempresa.com").fill(DEMO.email);
  await pageR.getByPlaceholder("Mínimo 10 caracteres").fill(DEMO.password);
  await pageR.locator("form.auth-form .auth-submit").click();
  await pageR.waitForURL("**/dashboard", { timeout: 25000 });
  await pageR.goto(`${BASE}/dashboard`);
  await pageR.getByRole("link", { name: "Productos" }).click();
  await pageR.locator(".route-veil").waitFor({ state: "visible", timeout: 8000 }).catch(() => {});
  check("reduced: velo también anima", (await pageR.locator(".route-veil").count()) > 0);
  await pageR.waitForURL("**/dashboard/productos", { timeout: 25000 });
  await pageR.locator(".route-veil").waitFor({ state: "detached", timeout: 8000 }).catch(() => {});
  check("reduced: llega y el velo se retira", (await pageR.locator(".route-veil").count()) === 0, pageR.url());
  await ctxR.close();
}

await browser.close();
console.log(failures === 0 ? "VEIL E2E OK" : `VEIL E2E con ${failures} fallas`);
process.exit(failures === 0 ? 0 : 1);
