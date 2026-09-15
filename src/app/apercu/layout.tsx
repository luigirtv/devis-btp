import { notFound } from "next/navigation";
import Navigation from "@/components/Navigation";
import { PARAMETRES_EXEMPLE } from "@/lib/exemple";

/** Aperçu des écrans avec des données d'exemple, sans base ni session. Désactivé en production. */
export default function ApercuLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="flex min-h-full flex-1">
      <Navigation nomEntreprise={PARAMETRES_EXEMPLE.nom_entreprise} />
      <main className="min-w-0 flex-1 pb-24 md:pb-8">{children}</main>
    </div>
  );
}
