import Link from "next/link";
import { chargerParametres, exigerSession } from "@/lib/acces";
import BoutonNouveau from "@/components/BoutonNouveau";
import ListeDocuments from "@/components/ListeDocuments";
import { IcoFleche, IcoReglages } from "@/components/Icones";
import { enRetard, euros } from "@/lib/format";
import type { DocumentAvecClient } from "@/lib/types";

export default async function Accueil() {
  const { supabase } = await exigerSession();
  const [p, { data: recents }, { data: devisAttente }, { data: facturesDues }] = await Promise.all([
    chargerParametres(),
    supabase.from("documents").select("id, type, sous_type, numero, statut, objet, date_document, date_echeance, net_a_payer, clients(id, nom, email, type)").order("updated_at", { ascending: false }).limit(8),
    supabase.from("documents").select("net_a_payer").eq("type", "devis").eq("statut", "envoye"),
    supabase.from("documents").select("net_a_payer, date_echeance").eq("type", "facture").eq("statut", "envoyee")
  ]);
  const attente = (devisAttente ?? []) as { net_a_payer: number }[];
  const dues = (facturesDues ?? []) as { net_a_payer: number; date_echeance: string | null }[];
  const retard = dues.filter((f) => enRetard(f.date_echeance));
  const somme = (l: { net_a_payer: number }[]) => l.reduce((s, x) => s + Number(x.net_a_payer), 0);
  const heure = new Date().getHours();
  const salut = heure < 18 ? "Bonjour" : "Bonsoir";

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8">
      <h1 className="text-3xl font-bold">{salut}{p.nom_contact ? ` ${p.nom_contact.split(" ")[0]}` : ""}</h1>
      <p className="mb-6 text-lg text-muet">Que voulez-vous faire ?</p>

      {!p.nom_entreprise && (
        <Link href="/reglages" className="carte mb-6 flex items-center gap-3 border-accent bg-accent-fond">
          <IcoReglages className="shrink-0 text-accent" width={30} height={30} />
          <div className="flex-1">
            <p className="font-bold">Commencez par renseigner votre entreprise</p>
            <p className="text-muet">Nom, adresse, SIRET, assurance : ils apparaissent sur vos devis et factures.</p>
          </div>
          <IcoFleche className="text-accent" />
        </Link>
      )}

      <div className="mb-8 flex gap-3">
        <BoutonNouveau type="devis" grand />
        <BoutonNouveau type="facture" grand className="btn-secondaire" />
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        <Link href="/devis?statut=envoye" className="carte hover:border-accent">
          <p className="etiquette">Devis en attente de réponse</p>
          <p className="text-3xl font-bold">{attente.length}</p>
          <p className="text-muet">{euros(somme(attente))}</p>
        </Link>
        <Link href="/factures?statut=envoyee" className={`carte hover:border-accent ${retard.length ? "border-alerte" : ""}`}>
          <p className="etiquette">Factures à encaisser</p>
          <p className="text-3xl font-bold">{euros(somme(dues))}</p>
          <p className={retard.length ? "font-semibold text-alerte" : "text-muet"}>
            {dues.length} facture{dues.length > 1 ? "s" : ""}{retard.length ? ` · ${retard.length} en retard` : ""}
          </p>
        </Link>
      </div>

      <h2 className="mb-3 text-xl font-bold">Derniers documents</h2>
      <ListeDocuments documents={(recents ?? []) as unknown as DocumentAvecClient[]} vide="Aucun document pour l'instant. Créez votre premier devis ci-dessus." />
    </div>
  );
}
