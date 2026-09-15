// Données d'exemple pour les pages d'aperçu (hors production) : permet de voir les écrans sans base.
import { ligneVide } from "@/lib/calculs";
import type { Client, DocumentAvecClient, Parametres, Prestation } from "@/lib/types";

export const PARAMETRES_EXEMPLE: Parametres = {
  owner_id: "exemple",
  nom_entreprise: "Rénov' Martin",
  nom_contact: "Paul Martin",
  adresse: "12 rue des Lilas",
  code_postal: "83000",
  ville: "Toulon",
  telephone: "06 12 34 56 78",
  email: "paul@renov-martin.fr",
  siret: "123 456 789 00012",
  immatriculation: "RM 123 456 789 – CMA du Var",
  assujetti_tva: false,
  numero_tva: "",
  assurance_nom: "AXA",
  assurance_contrat: "1234567",
  assurance_couverture: "France métropolitaine",
  iban: "FR76 1234 5678 9012 3456 7890 123",
  bic: "BNPAFRPP",
  validite_devis_jours: 30,
  delai_paiement_jours: 30,
  acompte_pourcent: 30,
  mentions_devis: "Devis gratuit. Les travaux commenceront à la date convenue après acceptation du devis et versement de l'acompte.",
  mentions_facture: "En cas de retard de paiement, des pénalités de retard au taux légal en vigueur sont exigibles, ainsi qu'une indemnité forfaitaire de 40 € pour frais de recouvrement pour les clients professionnels (art. L441-10 du Code de commerce). Pas d'escompte pour paiement anticipé.",
  logo_data: null,
  prefixe_devis: "D",
  prefixe_facture: "F"
};

export const CLIENTS_EXEMPLE: Client[] = [
  { id: "11111111-1111-1111-1111-111111111111", nom: "Marie Dupont", type: "particulier", adresse: "4 allée des Pins", code_postal: "83100", ville: "Toulon", telephone: "06 00 00 00 00", email: "marie.dupont@exemple.fr", siret: "", notes: "Code portail 1234", archive: false },
  { id: "22222222-2222-2222-2222-222222222222", nom: "SCI Les Oliviers", type: "professionnel", adresse: "8 avenue de la République", code_postal: "83000", ville: "Toulon", telephone: "04 94 00 00 00", email: "contact@sci-oliviers.fr", siret: "987 654 321 00021", notes: "", archive: false },
  { id: "33333333-3333-3333-3333-333333333333", nom: "Jean Bernard", type: "particulier", adresse: "15 chemin du Moulin", code_postal: "83200", ville: "Le Revest", telephone: "07 11 22 33 44", email: "", siret: "", notes: "", archive: false }
];

export const PRESTATIONS_EXEMPLE: Prestation[] = [
  { id: "p1", libelle: "Main-d'œuvre", description: "", unite: "h", prix_unitaire: 45, nature: "main_oeuvre", tva: 10, actif: true },
  { id: "p2", libelle: "Pose de carrelage sol", description: "Pose droite, joints compris", unite: "m²", prix_unitaire: 40, nature: "main_oeuvre", tva: 10, actif: true },
  { id: "p3", libelle: "Pose de faïence murale", description: "", unite: "m²", prix_unitaire: 45, nature: "main_oeuvre", tva: 10, actif: true },
  { id: "p4", libelle: "Peinture murs et plafonds", description: "Deux couches, préparation comprise", unite: "m²", prix_unitaire: 22, nature: "main_oeuvre", tva: 10, actif: true },
  { id: "p5", libelle: "Carrelage grès cérame", description: "", unite: "m²", prix_unitaire: 28, nature: "fourniture", tva: 20, actif: true },
  { id: "p6", libelle: "Colle et joints", description: "", unite: "forfait", prix_unitaire: 60, nature: "fourniture", tva: 20, actif: true },
  { id: "p7", libelle: "Déplacement", description: "", unite: "forfait", prix_unitaire: 30, nature: "main_oeuvre", tva: 10, actif: true }
];

export const DEVIS_EXEMPLE: DocumentAvecClient = {
  id: "44444444-4444-4444-4444-444444444444",
  type: "devis",
  sous_type: "standard",
  numero: "D-2026-0003",
  annee: 2026,
  statut: "envoye",
  client_id: CLIENTS_EXEMPLE[0].id,
  client_snapshot: null,
  objet: "Rénovation de la salle de bain",
  adresse_chantier: "",
  date_document: "2026-09-13",
  date_validite: "2026-10-13",
  date_echeance: null,
  date_debut_travaux: "2026-10-05",
  duree_travaux: "2 semaines",
  lignes: [
    ligneVide({ id: "l1", genre: "titre", libelle: "Dépose" }),
    ligneVide({ id: "l2", libelle: "Dépose de l'ancien carrelage", description: "Évacuation des gravats comprise", quantite: 1, unite: "forfait", prix_unitaire: 350 }),
    ligneVide({ id: "l3", genre: "titre", libelle: "Carrelage" }),
    ligneVide({ id: "l4", libelle: "Pose de carrelage sol", description: "Pose droite, joints compris", quantite: 12.5, unite: "m²", prix_unitaire: 40 }),
    ligneVide({ id: "l5", libelle: "Carrelage grès cérame 60×60", quantite: 14, unite: "m²", prix_unitaire: 28, nature: "fourniture" }),
    ligneVide({ id: "l6", libelle: "Colle et joints", quantite: 1, unite: "forfait", prix_unitaire: 60, nature: "fourniture" }),
    ligneVide({ id: "l7", genre: "commentaire", libelle: "Le choix du carrelage se fera avec vous chez le fournisseur." })
  ],
  remise_pourcent: 5,
  deductions: [],
  devis_id: null,
  facture_origine_id: null,
  acompte_pourcent: null,
  total_ht: 1224.5,
  total_tva: 0,
  total_ttc: 1224.5,
  net_a_payer: 1224.5,
  notes: "Accès par le jardin. Travaux le matin uniquement.",
  paye_le: null,
  mode_paiement: null,
  accepte_le: null,
  envoye_le: "2026-09-13T10:00:00Z",
  envoye_a: "marie.dupont@exemple.fr",
  valide_le: "2026-09-13T10:00:00Z",
  created_at: "2026-09-13T09:00:00Z",
  updated_at: "2026-09-13T10:00:00Z",
  clients: { id: CLIENTS_EXEMPLE[0].id, nom: CLIENTS_EXEMPLE[0].nom, email: CLIENTS_EXEMPLE[0].email, type: "particulier" }
};

export const FACTURE_EXEMPLE: DocumentAvecClient = {
  ...DEVIS_EXEMPLE,
  id: "55555555-5555-5555-5555-555555555555",
  type: "facture",
  sous_type: "solde",
  numero: "F-2026-0007",
  statut: "envoyee",
  date_document: "2026-09-13",
  date_validite: null,
  date_echeance: "2026-10-13",
  devis_id: DEVIS_EXEMPLE.id,
  deductions: [{ facture_id: "66666666-6666-6666-6666-666666666666", numero: "F-2026-0005", libelle: "Acompte déjà facturé (facture F-2026-0005)", montant_ttc: 367.35, repartition: { main_oeuvre: 242.25, fourniture: 125.1 } }],
  net_a_payer: 857.15,
  accepte_le: null
};
