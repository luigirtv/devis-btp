import { chargerParametres, exigerSession, reponseErreur } from "@/lib/acces";
import { messageZod, schemaParametres } from "@/lib/schemas";

export async function PATCH(request: Request) {
  try {
    const { supabase, user } = await exigerSession();
    await chargerParametres();
    const corps = schemaParametres.safeParse(await request.json());
    if (!corps.success) return Response.json({ error: messageZod(corps.error) }, { status: 400 });
    let { data, error } = await supabase.from("parametres").update(corps.data).eq("owner_id", user.id).select("*").single();
    // Base sans la colonne echeancier (migration 2 pas passée) : on enregistre tout le reste, les étapes par défaut 40/40/20 s'appliquent.
    if (error && (error.code === "PGRST204" || error.code === "42703")) {
      const { echeancier: _ignore, ...reste } = corps.data;
      void _ignore;
      ({ data, error } = await supabase.from("parametres").update(reste).eq("owner_id", user.id).select("*").single());
    }
    if (error) throw error;
    return Response.json(data);
  } catch (e) {
    return reponseErreur(e);
  }
}
