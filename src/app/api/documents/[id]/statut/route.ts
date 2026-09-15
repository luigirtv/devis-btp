import { z } from "zod";
import { AccesRefuse, exigerSession, reponseErreur } from "@/lib/acces";
import { chargerDocument, validerDocument } from "@/lib/documents";
import { aujourdhui } from "@/lib/format";

const schema = z.object({
  statut: z.enum(["brouillon", "envoye", "accepte", "refuse", "envoyee", "payee", "annulee"]),
  paye_le: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  mode_paiement: z.string().max(40).optional()
});

const TRANSITIONS: Record<string, string[]> = {
  // devis
  brouillon: ["envoye", "accepte", "envoyee", "payee"],
  envoye: ["accepte", "refuse", "brouillon"],
  accepte: ["refuse", "envoye"],
  refuse: ["accepte", "envoye"],
  // facture
  envoyee: ["payee", "annulee"],
  payee: ["envoyee"],
  annulee: []
};

export async function POST(request: Request, { params }: RouteContext<"/api/documents/[id]/statut">) {
  try {
    const { id } = await params;
    const { supabase } = await exigerSession();
    const corps = schema.safeParse(await request.json());
    if (!corps.success) return Response.json({ error: "Demande invalide" }, { status: 400 });
    let d = await chargerDocument(supabase, id);
    const { statut, paye_le, mode_paiement } = corps.data;
    if (!TRANSITIONS[d.statut]?.includes(statut)) throw new AccesRefuse(409, `Passage de « ${d.statut} » à « ${statut} » impossible`);
    const bonType = d.type === "devis" ? ["brouillon", "envoye", "accepte", "refuse"] : ["brouillon", "envoyee", "payee", "annulee"];
    if (!bonType.includes(statut)) throw new AccesRefuse(400, "Statut incompatible avec ce type de document");
    if (statut !== "brouillon") d = await validerDocument(supabase, id);

    const maj: Record<string, unknown> = { statut };
    if (statut === "accepte") maj.accepte_le = aujourdhui();
    if (statut === "payee") {
      maj.paye_le = paye_le ?? aujourdhui();
      maj.mode_paiement = mode_paiement ?? null;
    }
    if (statut === "envoyee" && d.statut === "payee") {
      maj.paye_le = null;
      maj.mode_paiement = null;
    }
    const { error } = await supabase.from("documents").update(maj).eq("id", id);
    if (error) throw error;
    return Response.json(await chargerDocument(supabase, id));
  } catch (e) {
    return reponseErreur(e);
  }
}
