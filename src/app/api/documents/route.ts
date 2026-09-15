import { z } from "zod";
import { chargerParametres, exigerSession, reponseErreur } from "@/lib/acces";
import { creerDocument } from "@/lib/documents";

const schema = z.union([
  z.object({ type: z.enum(["devis", "facture"]), client_id: z.string().uuid().nullable().optional() }),
  z.object({ depuis_devis: z.string().uuid(), mode: z.enum(["acompte", "solde", "totale"]), acompte_pourcent: z.coerce.number().min(1).max(100).optional() }),
  z.object({ avoir_de: z.string().uuid() }),
  z.object({ dupliquer: z.string().uuid() })
]);

/** Crée un brouillon (devis, facture, facture issue d'un devis, avoir, copie) et renvoie son id. */
export async function POST(request: Request) {
  try {
    const { supabase } = await exigerSession();
    const p = await chargerParametres();
    const corps = schema.safeParse(await request.json());
    if (!corps.success) return Response.json({ error: "Demande invalide" }, { status: 400 });
    const id = await creerDocument(supabase, p, corps.data);
    return Response.json({ id });
  } catch (e) {
    return reponseErreur(e);
  }
}
