"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { appeler } from "@/lib/api";
import { calculerTotaux, formatPourcent, ligneVide, totalLigne } from "@/lib/calculs";
import { dateFr, euros, titreDocument } from "@/lib/format";
import { LIBELLE_NATURE, TAUX_TVA, UNITES, type Client, type DocumentAvecClient, type Ligne, type Parametres, type Prestation } from "@/lib/types";
import EnTete from "@/components/EnTete";
import Modale from "@/components/Modale";
import Erreur from "@/components/Erreur";
import FormulaireClient from "@/components/FormulaireClient";
import { IcoBas, IcoCheck, IcoHaut, IcoLoupe, IcoPlus, IcoPoubelle } from "@/components/Icones";

type Champs = Pick<DocumentAvecClient, "client_id" | "objet" | "adresse_chantier" | "date_document" | "date_validite" | "date_debut_travaux" | "duree_travaux" | "lignes" | "remise_pourcent" | "notes">;

function extraire(d: DocumentAvecClient): Champs {
  return { client_id: d.client_id, objet: d.objet, adresse_chantier: d.adresse_chantier, date_document: d.date_document, date_validite: d.date_validite, date_debut_travaux: d.date_debut_travaux, duree_travaux: d.duree_travaux, lignes: d.lignes, remise_pourcent: Number(d.remise_pourcent), notes: d.notes };
}

