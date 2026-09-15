import { supabaseServer } from "@/lib/supabase/server";
import { currentUser } from "@/lib/supabase/auth";
import type { Parametres } from "@/lib/types";

export class AccesRefuse extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Session courante + client Supabase lié (RLS active : l'utilisateur ne voit que ses données). */
export async function exigerSession() {
  const supabase = await supabaseServer();
  const user = await currentUser(supabase);
  if (!user) throw new AccesRefuse(401, "Non connecté");
  return { supabase, user };
}

/** Paramètres de l'entreprise ; crée la ligne par défaut à la première visite. */
export async function chargerParametres(): Promise<Parametres> {
  const { supabase, user } = await exigerSession();
  const { data } = await supabase.from("parametres").select("*").eq("owner_id", user.id).maybeSingle();
  if (data) return data as Parametres;
  const { data: cree, error } = await supabase.from("parametres").insert({ owner_id: user.id, email: user.email ?? "" }).select("*").single();
  if (error) throw error;
  return cree as Parametres;
}

/** Transforme une AccesRefuse (ou toute erreur) en réponse JSON. */
export function reponseErreur(e: unknown) {
  if (e instanceof AccesRefuse) return Response.json({ error: e.message }, { status: e.status });
  console.error(e);
  const message = e instanceof Error ? e.message : "Erreur interne";
  return Response.json({ error: message }, { status: 500 });
}
