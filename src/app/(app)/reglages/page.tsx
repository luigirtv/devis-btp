import EnTete from "@/components/EnTete";
import ReglagesClient from "@/components/ReglagesClient";
import { chargerParametresComplets } from "@/lib/acces";

export default async function Reglages() {
  const p = await chargerParametresComplets();
  return (
    <div>
      <EnTete titre="Mon entreprise" />
      <ReglagesClient parametres={p} />
    </div>
  );
}
