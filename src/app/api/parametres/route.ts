import { chargerParametres, exigerSession, reponseErreur } from "@/lib/acces";
import { messageZod, schemaParametres } from "@/lib/schemas";

export async function PATCH(request: Request) {
  try {
    const { supabase, user } = await exigerSession();
    await chargerParametres();
    const corps = schemaParametres.safeParse(await request.json());
    if (!corps.success) return Response.json({ error: messageZod(corps.error) }, { status: 400 });
    const { data, error } = await supabase.from("parametres").update(corps.data).eq("owner_id", user.id).select("*").single();
    if (error) throw error;
    return Response.json(data);
  } catch (e) {
    return reponseErreur(e);
  }
}
