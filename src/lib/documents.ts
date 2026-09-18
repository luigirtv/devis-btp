import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { AccesRefuse } from "@/lib/acces";
import { calculerTotaux, intituleTranche, lignesAcompte, lignesAvoir, nouvelId } from "@/lib/calculs";
import { ajouterJours, aujourdhui } from "@/lib/format";
import type { Client, ClientSnapshot, Deduction, Document, DocumentAvecClient, Ligne, Parametres } from "@/lib/types";

export const schemaLigne = z.object({
  id: z.string().min(1),
  genre: z.enum(["prestation", "titre", "commentaire"]),
  libelle: z.string().max(500),
  description: z.string().max(2000),
  quantite: z.coerce.number().finite(),
  unite: z.string().max(20),
  prix_unitaire: z.coerce.number().finite(),
  nature: z.enum(["main_oeuvre", "fourniture"]),
  tva: z.coerce.number().min(0).max(100)
});

export const schemaModification = z.object({
  client_id: z.string().uuid().nullable().optional(),
  objet: z.string().max(300).optional(),
  adresse_chantier: z.string().max(500).optional(),
  date_document: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  date_validite: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  date_debut_travaux: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  duree_travaux: z.string().max(200).optional(),
  lignes: z.array(schemaLigne).max(500).optional(),
  remise_pourcent: z.coerce.number().min(0).max(100).optional(),
  notes: z.string().max(3000).optional()
});
export type Modification = z.infer<typeof schemaModification>;

const SELECT = "*, clients(id, nom, email, type)";

export async function chargerDocument(supabase: SupabaseClient, id: string): Promise<DocumentAvecClient> {
  const { data, error } = await supabase.from("documents").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) throw new AccesRefuse(404, "Document introuvable");
  return data as unknown as DocumentAvecClient;
}


/**
 * Un devis se modifie tant qu'il n'est pas accepté ; une facture, tant qu'elle n'est pas partie chez le client.
 * Le numéro est attribué dès « Terminer » (plus de « brouillon » sur le PDF) : ce qui fige une facture, c'est son envoi.
 */
export function modifiable(d: Pick<Document, "type" | "statut" | "numero">): boolean {
  if (d.type === "devis") return d.statut === "brouillon" || d.statut === "envoye";
  return d.statut === "brouillon";
}

export function totauxDe(d: Pick<Document, "lignes" | "remise_pourcent" | "deductions">, p: Pick<Parametres, "assujetti_tva">) {
  return calculerTotaux({ lignes: d.lignes, remise_pourcent: d.remise_pourcent, deductions: d.deductions, assujetti_tva: p.assujetti_tva });
}

function colonnesTotaux(d: Pick<Document, "lignes" | "remise_pourcent" | "deductions">, p: Parametres) {
  const t = totauxDe(d, p);
  return { total_ht: t.total_ht, total_tva: t.total_tva, total_ttc: t.total_ttc, net_a_payer: t.net_a_payer };
}

export async function modifierDocument(supabase: SupabaseClient, p: Parametres, id: string, modif: Modification): Promise<DocumentAvecClient> {
  const actuel = await chargerDocument(supabase, id);
  if (!modifiable(actuel)) throw new AccesRefuse(409, "Ce document est validé et ne peut plus être modifié");
  const fusion = { ...actuel, ...modif } as Document;
  const { data, error } = await supabase
    .from("documents")
    .update({ ...modif, ...colonnesTotaux(fusion, p) })
    .eq("id", id)
    .select(SELECT)
    .single();
  if (error) throw error;
  return data as unknown as DocumentAvecClient;
}

function snapshot(c: Client | null): ClientSnapshot | null {
  if (!c) return null;
  return { nom: c.nom, type: c.type, adresse: c.adresse, code_postal: c.code_postal, ville: c.ville, telephone: c.telephone, email: c.email, siret: c.siret };
}

/** Attribue le numéro définitif et fige le client. Sans effet si déjà validé. */
export async function validerDocument(supabase: SupabaseClient, id: string): Promise<DocumentAvecClient> {
  const d = await chargerDocument(supabase, id);
  if (d.numero) return d;
  if (!d.client_id) throw new AccesRefuse(400, "Choisissez un client avant de valider");
  if (!d.lignes.some((l) => l.genre === "prestation")) throw new AccesRefuse(400, "Ajoutez au moins une ligne avant de valider");
  const { data: client } = await supabase.from("clients").select("*").eq("id", d.client_id).maybeSingle();
  await supabase.from("documents").update({ client_snapshot: snapshot(client as Client | null) }).eq("id", id);
  const { error } = await supabase.rpc("numeroter_document", { doc: id });
  if (error) throw new Error(`Numérotation impossible : ${error.message}`);
  return chargerDocument(supabase, id);
}

type Creation =
  | { type: "devis" | "facture"; client_id?: string | null }
  | { depuis_devis: string; mode: "suivante" | "acompte" | "solde" | "totale"; acompte_pourcent?: number }
  | { avoir_de: string }
  | { dupliquer: string };

