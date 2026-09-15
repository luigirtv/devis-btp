"use client";
import { useState } from "react";
import { appeler } from "@/lib/api";
import Erreur from "@/components/Erreur";
import type { Client } from "@/lib/types";

const VIDE = { nom: "", type: "particulier" as Client["type"], telephone: "", email: "", adresse: "", code_postal: "", ville: "", siret: "", notes: "" };

/** Formulaire de création / modification d'un client. Appelle `fait(client)` une fois enregistré. */
export default function FormulaireClient({ initial, fait, annuler }: { initial?: Client | null; fait: (c: Client) => void; annuler?: () => void }) {
  const [f, setF] = useState({ ...VIDE, ...(initial ?? {}) });
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const maj = (cle: keyof typeof VIDE) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [cle]: e.target.value });

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    setErreur(null);
    try {
      const { id: _id, archive: _a, ...corps } = f as Client;
      void _id; void _a;
      const c = initial?.id ? await appeler<Client>(`/api/clients/${initial.id}`, "PATCH", corps) : await appeler<Client>("/api/clients", "POST", corps);
      fait(c);
    } catch (err) {
      setErreur((err as Error).message);
      setEnvoi(false);
    }
  }

  return (
    <form onSubmit={enregistrer} className="flex flex-col gap-4">
      <div className="flex gap-2">
        {(["particulier", "professionnel"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setF({ ...f, type: t })} className={`btn-secondaire btn-petit flex-1 ${f.type === t ? "border-accent bg-accent-fond text-accent-fonce" : ""}`}>
            {t === "particulier" ? "Particulier" : "Professionnel"}
          </button>
        ))}
      </div>
      <label>
        <span className="etiquette">{f.type === "particulier" ? "Nom et prénom" : "Nom de l'entreprise"} *</span>
        <input className="champ" value={f.nom} onChange={maj("nom")} required autoFocus placeholder={f.type === "particulier" ? "Ex. Marie Dupont" : "Ex. SCI Les Oliviers"} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="etiquette">Téléphone</span>
          <input className="champ" type="tel" value={f.telephone} onChange={maj("telephone")} placeholder="06 …" />
        </label>
        <label>
          <span className="etiquette">E-mail</span>
          <input className="champ" type="email" value={f.email} onChange={maj("email")} placeholder="pour envoyer les devis" />
        </label>
      </div>
      <label>
        <span className="etiquette">Adresse</span>
        <input className="champ" value={f.adresse} onChange={maj("adresse")} placeholder="Numéro et rue" />
      </label>
      <div className="grid grid-cols-[1fr_2fr] gap-4">
        <label>
          <span className="etiquette">Code postal</span>
          <input className="champ" inputMode="numeric" value={f.code_postal} onChange={maj("code_postal")} />
        </label>
        <label>
          <span className="etiquette">Ville</span>
          <input className="champ" value={f.ville} onChange={maj("ville")} />
        </label>
      </div>
      {f.type === "professionnel" && (
        <label>
          <span className="etiquette">SIRET (obligatoire sur les factures à un professionnel)</span>
          <input className="champ" value={f.siret} onChange={maj("siret")} />
        </label>
      )}
      <label>
        <span className="etiquette">Notes (pour vous, pas sur les documents)</span>
        <textarea className="champ" rows={2} value={f.notes} onChange={maj("notes")} placeholder="Code portail, préférences…" />
      </label>
      <Erreur message={erreur} />
      <div className="flex flex-col gap-3 md:flex-row-reverse">
        <button className="btn-primaire flex-1" disabled={envoi}>{envoi ? "Enregistrement…" : "Enregistrer"}</button>
        {annuler && <button type="button" className="btn-secondaire flex-1" onClick={annuler}>Annuler</button>}
      </div>
    </form>
  );
}
