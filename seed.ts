import { db } from "@/db";
import { user, clients, products, accessRequests } from "@/db/schema";

const now = Date.now();
const userId = "demo-user-gestion-comercial";

async function seed() {
  await db.insert(user).values({
    id: userId,
    name: "Cuenta demo",
    email: "demo@gestion.ar",
    emailVerified: true,
    createdAt: new Date(now),
    updatedAt: new Date(now),
  }).onConflictDoNothing({ target: user.email });

  await db.insert(accessRequests).values({
    id: "demo-access",
    userId,
    status: "aprobado",
    notaAdmin: "",
    submittedAt: new Date(now),
    reviewedAt: new Date(now),
    createdAt: new Date(now),
    updatedAt: new Date(now),
  }).onConflictDoNothing({ target: accessRequests.userId });

  const demoClients = [
    { id: "cliente-distribuidora-norte", nombre: "Distribuidora Norte", cuit: "30-71823456-1", condicionIva: "Responsable Inscripto", domicilio: "Av. San Martín 1450", localidad: "Córdoba", telefono: "351 456-8890", email: "compras@distribuidoranorte.com.ar" },
    { id: "cliente-almacen-centro", nombre: "Almacén Centro", cuit: "27-30456789-2", condicionIva: "Monotributista", domicilio: "Belgrano 742", localidad: "Rosario", telefono: "341 422-1802", email: "almacen.centro@example.com" },
  ];
  for (const c of demoClients) {
    await db.insert(clients).values({ ...c, userId, createdAt: new Date(now) }).onConflictDoNothing({ target: clients.id });
  }

  const demoProducts = [
    { id: "product-tornillos", codigo: "FER-001", nombre: "Tornillos autoperforantes", descripcion: "Caja de 100 unidades", precio: 8500, unidad: "caja", stockActual: 24, stockMinimo: 5 },
    { id: "product-cinta", codigo: "FER-002", nombre: "Cinta aisladora negra", descripcion: "Rollo profesional", precio: 2100, unidad: "u.", stockActual: 4, stockMinimo: 10 },
    { id: "product-guantes", codigo: "SEG-001", nombre: "Guantes de trabajo", descripcion: "Par reforzado", precio: 4800, unidad: "par", stockActual: 32, stockMinimo: 8 },
    { id: "product-lija", codigo: "PIN-001", nombre: "Lija al agua grano 120", descripcion: "Hoja 230 x 280 mm", precio: 950, unidad: "u.", stockActual: 65, stockMinimo: 15 },
  ];
  for (const p of demoProducts) {
    await db.insert(products).values({ ...p, userId, createdAt: new Date(now) }).onConflictDoNothing({ target: products.id });
  }

  console.log("Seed lista: demo@gestion.ar, clientes y productos cargados.");
}

seed().catch((err) => { console.error(err); process.exit(1); });
