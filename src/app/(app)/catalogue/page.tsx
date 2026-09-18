import EnTete from "@/components/EnTete";
import CatalogueClient from "@/components/CatalogueClient";
import { chargerParametres, exigerSession } from "@/lib/acces";
import type { Prestation } from "@/lib/types";

export default async function Catalogue() {
  const { supabase } = await exigerSession();
  const [p, { data }] = await Promise.all([chargerParametres(), supabase.from("prestations").select("*").order("libelle")]);
  return (
    <div>
      <EnTete titre="Mes prestations" />
      <CatalogueClient prestations={(data ?? []) as Prestation[]} assujettiTva={p.assujetti_tva} />
    </div>
  );
}
