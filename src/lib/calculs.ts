import type { Deduction, Document, Ligne, Nature, Tranche } from "./types";

export const arrondir = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function totalLigne(l: Ligne): number {
  if (l.genre !== "prestation") return 0;
  return arrondir((Number(l.quantite) || 0) * (Number(l.prix_unitaire) || 0));
}

export type Totaux = {
  sous_total_ht: number;
  remise: number;
  total_ht: number;
  tva_par_taux: { taux: number; base: number; montant: number }[];
  total_tva: number;
  total_ttc: number;
  deductions: number;
  net_a_payer: number;
  repartition: Record<Nature, number>; // HT après remise, par nature (déclaration URSSAF)
};

/**
 * Totaux d'un document. Règles :
 *  - la remise (en %) s'applique sur le sous-total HT, et se répartit au prorata sur chaque ligne ;
 *  - la TVA se calcule par taux sur les bases remisées (0 partout en franchise) ;
 *  - les déductions (acomptes déjà facturés) se retranchent du TTC pour donner le net à payer.
 */
export function calculerTotaux(args: {
  lignes: Ligne[];
  remise_pourcent?: number;
  deductions?: Deduction[];
  assujetti_tva?: boolean;
}): Totaux {
  const prestations = args.lignes.filter((l) => l.genre === "prestation");
  const sous_total_ht = arrondir(prestations.reduce((s, l) => s + totalLigne(l), 0));
  const tauxRemise = Math.min(100, Math.max(0, Number(args.remise_pourcent) || 0)) / 100;
  const remise = arrondir(sous_total_ht * tauxRemise);
  const total_ht = arrondir(sous_total_ht - remise);

  const parTaux = new Map<number, number>();
  const repartition: Record<Nature, number> = { main_oeuvre: 0, fourniture: 0 };
  for (const l of prestations) {
    const base = totalLigne(l) * (1 - tauxRemise);
    const taux = args.assujetti_tva ? Number(l.tva) || 0 : 0;
    parTaux.set(taux, (parTaux.get(taux) ?? 0) + base);
    repartition[l.nature] += base;
  }
  const tva_par_taux = [...parTaux.entries()]
    .filter(([taux]) => taux > 0)
    .sort((a, b) => b[0] - a[0])
    .map(([taux, base]) => ({ taux, base: arrondir(base), montant: arrondir((base * taux) / 100) }));
  const total_tva = arrondir(tva_par_taux.reduce((s, t) => s + t.montant, 0));
  const total_ttc = arrondir(total_ht + total_tva);
  const deductions = arrondir((args.deductions ?? []).reduce((s, d) => s + (Number(d.montant_ttc) || 0), 0));
  const net_a_payer = arrondir(total_ttc - deductions);
  repartition.main_oeuvre = arrondir(repartition.main_oeuvre);
  repartition.fourniture = arrondir(repartition.fourniture);
  return { sous_total_ht, remise, total_ht, tva_par_taux, total_tva, total_ttc, deductions, net_a_payer, repartition };
}

export function nouvelId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function ligneVide(partiel: Partial<Ligne> = {}): Ligne {
  return { id: nouvelId(), genre: "prestation", libelle: "", description: "", quantite: 1, unite: "u", prix_unitaire: 0, nature: "main_oeuvre", tva: 0, ...partiel };
}

/**
 * Lignes d'une facture d'acompte : un pourcentage du devis, une ligne par nature (et par taux de TVA)
 * pour que la répartition main-d'œuvre / fournitures reste juste dans la déclaration URSSAF.
 */
export function lignesAcompte(devis: Pick<Document, "lignes" | "remise_pourcent" | "numero">, pourcent: number, assujetti_tva: boolean, intitule?: string): Ligne[] {
  const tauxRemise = Math.min(100, Math.max(0, Number(devis.remise_pourcent) || 0)) / 100;
  const groupes = new Map<string, { nature: Nature; tva: number; ht: number }>();
  for (const l of devis.lignes) {
    if (l.genre !== "prestation") continue;
    const tva = assujetti_tva ? Number(l.tva) || 0 : 0;
    const cle = `${l.nature}|${tva}`;
    const g = groupes.get(cle) ?? { nature: l.nature, tva, ht: 0 };
    g.ht += totalLigne(l) * (1 - tauxRemise);
    groupes.set(cle, g);
  }
  const plusieurs = groupes.size > 1;
  return [...groupes.values()]
    .filter((g) => g.ht > 0)
    .map((g) =>
      ligneVide({
        libelle: (intitule ?? `Acompte de ${formatPourcent(pourcent)} sur le devis ${devis.numero ?? ""}`).trim() + (plusieurs ? ` – ${g.nature === "main_oeuvre" ? "main-d'œuvre" : "fournitures"}` : ""),
        quantite: 1,
        unite: "forfait",
        prix_unitaire: arrondir((g.ht * pourcent) / 100),
        nature: g.nature,
        tva: g.tva
      })
    );
}

/** Lignes d'un avoir : celles de la facture d'origine, en négatif. */
export function lignesAvoir(facture: Pick<Document, "lignes">): Ligne[] {
  return facture.lignes.map((l) => ({ ...l, id: nouvelId(), prix_unitaire: l.genre === "prestation" ? -l.prix_unitaire : l.prix_unitaire }));
}

export function formatPourcent(p: number): string {
  return `${Number.isInteger(p) ? p : p.toFixed(1).replace(".", ",")} %`;
}

/**
 * Montant de chaque étape de l'échéancier. La dernière absorbe les centimes d'arrondi,
 * pour que la somme des étapes fasse exactement le total.
 */
export function montantsEcheancier(total: number, echeancier: Tranche[]): (Tranche & { montant: number })[] {
  let reste = arrondir(total);
  return echeancier.map((t, i) => {
    const montant = i === echeancier.length - 1 ? reste : arrondir((total * t.pourcent) / 100);
    reste = arrondir(reste - montant);
    return { ...t, montant };
  });
}

/** Intitulé de la facture d'une étape : « Acompte de 40 % à la signature du devis – devis D-2026-0003 ». */
export function intituleTranche(t: Tranche, index: number, numeroDevis: string | null): string {
  return `${index === 0 ? "Acompte" : "Paiement intermédiaire"} de ${formatPourcent(t.pourcent)} ${t.libelle}${numeroDevis ? ` – devis ${numeroDevis}` : ""}`;
}
