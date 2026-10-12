// E2E HTTP check contra el dev server (node 24, fetch nativo).
const BASE = "http://localhost:3000";
const DEMO = { email: "vendedor@remitosarg.com.ar", password: "RemitosDemo123" };
const ADMIN = { email: "elbatysa@gmail.com", password: "AdminRemitos123" };
const FRESH = { email: `fresco-${Date.now()}@remitosarg.com.ar`, password: "FrescoDemo1234", name: "Usuario Fresco" };

let failures = 0;
function check(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

async function signUp(user) {
  const r = await fetch(`${BASE}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify(user),
  });
  return r;
}

async function signIn(email, password) {
  const r = await fetch(`${BASE}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify({ email, password }),
    redirect: "manual",
  });
  const setCookie = r.headers.getSetCookie ? r.headers.getSetCookie() : [];
  const jar = setCookie.map((c) => c.split(";")[0]).join("; ");
  return { status: r.status, jar, body: await r.text().catch(() => "") };
}

async function get(path, jar) {
  const r = await fetch(BASE + path, { headers: jar ? { Cookie: jar } : {}, redirect: "manual" });
  const text = await r.text().catch(() => "");
  return { status: r.status, location: r.headers.get("location"), contentType: r.headers.get("content-type"), text };
}

// 1. Auth: demo y admin entran, clave mala no
const demo = await signIn(DEMO.email, DEMO.password);
check("login demo", demo.status === 200 && demo.jar.includes("better-auth"), `status=${demo.status}`);
const admin = await signIn(ADMIN.email, ADMIN.password);
check("login admin", admin.status === 200 && admin.jar.includes("better-auth"), `status=${admin.status}`);
const bad = await signIn(DEMO.email, "clave-incorrecta-000");
check("login con clave mala se rechaza", bad.status !== 200 || !bad.jar.includes("better-auth.session"), `status=${bad.status}`);

// 2. Gates: anónimo -> login
const anon = await get("/dashboard/clientes", "");
check("anónimo redirige a login", [307, 308, 302].includes(anon.status) && (anon.location || "").includes("/login"), `status=${anon.status} loc=${anon.location}`);

// 3. Usuario fresco: se registra y queda pendiente -> /acceso
const freshSignup = await signUp(FRESH);
check("registro fresco", [200, 201].includes(freshSignup.status), `status=${freshSignup.status}`);
const fresh = await signIn(FRESH.email, FRESH.password);
if (fresh.status === 429) {
  console.log("INFO rate-limit alcanzado, espero 65s y reintento…");
  await new Promise((r) => setTimeout(r, 65000));
  const retry = await signIn(FRESH.email, FRESH.password);
  Object.assign(fresh, retry);
}
check("login fresco", fresh.status === 200 && fresh.jar.length > 0, `status=${fresh.status}`);
const freshClientes = await get("/dashboard/clientes", fresh.jar);
const freshVaAAcceso = [307, 308, 302].includes(freshClientes.status) && (freshClientes.location || "").includes("/acceso");
const freshVeBanner = freshClientes.text.includes("pendiente de aprobaci");
check("fresco sin aprobación no entra a clientes", freshVaAAcceso || (freshClientes.status === 200 && freshVeBanner), `status=${freshClientes.status} loc=${freshClientes.location}`);

// 4. Demo aprobado entra a todo
for (const p of ["/dashboard", "/dashboard/clientes", "/dashboard/productos", "/dashboard/stock", "/dashboard/documentos", "/dashboard/configuracion", "/dashboard/acceso"]) {
  const r = await get(p, demo.jar);
  check(`demo aprobado GET ${p}`, r.status === 200, `status=${r.status}`);
}

// 5. Admin ve pedidos, demo no
const adminPedidos = await get("/dashboard/admin/pedidos", admin.jar);
check("admin ve /admin/pedidos", adminPedidos.status === 200, `status=${adminPedidos.status}`);
const demoPedidos = await get("/dashboard/admin/pedidos", demo.jar);
check("demo no ve /admin/pedidos", demoPedidos.status !== 200, `status=${demoPedidos.status}`);

// 6. Toaster + toggle CSS llegan al cliente
const landing = await get("/", "");
check("landing trae Toaster (sonner)", landing.text.includes("sonner") || landing.text.includes("toaster"), "markup");
const dashHtml = await get("/dashboard/clientes", demo.jar);
const cssPaths = [...dashHtml.text.matchAll(/href="([^"]+\.css)"/g)].map((m) => m[1]).slice(0, 8);
let cssOk = false;
for (const c of cssPaths) {
  const r = await get(c.startsWith("http") ? c.replace(BASE, "") : c, "");
  if (r.text.includes("document-type-toggle")) { cssOk = true; break; }
}
check("CSS con .document-type-toggle servido", cssOk, "");

// 7. PDF del remito semilla
const docs = await get("/dashboard/documentos", demo.jar);
const m = docs.text.match(/\/dashboard\/documentos\/([a-zA-Z0-9-]{9,})/);
check("hay documento listado", !!m, m ? m[1] : "sin match");
if (m) {
  const pdfRes = await fetch(`${BASE}/api/documentos/${m[1]}/pdf`, { headers: { Cookie: demo.jar } });
  const buf = Buffer.from(await pdfRes.arrayBuffer());
  check("PDF 200 + magic %PDF", pdfRes.status === 200 && buf.subarray(0, 4).toString() === "%PDF", `status=${pdfRes.status} bytes=${buf.length}`);
  const pdfAnon = await fetch(`${BASE}/api/documentos/${m[1]}/pdf`, { redirect: "manual" });
  check("PDF anónimo no entra", pdfAnon.status !== 200, `status=${pdfAnon.status}`);
}

console.log(failures === 0 ? "E2E OK" : `E2E con ${failures} fallas`);
process.exit(failures === 0 ? 0 : 1);
