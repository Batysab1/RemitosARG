import { chromium } from "playwright-core";

const BASE = "http://localhost:3000";
const DEMO = { email: "vendedor@remitosarg.com.ar", password: "RemitosDemo123" };
const EXE = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

let failures = 0;
function check(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

function watchErrors(page, tag, store) {
  page.on("console", (msg) => {
    if (msg.type() === "error") store.push(`[${tag}] ${msg.text().slice(0, 200)}`);
  });
  page.on("pageerror", (err) => store.push(`[${tag}] pageerror: ${String(err).slice(0, 200)}`));
}

const browser = await chromium.launch({ executablePath: EXE, args: ["--no-sandbox", "--disable-setuid-sandbox"] });

// 1. Perfil limpio, movimiento normal: intro animada, sin errores de hidratación
{
  const ctx = await browser.newContext();
  const errors = [];
  const page = await ctx.newPage();
  page.setDefaultTimeout(25000);
  watchErrors(page, "intro", errors);
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  const overlay = page.locator(".intro-overlay");
  await overlay.waitFor({ state: "visible", timeout: 15000 });
  check("intro visible en primera visita", true);
  const letters = await page.locator(".intro-cine-title > span").count();
  check("título letra por letra animado", letters > 1, `${letters} spans`);
  await overlay.waitFor({ state: "detached", timeout: 12000 });
  check("intro se retira sola (~4s)", true);
  const seen = await page.evaluate(() => sessionStorage.getItem("remitosarg-intro-seen"));
  check("sessionStorage marca visita", seen === "1", String(seen));
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  check("segunda visita salta la intro", (await page.locator(".intro-overlay").count()) === 0);
  const hydration = errors.filter((e) => e.toLowerCase().includes("hydrat"));
  check("sin errores de hidratación", hydration.length === 0, hydration[0] ?? `${errors.length} errores totales`);
  if (errors.length > 0 && hydration.length === 0) console.log(`  (errores no-hidratación: ${errors.join(" | ").slice(0, 300)})`);
  await ctx.close();
}

// 2. Movimiento reducido: cinemática completa igual (decisión del producto)
{
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const errors = [];
  const page = await ctx.newPage();
  page.setDefaultTimeout(25000);
  watchErrors(page, "reduced", errors);
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  const overlay = page.locator(".intro-overlay");
  await overlay.waitFor({ state: "visible", timeout: 15000 });
  const letters = await page.locator(".intro-cine-title > span").count();
  check("reduced: cinemática completa también", letters > 1, `${letters} spans`);
  await overlay.waitFor({ state: "detached", timeout: 12000 });
  check("reduced: autoplay retira sola", true);
  const hydration = errors.filter((e) => e.toLowerCase().includes("hydrat"));
  check("reduced: sin errores de hidratación", hydration.length === 0, hydration[0] ?? `${errors.length} errores totales`);
  await ctx.close();
}

// 3. Logout con animación (normal)
{
  const ctx = await browser.newContext();
  const errors = [];
  const page = await ctx.newPage();
  page.setDefaultTimeout(25000);
  watchErrors(page, "logout", errors);
  await page.goto(`${BASE}/login`);
  await page.getByPlaceholder("hola@tuempresa.com").fill(DEMO.email);
  await page.getByPlaceholder("Mínimo 10 caracteres").fill(DEMO.password);
  await page.locator("form.auth-form .auth-submit").click();
  await page.waitForURL("**/dashboard", { timeout: 25000 });
  await page.goto(`${BASE}/dashboard/configuracion`);
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  const overlay = page.locator(".intro-overlay");
  await overlay.waitFor({ state: "visible", timeout: 15000 });
  const letters = await page.locator(".intro-cine-title > span").count();
  check("logout: overlay de despedida animado", letters > 1, `${letters} spans`);
  await page.waitForURL(`${BASE}/`, { timeout: 20000 });
  check("logout: completa y vuelve al inicio", true, page.url());
  const hydration = errors.filter((e) => e.toLowerCase().includes("hydrat"));
  check("logout: sin errores de hidratación", hydration.length === 0, hydration[0] ?? "");
  await ctx.close();
}

// 4. Logout con movimiento reducido (cinemática completa igual)
{
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const page = await ctx.newPage();
  page.setDefaultTimeout(25000);
  await page.goto(`${BASE}/login`);
  await page.getByPlaceholder("hola@tuempresa.com").fill(DEMO.email);
  await page.getByPlaceholder("Mínimo 10 caracteres").fill(DEMO.password);
  await page.locator("form.auth-form .auth-submit").click();
  await page.waitForURL("**/dashboard", { timeout: 25000 });
  await page.goto(`${BASE}/dashboard/configuracion`);
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  const overlay = page.locator(".intro-overlay");
  await overlay.waitFor({ state: "visible", timeout: 15000 });
  const letters = await page.locator(".intro-cine-title > span").count();
  check("logout reduced: despedida animada", letters > 1, `${letters} spans`);
  await page.waitForURL(`${BASE}/`, { timeout: 20000 });
  check("logout reduced: completa igual", true);
  await ctx.close();
}

await browser.close();
console.log(failures === 0 ? "ANIM E2E OK" : `ANIM E2E con ${failures} fallas`);
process.exit(failures === 0 ? 0 : 1);
