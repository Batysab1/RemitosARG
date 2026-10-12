"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await authClient.resetPassword({ newPassword: password, token });
      if (result.error) {
        setError("El enlace es inválido o venció. Pedí uno nuevo desde el login.");
      } else {
        router.push("/login");
      }
    } catch {
      setError("No pudimos conectar con el servidor. Intentá de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <div className="auth-copy">
        <p className="eyebrow">Recuperación</p>
        <h1>Pedí el enlace<br /><span>desde el login.</span></h1>
        <p>Usá ¿Olvidaste tu contraseña? en la pantalla de ingreso y seguí el enlace recibido.</p>
        <p className="auth-switch"><Link href="/login">Volver al login</Link></p>
      </div>
    );
  }

  return (
    <>
      <div className="auth-copy">
        <p className="eyebrow">Recuperación</p>
        <h1>Elegí una<br /><span>nueva clave.</span></h1>
      </div>
      <form onSubmit={submit} className="auth-form">
        <label><span>Nueva contraseña</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={10} autoComplete="new-password" placeholder="Mínimo 10 caracteres" /></label>
        {error && <p className="form-error">{error}</p>}
        <button className="auth-submit" disabled={busy}>{busy ? "Guardando…" : "Guardar nueva contraseña"}</button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="auth-page">
      <div className="auth-panel">
        <Link href="/" className="auth-brand"><span className="brand-symbol">R</span>RemitosARG</Link>
        <Suspense><ResetPasswordForm /></Suspense>
        <p className="auth-switch"><Link href="/login">Volver al login</Link></p>
      </div>
      <div className="auth-side"><div className="auth-side-line" /><p>Una operación más clara empieza con los datos en el lugar correcto.</p></div>
    </main>
  );
}
