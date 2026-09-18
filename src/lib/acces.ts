import { cache } from "react";
import { supabaseServer } from "@/lib/supabase/server";
import { currentUser } from "@/lib/supabase/auth";
import { ECHEANCIER_PAR_DEFAUT, type Parametres } from "@/lib/types";

export class AccesRefuse extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Session courante + client Supabase lié (RLS active : l'utilisateur ne voit que ses données). */
export const exigerSession = cache(async () => {
  const supabase = await supabaseServer();
  const user = await currentUser(supabase);
  if (!user) throw new AccesRefuse(401, "Non connecté");
  return { supabase, user };
});

// Tout sauf logo_data : le logo (jusqu'à 400 Ko en base64) ne sert qu'au PDF et à l'écran de réglages.
const SANS_LOGO =
  "owner_id, nom_entreprise, nom_contact, adresse, code_postal, ville, telephone, email, siret, immatriculation, assujetti_tva, numero_tva, assurance_nom, assurance_contrat, assurance_couverture, iban, bic, validite_devis_jours, delai_paiement_jours, acompte_pourcent, echeancier, mentions_devis, mentions_facture, prefixe_devis, prefixe_facture";

async function lireParametres(colonnes: string): Promise<Parametres> {
  const { supabase, user } = await exigerSession();
  let { data, error } = await supabase.from("parametres").select(colonnes).eq("owner_id", user.id).maybeSingle();
  // Base pas encore migrée (colonne echeancier absente) : on relit sans elle, l'échéancier par défaut s'applique.
  if (error?.code === "42703") ({ data, error } = await supabase.from("parametres").select(colonnes.replace(" echeancier,", "")).eq("owner_id", user.id).maybeSingle());
  if (error) throw error;
  if (data) {
    const lu = data as unknown as Omit<Parametres, "logo_data" | "echeancier"> & { logo_data?: string | null; echeancier?: Parametres["echeancier"] | null };
    return { ...lu, logo_data: lu.logo_data ?? null, echeancier: lu.echeancier?.length ? lu.echeancier : ECHEANCIER_PAR_DEFAUT };
  }
  const { data: cree, error: creation } = await supabase.from("parametres").insert({ owner_id: user.id, email: user.email ?? "" }).select("*").single();
  if (creation) throw creation;
  return { ...(cree as Parametres), echeancier: (cree as Parametres).echeancier?.length ? (cree as Parametres).echeancier : ECHEANCIER_PAR_DEFAUT };
}

/** Paramètres de l'entreprise, sans le logo ; une seule lecture par requête. Crée la ligne par défaut à la première visite. */
export const chargerParametres = cache(() => lireParametres(SANS_LOGO));

/** Paramètres avec le logo : PDF et écran « Mon entreprise » uniquement. */
export const chargerParametresComplets = cache(() => lireParametres("*"));

/** Transforme une AccesRefuse (ou toute erreur) en réponse JSON. */
export function reponseErreur(e: unknown) {
  if (e instanceof AccesRefuse) return Response.json({ error: e.message }, { status: e.status });
  if (e instanceof Error && (e as { affichable?: boolean }).affichable) return Response.json({ error: e.message }, { status: 502 });
  console.error(e);
  const message = e instanceof Error ? e.message : "Erreur interne";
  return Response.json({ error: message }, { status: 500 });
}
