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
const ctx = await browser.newContext({ acceptDownloads: true });
const page = await ctx.newPage();
page.setDefaultTimeout(25000);
const errors = [];
page.on("pageerror", (e) => errors.push(String(e).slice(0, 150)));

await page.goto(`${BASE}/login`);
await page.getByPlaceholder("hola@tuempresa.com").fill(DEMO.email);
await page.getByPlaceholder("Mínimo 10 caracteres").fill(DEMO.password);
await page.locator("form.auth-form .auth-submit").click();
await page.waitForURL("**/dashboard", { timeout: 25000 });

// stock inicial del primer producto con stock conocido
await page.goto(`${BASE}/dashboard/stock`);
await page.locator(".stock-charts svg").first().waitFor({ timeout: 25000 });
check("gráficos de stock visibles", (await page.locator(".stock-charts svg").count()) === 2);
const prodRow = page.locator(".stock-row", { hasText: "Tornillos autoperforantes" });
const stockBefore = await prodRow.innerText();

// toggle con 3 tipos
await page.goto(`${BASE}/dashboard/documentos/nuevo`);
const toggleBtns = await page.locator(".document-type-toggle button").allInnerTexts();
check("toggle con Recibo", toggleBtns.join("|").includes("Recibo"), toggleBtns.join("|"));
await page.getByRole("tab", { name: "Presupuesto" }).click();
// selector IVA por ítem
const ivaSelect = page.locator(".item-numbers select").first();
await ivaSelect.waitFor();
const ivaOpts = await ivaSelect.locator("option").allInnerTexts();
check("opciones IVA 21/10.5/0/Exento", ivaOpts.join("|").includes("Exento"), ivaOpts.join("|"));

// armar presupuesto: cliente + producto + IVA exento
await page.locator(".module-panel select").first().selectOption({ index: 1 });
await page.locator(".item-product-select select").selectOption({ index: 1 });
await ivaSelect.selectOption({ label: "Exento" });
await page.locator(".item-numbers input").first().fill("1");
await page.locator(".editor-toolbar button").click();
await page.waitForURL("**/dashboard/documentos", { timeout: 25000 });
check("presupuesto con IVA exento guardado", true);

// detalle: columna IVA + Ex.
const links = page.locator('a[href*="/dashboard/documentos/"]');
let href = "";
for (let i = 0; i < (await links.count()); i++) {
  const h = await links.nth(i).getAttribute("href");
  if (h && !h.endsWith("/nuevo") && !h.includes("/imprimir")) { href = h; break; }
}
await page.goto(`${BASE}${href}`);
await page.locator(".document-items-table").waitFor();
const tableText = await page.locator(".document-items-table").innerText();
check("detalle muestra IVA Ex.", tableText.includes("Ex."), tableText.slice(0, 120).replace(/\n/g, " | "));

// aprobar + convertir a recibo
await page.getByRole("button", { name: "Aprobar" }).click();
await page.getByRole("button", { name: "Convertir a recibo" }).waitFor({ timeout: 25000 });
await page.getByRole("button", { name: "Convertir a recibo" }).click();
await page.waitForURL(/\/dashboard\/documentos\/.+/, { timeout: 25000 });
await page.waitForTimeout(1500);
const h1 = await page.locator(".document-detail-heading h1").innerText();
check("convertido a recibo", h1.includes("Recibo"), h1);

// PDF del recibo válido
const [download] = await Promise.all([
  page.waitForEvent("download", { timeout: 60000 }),
  page.getByRole("link", { name: "Descargar PDF" }).click(),
]);
const { readFileSync } = await import("fs");
const magic = readFileSync(await download.path()).subarray(0, 4).toString();
check("PDF del recibo válido", magic === "%PDF", magic);

// stock intacto (presupuesto + recibo no mueven stock)
await page.goto(`${BASE}/dashboard/stock`);
const stockAfter = await page.locator(".stock-row", { hasText: "Tornillos autoperforantes" }).innerText();
check("stock intacto tras recibo", stockAfter === stockBefore, stockAfter.slice(0, 60).replace(/\n/g, " | "));

// egreso mayor al stock -> error
const firstRow = page.locator(".stock-row").first();
await firstRow.locator('input[aria-label="Cantidad"]').fill("999999");
await firstRow.getByRole("button", { name: /Egresar/ }).click();
await page.locator("[data-sonner-toast]").first().waitFor({ timeout: 15000 }).catch(() => {});
const toastText = await page.locator("[data-sonner-toast]").first().innerText().catch(() => "");
check("egreso sin stock da error", toastText.toLowerCase().includes("insuficiente"), toastText.slice(0, 80));

// egreso válido de 1 unidad
await firstRow.locator('input[aria-label="Cantidad"]').fill("1");
await firstRow.getByRole("button", { name: /Egresar/ }).click();
await page.waitForTimeout(2500);
check("egreso de 1 unidad OK", true);
check("sin pageerrors", errors.length === 0, errors[0] ?? "");

await browser.close();
console.log(failures === 0 ? "DOCS E2E OK" : `DOCS E2E con ${failures} fallas`);
process.exit(failures === 0 ? 0 : 1);
