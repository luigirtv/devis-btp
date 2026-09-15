import FicheDocument from "@/components/FicheDocument";
import { CLIENTS_EXEMPLE, DEVIS_EXEMPLE, FACTURE_EXEMPLE, PARAMETRES_EXEMPLE } from "@/lib/exemple";

export default async function ApercuFiche({ searchParams }: PageProps<"/apercu/fiche">) {
  const { facture } = (await searchParams) as { facture?: string };
  const d = facture ? FACTURE_EXEMPLE : DEVIS_EXEMPLE;
  const lies = facture
    ? [{ id: DEVIS_EXEMPLE.id, type: "devis", sous_type: "standard", numero: DEVIS_EXEMPLE.numero, statut: "accepte", net_a_payer: DEVIS_EXEMPLE.net_a_payer, date_document: DEVIS_EXEMPLE.date_document }]
    : [];
  return <FicheDocument document={d} client={CLIENTS_EXEMPLE[0]} parametres={PARAMETRES_EXEMPLE} emailConfigure={false} modifiable={!facture} lies={lies} />;
}
