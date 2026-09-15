const fmtEuros = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const fmtDate = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
const fmtDateLongue = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

const fmtNombre = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });
// Intl sépare les milliers par une espace fine insécable (U+202F) que les polices PDF standard ne connaissent pas :
// on la remplace par l'espace insécable classique, identique à l'écran.
const espaces = (s: string) => s.replace(/\u202f/g, "\u00a0");

export const euros = (n: number | null | undefined) => espaces(fmtEuros.format(Number(n) || 0));
export const nombre = (n: number) => espaces(fmtNombre.format(n));

export function dateFr(iso: string | null | undefined, longue = false): string {
  if (!iso) return "";
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  if (Number.isNaN(d.getTime())) return "";
  return (longue ? fmtDateLongue : fmtDate).format(d);
}

/** Date du jour au format ISO (AAAA-MM-JJ), en heure locale. */
export function aujourdhui(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function ajouterJours(iso: string, jours: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + jours);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function enRetard(echeance: string | null | undefined): boolean {
  return Boolean(echeance) && echeance! < aujourdhui();
}

export const LIBELLE_STATUT: Record<string, string> = {
  brouillon: "Brouillon",
  envoye: "Envoyé",
  envoyee: "Envoyée",
  accepte: "Accepté",
  refuse: "Refusé",
  payee: "Payée",
  annulee: "Annulée"
};

export const LIBELLE_SOUS_TYPE: Record<string, string> = {
  standard: "",
  acompte: "Facture d'acompte",
  solde: "Facture de solde",
  avoir: "Avoir"
};

export function titreDocument(d: { type: string; sous_type: string; numero: string | null }): string {
  const base = d.type === "devis" ? "Devis" : LIBELLE_SOUS_TYPE[d.sous_type] || "Facture";
  return d.numero ? `${base} ${d.numero}` : `${base} (brouillon)`;
}
