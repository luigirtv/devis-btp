import { exigerSession, reponseErreur } from "@/lib/acces";
import { messageZod, schemaPrestation } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const { supabase } = await exigerSession();
    const corps = schemaPrestation.safeParse(await request.json());
    if (!corps.success) return Response.json({ error: messageZod(corps.error) }, { status: 400 });
    const { data, error } = await supabase.from("prestations").insert(corps.data).select("*").single();
    if (error) throw error;
    return Response.json(data);
  } catch (e) {
    return reponseErreur(e);
  }
}
