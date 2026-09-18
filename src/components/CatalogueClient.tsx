"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { appeler } from "@/lib/api";
import Modale, { Confirmation } from "@/components/Modale";
import Erreur from "@/components/Erreur";
import { IcoCrayon, IcoLoupe, IcoPlus, IcoPoubelle } from "@/components/Icones";
import { euros } from "@/lib/format";
import { formatPourcent } from "@/lib/calculs";
import { TAUX_TVA, UNITES, type Nature, type Prestation } from "@/lib/types";

const VIDE = { libelle: "", description: "", unite: "u", prix_unitaire: 0, nature: "main_oeuvre" as Nature, tva: 0 };

export default function CatalogueClient({ prestations, assujettiTva }: { prestations: Prestation[]; assujettiTva: boolean }) {
  const router = useRouter();
  const [recherche, setRecherche] = useState("");
  const [edition, setEdition] = useState<null | Partial<Prestation>>(null);
  const [suppression, setSuppression] = useState<Prestation | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const f = recherche.trim().toLowerCase();
  const liste = prestations.filter((p) => !f || p.libelle.toLowerCase().includes(f));

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    if (!edition) return;
    setEnvoi(true);
    setErreur(null);
    try {
      const { id, ...corps } = edition;
      if (id) await appeler(`/api/prestations/${id}`, "PATCH", corps);
      else await appeler("/api/prestations", "POST", corps);
      setEdition(null);
      router.refresh();
    } catch (err) {
      setErreur((err as Error).message);
    } finally {
      setEnvoi(false);
    }
  }
  async function supprimer() {
    if (!suppression) return;
    setEnvoi(true);
    try {
      await appeler(`/api/prestations/${suppression.id}`, "DELETE");
      setSuppression(null);
      router.refresh();
    } catch (err) {
      setErreur((err as Error).message);
    } finally {
      setEnvoi(false);
    }
  }
  const champ = (cle: keyof typeof VIDE) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setEdition({ ...edition, [cle]: e.target.type === "number" ? Number(e.target.value) : e.target.value });

  return (
    <div className="mx-auto max-w-3xl px-4 py-4 md:px-8">
      <p className="mb-4 text-muet">Vos travaux et fournitures habituels, avec leur prix. Dans un devis, un appui suffit pour les ajouter.</p>
      <Erreur message={erreur} />
      <div className="my-4 flex gap-2">
        <div className="relative flex-1">
          <IcoLoupe className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muet" />
          <input className="champ pl-12" value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher" />
        </div>
        <button type="button" className="btn-primaire" onClick={() => setEdition({ ...VIDE, tva: assujettiTva ? 20 : 0 })}><IcoPlus /> <span className="hidden sm:inline">Ajouter</span></button>
      </div>
      {!liste.length && <div className="carte py-10 text-center text-lg text-muet">{prestations.length ? "Rien ne correspond." : "Votre catalogue est vide. Ajoutez votre première prestation."}</div>}
      <ul className="flex flex-col gap-2">
        {liste.map((p) => (
          <li key={p.id} className="carte flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold">{p.libelle}</p>
              {(assujettiTva || p.description) && <p className="text-sm text-muet">{[assujettiTva ? `TVA ${formatPourcent(Number(p.tva))}` : "", p.description].filter(Boolean).join(" · ")}</p>}
            </div>
            <p className="shrink-0 text-lg font-bold tabular-nums">{euros(p.prix_unitaire)} <span className="text-sm font-normal text-muet">/ {p.unite}</span></p>
            <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full bg-fond text-muet hover:text-encre" onClick={() => setEdition({ ...p, prix_unitaire: Number(p.prix_unitaire), tva: Number(p.tva) })} aria-label="Modifier"><IcoCrayon /></button>
            <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full bg-fond text-muet hover:text-erreur" onClick={() => setSuppression(p)} aria-label="Supprimer"><IcoPoubelle /></button>
          </li>
        ))}
      </ul>

      <Modale titre={edition?.id ? "Modifier la prestation" : "Nouvelle prestation"} ouvert={edition !== null} fermer={() => setEdition(null)}>
        {edition && (
          <form onSubmit={enregistrer} className="flex flex-col gap-4">
            <label>
              <span className="etiquette">Libellé *</span>
              <input className="champ" value={edition.libelle ?? ""} onChange={champ("libelle")} required autoFocus placeholder="Ex. Pose de carrelage sol" />
            </label>
            <label>
              <span className="etiquette">Détail (facultatif)</span>
              <input className="champ" value={edition.description ?? ""} onChange={champ("description")} placeholder="Ex. Pose droite, joints compris" />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label>
                <span className="etiquette">Prix{assujettiTva ? " HT" : ""}</span>
                <input className="champ" type="number" inputMode="decimal" step="0.01" min="0" value={edition.prix_unitaire ?? 0} onChange={champ("prix_unitaire")} onFocus={(e) => e.target.select()} />
              </label>
              <label>
                <span className="etiquette">Par</span>
                <select className="champ" value={edition.unite ?? "u"} onChange={champ("unite")}>
                  {UNITES.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </label>
            </div>
            {assujettiTva && (
              <label>
                <span className="etiquette">TVA</span>
                <select className="champ" value={edition.tva ?? 20} onChange={champ("tva")}>
                  {TAUX_TVA.map((t) => <option key={t} value={t}>{formatPourcent(t)}</option>)}
                </select>
              </label>
            )}
            <div className="flex flex-col gap-3 md:flex-row-reverse">
              <button className="btn-primaire flex-1" disabled={envoi}>{envoi ? "Enregistrement…" : "Enregistrer"}</button>
              <button type="button" className="btn-secondaire flex-1" onClick={() => setEdition(null)}>Annuler</button>
            </div>
          </form>
        )}
      </Modale>
      <Confirmation ouvert={suppression !== null} titre="Retirer cette prestation ?" message={<>« {suppression?.libelle} » disparaîtra du catalogue. Les devis déjà faits ne changent pas.</>} libelleOui="Oui, retirer" danger enCours={envoi} oui={supprimer} non={() => setSuppression(null)} />
    </div>
  );
}
