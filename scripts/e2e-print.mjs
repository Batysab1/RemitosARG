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
const ctx = await browser.newContext();
const page = await ctx.newPage();
page.setDefaultTimeout(25000);
const errors = [];
page.on("pageerror", (e) => errors.push(String(e).slice(0, 150)));

await page.goto(`${BASE}/login`);
await page.getByPlaceholder("hola@tuempresa.com").fill(DEMO.email);
await page.getByPlaceholder("Mínimo 10 caracteres").fill(DEMO.password);
await page.locator("form.auth-form .auth-submit").click();
await page.waitForURL("**/dashboard", { timeout: 25000 });

// ir al detalle del primer documento y tocar Imprimir
await page.goto(`${BASE}/dashboard/documentos`);
const links = page.locator('a[href*="/dashboard/documentos/"]');
let href = "";
for (let i = 0; i < (await links.count()); i++) {
  const h = await links.nth(i).getAttribute("href");
  if (h && !h.endsWith("/nuevo") && !h.includes("/imprimir")) { href = h; break; }
}
await page.goto(`${BASE}${href}`);
await page.getByRole("link", { name: "Imprimir" }).click();
await page.waitForURL(/\/imprimir/, { timeout: 25000 });
check("llega a imprimir", true, page.url());

// la página ya no es un callejón: hay barra con Volver
await page.locator(".print-toolbar").waitFor({ timeout: 15000 });
check("barra con Volver visible", await page.getByRole("button", { name: "Volver al documento" }).isVisible());
check("botón Imprimir de nuevo", await page.getByRole("button", { name: "Imprimir de nuevo" }).isVisible());
check("documento renderizado en iframe", (await page.locator(".print-iframe").count()) === 1);

// Volver saca de la página trabada
await page.getByRole("button", { name: "Volver al documento" }).click();
await page.waitForFunction(() => !window.location.href.includes("/imprimir"), { timeout: 25000 });
check("Volver regresa al detalle", !page.url().includes("/imprimir"), page.url());
check("sin pageerrors", errors.length === 0, errors[0] ?? "");

await browser.close();
console.log(failures === 0 ? "PRINT E2E OK" : `PRINT E2E con ${failures} fallas`);
process.exit(failures === 0 ? 0 : 1);
