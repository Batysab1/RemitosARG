import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";

export default function RegisterPage() {
  return <main className="auth-page"><div className="auth-panel"><Link href="/" className="auth-brand"><span className="brand-symbol">R</span>RemitosARG</Link><div className="auth-copy"><p className="eyebrow">Empezá ordenado</p><h1>Tu negocio,<br /><span>en marcha.</span></h1><p>Creá tu cuenta y empezá a gestionar remitos, presupuestos y stock.</p></div><AuthForm mode="registro" /><p className="auth-switch">¿Ya tenés cuenta? <Link href="/login">Iniciar sesión</Link></p></div><div className="auth-side"><div className="auth-side-line" /><p>Clientes, productos y documentos conectados en una sola vista.</p></div></main>;
}
