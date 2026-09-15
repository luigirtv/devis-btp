"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [mdp, setMdp] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  async function connecter(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    setErreur(null);
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email: email.trim(), password: mdp });
    if (error) {
      setErreur("E-mail ou mot de passe incorrect. Vérifiez et réessayez.");
      setEnvoi(false);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <form onSubmit={connecter} className="carte flex flex-col gap-4">
      <label>
        <span className="etiquette">Votre e-mail</span>
        <input className="champ" type="email" autoComplete="username" placeholder="prenom@exemple.fr" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <label>
        <span className="etiquette">Votre mot de passe</span>
        <input className="champ" type="password" autoComplete="current-password" value={mdp} onChange={(e) => setMdp(e.target.value)} required />
      </label>
      {erreur && <p className="rounded-xl bg-erreur-fond px-3 py-2 text-erreur">{erreur}</p>}
      <button className="btn-primaire" disabled={envoi}>{envoi ? "Connexion…" : "Entrer"}</button>
      <p className="text-center text-sm text-muet">Vous restez connecté sur cet appareil.</p>
    </form>
  );
}
