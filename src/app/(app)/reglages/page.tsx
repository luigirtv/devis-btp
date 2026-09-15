import EnTete from "@/components/EnTete";
import ReglagesClient from "@/components/ReglagesClient";
import { chargerParametres } from "@/lib/acces";

export default async function Reglages() {
  const p = await chargerParametres();
  return (
    <div>
      <EnTete titre="Mon entreprise" />
      <ReglagesClient parametres={p} />
    </div>
  );
}
