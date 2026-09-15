"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FormulaireClient from "@/components/FormulaireClient";
import Modale from "@/components/Modale";
import { IcoFleche, IcoLoupe, IcoPlus } from "@/components/Icones";
import type { Client } from "@/lib/types";

export default function ClientsClient({ clients }: { clients: Client[] }) {
  const router = useRouter();
  const [recherche, setRecherche] = useState("");
  const [nouveau, setNouveau] = useState(false);
  const f = recherche.trim().toLowerCase();
  const liste = clients.filter((c) => !c.archive && (!f || c.nom.toLowerCase().includes(f) || c.ville.toLowerCase().includes(f) || c.telephone.includes(f)));
  return (
    <div className="mx-auto max-w-3xl px-4 py-4 md:px-8">
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <IcoLoupe className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muet" />
          <input className="champ pl-12" value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Nom, ville ou téléphone" />
        </div>
      </div>
      {!liste.length && <div className="carte py-10 text-center text-lg text-muet">{clients.length ? "Aucun client ne correspond." : "Aucun client pour l'instant."}</div>}
      <ul className="flex flex-col gap-2">
        {liste.map((c) => (
          <li key={c.id}>
            <Link href={`/clients/${c.id}`} className="carte flex items-center gap-3 hover:border-accent">
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold">{c.nom}</p>
                <p className="truncate text-muet">{[c.ville, c.telephone, c.email].filter(Boolean).join(" · ")}</p>
              </div>
              <IcoFleche className="text-muet" />
            </Link>
          </li>
        ))}
      </ul>
      <button type="button" className="btn-primaire mt-4 w-full sm:w-auto" onClick={() => setNouveau(true)}><IcoPlus /> Nouveau client</button>
      <Modale titre="Nouveau client" ouvert={nouveau} fermer={() => setNouveau(false)}>
        <FormulaireClient fait={(c) => { setNouveau(false); router.push(`/clients/${c.id}`); }} annuler={() => setNouveau(false)} />
      </Modale>
    </div>
  );
}
