import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";

export default function LoginPage() {
  return <main className="auth-page"><div className="auth-panel"><Link href="/" className="auth-brand"><span className="brand-symbol">R</span>RemitosARG</Link><div className="auth-copy"><p className="eyebrow">Tu espacio de trabajo</p><h1>Volvé a tener<br /><span>el control.</span></h1><p>Ingresá a tu operación y seguí desde donde dejaste.</p></div><AuthForm mode="login" /><p className="auth-switch">¿Todavía no tenés cuenta? <Link href="/registro">Crear una cuenta</Link></p></div><div className="auth-side"><div className="auth-side-line" /><p>Una operación más clara empieza con los datos en el lugar correcto.</p></div></main>;
}
