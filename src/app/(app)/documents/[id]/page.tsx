import { notFound } from "next/navigation";
import FicheDocument from "@/components/FicheDocument";
import { AccesRefuse, chargerParametres, exigerSession } from "@/lib/acces";
import { chargerDocument, modifiable } from "@/lib/documents";
import { emailConfigure } from "@/lib/email";
import { clientDuDocument } from "@/lib/pdf/generer";

type Lie = { id: string; type: string; sous_type: string; numero: string | null; statut: string; net_a_payer: number; date_document: string };

export default async function Fiche({ params }: PageProps<"/documents/[id]">) {
  const { id } = await params;
  const { supabase } = await exigerSession();
  let doc, p;
  try {
    [p, doc] = await Promise.all([chargerParametres(), chargerDocument(supabase, id)]);
  } catch (e) {
    if (e instanceof AccesRefuse && e.status === 404) notFound();
    throw e;
  }
  const colonnes = "id, type, sous_type, numero, statut, net_a_payer, date_document";
  const rien = Promise.resolve({ data: [] as Lie[] });
  const lire = (q: PromiseLike<{ data: unknown }>) => Promise.resolve(q).then((r) => ({ data: (r.data ?? []) as Lie[] }));
  const docs = () => supabase.from("documents").select(colonnes);
  const [client, ...groupes] = await Promise.all([
    clientDuDocument(supabase, doc),
    ...(doc.type === "devis"
      ? [lire(docs().eq("devis_id", doc.id).order("created_at"))]
      : [
          doc.devis_id ? lire(docs().eq("id", doc.devis_id)) : rien,
          doc.facture_origine_id ? lire(docs().eq("id", doc.facture_origine_id)) : rien,
          lire(docs().eq("facture_origine_id", doc.id)),
          doc.devis_id ? lire(docs().eq("devis_id", doc.devis_id).neq("id", doc.id)) : rien
        ])
  ]);
  const lies = groupes.flatMap((g) => g.data);
  return <FicheDocument document={doc} client={client} parametres={p} emailConfigure={emailConfigure()} modifiable={modifiable(doc)} lies={lies} />;
}