export async function creerDocument(supabase: SupabaseClient, p: Parametres, demande: Creation): Promise<string> {
  const jour = aujourdhui();
  let ligne: Partial<Document> & { type: Document["type"] };

  if ("depuis_devis" in demande) {
    const devis = await chargerDocument(supabase, demande.depuis_devis);
    if (devis.type !== "devis") throw new AccesRefuse(400, "Le document source n'est pas un devis");
    if (!devis.numero) throw new AccesRefuse(400, "Validez le devis avant de le facturer");
    const commun = { type: "facture" as const, client_id: devis.client_id, objet: devis.objet, adresse_chantier: devis.adresse_chantier, devis_id: devis.id, date_document: jour, notes: "" };
    // « suivante » : l'app choisit seule l'étape de l'échéancier, d'après les factures déjà faites sur ce devis.
    let mode = demande.mode;
    let tranche: { index: number; pourcent: number; intitule: string } | null = null;
    if (mode === "suivante") {
      const { data: faites } = await supabase.from("documents").select("sous_type, numero, statut").eq("devis_id", devis.id).eq("type", "facture").neq("statut", "annulee").neq("sous_type", "avoir");
      const liste = (faites ?? []) as Pick<Document, "sous_type" | "numero" | "statut">[];
      if (liste.some((f) => f.sous_type !== "acompte")) throw new AccesRefuse(409, "Ce devis est déjà entièrement facturé");
      if (liste.some((f) => !f.numero)) throw new AccesRefuse(409, "Une facture de ce devis est encore en brouillon : envoyez-la ou supprimez-la avant de préparer la suivante");
      const index = liste.length;
      if (index < p.echeancier.length - 1) {
        const t = p.echeancier[index];
        tranche = { index, pourcent: t.pourcent, intitule: intituleTranche(t, index, devis.numero) };
        mode = "acompte";
      } else mode = "solde";
    }
    if (mode === "acompte") {
      const pct = tranche?.pourcent ?? demande.acompte_pourcent ?? p.acompte_pourcent;
      ligne = { ...commun, sous_type: "acompte", acompte_pourcent: pct, lignes: lignesAcompte(devis, pct, p.assujetti_tva, tranche?.intitule), remise_pourcent: 0, deductions: [] };
    } else {
      const { data: acomptes } = await supabase
        .from("documents")
        .select("id, numero, lignes, remise_pourcent, sous_type, statut")
        .eq("devis_id", devis.id)
        .eq("type", "facture")
        .eq("sous_type", "acompte")
        .not("numero", "is", null)
        .neq("statut", "annulee");
      const deductions: Deduction[] = ((acomptes ?? []) as Document[]).map((a) => {
        const t = totauxDe(a, p);
        return { facture_id: a.id, numero: a.numero!, libelle: `Acompte déjà facturé (facture ${a.numero})`, montant_ttc: t.total_ttc, repartition: t.repartition };
      });
      ligne = {
        ...commun,
        sous_type: mode === "solde" || deductions.length ? "solde" : "standard",
        lignes: devis.lignes.map((l) => ({ ...l, id: nouvelId() })),
        remise_pourcent: devis.remise_pourcent,
        deductions
      };
    }
  } else if ("avoir_de" in demande) {
    const f = await chargerDocument(supabase, demande.avoir_de);
    if (f.type !== "facture" || !f.numero) throw new AccesRefuse(400, "Un avoir ne s'établit que sur une facture validée");
    ligne = {
      type: "facture",
      sous_type: "avoir",
      client_id: f.client_id,
      objet: `Annulation de la facture ${f.numero}${f.objet ? ` – ${f.objet}` : ""}`,
      adresse_chantier: f.adresse_chantier,
      facture_origine_id: f.id,
      lignes: lignesAvoir(f),
      remise_pourcent: f.remise_pourcent,
      deductions: f.deductions.map((d) => ({ ...d, montant_ttc: -d.montant_ttc, repartition: { main_oeuvre: -d.repartition.main_oeuvre, fourniture: -d.repartition.fourniture } })),
      date_document: jour
    };
  } else if ("dupliquer" in demande) {
    const s = await chargerDocument(supabase, demande.dupliquer);
    ligne = {
      type: s.type,
      sous_type: "standard",
      client_id: s.client_id,
      objet: s.objet,
      adresse_chantier: s.adresse_chantier,
      lignes: s.lignes.map((l) => ({ ...l, id: nouvelId() })),
      remise_pourcent: s.remise_pourcent,
      deductions: [],
      notes: s.notes,
      duree_travaux: s.duree_travaux,
      date_document: jour,
      date_validite: s.type === "devis" ? ajouterJours(jour, p.validite_devis_jours) : null
    };
  } else {
    ligne = {
      type: demande.type,
      client_id: demande.client_id ?? null,
      date_document: jour,
      date_validite: demande.type === "devis" ? ajouterJours(jour, p.validite_devis_jours) : null,
      lignes: [],
      deductions: []
    };
  }

  const complet = { lignes: [] as Ligne[], remise_pourcent: 0, deductions: [] as Deduction[], ...ligne };
  const { data, error } = await supabase
    .from("documents")
    .insert({ ...complet, statut: "brouillon", numero: null, ...colonnesTotaux(complet, p) })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}
