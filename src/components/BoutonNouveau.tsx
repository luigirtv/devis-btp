"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { appeler } from "@/lib/api";
import { IcoPlus } from "@/components/Icones";

/** Crée un brouillon et ouvre l'éditeur. */
export default function BoutonNouveau({ type, clientId, libelle, className = "btn-primaire", grand = false }: { type: "devis" | "facture"; clientId?: string; libelle?: string; className?: string; grand?: boolean }) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  async function creer() {
    setEnCours(true);
    setErreur(null);
    try {
      const { id } = await appeler<{ id: string }>("/api/documents", "POST", { type, client_id: clientId ?? null });
      router.push(`/documents/${id}/modifier`);
    } catch (e) {
      setErreur((e as Error).message);
      setEnCours(false);
    }
  }
  return (
    <div className={grand ? "flex-1" : ""}>
      <button type="button" onClick={creer} disabled={enCours} className={`${className} ${grand ? "min-h-24 w-full flex-col gap-1 text-xl" : ""}`}>
        <IcoPlus width={grand ? 30 : 22} height={grand ? 30 : 22} />
        {enCours ? "Un instant…" : libelle ?? (type === "devis" ? "Nouveau devis" : "Nouvelle facture")}
      </button>
      {erreur && <p className="mt-1 text-sm text-erreur">{erreur}</p>}
    </div>
  );
}
