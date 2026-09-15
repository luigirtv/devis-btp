"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { appeler } from "@/lib/api";
import Erreur from "@/components/Erreur";
import { IcoCheck } from "@/components/Icones";
import type { Parametres } from "@/lib/types";

/** Redimensionne une image en data URL (max 600 px) pour la stocker avec les paramètres. */
function lireLogo(fichier: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(fichier);
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(1, 600 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * ratio);
      c.height = Math.round(img.height * ratio);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("Image illisible"));
    img.src = url;
  });
}

type Maj = (cle: keyof Parametres) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;

function Champ({ p, maj, cle, libelle, aide, type = "text", ...rest }: { p: Parametres; maj: Maj; cle: keyof Parametres; libelle: string; aide?: string; type?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="etiquette">{libelle}</span>
      <input className="champ" type={type} value={String(p[cle] ?? "")} onChange={maj(cle)} {...rest} />
      {aide && <span className="mt-1 block text-sm text-muet">{aide}</span>}
    </label>
  );
}

export default function ReglagesClient({ parametres: initial }: { parametres: Parametres }) {
  const router = useRouter();
  const [p, setP] = useState(initial);
  const [erreur, setErreur] = useState<string | null>(null);
  const [etat, setEtat] = useState<"idle" | "envoi" | "ok">("idle");
  const fichier = useRef<HTMLInputElement>(null);
  const maj: Maj = (cle) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setP({ ...p, [cle]: e.target.type === "number" ? Number(e.target.value) : e.target.value });

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    setEtat("envoi");
    setErreur(null);
    try {
      const { owner_id: _o, ...corps } = p;
      void _o;
      await appeler("/api/parametres", "PATCH", corps);
      setEtat("ok");
      router.refresh();
      setTimeout(() => setEtat("idle"), 2500);
    } catch (err) {
      setErreur((err as Error).message);
      setEtat("idle");
    }
  }

  return (
    <form onSubmit={enregistrer} className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-5 md:px-8">
      <p className="text-muet">Ces informations apparaissent sur vos devis et factures. Plusieurs sont obligatoires par la loi.</p>
      <Erreur message={erreur} />

      <section className="carte flex flex-col gap-4">
        <h2 className="text-lg font-bold">Mon entreprise</h2>
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {p.logo_data ? <img src={p.logo_data} alt="Logo" className="h-20 w-32 rounded-xl border border-ligne object-contain" /> : <div className="flex h-20 w-32 items-center justify-center rounded-xl border-2 border-dashed border-ligne text-sm text-muet">Pas de logo</div>}
          <div className="flex flex-col gap-2">
            <button type="button" className="btn-secondaire btn-petit" onClick={() => fichier.current?.click()}>{p.logo_data ? "Changer le logo" : "Ajouter un logo"}</button>
            {p.logo_data && <button type="button" className="text-sm text-erreur" onClick={() => setP({ ...p, logo_data: null })}>Retirer le logo</button>}
            <input ref={fichier} type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setP({ ...p, logo_data: await lireLogo(f) }); e.target.value = ""; }} />
          </div>
        </div>
        <Champ p={p} maj={maj} cle="nom_entreprise" libelle="Nom de l'entreprise *" placeholder="Ex. Rénov' Martin" />
        <Champ p={p} maj={maj} cle="nom_contact" libelle="Votre nom et prénom" placeholder="Ex. Paul Martin" />
        <Champ p={p} maj={maj} cle="adresse" libelle="Adresse" />
        <div className="grid grid-cols-[1fr_2fr] gap-4">
          <Champ p={p} maj={maj} cle="code_postal" libelle="Code postal" inputMode="numeric" />
          <Champ p={p} maj={maj} cle="ville" libelle="Ville" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Champ p={p} maj={maj} cle="telephone" libelle="Téléphone" type="tel" />
          <Champ p={p} maj={maj} cle="email" libelle="E-mail" type="email" aide="Les clients vous répondront à cette adresse." />
        </div>
      </section>

      <section className="carte flex flex-col gap-4">
        <h2 className="text-lg font-bold">Mentions légales</h2>
        <Champ p={p} maj={maj} cle="siret" libelle="SIRET *" placeholder="14 chiffres" />
        <Champ p={p} maj={maj} cle="immatriculation" libelle="Immatriculation" placeholder="Ex. RM 123 456 789 – CMA du Var" aide="Numéro au Répertoire des métiers (ou RCS) et ville, comme sur votre extrait d'immatriculation." />
        <div className="rounded-xl bg-fond p-4">
          <label className="flex items-center gap-3 text-lg">
            <input type="checkbox" className="h-6 w-6 accent-accent" checked={p.assujetti_tva} onChange={(e) => setP({ ...p, assujetti_tva: e.target.checked })} />
            Je facture la TVA
          </label>
          <p className="mt-1 text-sm text-muet">{p.assujetti_tva ? "Chaque ligne aura un taux de TVA (20 %, 10 % rénovation, 5,5 % énergétique)." : "Auto-entrepreneur en franchise : la mention « TVA non applicable, art. 293 B du CGI » est ajoutée automatiquement. Si vous dépassez le plafond de chiffre d'affaires, cochez cette case."}</p>
          {p.assujetti_tva && <div className="mt-3"><Champ p={p} maj={maj} cle="numero_tva" libelle="Numéro de TVA intracommunautaire" placeholder="FR 12 123456789" /></div>}
        </div>
        <Champ p={p} maj={maj} cle="assurance_nom" libelle="Assureur (décennale / RC pro) *" placeholder="Ex. AXA, MAAF, SMABTP…" aide="Obligatoire sur les devis et factures du bâtiment." />
        <div className="grid gap-4 sm:grid-cols-2">
          <Champ p={p} maj={maj} cle="assurance_contrat" libelle="N° de contrat" />
          <Champ p={p} maj={maj} cle="assurance_couverture" libelle="Zone couverte" />
        </div>
      </section>

      <section className="carte flex flex-col gap-4">
        <h2 className="text-lg font-bold">Paiement</h2>
        <Champ p={p} maj={maj} cle="iban" libelle="IBAN" aide="Affiché sur les factures pour le virement." />
        <Champ p={p} maj={maj} cle="bic" libelle="BIC" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Champ p={p} maj={maj} cle="delai_paiement_jours" libelle="Délai de paiement (jours)" type="number" min={0} max={365} />
          <Champ p={p} maj={maj} cle="validite_devis_jours" libelle="Validité des devis (jours)" type="number" min={1} max={365} />
          <Champ p={p} maj={maj} cle="acompte_pourcent" libelle="Acompte habituel (%)" type="number" min={0} max={100} />
        </div>
      </section>

      <section className="carte flex flex-col gap-4">
        <h2 className="text-lg font-bold">Textes en bas des documents</h2>
        <label className="block">
          <span className="etiquette">Sur les devis</span>
          <textarea className="champ" rows={3} value={p.mentions_devis} onChange={maj("mentions_devis")} />
        </label>
        <label className="block">
          <span className="etiquette">Sur les factures</span>
          <textarea className="champ" rows={4} value={p.mentions_facture} onChange={maj("mentions_facture")} />
          <span className="mt-1 block text-sm text-muet">Les pénalités de retard et l'indemnité de 40 € (clients professionnels) sont des mentions obligatoires.</span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <Champ p={p} maj={maj} cle="prefixe_devis" libelle="Préfixe des devis" aide={`Ex. ${p.prefixe_devis || "D"}-${new Date().getFullYear()}-0001`} maxLength={5} />
          <Champ p={p} maj={maj} cle="prefixe_facture" libelle="Préfixe des factures" aide={`Ex. ${p.prefixe_facture || "F"}-${new Date().getFullYear()}-0001`} maxLength={5} />
        </div>
      </section>

      <div className="sticky bottom-20 md:bottom-4">
        <button className={`${etat === "ok" ? "btn-ok" : "btn-primaire"} w-full shadow-lg`} disabled={etat === "envoi"}>
          {etat === "envoi" ? "Enregistrement…" : etat === "ok" ? <><IcoCheck /> Enregistré</> : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
