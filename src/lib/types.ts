export type Nature = "main_oeuvre" | "fourniture";
export type GenreLigne = "prestation" | "titre" | "commentaire";

/** Une ligne de devis/facture, stockée en JSON dans documents.lignes. */
export type Ligne = {
  id: string;
  genre: GenreLigne;
  libelle: string;
  description: string;
  quantite: number;
  unite: string;
  prix_unitaire: number;
  nature: Nature;
  tva: number; // taux en % (0 en franchise)
};

/** Acompte déjà facturé, déduit sur une facture de solde. */
export type Deduction = {
  facture_id: string;
  numero: string;
  libelle: string;
  montant_ttc: number;
  repartition: Record<Nature, number>; // HT par nature, pour le récap URSSAF
};

export type TypeDocument = "devis" | "facture";
export type SousType = "standard" | "acompte" | "solde" | "avoir";
export type StatutDevis = "brouillon" | "envoye" | "accepte" | "refuse";
export type StatutFacture = "brouillon" | "envoyee" | "payee" | "annulee";
export type Statut = StatutDevis | StatutFacture;

export type Client = {
  id: string;
  nom: string;
  type: "particulier" | "professionnel";
  adresse: string;
  code_postal: string;
  ville: string;
  telephone: string;
  email: string;
  siret: string;
  notes: string;
  archive: boolean;
};

export type ClientSnapshot = Omit<Client, "id" | "archive" | "notes">;

export type Prestation = {
  id: string;
  libelle: string;
  description: string;
  unite: string;
  prix_unitaire: number;
  nature: Nature;
  tva: number;
  actif: boolean;
};

export type Parametres = {
  owner_id: string;
  nom_entreprise: string;
  nom_contact: string;
  adresse: string;
  code_postal: string;
  ville: string;
  telephone: string;
  email: string;
  siret: string;
  immatriculation: string;
  assujetti_tva: boolean;
  numero_tva: string;
  assurance_nom: string;
  assurance_contrat: string;
  assurance_couverture: string;
  iban: string;
  bic: string;
  validite_devis_jours: number;
  delai_paiement_jours: number;
  acompte_pourcent: number;
  mentions_devis: string;
  mentions_facture: string;
  logo_data: string | null;
  prefixe_devis: string;
  prefixe_facture: string;
};

export type Document = {
  id: string;
  type: TypeDocument;
  sous_type: SousType;
  numero: string | null;
  annee: number | null;
  statut: Statut;
  client_id: string | null;
  client_snapshot: ClientSnapshot | null;
  objet: string;
  adresse_chantier: string;
  date_document: string;
  date_validite: string | null;
  date_echeance: string | null;
  date_debut_travaux: string | null;
  duree_travaux: string;
  lignes: Ligne[];
  remise_pourcent: number;
  deductions: Deduction[];
  devis_id: string | null;
  facture_origine_id: string | null;
  acompte_pourcent: number | null;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  net_a_payer: number;
  notes: string;
  paye_le: string | null;
  mode_paiement: string | null;
  accepte_le: string | null;
  envoye_le: string | null;
  envoye_a: string | null;
  valide_le: string | null;
  created_at: string;
  updated_at: string;
};

/** Document avec son client joint (liste et fiche). */
export type DocumentAvecClient = Document & { clients: Pick<Client, "id" | "nom" | "email" | "type"> | null };

export const UNITES = ["u", "h", "j", "m", "m²", "m³", "ml", "kg", "L", "forfait", "lot"] as const;
export const TAUX_TVA = [20, 10, 5.5, 0] as const;
export const MODES_PAIEMENT = ["Virement", "Chèque", "Espèces", "Carte bancaire", "Autre"] as const;

export const LIBELLE_NATURE: Record<Nature, string> = { main_oeuvre: "Main-d'œuvre", fourniture: "Fourniture" };
