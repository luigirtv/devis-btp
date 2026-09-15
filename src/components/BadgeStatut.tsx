import { LIBELLE_STATUT, enRetard } from "@/lib/format";

const COULEURS: Record<string, string> = {
  brouillon: "bg-fond text-muet border border-ligne",
  envoye: "bg-accent-fond text-accent-fonce",
  envoyee: "bg-accent-fond text-accent-fonce",
  accepte: "bg-ok-fond text-ok",
  payee: "bg-ok-fond text-ok",
  refuse: "bg-erreur-fond text-erreur",
  annulee: "bg-erreur-fond text-erreur",
  retard: "bg-alerte-fond text-alerte"
};

export default function BadgeStatut({ statut, echeance, grand = false }: { statut: string; echeance?: string | null; grand?: boolean }) {
  const retard = statut === "envoyee" && enRetard(echeance);
  const cle = retard ? "retard" : statut;
  return <span className={`pastille ${COULEURS[cle] ?? COULEURS.brouillon} ${grand ? "px-3 py-1.5 text-base" : ""}`}>{retard ? "En retard" : LIBELLE_STATUT[statut] ?? statut}</span>;
}
