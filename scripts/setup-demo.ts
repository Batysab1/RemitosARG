import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { accessRequests, clients, counters, documentItems, documents, issuers, movements, products, user } from "@/db/schema";

const ADMIN_EMAIL = "elbatysa@gmail.com";
const ADMIN_PASSWORD = "AdminRemitos123";
const DEMO_EMAIL = "vendedor@remitosarg.com.ar";
const DEMO_PASSWORD = "RemitosDemo123";

async function ensureUser(name: string, email: string, password: string) {
  const existing = await db.select().from(user).where(eq(user.email, email)).get();
  if (existing) {
    console.log(`Existe: ${email} (${existing.id})`);
    return existing;
  }
  const result = await auth.api.signUpEmail({ body: { name, email, password } });
  const created = await db.select().from(user).where(eq(user.email, email)).get();
  if (!created) throw new Error(`No se pudo crear ${email}: ${JSON.stringify(result)}`);
  console.log(`Creado: ${email} (${created.id})`);
  return created;
}

async function main() {
  const now = new Date();
  await ensureUser("Administrador", ADMIN_EMAIL, ADMIN_PASSWORD);
  const demo = await ensureUser("Vendedor Demo", DEMO_EMAIL, DEMO_PASSWORD);

  await db
    .insert(accessRequests)
    .values({ id: `access-${demo.id}`, userId: demo.id, status: "aprobado", notaAdmin: "Aprobado por script setup-demo", submittedAt: now, reviewedAt: now, createdAt: now, updatedAt: now })
    .onConflictDoNothing({ target: accessRequests.userId });
  console.log(`Acceso aprobado para ${DEMO_EMAIL}`);

  await db
    .insert(issuers)
    .values({ id: `issuer-${demo.id}`, userId: demo.id, razonSocial: "Mi Empresa Demo S.R.L.", nombreComercial: "Mi Empresa Demo", cuit: "30-71234567-9", condicionIva: "Responsable Inscripto", domicilio: "Av. Corrientes 1234", localidad: "CABA", telefono: "11 4567-8901", createdAt: now, updatedAt: now })
    .onConflictDoNothing({ target: issuers.userId });

  const clientId = `client-demo-${demo.id.slice(0, 8)}`;
  await db
    .insert(clients)
    .values({ id: clientId, userId: demo.id, nombre: "Distribuidora Norte", cuit: "30-71823456-1", condicionIva: "Responsable Inscripto", domicilio: "Av. San Martín 1450", localidad: "Córdoba", telefono: "351 456-8890", email: "compras@distribuidoranorte.com.ar", createdAt: now })
    .onConflictDoNothing({ target: clients.id });

  const productA = `prod-a-${demo.id.slice(0, 8)}`;
  const productB = `prod-b-${demo.id.slice(0, 8)}`;
  await db
    .insert(products)
    .values({ id: productA, userId: demo.id, codigo: "FER-001", nombre: "Tornillos autoperforantes", descripcion: "Caja de 100 unidades", precio: 8500, unidad: "caja", stockActual: 22, stockMinimo: 5, createdAt: now })
    .onConflictDoNothing({ target: products.id });
  await db
    .insert(products)
    .values({ id: productB, userId: demo.id, codigo: "FER-002", nombre: "Cinta aisladora negra", descripcion: "Rollo profesional", precio: 2100, unidad: "u.", stockActual: 47, stockMinimo: 10, createdAt: now })
    .onConflictDoNothing({ target: products.id });

  // Un remito N°1 ya emitido (2 cajas FER-001 + 5 cintas), como lo generaría createDocument
  const docId = `doc-remito-1-${demo.id.slice(0, 8)}`;
  const existingDoc = await db.select().from(documents).where(eq(documents.id, docId)).get();
  if (!existingDoc) {
    const client = await db.select().from(clients).where(eq(clients.id, clientId)).get();
    const issuer = await db.select().from(issuers).where(eq(issuers.userId, demo.id)).get();
    const items = [
      { codigo: "FER-001", descripcion: "Tornillos autoperforantes", cantidad: 2, unidad: "caja", precio: 8500, descuento: 0, ivaTasa: 21, productId: productA },
      { codigo: "FER-002", descripcion: "Cinta aisladora negra", cantidad: 5, unidad: "u.", precio: 2100, descuento: 0, ivaTasa: 21, productId: productB },
    ];
    let subtotal = 0;
    let iva = 0;
    for (const item of items) {
      const base = item.cantidad * item.precio;
      subtotal += base;
      iva += (base * item.ivaTasa) / 100;
    }
    await db.insert(documents).values({
      id: docId, userId: demo.id, tipo: "remito", numero: 1, fecha: new Date().toISOString().slice(0, 10),
      estado: "emitido", clienteSnapshot: JSON.stringify(client), emisorSnapshot: JSON.stringify(issuer),
      condVenta: "Contado", validezDias: 15, observaciones: "Documento de prueba del setup",
      subtotal, iva, total: subtotal + iva, createdAt: now,
    });
    for (const item of items) {
      await db.insert(documentItems).values({ id: crypto.randomUUID(), documentId: docId, ...item });
      await db.insert(movements).values({ id: crypto.randomUUID(), userId: demo.id, productId: item.productId, tipo: "egreso", cantidad: item.cantidad, motivo: "Remito 1", documentId: docId, createdAt: now });
    }
    await db.insert(counters).values({ id: `counter-remito-${demo.id.slice(0, 8)}`, userId: demo.id, tipo: "remito", proximoNumero: 2 }).onConflictDoNothing({ target: counters.id });
    console.log(`Remito N°1 creado para ${DEMO_EMAIL} (id ${docId})`);
  } else {
    console.log("Remito N°1 ya existía, no se duplica.");
  }

  console.log("Setup demo listo.");
  console.log(`  admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`  demo:  ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
