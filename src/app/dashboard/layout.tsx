import Link from "next/link";
import { ChartLineUp, FileText, Gear, Package, Shield, Users, Warehouse } from "@phosphor-icons/react/dist/ssr";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasApprovedAccess, isAdminEmail, getPendingReviewCount } from "@/lib/access";
import "./dashboard-extra.css";

const nav = [
  ["Resumen", "/dashboard", ChartLineUp],
  ["Clientes", "/dashboard/clientes", Users],
  ["Productos", "/dashboard/productos", Package],
  ["Stock", "/dashboard/stock", Warehouse],
  ["Documentos", "/dashboard/documentos", FileText],
  ["Configuración", "/dashboard/configuracion", Gear],
] as const;

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login?next=/dashboard");
  const approved = await hasApprovedAccess(session.user.id, session.user.email);
  const admin = isAdminEmail(session.user.email);
  const pendingCount = admin ? await getPendingReviewCount() : 0;

  const statusLabel = admin ? "Administrador" : approved ? "Cuenta activa" : "Pendiente de aprobación";

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <Link href="/dashboard" className="brand-mark" aria-label="RemitosARG, inicio">
          <span className="brand-symbol">R</span>
          <span>RemitosARG</span>
        </Link>
        <nav>
          {nav.map(([label, href, Icon]) => (
            <Link key={href} href={href} className="dashboard-nav-item">
              <Icon size={18} weight="duotone" />
              {label}
            </Link>
          ))}
          {admin && (
            <Link href="/dashboard/admin/pedidos" className="dashboard-nav-item">
              <Shield size={18} weight="duotone" />
              Pedidos
              {pendingCount > 0 && <span className="admin-badge">{pendingCount}</span>}
            </Link>
          )}
        </nav>
        <div className="dashboard-user">
          <span>{session.user.name?.slice(0, 1).toUpperCase() ?? "U"}</span>
          <div>
            <strong>{session.user.name}</strong>
            <small>{statusLabel}</small>
          </div>
        </div>
      </aside>
      <main className="dashboard-main">
        {!approved && !admin && (
          <div className="subscription-banner">
            <strong>Tu cuenta está pendiente de aprobación.</strong>
            <span>Subí el comprobante de la transferencia para activarla.</span>
            <Link href="/dashboard/acceso">Ver instrucciones</Link>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
