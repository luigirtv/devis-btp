import { notFound } from "next/navigation";
import FicheDocument from "@/components/FicheDocument";
import { AccesRefuse, chargerParametres, exigerSession } from "@/lib/acces";
import { chargerDocument, modifiable } from "@/lib/documents";
import { emailConfigure } from "@/lib/email";
import { clientDuDocument } from "@/lib/pdf/generer";

export default async function Fiche({ params }: PageProps<"/documents/[id]">) {
  const { id } = await params;
  const { supabase } = await exigerSession();
  const p = await chargerParametres();
  let doc;
  try {
    doc = await chargerDocument(supabase, id);
  } catch (e) {
    if (e instanceof AccesRefuse && e.status === 404) notFound();
    throw e;
  }
  const client = await clientDuDocument(supabase, doc);
  const colonnes = "id, type, sous_type, numero, statut, net_a_payer, date_document";
  const lies = doc.type === "devis"
    ? (await supabase.from("documents").select(colonnes).eq("devis_id", doc.id).order("created_at")).data ?? []
    : [
        ...(doc.devis_id ? (await supabase.from("documents").select(colonnes).eq("id", doc.devis_id)).data ?? [] : []),
        ...(doc.facture_origine_id ? (await supabase.from("documents").select(colonnes).eq("id", doc.facture_origine_id)).data ?? [] : []),
        ...((await supabase.from("documents").select(colonnes).eq("facture_origine_id", doc.id)).data ?? []),
        ...(doc.devis_id ? ((await supabase.from("documents").select(colonnes).eq("devis_id", doc.devis_id).neq("id", doc.id)).data ?? []) : [])
      ];
  return <FicheDocument document={doc} client={client} parametres={p} emailConfigure={emailConfigure()} modifiable={modifiable(doc)} lies={lies} />;
}
