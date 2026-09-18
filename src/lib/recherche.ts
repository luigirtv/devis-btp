import type { SupabaseClient } from "@supabase/supabase-js";
import type { Client, DocumentAvecClient, TypeDocument } from "@/lib/types";

/** Minuscules, sans accents ni ponctuation : « Rénovation (SDB) » et « renovation sdb » se valent. */
export function normaliser(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** Vrai si chaque mot de la recherche se retrouve quelque part dans le texte. */
export function correspond(texte: string, q: string): boolean {
  const t = normaliser(texte);
  // Un numéro tapé sans tirets (« d20260003 ») doit aussi trouver « D-2026-0003 ».
  const compact = t.replace(/ /g, "");
  return normaliser(q).split(" ").filter(Boolean).every((mot) => t.includes(mot) || compact.includes(mot));
}

/**
 * Documents dont le client, l'objet, le numéro ou l'adresse contient tous les mots cherchés.
 * Le tri se fait ici plutôt qu'en SQL : un artisan a quelques centaines de documents, et cela rend la recherche
 * indulgente (accents, majuscules, ordre des mots), ce qui compte plus que tout pour cet utilisateur.
 */
export async function rechercherDocuments(supabase: SupabaseClient, q: string, filtre: { type?: TypeDocument; statut?: string } = {}): Promise<DocumentAvecClient[]> {
  let r = supabase.from("documents").select("*, clients(id, nom, email, type)").order("date_document", { ascending: false }).order("created_at", { ascending: false }).limit(q.trim() ? 2000 : 500);
  if (filtre.type) r = r.eq("type", filtre.type);
  if (filtre.statut) r = r.eq("statut", filtre.statut);
  const documents = ((await r).data ?? []) as unknown as DocumentAvecClient[];
  if (!q.trim()) return documents;
  return documents.filter((d) => correspond([d.clients?.nom, d.client_snapshot?.nom, d.objet, d.numero, d.adresse_chantier].filter(Boolean).join(" "), q));
}

export async function rechercherClients(supabase: SupabaseClient, q: string): Promise<Client[]> {
  if (!q.trim()) return [];
  const { data } = await supabase.from("clients").select("*").eq("archive", false).order("nom").limit(2000);
  return ((data ?? []) as Client[]).filter((c) => correspond([c.nom, c.ville, c.telephone, c.email].join(" "), q));
}
