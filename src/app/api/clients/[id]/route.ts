import { exigerSession, reponseErreur } from "@/lib/acces";
import { messageZod, schemaClient } from "@/lib/schemas";

export async function PATCH(request: Request, { params }: RouteContext<"/api/clients/[id]">) {
  try {
    const { id } = await params;
    const { supabase } = await exigerSession();
    const corps = schemaClient.partial().safeParse(await request.json());
    if (!corps.success) return Response.json({ error: messageZod(corps.error) }, { status: 400 });
    const { data, error } = await supabase.from("clients").update(corps.data).eq("id", id).select("*").single();
    if (error) throw error;
    return Response.json(data);
  } catch (e) {
    return reponseErreur(e);
  }
}

/** Un client lié à des documents est archivé (il reste sur les anciens devis), sinon supprimé. */
export async function DELETE(_: Request, { params }: RouteContext<"/api/clients/[id]">) {
  try {
    const { id } = await params;
    const { supabase } = await exigerSession();
    const { count } = await supabase.from("documents").select("id", { count: "exact", head: true }).eq("client_id", id);
    if (count) {
      const { error } = await supabase.from("clients").update({ archive: true }).eq("id", id);
      if (error) throw error;
      return Response.json({ archive: true });
    }
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) throw error;
    return Response.json({ supprime: true });
  } catch (e) {
    return reponseErreur(e);
  }
}
