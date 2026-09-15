import Link from "next/link";
import BadgeStatut from "@/components/BadgeStatut";
import { IcoFleche } from "@/components/Icones";
import { dateFr, euros, titreDocument } from "@/lib/format";
import type { DocumentAvecClient } from "@/lib/types";

/** Liste de devis ou de factures : une grosse ligne cliquable par document. */
export default function ListeDocuments({ documents, vide }: { documents: DocumentAvecClient[]; vide: React.ReactNode }) {
  if (!documents.length) return <div className="carte py-10 text-center text-lg text-muet">{vide}</div>;
  return (
    <ul className="flex flex-col gap-2">
      {documents.map((d) => (
        <li key={d.id}>
          <Link href={`/documents/${d.id}`} className="carte flex items-center gap-3 transition hover:border-accent">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold">{titreDocument(d)}</span>
                <BadgeStatut statut={d.statut} echeance={d.date_echeance} />
              </div>
              <p className="truncate text-lg">{d.clients?.nom ?? <span className="text-muet">Sans client</span>}{d.objet && <span className="text-muet"> · {d.objet}</span>}</p>
              <p className="text-sm text-muet">{dateFr(d.date_document)}</p>
            </div>
            <div className="text-right text-lg font-bold tabular-nums">{euros(d.net_a_payer)}</div>
            <IcoFleche className="shrink-0 text-muet" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
