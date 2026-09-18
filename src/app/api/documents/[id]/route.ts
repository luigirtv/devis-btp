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
    if (d.numero && d.type === "facture") {
      // La numérotation des factures doit rester sans trou : on ne supprime que la toute dernière, jamais envoyée, et on rend son numéro.
      if (d.statut !== "brouillon") return Response.json({ error: "Cette facture est déjà partie chez le client : pour l'annuler, utilisez « Annuler cette facture (avoir) »." }, { status: 409 });
      const rang = Number(d.numero.split("-").pop());
      const { data: compteur } = await supabase.from("compteurs").select("dernier").eq("type", "facture").eq("annee", d.annee).maybeSingle();
      if (!compteur || compteur.dernier !== rang) return Response.json({ error: "D'autres factures ont été faites après celle-ci : elle ne peut plus être supprimée. Utilisez « Annuler cette facture (avoir) »." }, { status: 409 });
      const { error: e1 } = await supabase.from("documents").delete().eq("id", id);
      if (e1) throw e1;
      await supabase.from("compteurs").update({ dernier: rang - 1 }).eq("type", "facture").eq("annee", d.annee);
      return Response.json({ supprime: true });
    }
    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) throw error;
    return Response.json({ supprime: true });
  } catch (e) {
    return reponseErreur(e);
  }
}
