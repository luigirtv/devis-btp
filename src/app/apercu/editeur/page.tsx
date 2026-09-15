import EditeurDocument from "@/components/EditeurDocument";
import { CLIENTS_EXEMPLE, DEVIS_EXEMPLE, PARAMETRES_EXEMPLE, PRESTATIONS_EXEMPLE } from "@/lib/exemple";

export default function ApercuEditeur() {
  return <EditeurDocument document={{ ...DEVIS_EXEMPLE, numero: null, statut: "brouillon" }} clients={CLIENTS_EXEMPLE} prestations={PRESTATIONS_EXEMPLE} parametres={PARAMETRES_EXEMPLE} />;
}
