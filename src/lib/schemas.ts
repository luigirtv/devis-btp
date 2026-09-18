import { z } from "zod";

export const schemaClient = z.object({
  nom: z.string().trim().min(1, "Le nom est obligatoire").max(200),
  type: z.enum(["particulier", "professionnel"]).default("particulier"),
  adresse: z.string().max(300).default(""),
  code_postal: z.string().max(10).default(""),
  ville: z.string().max(100).default(""),
  telephone: z.string().max(30).default(""),
  email: z.string().trim().max(200).default("").refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "E-mail invalide"),
  siret: z.string().max(20).default(""),
  notes: z.string().max(2000).default(""),
  archive: z.boolean().optional()
});

export const schemaPrestation = z.object({
  libelle: z.string().trim().min(1, "Le libellé est obligatoire").max(300),
  description: z.string().max(2000).default(""),
  unite: z.string().max(20).default("u"),
  prix_unitaire: z.coerce.number().finite().default(0),
  nature: z.enum(["main_oeuvre", "fourniture"]).default("main_oeuvre"),
  tva: z.coerce.number().min(0).max(100).default(0),
  actif: z.boolean().optional()
});

export const schemaParametres = z.object({
  nom_entreprise: z.string().max(200),
  nom_contact: z.string().max(200),
  adresse: z.string().max(300),
  code_postal: z.string().max(10),
  ville: z.string().max(100),
  telephone: z.string().max(30),
  email: z.string().max(200),
  siret: z.string().max(20),
  immatriculation: z.string().max(200),
  assujetti_tva: z.boolean(),
  numero_tva: z.string().max(30),
  assurance_nom: z.string().max(200),
  assurance_contrat: z.string().max(100),
  assurance_couverture: z.string().max(200),
  iban: z.string().max(40),
  bic: z.string().max(15),
  validite_devis_jours: z.coerce.number().int().min(1).max(365),
  delai_paiement_jours: z.coerce.number().int().min(0).max(365),
  acompte_pourcent: z.coerce.number().min(0).max(100),
  echeancier: z
    .array(z.object({ libelle: z.string().trim().min(1, "Chaque étape de paiement doit avoir un libellé").max(120), pourcent: z.coerce.number().min(1).max(100) }))
    .min(1)
    .max(6)
    .refine((t) => Math.abs(t.reduce((s, x) => s + x.pourcent, 0) - 100) < 0.01, "Les étapes de paiement doivent faire 100 % au total"),
  mentions_devis: z.string().max(3000),
  mentions_facture: z.string().max(3000),
  logo_data: z.string().max(400_000).nullable(),
  prefixe_devis: z.string().trim().min(1).max(5),
  prefixe_facture: z.string().trim().min(1).max(5)
}).partial();

/** Message d'erreur lisible pour un humain à partir d'une erreur zod. */
export function messageZod(e: z.ZodError): string {
  return e.issues.map((i) => i.message).join(". ");
}
