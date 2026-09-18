import { z } from "zod";
import { AccesRefuse, chargerParametresComplets, exigerSession, reponseErreur } from "@/lib/acces";
import { chargerDocument, validerDocument } from "@/lib/documents";
import { emailConfigure, envoyerEmail, nomFichierPdf } from "@/lib/email";
import { dateFr, euros, titreDocument } from "@/lib/format";
import { clientDuDocument, genererPdf } from "@/lib/pdf/generer";

export const maxDuration = 30;

function texteParDefaut(d: { type: string; sous_type: string; numero: string | null; objet: string; net_a_payer: number; date_validite: string | null; date_echeance: string | null }, p: { nom_contact: string; nom_entreprise: string; telephone: string }): string {
  const quoi = d.type === "devis" ? "notre devis" : d.sous_type === "avoir" ? "notre avoir" : "notre facture";
  const lignes = [`Bonjour,`, ``, `Veuillez trouver ci-joint ${quoi} n° ${d.numero}${d.objet ? ` pour : ${d.objet}` : ""}, d'un montant de ${euros(d.net_a_payer)}.`];
  if (d.type === "devis") lignes.push(`Pour l'accepter, il suffit de me le retourner signé avec la mention « Bon pour accord »${d.date_validite ? ` avant le ${dateFr(d.date_validite)}` : ""}.`);
  else if (d.sous_type !== "avoir" && d.date_echeance) lignes.push(`Merci de la régler avant le ${dateFr(d.date_echeance)}.`);
  lignes.push(`Je reste à votre disposition pour toute question.`, ``, `Cordialement,`, p.nom_contact || p.nom_entreprise, p.telephone);
  return lignes.filter((l, i, t) => l !== "" || t[i - 1] !== "").join("\n");
}

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
    // Le client n'avait pas d'adresse : on la retient pour la prochaine fois (avant la validation, qui fige sa fiche).
    const avant = await chargerDocument(supabase, id);
    if (avant.client_id && !avant.clients?.email) await supabase.from("clients").update({ email: corps.data.a }).eq("id", avant.client_id);
    const d = await validerDocument(supabase, id);
    const client = await clientDuDocument(supabase, d);
    const pdf = await genererPdf(d, p, client);
    const titre = titreDocument(d);
    await envoyerEmail({
      a: { email: corps.data.a, nom: client?.nom ?? corps.data.a },
      repondreA: p.email ? { email: p.email, nom: p.nom_entreprise || p.nom_contact || p.email } : null,
      copieA: p.email || null,
      sujet: `${titre}${d.objet ? ` – ${d.objet}` : ""} – ${p.nom_entreprise}`,
      texte: corps.data.message || texteParDefaut(d, p),
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
