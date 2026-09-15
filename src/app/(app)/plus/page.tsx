import Link from "next/link";
import EnTete from "@/components/EnTete";
import { SECONDAIRES } from "@/components/Navigation";
import { IcoFleche } from "@/components/Icones";

export default function Plus() {
  return (
    <div>
      <EnTete titre="Plus" />
      <div className="mx-auto flex max-w-3xl flex-col gap-2 px-4 py-4">
        {SECONDAIRES.map(({ href, libelle, Ico }) => (
          <Link key={href} href={href} className="carte flex items-center gap-3 text-lg font-semibold hover:border-accent">
            <Ico className="text-accent" width={26} height={26} /> <span className="flex-1">{libelle}</span> <IcoFleche className="text-muet" />
          </Link>
        ))}
        <form action="/api/auth/logout" method="post" className="mt-6">
          <button className="btn-secondaire w-full">Se déconnecter</button>
        </form>
      </div>
    </div>
  );
}
