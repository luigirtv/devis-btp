import EnTete from "@/components/EnTete";
import ReglagesClient from "@/components/ReglagesClient";
import { PARAMETRES_EXEMPLE } from "@/lib/exemple";

export default function ApercuReglages() {
  return (
    <div>
      <EnTete titre="Mon entreprise" />
      <ReglagesClient parametres={PARAMETRES_EXEMPLE} />
    </div>
  );
}