export default function EditeurDocument({ document: initial, clients: clientsInitiaux, prestations, parametres: p }: { document: DocumentAvecClient; clients: Client[]; prestations: Prestation[]; parametres: Parametres }) {
  const router = useRouter();
  const [doc, setDoc] = useState<Champs>(() => extraire(initial));
  const [clients, setClients] = useState(clientsInitiaux);
  const [sauvegarde, setSauvegarde] = useState<"ok" | "en_cours" | "attente" | "erreur">("ok");
  const [erreur, setErreur] = useState<string | null>(null);
  const [panneau, setPanneau] = useState<null | "client" | "nouveau_client" | "catalogue">(null);
  const [remiseVisible, setRemiseVisible] = useState(Number(initial.remise_pourcent) > 0);
  const [details, setDetails] = useState<Set<string>>(() => new Set(initial.lignes.filter((l) => l.description).map((l) => l.id)));
  const [recherche, setRecherche] = useState("");
  const dernierEnvoye = useRef(JSON.stringify(extraire(initial)));
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusLigne = useRef<string | null>(null);

  const devis = initial.type === "devis";
  const client = clients.find((c) => c.id === doc.client_id) ?? null;
  const totaux = useMemo(() => calculerTotaux({ lignes: doc.lignes, remise_pourcent: doc.remise_pourcent, deductions: initial.deductions, assujetti_tva: p.assujetti_tva }), [doc.lignes, doc.remise_pourcent, initial.deductions, p.assujetti_tva]);

  // Sauvegarde automatique, 700 ms après la dernière modification.
  const enregistrer = useCallback(async (etat: Champs) => {
    const json = JSON.stringify(etat);
    if (json === dernierEnvoye.current) { setSauvegarde("ok"); return; }
    setSauvegarde("en_cours");
    try {
      await appeler(`/api/documents/${initial.id}`, "PATCH", etat);
      dernierEnvoye.current = json;
      setSauvegarde("ok");
      setErreur(null);
    } catch (e) {
      setSauvegarde("erreur");
      setErreur(`Impossible d'enregistrer : ${(e as Error).message}`);
    }
  }, [initial.id]);

  useEffect(() => {
    if (JSON.stringify(doc) === dernierEnvoye.current) return;
    setSauvegarde("attente");
    if (minuteur.current) clearTimeout(minuteur.current);
    minuteur.current = setTimeout(() => enregistrer(doc), 700);
    return () => { if (minuteur.current) clearTimeout(minuteur.current); };
  }, [doc, enregistrer]);

  useEffect(() => {
    const avertir = (e: BeforeUnloadEvent) => { if (sauvegarde !== "ok") { e.preventDefault(); } };
    window.addEventListener("beforeunload", avertir);
    return () => window.removeEventListener("beforeunload", avertir);
  }, [sauvegarde]);

  useEffect(() => {
    if (!focusLigne.current) return;
    const el = window.document.querySelector<HTMLInputElement>(`[data-ligne="${focusLigne.current}"] input`);
    el?.focus();
    focusLigne.current = null;
  });

  const maj = (partiel: Partial<Champs>) => setDoc((d) => ({ ...d, ...partiel }));
  const majLigne = (id: string, partiel: Partial<Ligne>) => maj({ lignes: doc.lignes.map((l) => (l.id === id ? { ...l, ...partiel } : l)) });
  const ajouterLigne = (l: Ligne) => { focusLigne.current = l.id; maj({ lignes: [...doc.lignes, l] }); };
  const supprimerLigne = (id: string) => maj({ lignes: doc.lignes.filter((l) => l.id !== id) });
  const deplacer = (index: number, sens: -1 | 1) => {
    const cible = index + sens;
    if (cible < 0 || cible >= doc.lignes.length) return;
    const l = [...doc.lignes];
    [l[index], l[cible]] = [l[cible], l[index]];
    maj({ lignes: l });
  };
  const ajouterPrestation = (pr: Prestation) => {
    ajouterLigne(ligneVide({ libelle: pr.libelle, description: pr.description, unite: pr.unite, prix_unitaire: Number(pr.prix_unitaire), nature: pr.nature, tva: Number(pr.tva) }));
    setPanneau(null);
    setRecherche("");
  };
  const choisirClient = (c: Client) => {
    setClients((liste) => (liste.some((x) => x.id === c.id) ? liste.map((x) => (x.id === c.id ? c : x)) : [...liste, c]));
    maj({ client_id: c.id });
    setPanneau(null);
    setRecherche("");
  };

  async function terminer() {
    if (minuteur.current) clearTimeout(minuteur.current);
    await enregistrer(doc);
    router.push(`/documents/${initial.id}`);
  }

  const filtre = recherche.trim().toLowerCase();
  const clientsFiltres = clients.filter((c) => !c.archive && (!filtre || c.nom.toLowerCase().includes(filtre) || c.ville.toLowerCase().includes(filtre)));
  const prestationsFiltrees = prestations.filter((x) => x.actif && (!filtre || x.libelle.toLowerCase().includes(filtre)));
  const nbPrestations = doc.lignes.filter((l) => l.genre === "prestation").length;

  const etatSauvegarde = { ok: "Enregistré", en_cours: "Enregistrement…", attente: "Modifications en cours…", erreur: "Non enregistré" }[sauvegarde];

  return (
    <div className="pb-24 md:pb-28">
      <EnTete
        titre={titreDocument(initial)}
        retour={`/documents/${initial.id}`}
        retourLibelle="Retour à la fiche"
        sousTitre={<span className={`inline-flex items-center gap-1 ${sauvegarde === "erreur" ? "text-erreur" : sauvegarde === "ok" ? "text-ok" : ""}`}>{sauvegarde === "ok" && <IcoCheck width={18} height={18} />}{etatSauvegarde}</span>}
      />

      <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-5 md:px-8">
        <Erreur message={erreur} />

        {/* ---------------------------------------------------------- Client */}
        <section className="carte">
          <h2 className="mb-3 text-lg font-bold">1. Le client</h2>
          {client ? (
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-xl font-bold">{client.nom}</p>
                <p className="text-muet">{[client.adresse, `${client.code_postal} ${client.ville}`.trim()].filter(Boolean).join(", ")}</p>
                {client.telephone && <p className="text-muet">{client.telephone}</p>}
              </div>
              <button type="button" className="btn-secondaire btn-petit" onClick={() => setPanneau("client")}>Changer</button>
            </div>
          ) : (
            <button type="button" className="btn-primaire w-full" onClick={() => setPanneau("client")}>Choisir le client</button>
          )}
        </section>

        {/* ---------------------------------------------------------- Chantier */}
        <section className="carte flex flex-col gap-4">
          <h2 className="text-lg font-bold">2. Le chantier</h2>
          <label>
            <span className="etiquette">De quoi s'agit-il ?</span>
            <input className="champ" value={doc.objet} onChange={(e) => maj({ objet: e.target.value })} placeholder="Ex. Rénovation de la salle de bain" />
          </label>
          <label>
            <span className="etiquette">Adresse des travaux</span>
            <input className="champ" value={doc.adresse_chantier} onChange={(e) => maj({ adresse_chantier: e.target.value })} placeholder={client ? "Laissez vide si c'est l'adresse du client" : "Adresse où auront lieu les travaux"} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="etiquette">Date du {devis ? "devis" : "document"}</span>
              <input className="champ" type="date" value={doc.date_document} onChange={(e) => maj({ date_document: e.target.value })} disabled={!devis && Boolean(initial.numero)} />
            </label>
            {devis && (
              <label>
                <span className="etiquette">Valable jusqu'au</span>
                <input className="champ" type="date" value={doc.date_validite ?? ""} onChange={(e) => maj({ date_validite: e.target.value || null })} />
              </label>
            )}
          </div>
          {devis && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="etiquette">Début des travaux prévu</span>
                <input className="champ" type="date" value={doc.date_debut_travaux ?? ""} onChange={(e) => maj({ date_debut_travaux: e.target.value || null })} />
              </label>
              <label>
                <span className="etiquette">Durée estimée</span>
                <input className="champ" value={doc.duree_travaux} onChange={(e) => maj({ duree_travaux: e.target.value })} placeholder="Ex. 2 semaines" />
              </label>
            </div>
          )}
        </section>

        {/* ---------------------------------------------------------- Lignes */}
        <section className="carte">
          <h2 className="mb-3 text-lg font-bold">3. Les travaux et fournitures</h2>
          {doc.lignes.length === 0 && <p className="mb-3 rounded-xl bg-fond px-4 py-3 text-muet">Aucune ligne pour l'instant. Ajoutez vos prestations avec les boutons ci-dessous.</p>}
          <ol className="flex flex-col gap-3">
            {doc.lignes.map((l, i) => (
              <li key={l.id} data-ligne={l.id} className={`rounded-2xl border-2 p-3 ${l.genre === "titre" ? "border-accent-fond bg-accent-fond/40" : l.genre === "commentaire" ? "border-dashed border-ligne" : "border-ligne"}`}>
                {l.genre === "titre" && (
                  <input className="champ font-bold" value={l.libelle} onChange={(e) => majLigne(l.id, { libelle: e.target.value })} placeholder="Titre de partie (ex. Salle de bain)" />
                )}
                {l.genre === "commentaire" && (
                  <textarea className="champ" rows={2} value={l.libelle} onChange={(e) => majLigne(l.id, { libelle: e.target.value })} placeholder="Commentaire (sans prix)" />
                )}
                {l.genre === "prestation" && (
                  <div className="flex flex-col gap-2">
                    <input className="champ" value={l.libelle} onChange={(e) => majLigne(l.id, { libelle: e.target.value })} placeholder="Description du travail ou de la fourniture" />
                    {details.has(l.id) && (
                      <textarea className="champ champ-petit" rows={2} value={l.description} onChange={(e) => majLigne(l.id, { description: e.target.value })} placeholder="Détail (facultatif, apparaît en petit sous la ligne)" />
                    )}
                    <div className="grid grid-cols-[1fr_1fr] items-end gap-2 sm:grid-cols-[1fr_1fr_1.4fr_1.2fr]">
                      <label>
                        <span className="etiquette">Quantité</span>
                        <input className="champ champ-petit" type="number" inputMode="decimal" step="any" min="0" value={l.quantite} onChange={(e) => majLigne(l.id, { quantite: e.target.value === "" ? 0 : Number(e.target.value) })} onFocus={(e) => e.target.select()} />
                      </label>
                      <label>
                        <span className="etiquette">Unité</span>
                        <select className="champ champ-petit" value={l.unite} onChange={(e) => majLigne(l.id, { unite: e.target.value })}>
                          {(UNITES as readonly string[]).includes(l.unite) ? null : <option value={l.unite}>{l.unite}</option>}
                          {UNITES.map((u) => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </label>
                      <label>
                        <span className="etiquette">Prix unitaire{p.assujetti_tva ? " HT" : ""}</span>
                        <div className="relative">
                          <input className="champ champ-petit pr-8" type="number" inputMode="decimal" step="0.01" value={l.prix_unitaire} onChange={(e) => majLigne(l.id, { prix_unitaire: e.target.value === "" ? 0 : Number(e.target.value) })} onFocus={(e) => e.target.select()} />
                          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muet">€</span>
                        </div>
                      </label>
                      <div className="text-right">
                        <span className="etiquette">Total</span>
                        <p className="min-h-12 py-2 text-xl font-bold tabular-nums">{euros(totalLigne(l))}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex rounded-xl border border-ligne p-0.5" role="radiogroup" aria-label="Nature">
                        {(["main_oeuvre", "fourniture"] as const).map((n) => (
                          <button key={n} type="button" role="radio" aria-checked={l.nature === n} onClick={() => majLigne(l.id, { nature: n })} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${l.nature === n ? "bg-marine text-white" : "text-muet"}`}>{LIBELLE_NATURE[n]}</button>
                        ))}
                      </div>
                      {p.assujetti_tva && (
                        <select className="champ champ-petit w-auto min-h-10 py-1 text-sm" value={l.tva} onChange={(e) => majLigne(l.id, { tva: Number(e.target.value) })} aria-label="TVA">
                          {TAUX_TVA.map((t) => <option key={t} value={t}>TVA {formatPourcent(t)}</option>)}
                        </select>
                      )}
                      {!details.has(l.id) && <button type="button" className="text-sm font-semibold text-accent" onClick={() => setDetails(new Set(details).add(l.id))}>+ Ajouter un détail</button>}
                    </div>
                  </div>
                )}
                <div className="mt-2 flex items-center justify-end gap-1">
                  <button type="button" className="flex h-10 w-10 items-center justify-center rounded-lg text-muet hover:bg-fond disabled:opacity-30" onClick={() => deplacer(i, -1)} disabled={i === 0} aria-label="Monter"><IcoHaut /></button>
                  <button type="button" className="flex h-10 w-10 items-center justify-center rounded-lg text-muet hover:bg-fond disabled:opacity-30" onClick={() => deplacer(i, 1)} disabled={i === doc.lignes.length - 1} aria-label="Descendre"><IcoBas /></button>
                  <button type="button" className="flex h-10 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-erreur hover:bg-erreur-fond" onClick={() => supprimerLigne(l.id)}><IcoPoubelle width={18} height={18} /> Retirer</button>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button type="button" className="btn-primaire flex-1" onClick={() => setPanneau("catalogue")}><IcoPlus /> Mes prestations</button>
            <button type="button" className="btn-secondaire flex-1" onClick={() => ajouterLigne(ligneVide({ tva: p.assujetti_tva ? 20 : 0 }))}><IcoPlus /> Ligne libre</button>
            <button type="button" className="btn-secondaire" onClick={() => ajouterLigne(ligneVide({ genre: "titre" }))}>Titre</button>
          </div>
        </section>

        {/* ---------------------------------------------------------- Totaux, remise, notes */}
        <section className="carte flex flex-col gap-3">
          <h2 className="text-lg font-bold">4. Le total</h2>
          {remiseVisible ? (
            <label className="flex items-center justify-between gap-3">
              <span className="text-lg">Remise sur l'ensemble</span>
              <span className="relative w-32">
                <input className="champ champ-petit pr-8" type="number" inputMode="decimal" min="0" max="100" step="0.5" value={doc.remise_pourcent} onChange={(e) => maj({ remise_pourcent: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })} onFocus={(e) => e.target.select()} />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muet">%</span>
              </span>
            </label>
          ) : (
            <button type="button" className="self-start text-base font-semibold text-accent" onClick={() => setRemiseVisible(true)}>+ Faire une remise</button>
          )}
          <dl className="flex flex-col gap-1 text-lg">
            {totaux.remise > 0 && (
              <>
                <div className="flex justify-between"><dt>Sous-total</dt><dd className="tabular-nums">{euros(totaux.sous_total_ht)}</dd></div>
                <div className="flex justify-between text-ok"><dt>Remise ({formatPourcent(doc.remise_pourcent)})</dt><dd className="tabular-nums">- {euros(totaux.remise)}</dd></div>
              </>
            )}
            <div className="flex justify-between"><dt>Total HT</dt><dd className="tabular-nums">{euros(totaux.total_ht)}</dd></div>
            {p.assujetti_tva ? (
              totaux.tva_par_taux.map((t) => <div key={t.taux} className="flex justify-between text-muet"><dt>TVA {formatPourcent(t.taux)}</dt><dd className="tabular-nums">{euros(t.montant)}</dd></div>)
            ) : (
              <div className="flex justify-between text-sm text-muet"><dt>TVA non applicable (art. 293 B du CGI)</dt><dd /></div>
            )}
            {initial.deductions.map((d) => <div key={d.facture_id} className="flex justify-between text-muet"><dt>{d.libelle}</dt><dd className="tabular-nums">- {euros(d.montant_ttc)}</dd></div>)}
            <div className="mt-1 flex justify-between border-t border-ligne pt-2 text-2xl font-bold"><dt>{devis ? "Total du devis" : "Net à payer"}</dt><dd className="tabular-nums">{euros(totaux.net_a_payer)}</dd></div>
          </dl>
          <p className="text-sm text-muet">Dont main-d'œuvre {euros(totaux.repartition.main_oeuvre)} et fournitures {euros(totaux.repartition.fourniture)} (pour votre déclaration URSSAF).</p>
          <label>
            <span className="etiquette">Remarques (visibles sur le document)</span>
            <textarea className="champ" rows={2} value={doc.notes} onChange={(e) => maj({ notes: e.target.value })} placeholder="Ex. Accès par le jardin, travaux le matin uniquement…" />
          </label>
          {!devis && initial.numero && <p className="text-sm text-muet">Date d'émission : {dateFr(initial.date_document)}.</p>}
        </section>
      </div>

      {/* ---------------------------------------------------------- Barre du bas */}
      <div className="no-print fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 border-t border-ligne bg-carte/95 px-4 py-3 backdrop-blur md:bottom-0 md:left-64 md:pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muet">{nbPrestations} ligne{nbPrestations > 1 ? "s" : ""}</p>
            <p className="text-2xl font-bold tabular-nums">{euros(totaux.net_a_payer)}</p>
          </div>
          <button type="button" className="btn-primaire px-8" onClick={terminer} disabled={sauvegarde === "en_cours"}>
            <IcoCheck /> Terminer
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------------- Panneaux */}
      <Modale titre="Choisir le client" ouvert={panneau === "client"} fermer={() => setPanneau(null)}>
        <div className="relative mb-3">
          <IcoLoupe className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muet" />
          <input className="champ pl-12" value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Nom ou ville" autoFocus />
        </div>
        <button type="button" className="btn-secondaire mb-3 w-full" onClick={() => setPanneau("nouveau_client")}><IcoPlus /> Nouveau client</button>
        <ul className="flex flex-col gap-2">
          {clientsFiltres.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => choisirClient(c)} className={`w-full rounded-xl border-2 px-4 py-3 text-left hover:border-accent ${c.id === doc.client_id ? "border-accent bg-accent-fond" : "border-ligne"}`}>
                <p className="text-lg font-semibold">{c.nom}</p>
                <p className="text-sm text-muet">{[c.ville, c.telephone].filter(Boolean).join(" · ")}</p>
              </button>
            </li>
          ))}
          {!clientsFiltres.length && <li className="py-4 text-center text-muet">{clients.length ? "Aucun client ne correspond." : "Vous n'avez pas encore de client."}</li>}
        </ul>
      </Modale>

      <Modale titre="Nouveau client" ouvert={panneau === "nouveau_client"} fermer={() => setPanneau("client")}>
        <FormulaireClient fait={choisirClient} annuler={() => setPanneau("client")} />
      </Modale>

      <Modale titre="Mes prestations" ouvert={panneau === "catalogue"} fermer={() => setPanneau(null)} large>
        <div className="relative mb-3">
          <IcoLoupe className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muet" />
          <input className="champ pl-12" value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher une prestation" autoFocus />
        </div>
        <ul className="flex flex-col gap-2">
          {prestationsFiltrees.map((pr) => (
            <li key={pr.id}>
              <button type="button" onClick={() => ajouterPrestation(pr)} className="flex w-full items-center gap-3 rounded-xl border-2 border-ligne px-4 py-3 text-left hover:border-accent">
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-semibold">{pr.libelle}</p>
                  <p className="text-sm text-muet">{LIBELLE_NATURE[pr.nature]}{pr.description ? ` · ${pr.description}` : ""}</p>
                </div>
                <p className="shrink-0 text-lg font-bold tabular-nums">{euros(pr.prix_unitaire)} <span className="text-sm font-normal text-muet">/ {pr.unite}</span></p>
                <IcoPlus className="shrink-0 text-accent" />
              </button>
            </li>
          ))}
          {!prestationsFiltrees.length && (
            <li className="py-4 text-center text-muet">
              {prestations.length ? "Aucune prestation ne correspond." : <>Votre catalogue est vide. <Link href="/catalogue" className="font-semibold text-accent">Ajoutez vos prestations habituelles</Link>.</>}
            </li>
          )}
        </ul>
        <button type="button" className="btn-secondaire mt-3 w-full" onClick={() => { ajouterLigne(ligneVide({ libelle: recherche.trim(), tva: p.assujetti_tva ? 20 : 0 })); setPanneau(null); setRecherche(""); }}>
          <IcoPlus /> Ajouter une ligne libre{recherche.trim() ? ` « ${recherche.trim()} »` : ""}
        </button>
      </Modale>
    </div>
  );
}
