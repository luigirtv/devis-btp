import { notFound, redirect } from "next/navigation";
import EditeurDocument from "@/components/EditeurDocument";
import { AccesRefuse, chargerParametres, exigerSession } from "@/lib/acces";
import { chargerDocument, modifiable } from "@/lib/documents";
import type { Client, Prestation } from "@/lib/types";

export default async function Modifier({ params }: PageProps<"/documents/[id]/modifier">) {
  const { id } = await params;
  const { supabase } = await exigerSession();
  let p, doc, clients, prestations;
  try {
    [p, doc, { data: clients }, { data: prestations }] = await Promise.all([
      chargerParametres(),
      chargerDocument(supabase, id),
      supabase.from("clients").select("*").order("nom"),
      supabase.from("prestations").select("*").eq("actif", true).order("libelle")
    ]);
  } catch (e) {
    if (e instanceof AccesRefuse && e.status === 404) notFound();
    throw e;
  }
  if (!modifiable(doc)) redirect(`/documents/${id}`);
  return <EditeurDocument document={doc} clients={(clients ?? []) as Client[]} prestations={(prestations ?? []) as Prestation[]} parametres={p} />;
}
