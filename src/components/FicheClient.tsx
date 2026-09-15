"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { appeler } from "@/lib/api";
import FormulaireClient from "@/components/FormulaireClient";
import BoutonNouveau from "@/components/BoutonNouveau";
import ListeDocuments from "@/components/ListeDocuments";
import Modale, { Confirmation } from "@/components/Modale";
import Erreur from "@/components/Erreur";
import { IcoCrayon, IcoPoubelle } from "@/components/Icones";
import type { Client, DocumentAvecClient } from "@/lib/types";

export default function FicheClient({ client: initial, documents }: { client: Client; documents: DocumentAvecClient[] }) {
  const router = useRouter();
  const [client, setClient] = useState(initial);
  const [edition, setEdition] = useState(false);
  const [suppression, setSuppression] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function supprimer() {
    setEnCours(true);
    try {
      await appeler(`/api/clients/${client.id}`, "DELETE");
      router.push("/clients");
    } catch (e) {
      setErreur((e as Error).message);
      setEnCours(false);
      setSuppression(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-5 md:px-8">
      <Erreur message={erreur} />
      <section className="carte">
        <p className="text-muet">{client.type === "professionnel" ? "Professionnel" : "Particulier"}</p>
        {(client.adresse || client.ville) && <p className="text-lg">{[client.adresse, `${client.code_postal} ${client.ville}`.trim()].filter(Boolean).join(", ")}</p>}
        {client.telephone && <p className="text-lg"><a className="text-accent" href={`tel:${client.telephone}`}>{client.telephone}</a></p>}
        {client.email && <p className="text-lg"><a className="text-accent" href={`mailto:${client.email}`}>{client.email}</a></p>}
        {client.siret && <p className="text-muet">SIRET {client.siret}</p>}
        {client.notes && <p className="mt-2 rounded-xl bg-fond px-3 py-2 text-muet">{client.notes}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn-secondaire btn-petit" onClick={() => setEdition(true)}><IcoCrayon /> Modifier</button>
          <button type="button" className="btn-danger btn-petit" onClick={() => setSuppression(true)}><IcoPoubelle /> Supprimer</button>
        </div>
      </section>
      <div className="flex gap-3">
        <BoutonNouveau type="devis" clientId={client.id} grand />
        <BoutonNouveau type="facture" clientId={client.id} grand className="btn-secondaire" />
      </div>
      <section>
        <h2 className="mb-3 text-xl font-bold">Ses devis et factures</h2>
        <ListeDocuments documents={documents} vide="Aucun document pour ce client." />
      </section>
      <Modale titre="Modifier le client" ouvert={edition} fermer={() => setEdition(false)}>
        <FormulaireClient initial={client} fait={(c) => { setClient(c); setEdition(false); router.refresh(); }} annuler={() => setEdition(false)} />
      </Modale>
      <Confirmation ouvert={suppression} titre="Supprimer ce client ?" message={documents.length ? "Ce client a des documents : il sera seulement retiré de la liste, ses devis et factures sont conservés." : "Le client sera définitivement supprimé."} libelleOui="Oui, supprimer" danger enCours={enCours} oui={supprimer} non={() => setSuppression(false)} />
    </div>
  );
}
