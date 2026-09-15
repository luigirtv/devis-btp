import { Fragment } from "react";
import Link from "next/link";
import EnTete from "@/components/EnTete";
import { chargerParametres, exigerSession } from "@/lib/acces";
import { calculerTotaux } from "@/lib/calculs";
import { euros } from "@/lib/format";
import type { Document } from "@/lib/types";

const MOIS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

/** Chiffre d'affaires encaissé par mois, séparé main-d'œuvre / fournitures (les deux cases de la déclaration URSSAF). */
export default async function Recap({ searchParams }: PageProps<"/recap">) {
  const { annee: a } = (await searchParams) as { annee?: string };
  const annee = Number(a) || new Date().getFullYear();
  const { supabase } = await exigerSession();
  const p = await chargerParametres();
  const { data } = await supabase
    .from("documents")
    .select("*")
    .eq("type", "facture")
    .eq("statut", "payee")
    .gte("paye_le", `${annee}-01-01`)
    .lte("paye_le", `${annee}-12-31`);
  const factures = (data ?? []) as Document[];

  const mois = MOIS.map((nom, i) => ({ nom, mo: 0, fourniture: 0, ttc: 0, nb: 0, index: i }));
  for (const f of factures) {
    const m = Number(f.paye_le!.slice(5, 7)) - 1;
    const t = calculerTotaux({ lignes: f.lignes, remise_pourcent: f.remise_pourcent, deductions: f.deductions, assujetti_tva: p.assujetti_tva });
    // Une facture de solde a déjà vu ses acomptes déclarés : on retire leur part.
    const ded = f.deductions.reduce((s, d) => ({ mo: s.mo + Number(d.repartition?.main_oeuvre ?? 0), fo: s.fo + Number(d.repartition?.fourniture ?? 0) }), { mo: 0, fo: 0 });
    mois[m].mo += t.repartition.main_oeuvre - ded.mo;
    mois[m].fourniture += t.repartition.fourniture - ded.fo;
    mois[m].ttc += t.net_a_payer;
    mois[m].nb += 1;
  }
  const total = mois.reduce((s, m) => ({ mo: s.mo + m.mo, fourniture: s.fourniture + m.fourniture, ttc: s.ttc + m.ttc, nb: s.nb + m.nb }), { mo: 0, fourniture: 0, ttc: 0, nb: 0 });
  const trimestres = [0, 1, 2, 3].map((q) => mois.slice(q * 3, q * 3 + 3).reduce((s, m) => ({ mo: s.mo + m.mo, fourniture: s.fourniture + m.fourniture }), { mo: 0, fourniture: 0 }));

  return (
    <div>
      <EnTete titre="Chiffre d'affaires" sousTitre="Ce que vous avez encaissé, pour votre déclaration URSSAF" />
      <div className="mx-auto max-w-3xl px-4 py-5 md:px-8">
        <div className="mb-4 flex gap-2">
          {[annee - 1, annee, annee + 1].filter((x) => x <= new Date().getFullYear()).map((x) => (
            <Link key={x} href={`/recap?annee=${x}`} className={`pastille px-4 py-2 text-base ${x === annee ? "bg-marine text-white" : "border border-ligne bg-carte"}`}>{x}</Link>
          ))}
        </div>
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <div className="carte"><p className="etiquette">Encaissé en {annee}</p><p className="text-2xl font-bold tabular-nums">{euros(total.ttc)}</p><p className="text-sm text-muet">{total.nb} facture{total.nb > 1 ? "s" : ""} payée{total.nb > 1 ? "s" : ""}</p></div>
          <div className="carte"><p className="etiquette">Dont main-d'œuvre</p><p className="text-2xl font-bold tabular-nums">{euros(total.mo)}</p><p className="text-sm text-muet">Prestations de services</p></div>
          <div className="carte"><p className="etiquette">Dont fournitures</p><p className="text-2xl font-bold tabular-nums">{euros(total.fourniture)}</p><p className="text-sm text-muet">Ventes de marchandises</p></div>
        </div>
        <div className="carte overflow-x-auto p-0">
          <table className="w-full text-base">
            <thead className="bg-fond text-left text-sm text-muet">
              <tr><th className="px-4 py-2">Mois</th><th className="px-4 py-2 text-right">Main-d'œuvre</th><th className="px-4 py-2 text-right">Fournitures</th><th className="px-4 py-2 text-right">Total</th></tr>
            </thead>
            <tbody>
              {mois.map((m, i) => (
                <Fragment key={m.nom}>
                  <tr className={`border-t border-ligne ${m.nb ? "" : "text-muet"}`}>
                    <td className="px-4 py-2">{m.nom}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{euros(m.mo)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{euros(m.fourniture)}</td>
                    <td className="px-4 py-2 text-right font-semibold tabular-nums">{euros(m.mo + m.fourniture)}</td>
                  </tr>
                  {i % 3 === 2 && (
                    <tr className="border-t border-ligne bg-accent-fond/50 text-sm font-semibold">
                      <td className="px-4 py-1.5">Trimestre {Math.floor(i / 3) + 1}</td>
                      <td className="px-4 py-1.5 text-right tabular-nums">{euros(trimestres[Math.floor(i / 3)].mo)}</td>
                      <td className="px-4 py-1.5 text-right tabular-nums">{euros(trimestres[Math.floor(i / 3)].fourniture)}</td>
                      <td className="px-4 py-1.5 text-right tabular-nums">{euros(trimestres[Math.floor(i / 3)].mo + trimestres[Math.floor(i / 3)].fourniture)}</td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-muet">Les montants sont ceux des factures marquées « payée », à la date du paiement. En franchise de TVA, ces montants sont directement ceux à déclarer. Les taux de cotisation diffèrent entre prestations de services et ventes de marchandises : d'où les deux colonnes.</p>
      </div>
    </div>
  );
}
