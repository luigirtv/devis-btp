import Link from "next/link";
import EnTete from "@/components/EnTete";
import BoutonNouveau from "@/components/BoutonNouveau";
import ListeDocuments from "@/components/ListeDocuments";
import { IcoLoupe } from "@/components/Icones";
import { exigerSession } from "@/lib/acces";
import type { DocumentAvecClient, TypeDocument } from "@/lib/types";

const FILTRES: Record<TypeDocument, { valeur: string; libelle: string }[]> = {
  devis: [
    { valeur: "", libelle: "Tous" },
    { valeur: "brouillon", libelle: "Brouillons" },
    { valeur: "envoye", libelle: "En attente" },
    { valeur: "accepte", libelle: "Acceptés" },
    { valeur: "refuse", libelle: "Refusés" }
  ],
  facture: [
    { valeur: "", libelle: "Toutes" },
    { valeur: "brouillon", libelle: "Brouillons" },
    { valeur: "envoyee", libelle: "À encaisser" },
    { valeur: "payee", libelle: "Payées" },
    { valeur: "annulee", libelle: "Annulées" }
  ]
};

/** Page de liste (devis ou factures) avec filtres par statut et recherche. */
export default async function PageListe({ type, searchParams }: { type: TypeDocument; searchParams: Promise<{ statut?: string; q?: string }> }) {
  const { statut = "", q = "" } = await searchParams;
  const { supabase } = await exigerSession();
  let requete = supabase.from("documents").select("*, clients(id, nom, email, type)").eq("type", type).order("date_document", { ascending: false }).order("created_at", { ascending: false }).limit(200);
  if (statut) requete = requete.eq("statut", statut);
  if (q.trim()) requete = requete.or(`objet.ilike.%${q.trim()}%,numero.ilike.%${q.trim()}%`);
  const { data } = await requete;
  let documents = (data ?? []) as unknown as DocumentAvecClient[];
  // La recherche par nom de client se fait ici (jointure non filtrable simplement côté PostgREST).
  if (q.trim()) {
    const { data: parClient } = await supabase.from("documents").select("*, clients!inner(id, nom, email, type)").eq("type", type).ilike("clients.nom", `%${q.trim()}%`).limit(200);
    const ids = new Set(documents.map((d) => d.id));
    for (const d of (parClient ?? []) as unknown as DocumentAvecClient[]) if (!ids.has(d.id) && (!statut || d.statut === statut)) documents.push(d);
    documents = documents.sort((a, b) => (a.date_document < b.date_document ? 1 : -1));
  }
  const base = type === "devis" ? "/devis" : "/factures";
  const titre = type === "devis" ? "Mes devis" : "Mes factures";

  return (
    <div>
      <EnTete titre={titre} droite={<BoutonNouveau type={type} className="btn-primaire btn-petit" />} />
      <div className="mx-auto max-w-3xl px-4 py-4 md:px-8">
        <form className="mb-3 flex gap-2" action={base}>
          {statut && <input type="hidden" name="statut" value={statut} />}
          <div className="relative flex-1">
            <IcoLoupe className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muet" />
            <input name="q" defaultValue={q} className="champ pl-12" placeholder="Rechercher un client, un chantier…" />
          </div>
          <button className="btn-secondaire px-4">OK</button>
        </form>
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {FILTRES[type].map((f) => (
            <Link key={f.valeur} href={`${base}${f.valeur ? `?statut=${f.valeur}` : ""}${q ? `${f.valeur ? "&" : "?"}q=${encodeURIComponent(q)}` : ""}`} className={`pastille shrink-0 px-4 py-2 text-base ${statut === f.valeur ? "bg-marine text-white" : "border border-ligne bg-carte text-encre"}`}>
              {f.libelle}
            </Link>
          ))}
        </div>
        <ListeDocuments documents={documents} vide={q ? "Rien ne correspond à votre recherche." : type === "devis" ? "Aucun devis ici." : "Aucune facture ici."} />
      </div>
    </div>
  );
}
