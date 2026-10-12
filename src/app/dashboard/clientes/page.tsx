import { Trash } from "@phosphor-icons/react/dist/ssr";
import { deleteClient, listClients } from "@/actions/catalog";
import { CatalogForm } from "@/components/dashboard/CatalogForm";
import { requireSubscription } from "@/lib/guards";

export default async function ClientsPage() {
  const session = await requireSubscription();
  const rows = await listClients();
  return <div className="dashboard-content"><div className="dashboard-heading"><div><p className="eyebrow">Catálogo</p><h1>Clientes</h1><p>Datos listos para reutilizar en cada documento.</p></div></div><div className="module-grid"><section className="module-panel"><h2>Nuevo cliente</h2><CatalogForm type="cliente" /></section><section className="module-panel"><h2>{rows.length} clientes</h2><div className="data-list">{rows.length === 0 ? <p className="empty-copy">Todavía no hay clientes.</p> : rows.map((client) => <div className="data-row" key={client.id}><div><strong>{client.nombre}</strong><small>{client.cuit || "Sin CUIT"} · {client.localidad || "Sin localidad"}</small></div><form action={deleteClient.bind(null, client.id)}><button aria-label={`Eliminar ${client.nombre}`}><Trash size={16} /></button></form></div>)}</div></section></div><p className="server-note">Sesión activa: {session.user.email}</p></div>;
}
