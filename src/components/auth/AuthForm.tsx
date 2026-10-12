"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle, LockKey, WarningCircle } from "@phosphor-icons/react";
import { authClient } from "@/lib/auth-client";

export function AuthForm({ mode }: { mode: "login" | "registro" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const callbackURL = `${window.location.origin}/dashboard`;
      const result = mode === "login"
        ? await authClient.signIn.email({ email, password, callbackURL })
        : await authClient.signUp.email({ email, password, name, callbackURL });
      if (result.error) {
        setError("No pudimos validar esos datos. Revisá el email y la contraseña.");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError("No pudimos conectar con el servidor. Intentá de nuevo en unos segundos.");
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    if (!email) { setError("Escribí tu email para recibir el enlace de recuperación."); return; }
    const result = await authClient.requestPasswordReset({ email, redirectTo: `${window.location.origin}/reset-password` });
    if (result.error) setError("No se pudo solicitar el enlace.");
    else setSent(true);
  }

  return (
    <form onSubmit={submit} className="auth-form">
      {mode === "registro" && <label><span>Nombre</span><input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" placeholder="María de los Ángeles" /></label>}
      <label><span>Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="hola@tuempresa.com" /></label>
      <label><span>Contraseña</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={10} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="Mínimo 10 caracteres" /></label>
      {error && <p className="form-error"><WarningCircle size={16} />{error}</p>}
      {sent && <p className="form-success"><CheckCircle size={16} />Revisá la consola del servidor para ver el enlace simulado.</p>}
      <button className="auth-submit" disabled={busy}>{busy ? "Validando…" : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}<ArrowRight size={17} /></button>
      {mode === "login" && <button type="button" className="reset-link" onClick={resetPassword}><LockKey size={14} />¿Olvidaste tu contraseña?</button>}
    </form>
  );
}
