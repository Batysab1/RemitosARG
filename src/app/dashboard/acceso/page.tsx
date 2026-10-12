import { getMyAccessRequest } from "@/actions/access";
import { AccessRequestForm } from "@/components/dashboard/AccessRequestForm";
import { requireSession } from "@/lib/guards";

export default async function AccesoPage() {
  await requireSession();
  const request = await getMyAccessRequest();
  return (
    <div className="dashboard-content">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Acceso</p>
          <h1>Activá tu cuenta</h1>
        </div>
      </div>
      <section className="module-panel">
        <AccessRequestForm request={request} />
      </section>
    </div>
  );
}
