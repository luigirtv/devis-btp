"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IcoCasque, IcoCatalogue, IcoClients, IcoDevis, IcoFacture, IcoMaison, IcoReglages } from "@/components/Icones";

const ONGLETS = [
  { href: "/", libelle: "Accueil", Ico: IcoMaison },
  { href: "/devis", libelle: "Devis", Ico: IcoDevis },
  { href: "/factures", libelle: "Factures", Ico: IcoFacture },
  { href: "/clients", libelle: "Clients", Ico: IcoClients }
];
const SECONDAIRES = [
  { href: "/catalogue", libelle: "Mes prestations", Ico: IcoCatalogue },
  { href: "/reglages", libelle: "Mon entreprise", Ico: IcoReglages }
];

function actif(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Barre latérale sur grand écran, barre du bas sur téléphone. */
export default function Navigation({ nomEntreprise }: { nomEntreprise: string }) {
  const pathname = usePathname();
  const tous = [...ONGLETS, ...SECONDAIRES];
  return (
    <>
      <aside className="no-print hidden w-64 shrink-0 flex-col bg-marine text-white md:flex">
        <Link href="/" className="flex items-center gap-3 px-5 py-5">
          <IcoCasque width={28} height={28} />
          <div className="min-w-0">
            <p className="truncate text-base font-bold leading-tight">{nomEntreprise || "Mon entreprise"}</p>
            <p className="text-xs text-white/60">Devis et factures</p>
          </div>
        </Link>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {tous.map(({ href, libelle, Ico }, i) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-lg font-medium transition ${actif(pathname, href) ? "bg-white/15 text-white" : "text-white/75 hover:bg-white/10 hover:text-white"} ${i === ONGLETS.length ? "mt-4" : ""}`}
            >
              <Ico />
              {libelle}
            </Link>
          ))}
        </nav>
        <form action="/api/auth/logout" method="post" className="px-5 py-4">
          <button className="text-sm text-white/60 hover:text-white">Se déconnecter</button>
        </form>
      </aside>

      <nav className="no-print fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-ligne bg-carte md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {[...ONGLETS, { href: "/plus", libelle: "Plus", Ico: IcoReglages }].map(({ href, libelle, Ico }) => {
          const on = href === "/plus" ? SECONDAIRES.some((s) => actif(pathname, s.href)) || pathname === "/plus" : actif(pathname, href);
          return (
            <Link key={href} href={href} className={`flex flex-col items-center gap-0.5 py-2 text-xs font-semibold ${on ? "text-accent" : "text-muet"}`}>
              <Ico width={26} height={26} />
              {libelle}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export { SECONDAIRES };
