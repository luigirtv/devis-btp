import Link from "next/link";
import EnTete from "@/components/EnTete";
import ListeDocuments from "@/components/ListeDocuments";
import { DEVIS_EXEMPLE, FACTURE_EXEMPLE } from "@/lib/exemple";

export default function Apercu() {
  return (
    <div>
      <EnTete titre="Aperçu (données d'exemple)" />
      <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-4">
        {[["/apercu/editeur", "Éditeur de devis"], ["/apercu/fiche", "Fiche d'un devis envoyé"], ["/apercu/fiche?email=1", "Fiche avec envoi en un clic"], ["/apercu/fiche?facture=1", "Fiche d'une facture de solde"], ["/apercu/pdf", "PDF du devis"], ["/apercu/pdf?facture=1", "PDF de la facture"], ["/apercu/reglages", "Réglages"], ["/apercu/catalogue", "Catalogue"]].map(([href, l]) => (
          <Link key={href} href={href} className="carte font-semibold hover:border-accent">{l}</Link>
        ))}
        <ListeDocuments documents={[DEVIS_EXEMPLE, FACTURE_EXEMPLE]} vide="" />
      </div>
    </div>
  );
}
