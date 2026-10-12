import { getIssuer } from "@/actions/issuer";
import { IssuerSettingsForm } from "@/components/dashboard/IssuerSettingsForm";

export default async function ConfiguracionPage() {
  const issuer = await getIssuer();
  return (
    <div className="dashboard-content">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Tu negocio</p>
          <h1>Configuración</h1>
        </div>
      </div>
      <section className="module-panel">
        <IssuerSettingsForm issuer={issuer} />
      </section>
    </div>
  );
}
