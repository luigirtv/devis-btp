import { notFound } from "next/navigation";
import EnTete from "@/components/EnTete";
import FicheClient from "@/components/FicheClient";
import { exigerSession } from "@/lib/acces";
import type { Client, DocumentAvecClient } from "@/lib/types";

export default async function PageClient({ params }: PageProps<"/clients/[id]">) {
  const { id } = await params;
  const { supabase } = await exigerSession();
  const [{ data: client }, { data: documents }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).maybeSingle(),
    supabase.from("documents").select("*, clients(id, nom, email, type)").eq("client_id", id).order("date_document", { ascending: false })
  ]);
  if (!client) notFound();
  return (
    <div>
      <EnTete titre={client.nom} retour="/clients" retourLibelle="Mes clients" />
      <FicheClient client={client as Client} documents={(documents ?? []) as unknown as DocumentAvecClient[]} />
    </div>
  );
}
