import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, desc, eq, gt, lte, sum } from "drizzle-orm";
import { ArrowUpRight, Package, Users, Warehouse } from "@phosphor-icons/react/dist/ssr";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { docTypeLabel } from "@/lib/doc-label";
import { clients, documents, products } from "@/db/schema";

const money = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function clientName(snapshot: string) {
  try {
    const parsed = JSON.parse(snapshot) as { nombre?: string; razonSocial?: string } | null;
    return parsed?.nombre || parsed?.razonSocial || "Cliente";
  } catch {
    return "Cliente";
  }
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login?next=/dashboard");
  const userId = session.user.id;

  const [productCount, clientCount, lowStockCount, totalStockRows, recentDocs] = await Promise.all([
    db.$count(products, eq(products.userId, userId)),
    db.$count(clients, eq(clients.userId, userId)),
    db.$count(products, and(eq(products.userId, userId), gt(products.stockMinimo, 0), lte(products.stockActual, products.stockMinimo))),
    db.select({ value: sum(products.stockActual) }).from(products).where(eq(products.userId, userId)),
    db.select().from(documents).where(eq(documents.userId, userId)).orderBy(desc(documents.createdAt)).limit(5),
  ]);

  const totalStock = Number(totalStockRows[0]?.value ?? 0);
  const isEmpty = productCount === 0 && clientCount === 0;

  return (
    <div className="dashboard-content">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Resumen</p>
          <h1>Buen día. Acá está tu operación.</h1>
          <p>Empezá por cargar datos o revisá qué necesita atención.</p>
        </div>
        <Link href="/dashboard/documentos/nuevo" className="button button-primary">
          Nuevo documento <ArrowUpRight size={16} />
        </Link>
      </div>

      <div className="dashboard-overview">
        <div className="overview-card">
          <span><Package size={20} /></span>
          <small>Productos</small>
          <strong>{productCount}</strong>
          <em>{productCount === 0 ? "Sin datos todavía" : `${productCount} en catálogo`}</em>
        </div>
        <div className="overview-card">
          <span><Users size={20} /></span>
          <small>Clientes</small>
          <strong>{clientCount}</strong>
          <em>{clientCount === 0 ? "Cargá tu primer cliente" : `${clientCount} cargados`}</em>
        </div>
        <div className="overview-card overview-dark">
          <span><Warehouse size={20} /></span>
          <small>Stock bajo</small>
          <strong>{lowStockCount}</strong>
          <em>{lowStockCount === 0 ? `${money.format(totalStock)} unidades` : `${lowStockCount} por reponer`}</em>
        </div>
      </div>

      {isEmpty ? (
        <section className="dashboard-empty">
          <div className="empty-mark"><Package size={26} /></div>
          <h2>Tu operación empieza acá</h2>
          <p>Cargá productos y clientes para crear tu primer remito o presupuesto.</p>
          <div>
            <Link href="/dashboard/productos" className="button button-primary">Cargar productos</Link>
            <Link href="/dashboard/clientes" className="button button-quiet">Cargar clientes</Link>
          </div>
        </section>
      ) : (
        <section className="dashboard-recent">
          <div className="dashboard-recent-header">
            <h2>Últimos documentos</h2>
            <Link href="/dashboard/documentos" className="button button-quiet">Ver todos</Link>
          </div>
          {recentDocs.length === 0 ? (
            <div className="dashboard-empty-small">
              <p>Todavía no generaste documentos.</p>
              <Link href="/dashboard/documentos/nuevo" className="button button-primary">Crear el primero</Link>
            </div>
          ) : (
            <ul className="dashboard-recent-list">
              {recentDocs.map((doc) => (
                <li key={doc.id}>
                  <Link href={`/dashboard/documentos/${doc.id}`} className="dashboard-recent-item">
                    <span className="dashboard-recent-type">{docTypeLabel(doc.tipo)}</span>
                    <span className="dashboard-recent-number">Nº {doc.numero}</span>
                    <span className="dashboard-recent-client">{clientName(doc.clienteSnapshot)}</span>
                    <span className="dashboard-recent-date">{new Date(doc.createdAt).toLocaleDateString("es-AR")}</span>
                    <span className="dashboard-recent-total">$ {money.format(doc.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
