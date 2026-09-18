import Link from "next/link";
import { chargerParametres, exigerSession } from "@/lib/acces";
import BoutonNouveau from "@/components/BoutonNouveau";
import ListeDocuments from "@/components/ListeDocuments";
import { IcoFleche, IcoLoupe, IcoReglages } from "@/components/Icones";
import type { DocumentAvecClient } from "@/lib/types";

export default async function Accueil() {
  const { supabase } = await exigerSession();
  const [p, { data: recents }] = await Promise.all([
    chargerParametres(),
    supabase.from("documents").select("id, type, sous_type, numero, statut, objet, date_document, date_echeance, net_a_payer, clients(id, nom, email, type)").order("updated_at", { ascending: false }).limit(10)
  ]);
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

      <form action="/recherche" className="mb-8">
        <label className="etiquette" htmlFor="q">Retrouver un devis, une facture ou un client</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <IcoLoupe className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muet" />
            <input id="q" name="q" className="champ pl-12" placeholder="Nom du client, chantier, numéro…" />
          </div>
          <button className="btn-secondaire px-5">Chercher</button>
        </div>
      </form>

      <h2 className="mb-3 text-xl font-bold">Derniers documents</h2>
      <ListeDocuments documents={(recents ?? []) as unknown as DocumentAvecClient[]} vide="Aucun document pour l'instant. Créez votre premier devis ci-dessus." />
    </div>
  );
}
