import { ArrowUpRight, Check, FileText, Package, ShieldCheck, Users } from "@phosphor-icons/react/dist/ssr";
import { IntroGate } from "@/components/public/IntroGate";
import { Reveal } from "@/components/public/Reveal";
import "./landing.css";

const features = [
  {
    icon: Package,
    title: "Stock que responde",
    body: "Sabé qué tenés, qué se está terminando y qué movimiento cambió cada número.",
    tone: "blue"
  },
  {
    icon: Users,
    title: "Clientes a mano",
    body: "Cargá los datos una vez y reutilizalos en cada remito y presupuesto.",
    tone: "paper"
  },
  {
    icon: FileText,
    title: "Documentos listos",
    body: "Armá documentos comerciales en segundos, con formato A4 y PDF profesional.",
    tone: "ink"
  }
];

const plan = {
  name: "Activación",
  price: "$ 20.000",
  note: "Pago único",
  features: ["Clientes y productos ilimitados", "Stock y movimientos", "Remitos y presupuestos", "PDF e impresión A4", "Soporte por WhatsApp"]
};

export default function Home() {
  return (
    <IntroGate>
      <div className="public-shell">
        <header className="public-nav page-container">
          <a href="#inicio" className="brand-mark" aria-label="RemitosARG, inicio">
            <span className="brand-symbol">R</span>
            <span>RemitosARG</span>
          </a>
          <nav className="nav-links" aria-label="Navegación principal">
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#planes">Planes</a>
            <a href="#seguridad">Seguridad</a>
          </nav>
          <a href="/login" className="nav-login">Iniciar sesión <ArrowUpRight size={15} /></a>
        </header>

        <main>
          <section id="inicio" className="hero page-container">
            <div className="hero-copy">
              <p className="eyebrow">Gestión diaria para comercios argentinos</p>
              <h1>Menos papel.<br /><span>Más control.</span></h1>
              <p className="hero-lead">Stock, clientes, productos, remitos y presupuestos en un solo lugar, pensado para trabajar rápido.</p>
              <div className="hero-actions">
                <a href="/registro" className="button button-primary">Empezar ahora <ArrowUpRight size={17} /></a>
                <a href="#como-funciona" className="button button-quiet">Ver cómo funciona</a>
              </div>
              <p className="hero-footnote"><ShieldCheck size={15} /> Tus datos quedan en tu cuenta</p>
            </div>
            <div className="hero-art" aria-label="Vista previa de un documento comercial">
              <div className="ambient-ring ambient-ring-one" />
              <div className="ambient-ring ambient-ring-two" />
              <div className="document-card">
                <div className="document-topline"><span>REMITOSARG</span><span>01 / 24</span></div>
                <div className="document-head">
                  <div><span className="tiny-label">REMITO</span><strong>Tu empresa</strong><small>Av. Corrientes 1234 · CABA</small></div>
                  <div className="document-letter">X</div>
                </div>
                <div className="document-client"><span>CLIENTE</span><strong>Distribuidora Norte</strong><small>CUIT 30-71823456-1 · Responsable Inscripto</small></div>
                <div className="document-table"><div className="table-row table-title"><span>DESCRIPCIÓN</span><span>CANT.</span><span>UNIDAD</span></div><div className="table-row"><span>Producto de muestra</span><span>12</span><span>u.</span></div><div className="table-row"><span>Segundo producto</span><span>4</span><span>caja</span></div></div>
                <div className="document-sign"><span>Firma de quien recibe</span><span>Aclaración</span></div>
                <div className="document-footer">Documento no válido como factura</div>
              </div>
            </div>
          </section>

          <section id="como-funciona" className="section page-container">
            <Reveal className="section-intro"><p className="eyebrow">Una operación más clara</p><h2>Lo importante aparece<br />cuando lo necesitás.</h2></Reveal>
            <div className="feature-grid">
              {features.map(({ icon: Icon, title, body, tone }, index) => <Reveal key={title} delay={index * 0.06} className={`feature-card feature-${tone}`}><Icon size={25} weight="duotone" /><h3>{title}</h3><p>{body}</p><span className="card-index">0{index + 1}</span></Reveal>)}
            </div>
          </section>

          <section className="workflow-section page-container">
            <Reveal className="workflow-copy"><p className="eyebrow">De la carga al documento</p><h2>Un flujo que sigue<br />tu forma de trabajar.</h2><p>Elegí un cliente, agregá productos, revisá el total y guardá. El stock se actualiza cuando confirmás el remito.</p><a className="text-link" href="/registro">Probar el flujo <ArrowUpRight size={16} /></a></Reveal>
            <Reveal delay={0.1} className="workflow-steps"><div className="workflow-step"><span>01</span><strong>Elegí los datos</strong><small>Clientes y productos cargados una sola vez.</small></div><div className="workflow-step active"><span>02</span><strong>Armá el documento</strong><small>Vista previa real, importes claros y sin saltos.</small></div><div className="workflow-step"><span>03</span><strong>Enviá o imprimí</strong><small>PDF A4 listo para WhatsApp o papel.</small></div></Reveal>
          </section>

          <section id="planes" className="pricing-section page-container">
            <Reveal className="section-intro pricing-intro"><p className="eyebrow">Activación simple</p><h2>Un solo pago<br />para empezar.</h2><p>Transferí $20.000, subí el comprobante y empezá a usar RemitosARG.</p></Reveal>
            <div className="pricing-grid pricing-single">
              <Reveal className="price-card price-featured">
                <p className="price-name">{plan.name}</p>
                <p className="price-note">{plan.note}</p>
                <p className="price-value">{plan.price}</p>
                <ul>{plan.features.map((feature) => <li key={feature}><Check size={16} />{feature}</li>)}</ul>
                <a href="/registro" className="button button-primary">Crear mi cuenta <ArrowUpRight size={16} /></a>
              </Reveal>
            </div>
          </section>

          <section id="seguridad" className="closing-section page-container"><Reveal className="closing-inner"><div><p className="eyebrow">Hecho para el día a día</p><h2>Tu negocio merece<br /><span>menos fricción.</span></h2></div><a href="/registro" className="button button-primary">Crear mi cuenta <ArrowUpRight size={17} /></a></Reveal></section>
        </main>
        <footer className="site-footer page-container"><span>© 2026 RemitosARG</span><span>Hecho para comercios argentinos</span></footer>
      </div>
    </IntroGate>
  );
}
