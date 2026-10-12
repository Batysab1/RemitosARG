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

// limpieza previa de corridas anteriores
await page.goto(`${BASE}/dashboard/productos`);
for (let i = 0; i < 5; i++) {
  const leftover = page.locator(".data-row", { hasText: "Prod Prueba Sin Stock" });
  if ((await leftover.count()) === 0) break;
  await leftover.first().locator("button").click();
  await page.waitForTimeout(1500);
}

// producto de prueba con stock 5
await page.goto(`${BASE}/dashboard/productos`);
await page.locator('.catalog-form input[name="nombre"]').fill("Prod Prueba Sin Stock");
await page.locator('.catalog-form input[name="stockActual"]').fill("5");
await page.getByRole("button", { name: "Guardar producto" }).click();
await page.locator(".data-row", { hasText: "Prod Prueba Sin Stock" }).waitFor({ timeout: 25000 });
check("producto de prueba creado", true);

// remito por 100 unidades (sin stock suficiente)
await page.goto(`${BASE}/dashboard/documentos/nuevo`);
await page.getByRole("tab", { name: "Remito" }).click();
await page.locator(".module-panel select").first().selectOption({ index: 1 });
await page.locator(".item-product-select select").selectOption({ label: "Prod Prueba Sin Stock (5 u.)" });
await page.locator(".item-numbers input").first().fill("100");
await page.locator(".editor-toolbar button").click();
await page.waitForURL("**/dashboard/documentos", { timeout: 25000 });
check("remito sin stock se guarda", true, page.url());
check("sin error en el editor", (await page.locator(".form-error").count()) === 0);

// stock quedó en negativo y se muestra
await page.goto(`${BASE}/dashboard/stock`);
const row = page.locator(".stock-row", { hasText: "Prod Prueba Sin Stock" });
await row.waitFor({ timeout: 25000 });
const rowText = await row.innerText();
check("stock en negativo visible", rowText.includes("-95"), rowText.slice(0, 70).replace(/\n/g, " | "));

// limpiar: borrar producto de prueba
await page.goto(`${BASE}/dashboard/productos`);
await page.locator(".data-row", { hasText: "Prod Prueba Sin Stock" }).locator("button").click();
await page.waitForTimeout(2000);
check("producto de prueba eliminado", (await page.locator(".data-row", { hasText: "Prod Prueba Sin Stock" }).count()) === 0);
check("sin pageerrors", errors.length === 0, errors[0] ?? "");

await browser.close();
console.log(failures === 0 ? "NOSTOCK E2E OK" : `NOSTOCK E2E con ${failures} fallas`);
process.exit(failures === 0 ? 0 : 1);
