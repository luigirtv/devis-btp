import { exigerSession, reponseErreur } from "@/lib/acces";
import { messageZod, schemaPrestation } from "@/lib/schemas";

export async function PATCH(request: Request, { params }: RouteContext<"/api/prestations/[id]">) {
  try {
    const { id } = await params;
    const { supabase } = await exigerSession();
    const corps = schemaPrestation.partial().safeParse(await request.json());
    if (!corps.success) return Response.json({ error: messageZod(corps.error) }, { status: 400 });
    const { data, error } = await supabase.from("prestations").update(corps.data).eq("id", id).select("*").single();
    if (error) throw error;
    return Response.json(data);
  } catch (e) {
    return reponseErreur(e);
  }
}

export async function DELETE(_: Request, { params }: RouteContext<"/api/prestations/[id]">) {
  try {
    const { id } = await params;
    const { supabase } = await exigerSession();
    const { error } = await supabase.from("prestations").delete().eq("id", id);
    if (error) throw error;
    return Response.json({ supprime: true });
  } catch (e) {
    return reponseErreur(e);
  }
}
