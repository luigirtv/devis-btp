import { exigerSession, reponseErreur } from "@/lib/acces";
import { messageZod, schemaClient } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const { supabase } = await exigerSession();
    const corps = schemaClient.safeParse(await request.json());
    if (!corps.success) return Response.json({ error: messageZod(corps.error) }, { status: 400 });
    const { data, error } = await supabase.from("clients").insert(corps.data).select("*").single();
    if (error) throw error;
    return Response.json(data);
  } catch (e) {
    return reponseErreur(e);
  }
}
