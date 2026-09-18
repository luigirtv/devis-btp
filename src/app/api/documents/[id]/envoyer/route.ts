import { z } from "zod";
import { AccesRefuse, chargerParametresComplets, exigerSession, reponseErreur } from "@/lib/acces";
import { chargerDocument, validerDocument } from "@/lib/documents";
import { emailConfigure, envoyerEmail, nomFichierPdf } from "@/lib/email";
import { titreDocument } from "@/lib/format";
import { clientDuDocument, genererPdf } from "@/lib/pdf/generer";

export const maxDuration = 30;

const schema = z.object({ a: z.string().trim().email("Adresse e-mail invalide"), message: z.string().max(4000).default("") });

/** Valide le document si besoin, génère le PDF et l'envoie au client. */
export async function POST(request: Request, { params }: RouteContext<"/api/documents/[id]/envoyer">) {
  try {
    const { id } = await params;
    const { supabase } = await exigerSession();
    if (!emailConfigure()) throw new AccesRefuse(503, "L'envoi d'e-mail n'est pas configuré");
    const corps = schema.safeParse(await request.json());
    if (!corps.success) return Response.json({ error: corps.error.issues[0]?.message ?? "Demande invalide" }, { status: 400 });
    const p = await chargerParametresComplets();
    const d = await validerDocument(supabase, id);
    const client = await clientDuDocument(supabase, d);
    const pdf = await genererPdf(d, p, client);
    const titre = titreDocument(d);
    await envoyerEmail({
      a: { email: corps.data.a, nom: client?.nom ?? corps.data.a },
      repondreA: p.email ? { email: p.email, nom: p.nom_entreprise || p.nom_contact || p.email } : null,
      sujet: `${titre}${d.objet ? ` – ${d.objet}` : ""} – ${p.nom_entreprise}`,
      texte: corps.data.message || `Bonjour,\n\nVeuillez trouver ci-joint ${d.type === "devis" ? "notre devis" : "notre facture"} ${d.numero}.\n\nCordialement,\n${p.nom_contact || p.nom_entreprise}\n${p.telephone}`,
      pieceJointe: { nom: nomFichierPdf(d), contenu: pdf }
    });
    const maj: Record<string, unknown> = { envoye_le: new Date().toISOString(), envoye_a: corps.data.a };
    if (d.statut === "brouillon") maj.statut = d.type === "devis" ? "envoye" : "envoyee";
    const { error } = await supabase.from("documents").update(maj).eq("id", id);
    if (error) throw error;
    return Response.json(await chargerDocument(supabase, id));
  } catch (e) {
    return reponseErreur(e);
  }
}
