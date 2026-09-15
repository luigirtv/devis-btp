import { redirect } from "next/navigation";
import Navigation from "@/components/Navigation";
import { chargerParametres, AccesRefuse } from "@/lib/acces";

export const dynamic = "force-dynamic";

export default async function CoqueLayout({ children }: { children: React.ReactNode }) {
  let nom = "";
  try {
    nom = (await chargerParametres()).nom_entreprise;
  } catch (e) {
    if (e instanceof AccesRefuse) redirect("/login");
    throw e;
  }
  return (
    <div className="flex min-h-full flex-1">
      <Navigation nomEntreprise={nom} />
      <main className="min-w-0 flex-1 pb-24 md:pb-8">{children}</main>
    </div>
  );
}
