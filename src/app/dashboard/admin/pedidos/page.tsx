import { listAccessRequests } from "@/actions/admin";
import { AdminRequestCard } from "@/components/dashboard/AdminRequestCard";
import { requireSession } from "@/lib/guards";
import { isAdminEmail } from "@/lib/access";
import { redirect } from "next/navigation";

export default async function AdminPedidosPage() {
  const session = await requireSession();
  if (!isAdminEmail(session.user.email)) redirect("/dashboard");
  const requests = await listAccessRequests();

  return (
    <div className="dashboard-content">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Administración</p>
          <h1>Pedidos de acceso</h1>
        </div>
      </div>
      <section className="module-panel">
        {requests.length === 0 ? (
          <p className="empty-copy">No hay pedidos de acceso todavía.</p>
        ) : (
          <div className="admin-requests-list">
            {requests.map((request) => (
              <AdminRequestCard key={request.id} request={request} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
