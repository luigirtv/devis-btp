import EnTete from "@/components/EnTete";
import CatalogueClient from "@/components/CatalogueClient";
import { PRESTATIONS_EXEMPLE } from "@/lib/exemple";

export default function ApercuCatalogue() {
  return (
    <div>
      <EnTete titre="Mes prestations" />
      <CatalogueClient prestations={PRESTATIONS_EXEMPLE} assujettiTva={false} />
    </div>
  );
}
