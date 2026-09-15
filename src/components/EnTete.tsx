import Link from "next/link";
import { IcoRetour } from "@/components/Icones";

/** Bandeau de page : titre, sous-titre, lien retour et actions à droite. */
export default function EnTete({ titre, sousTitre, retour, retourLibelle = "Retour", droite }: { titre: string; sousTitre?: React.ReactNode; retour?: string; retourLibelle?: string; droite?: React.ReactNode }) {
  return (
    <header className="no-print sticky top-0 z-10 border-b border-ligne bg-carte/95 px-4 py-3 backdrop-blur md:px-8" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
      {retour && (
        <Link href={retour} className="mb-1 inline-flex items-center gap-1 text-base font-semibold text-accent">
          <IcoRetour width={20} height={20} /> {retourLibelle}
        </Link>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold leading-tight md:text-3xl">{titre}</h1>
          {sousTitre && <div className="mt-0.5 text-base text-muet">{sousTitre}</div>}
        </div>
        {droite && <div className="flex shrink-0 flex-wrap gap-2">{droite}</div>}
      </div>
    </header>
  );
}
