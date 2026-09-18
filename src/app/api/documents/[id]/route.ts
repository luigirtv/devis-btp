import { chargerParametres, exigerSession, reponseErreur } from "@/lib/acces";
import { chargerDocument, modifierDocument, schemaModification } from "@/lib/documents";
import { messageZod } from "@/lib/schemas";

export async function GET(_: Request, { params }: RouteContext<"/api/documents/[id]">) {
  try {
    const { id } = await params;
    const { supabase } = await exigerSession();
    return Response.json(await chargerDocument(supabase, id));
  } catch (e) {
    return reponseErreur(e);
  }
}

export async function PATCH(request: Request, { params }: RouteContext<"/api/documents/[id]">) {
  try {
    const { id } = await params;
    const { supabase } = await exigerSession();
    const [p, brut] = await Promise.all([chargerParametres(), request.json()]);
    const corps = schemaModification.safeParse(brut);
    if (!corps.success) return Response.json({ error: messageZod(corps.error) }, { status: 400 });
    return Response.json(await modifierDocument(supabase, p, id, corps.data));
  } catch (e) {
    return reponseErreur(e);
  }
}

/** Seul un brouillon (sans numéro) se supprime ; une facture validée s'annule par un avoir. */
export async function DELETE(_: Request, { params }: RouteContext<"/api/documents/[id]">) {
  try {
    const { id } = await params;
    const { supabase } = await exigerSession();
    const d = await chargerDocument(supabase, id);
    if (d.numero && d.type === "facture") return Response.json({ error: "Une facture validée ne se supprime pas : créez un avoir." }, { status: 409 });
    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) throw error;
    return Response.json({ supprime: true });
  } catch (e) {
    return reponseErreur(e);
  }
}
