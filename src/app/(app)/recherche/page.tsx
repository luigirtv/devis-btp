import Link from "next/link";
import EnTete from "@/components/EnTete";
import ListeDocuments from "@/components/ListeDocuments";
import { IcoFleche, IcoLoupe } from "@/components/Icones";
import { exigerSession } from "@/lib/acces";
import { rechercherClients, rechercherDocuments } from "@/lib/recherche";

/** Recherche unique : clients, devis et factures d'un seul coup. */
export default async function Recherche({ searchParams }: PageProps<"/recherche">) {
  const { q = "" } = (await searchParams) as { q?: string };
  const { supabase } = await exigerSession();
  const [clients, documents] = q.trim() ? await Promise.all([rechercherClients(supabase, q), rechercherDocuments(supabase, q)]) : [[], []];
  const devis = documents.filter((d) => d.type === "devis");
  const factures = documents.filter((d) => d.type === "facture");

  return (
    <div>
      <EnTete titre="Rechercher" retour="/" retourLibelle="Accueil" />
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-4 md:px-8">
        <form action="/recherche" className="flex gap-2">
          <div className="relative flex-1">
            <IcoLoupe className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muet" />
            <input name="q" defaultValue={q} className="champ pl-12" placeholder="Nom du client, chantier, numéro…" autoFocus={!q} />
          </div>
          <button className="btn-primaire px-5">Chercher</button>
        </form>

        {!q.trim() && <p className="text-lg text-muet">Tapez un nom de client, un mot du chantier ou un numéro de devis ou de facture.</p>}
        {q.trim() && !clients.length && !documents.length && <div className="carte py-10 text-center text-lg text-muet">Rien trouvé pour « {q} ». Essayez avec moins de lettres.</div>}

        {clients.length > 0 && (
          <section>
            <h2 className="mb-3 text-xl font-bold">Clients</h2>
            <ul className="flex flex-col gap-2">
              {clients.map((c) => (
                <li key={c.id}>
                  <Link href={`/clients/${c.id}`} className="carte flex items-center gap-3 hover:border-accent">
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-bold">{c.nom}</p>
                      <p className="truncate text-muet">{[c.ville, c.telephone].filter(Boolean).join(" · ")}</p>
                    </div>
                    <IcoFleche className="text-muet" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        {devis.length > 0 && <section><h2 className="mb-3 text-xl font-bold">Devis</h2><ListeDocuments documents={devis} vide="" /></section>}
        {factures.length > 0 && <section><h2 className="mb-3 text-xl font-bold">Factures</h2><ListeDocuments documents={factures} vide="" /></section>}
      </div>
    </div>
  );
}
