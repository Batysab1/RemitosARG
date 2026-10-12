import { readFileSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { chromium } from "playwright-core";

const BASE = "http://localhost:3000";
const TS = Date.now();
const USER = { name: "Browser E2E", email: `browser-${TS}@remitosarg.com.ar`, password: "BrowserE2E1234" };
const ADMIN = { email: "elbatysa@gmail.com", password: "AdminRemitos123" };

let failures = 0;
function check(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

// 1px PNG para el comprobante
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const pngPath = join(tmpdir(), `comprobante-${TS}.png`);
writeFileSync(pngPath, png);

const browser = await chromium.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});
const userCtx = await browser.newContext({ acceptDownloads: true });
const adminCtx = await browser.newContext();
const page = await userCtx.newPage();
page.setDefaultTimeout(25000);

// 1. Registro -> dashboard con banner pendiente
await page.goto(`${BASE}/registro`);
await page.getByPlaceholder("María de los Ángeles").fill(USER.name);
await page.getByPlaceholder("hola@tuempresa.com").fill(USER.email);
await page.getByPlaceholder("Mínimo 10 caracteres").fill(USER.password);
await page.locator("form.auth-form .auth-submit").click();
await page.waitForURL("**/dashboard", { timeout: 25000 });
check("registro lleva a /dashboard", page.url().includes("/dashboard"), page.url());
check("banner pendiente visible", await page.locator(".subscription-banner").isVisible());

// 2. Sin aprobación, clientes redirige a acceso
await page.goto(`${BASE}/dashboard/clientes`);
await page.waitForURL("**/dashboard/acceso", { timeout: 25000 });
check("pendiente redirige a /acceso", page.url().includes("/acceso"), page.url());
check("alias MP visible", await page.getByText("BautiiSab.mp").isVisible());

// 3. Subir comprobante -> en revisión
await page.locator(".access-upload input[type=file]").setInputFiles(pngPath);
check("preview comprobante", await page.locator("img.access-preview").isVisible());
await page.getByRole("button", { name: "Enviar comprobante" }).click();
await page.getByText("Comprobante recibido").waitFor({ timeout: 25000 });
check("comprobante en revisión", true);

// 4. Admin aprueba
const admin = await adminCtx.newPage();
admin.setDefaultTimeout(25000);
await admin.goto(`${BASE}/login`);
await admin.getByPlaceholder("hola@tuempresa.com").fill(ADMIN.email);
await admin.getByPlaceholder("Mínimo 10 caracteres").fill(ADMIN.password);
await admin.locator("form.auth-form .auth-submit").click();
await admin.waitForURL("**/dashboard", { timeout: 25000 });
await admin.goto(`${BASE}/dashboard/admin/pedidos`);
const card = admin.locator(".admin-request-card", { hasText: USER.email });
await card.waitFor({ timeout: 25000 });
await card.getByRole("button", { name: "Aprobar" }).click();
await card.getByText("Aprobado").waitFor({ timeout: 25000 });
check("admin aprueba comprobante", true);

// 5. Usuario aprobado crea cliente (y el toast aparece = Toaster vivo)
await page.goto(`${BASE}/dashboard/clientes`);
await page.locator('.catalog-form input[name="nombre"]').fill("Cliente Browser");
await page.getByRole("button", { name: "Guardar cliente" }).click();
await page.locator(".data-row", { hasText: "Cliente Browser" }).waitFor({ timeout: 25000 });
check("cliente creado y listado", true);
const toast = page.locator("[data-sonner-toast]");
await toast.first().waitFor({ timeout: 15000 }).catch(() => {});
check("toast de confirmación visible", (await toast.count()) > 0);

// 6. Crear producto con stock 10
await page.goto(`${BASE}/dashboard/productos`);
await page.locator('.catalog-form input[name="nombre"]').fill("Prod Browser");
await page.locator('.catalog-form input[name="precio"]').fill("1000");
await page.locator('.catalog-form input[name="stockActual"]').fill("10");
await page.getByRole("button", { name: "Guardar producto" }).click();
await page.locator(".data-row", { hasText: "Prod Browser" }).waitFor({ timeout: 25000 });
check("producto creado con stock", true);

// 7. Nuevo remito: elegir cliente + producto, cantidad 2, guardar
await page.goto(`${BASE}/dashboard/documentos/nuevo`);
await page.locator(".document-type-toggle").waitFor({ timeout: 25000 });
check("toggle remito/presupuesto con estilo", true);
await page.locator(".module-panel select").first().selectOption({ label: "Cliente Browser" });
await page.locator(".item-product-select select").selectOption({ index: 1 });
await page.locator(".item-numbers input").first().fill("2");
await page.locator(".editor-toolbar button").click();
await page.waitForURL("**/dashboard/documentos", { timeout: 25000 });
check("remito guardado", page.url().endsWith("/documentos"), page.url());

// 8. Detalle + PDF descargado con magic %PDF
const docLinks = page.locator('a[href*="/dashboard/documentos/"]');
const linkCount = await docLinks.count();
let detailHref = "";
for (let i = 0; i < linkCount; i++) {
  const href = await docLinks.nth(i).getAttribute("href");
  if (href && !href.endsWith("/nuevo") && !href.includes("/imprimir")) { detailHref = href; break; }
}
check("hay link al detalle (no a nuevo)", detailHref !== "", detailHref);
await page.goto(`${BASE}${detailHref}`);
check("detalle muestra total", await page.locator(".detail-total").isVisible());
const [download] = await Promise.all([
  page.waitForEvent("download", { timeout: 60000 }),
  page.getByRole("link", { name: "Descargar PDF" }).click(),
]);
const pdfPath = await download.path();
const magic = readFileSync(pdfPath).subarray(0, 4).toString();
check("PDF descargado válido", magic === "%PDF", magic);

// 9. Stock descontado: 10 - 2 = 8
await page.goto(`${BASE}/dashboard/stock`);
const stockRow = page.locator(".stock-row", { hasText: "Prod Browser" });
await stockRow.waitFor({ timeout: 25000 });
const stockText = await stockRow.innerText();
check("stock descontado a 8", stockText.includes("8"), stockText.slice(0, 80).replace(/\n/g, " | "));

await browser.close();
console.log(failures === 0 ? "BROWSER E2E OK" : `BROWSER E2E con ${failures} fallas`);
process.exit(failures === 0 ? 0 : 1);
