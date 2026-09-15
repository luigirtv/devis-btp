"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { appeler } from "@/lib/api";
import { calculerTotaux, formatPourcent, totalLigne } from "@/lib/calculs";
import { aujourdhui, dateFr, euros, nombre, titreDocument } from "@/lib/format";
import { MODES_PAIEMENT, type ClientSnapshot, type DocumentAvecClient, type Parametres } from "@/lib/types";
import EnTete from "@/components/EnTete";
import BadgeStatut from "@/components/BadgeStatut";
import Modale, { Confirmation } from "@/components/Modale";
import Erreur from "@/components/Erreur";
import { IcoCheck, IcoCopie, IcoCrayon, IcoCroix, IcoEnvoyer, IcoFleche, IcoPoubelle, IcoTelecharger } from "@/components/Icones";

function Bouton({ cle, enCours, className = "btn-secondaire", onClick, children }: { cle: string; enCours: string | null; className?: string; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" className={className} onClick={onClick} disabled={enCours !== null}>{enCours === cle ? "Un instant…" : children}</button>;
}

type Lie = { id: string; type: string; sous_type: string; numero: string | null; statut: string; net_a_payer: number; date_document: string };

export default function FicheDocument({ document: d, client, parametres: p, emailConfigure, modifiable, lies }: { document: DocumentAvecClient; client: ClientSnapshot | null; parametres: Parametres; emailConfigure: boolean; modifiable: boolean; lies: Lie[] }) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState<string | null>(null);
  const [panneau, setPanneau] = useState<null | "envoi" | "paiement" | "supprimer" | "avoir" | "acompte" | "refuser">(null);
  const [destinataire, setDestinataire] = useState(client?.email ?? "");
  const [message, setMessage] = useState("");
  const [payeLe, setPayeLe] = useState(aujourdhui());
  const [mode, setMode] = useState<string>(MODES_PAIEMENT[0]);
  const [pourcent, setPourcent] = useState(String(p.acompte_pourcent));

  const devis = d.type === "devis";
  const t = calculerTotaux({ lignes: d.lignes, remise_pourcent: d.remise_pourcent, deductions: d.deductions, assujetti_tva: p.assujetti_tva });
  const pdfUrl = `/api/documents/${d.id}/pdf`;
  const acomptesFactures = lies.filter((l) => l.type === "facture" && l.sous_type === "acompte" && l.statut !== "annulee" && l.numero);
  const soldeFacture = lies.find((l) => l.type === "facture" && (l.sous_type === "solde" || l.sous_type === "standard") && l.statut !== "annulee" && l.numero);
  const avoirExistant = lies.find((l) => l.sous_type === "avoir" && l.statut !== "annulee");

  async function agir(cle: string, fn: () => Promise<void>) {
    setEnCours(cle);
    setErreur(null);
    try {
      await fn();
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setEnCours(null);
    }
  }
  const statut = (s: string, extra: Record<string, unknown> = {}) => agir(s, async () => { await appeler(`/api/documents/${d.id}/statut`, "POST", { statut: s, ...extra }); setPanneau(null); router.refresh(); });
  const creer = (corps: unknown, cle: string) => agir(cle, async () => { const { id } = await appeler<{ id: string }>("/api/documents", "POST", corps); router.push(`/documents/${id}`); });
  const envoyer = () => agir("envoi", async () => { await appeler(`/api/documents/${d.id}/envoyer`, "POST", { a: destinataire, message }); setPanneau(null); router.refresh(); });
  const supprimer = () => agir("supprimer", async () => { await appeler(`/api/documents/${d.id}`, "DELETE"); router.push(devis ? "/devis" : "/factures"); });
  const valider = () => agir("valider", async () => { await appeler(`/api/documents/${d.id}/valider`, "POST"); router.refresh(); });

  const mailto = `mailto:${encodeURIComponent(destinataire)}?subject=${encodeURIComponent(`${titreDocument(d)} – ${p.nom_entreprise}`)}&body=${encodeURIComponent(`Bonjour,\n\nVeuillez trouver ci-joint ${devis ? "le devis" : "la facture"} ${d.numero ?? ""}.\n\nCordialement,\n${p.nom_contact || p.nom_entreprise}`)}`;

  // ---------------------------------------------------------------- Actions selon l'état
  const actions: React.ReactNode[] = [];
  const btnPdf = <a key="pdf" href={pdfUrl} target="_blank" rel="noopener" className="btn-secondaire"><IcoTelecharger /> Voir le PDF</a>;
  const btnEnvoyer = <Bouton enCours={enCours} key="envoyer" cle="ouvrir" className="btn-primaire" onClick={() => setPanneau("envoi")}><IcoEnvoyer /> {d.envoye_le ? "Renvoyer au client" : "Envoyer au client"}</Bouton>;
  const btnModifier = <Link key="modifier" href={`/documents/${d.id}/modifier`} className="btn-secondaire"><IcoCrayon /> Modifier</Link>;
  const btnDupliquer = <Bouton enCours={enCours} key="dupliquer" cle="dupliquer" onClick={() => creer({ dupliquer: d.id }, "dupliquer")}><IcoCopie /> Refaire un {devis ? "devis" : "document"} identique</Bouton>;
  const btnSupprimer = <Bouton enCours={enCours} key="supprimer" cle="ouvrir-suppr" className="btn-danger" onClick={() => setPanneau("supprimer")}><IcoPoubelle /> Supprimer</Bouton>;

  if (devis) {
    if (d.statut === "brouillon") actions.push(btnEnvoyer, btnModifier, btnPdf, <Bouton enCours={enCours} key="accepte" cle="accepte" onClick={() => statut("accepte")}><IcoCheck /> Le client a déjà accepté</Bouton>, btnSupprimer);
    if (d.statut === "envoye") actions.push(<Bouton enCours={enCours} key="accepte" cle="accepte" className="btn-ok" onClick={() => statut("accepte")}><IcoCheck /> Le client a accepté</Bouton>, <Bouton enCours={enCours} key="refuse" cle="ouvrir-refus" onClick={() => setPanneau("refuser")}><IcoCroix /> Le client a refusé</Bouton>, btnEnvoyer, btnModifier, btnPdf);
    if (d.statut === "accepte") {
      if (!soldeFacture) {
        if (!acomptesFactures.length) actions.push(<Bouton enCours={enCours} key="acompte" cle="ouvrir-acompte" className="btn-primaire" onClick={() => setPanneau("acompte")}>Facture d'acompte</Bouton>);
        actions.push(<Bouton enCours={enCours} key="solde" cle="solde" className={acomptesFactures.length ? "btn-primaire" : "btn-secondaire"} onClick={() => creer({ depuis_devis: d.id, mode: acomptesFactures.length ? "solde" : "totale" }, "solde")}>{acomptesFactures.length ? "Facture de solde" : "Facturer la totalité"}</Bouton>);
      }
      actions.push(btnPdf, btnDupliquer, <Bouton enCours={enCours} key="refuse" cle="refuse" onClick={() => statut("refuse")}>Finalement refusé</Bouton>);
    }
    if (d.statut === "refuse") actions.push(btnDupliquer, btnPdf, <Bouton enCours={enCours} key="accepte" cle="accepte" onClick={() => statut("accepte")}>Finalement accepté</Bouton>);
  } else {
    if (d.statut === "brouillon") actions.push(btnEnvoyer, btnModifier, btnPdf, <Bouton enCours={enCours} key="valider" cle="valider" onClick={valider}>Valider sans envoyer</Bouton>, btnSupprimer);
    if (d.statut === "envoyee") actions.push(
      d.sous_type === "avoir" ? <Bouton enCours={enCours} key="payee" cle="payee" className="btn-ok" onClick={() => statut("payee")}><IcoCheck /> Remboursement effectué</Bouton> : <Bouton enCours={enCours} key="payee" cle="ouvrir-paiement" className="btn-ok" onClick={() => setPanneau("paiement")}><IcoCheck /> Marquer comme payée</Bouton>,
      btnEnvoyer, btnPdf
    );
    if (d.statut === "payee") actions.push(btnPdf, btnEnvoyer, <Bouton enCours={enCours} key="impayee" cle="envoyee" onClick={() => statut("envoyee")}>Annuler le paiement</Bouton>);
    if (d.statut === "annulee") actions.push(btnPdf);
    if (d.numero && d.sous_type !== "avoir" && d.statut !== "annulee" && !avoirExistant) actions.push(<Bouton enCours={enCours} key="avoir" cle="ouvrir-avoir" className="btn-secondaire text-erreur" onClick={() => setPanneau("avoir")}>Annuler cette facture (avoir)</Bouton>);
  }

  return (
    <div>
      <EnTete titre={titreDocument(d)} retour={devis ? "/devis" : "/factures"} retourLibelle={devis ? "Mes devis" : "Mes factures"} sousTitre={<BadgeStatut statut={d.statut} echeance={d.date_echeance} grand />} />
      <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-5 md:px-8">
        <Erreur message={erreur} />
        {!d.numero && (
          <p className="rounded-xl bg-alerte-fond px-4 py-3 text-alerte">Ce document est un brouillon : il recevra son numéro définitif quand vous l'enverrez ou le validerez.</p>
        )}
        {d.statut === "envoyee" && d.date_echeance && d.date_echeance < aujourdhui() && (
          <p className="rounded-xl bg-alerte-fond px-4 py-3 font-semibold text-alerte">Cette facture devait être payée avant le {dateFr(d.date_echeance)}. Pensez à relancer le client.</p>
        )}

        <section className="carte">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="etiquette">Client</p>
              <p className="text-2xl font-bold">{client?.nom ?? <span className="text-muet">Aucun client</span>}</p>
              {client && <p className="text-muet">{[client.adresse, `${client.code_postal} ${client.ville}`.trim()].filter(Boolean).join(", ")}</p>}
              {client?.telephone && <p className="text-muet">{client.telephone}</p>}
            </div>
            <div className="text-right">
              <p className="etiquette">{devis ? "Montant" : d.sous_type === "avoir" ? "Montant de l'avoir" : "Net à payer"}</p>
              <p className="text-3xl font-bold tabular-nums">{euros(t.net_a_payer)}</p>
            </div>
          </div>
          <dl className="mt-4 grid gap-x-6 gap-y-1 text-base sm:grid-cols-2">
            {d.objet && <div className="sm:col-span-2"><dt className="inline text-muet">Objet : </dt><dd className="inline font-semibold">{d.objet}</dd></div>}
            {d.adresse_chantier && <div className="sm:col-span-2"><dt className="inline text-muet">Travaux à : </dt><dd className="inline">{d.adresse_chantier}</dd></div>}
            <div><dt className="inline text-muet">Date : </dt><dd className="inline">{dateFr(d.date_document)}</dd></div>
            {devis && d.date_validite && <div><dt className="inline text-muet">Valable jusqu'au : </dt><dd className="inline">{dateFr(d.date_validite)}</dd></div>}
            {!devis && d.date_echeance && <div><dt className="inline text-muet">À payer avant le : </dt><dd className="inline">{dateFr(d.date_echeance)}</dd></div>}
            {d.envoye_le && <div><dt className="inline text-muet">Envoyé le : </dt><dd className="inline">{dateFr(d.envoye_le)}{d.envoye_a ? ` à ${d.envoye_a}` : ""}</dd></div>}
            {d.accepte_le && <div><dt className="inline text-muet">Accepté le : </dt><dd className="inline">{dateFr(d.accepte_le)}</dd></div>}
            {d.paye_le && <div><dt className="inline text-muet">Payée le : </dt><dd className="inline">{dateFr(d.paye_le)}{d.mode_paiement ? ` (${d.mode_paiement.toLowerCase()})` : ""}</dd></div>}
          </dl>
        </section>

        <section className="flex flex-col gap-2">{actions}</section>

        {lies.length > 0 && (
          <section className="carte">
            <h2 className="mb-2 text-lg font-bold">{devis ? "Factures de ce devis" : "Documents liés"}</h2>
            <ul className="flex flex-col gap-2">
              {lies.map((l) => (
                <li key={l.id}>
                  <Link href={`/documents/${l.id}`} className="flex items-center gap-3 rounded-xl border border-ligne px-4 py-3 hover:border-accent">
                    <span className="flex-1 font-semibold">{titreDocument(l)}</span>
                    <BadgeStatut statut={l.statut} />
                    <span className="tabular-nums">{euros(l.net_a_payer)}</span>
                    <IcoFleche className="text-muet" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="carte">
          <h2 className="mb-3 text-lg font-bold">Détail</h2>
          <ul className="divide-y divide-ligne">
            {d.lignes.map((l) => (
              <li key={l.id} className={`py-2 ${l.genre === "titre" ? "font-bold text-marine" : l.genre === "commentaire" ? "text-muet italic" : "flex items-baseline justify-between gap-3"}`}>
                {l.genre === "prestation" ? (
                  <>
                    <div className="min-w-0">
                      <p>{l.libelle || <span className="text-muet">(sans libellé)</span>}</p>
                      {l.description && <p className="text-sm text-muet">{l.description}</p>}
                      <p className="text-sm text-muet">{nombre(l.quantite)} {l.unite} × {euros(l.prix_unitaire)}</p>
                    </div>
                    <p className="shrink-0 font-semibold tabular-nums">{euros(totalLigne(l))}</p>
                  </>
                ) : l.libelle}
              </li>
            ))}
          </ul>
          <dl className="mt-3 flex flex-col gap-1 border-t border-ligne pt-3 text-base">
            {t.remise > 0 && <div className="flex justify-between text-ok"><dt>Remise ({formatPourcent(d.remise_pourcent)})</dt><dd>- {euros(t.remise)}</dd></div>}
            <div className="flex justify-between"><dt>Total HT</dt><dd className="tabular-nums">{euros(t.total_ht)}</dd></div>
            {p.assujetti_tva ? t.tva_par_taux.map((x) => <div key={x.taux} className="flex justify-between text-muet"><dt>TVA {formatPourcent(x.taux)}</dt><dd className="tabular-nums">{euros(x.montant)}</dd></div>) : <div className="text-sm text-muet">TVA non applicable, art. 293 B du CGI</div>}
            {d.deductions.map((x) => <div key={x.facture_id} className="flex justify-between text-muet"><dt>{x.libelle}</dt><dd className="tabular-nums">- {euros(x.montant_ttc)}</dd></div>)}
            <div className="flex justify-between text-xl font-bold"><dt>{devis ? "Total" : "Net à payer"}</dt><dd className="tabular-nums">{euros(t.net_a_payer)}</dd></div>
            <p className="text-sm text-muet">Dont main-d'œuvre {euros(t.repartition.main_oeuvre)} et fournitures {euros(t.repartition.fourniture)}.</p>
          </dl>
          {d.notes && <p className="mt-3 rounded-xl bg-fond px-3 py-2 text-muet">{d.notes}</p>}
        </section>
        {modifiable && d.numero && <p className="text-center text-sm text-muet">Ce devis peut encore être modifié tant qu'il n'est pas accepté.</p>}
      </div>

      {/* ---------------------------------------------------------------- Envoi */}
      <Modale titre={`Envoyer ${devis ? "le devis" : "la facture"}`} ouvert={panneau === "envoi"} fermer={() => setPanneau(null)}>
        {!d.numero && <p className="mb-3 rounded-xl bg-accent-fond px-3 py-2 text-accent-fonce">Le document recevra son numéro définitif au moment de l'envoi{devis ? "" : " et ne pourra plus être modifié"}.</p>}
        <label>
          <span className="etiquette">Adresse e-mail du client</span>
          <input className="champ" type="email" value={destinataire} onChange={(e) => setDestinataire(e.target.value)} placeholder="client@exemple.fr" autoFocus />
        </label>
        {emailConfigure ? (
          <>
            <label className="mt-3 block">
              <span className="etiquette">Message (facultatif)</span>
              <textarea className="champ" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={`Bonjour,\nVeuillez trouver ci-joint ${devis ? "le devis" : "la facture"}…`} />
            </label>
            <p className="mt-2 text-sm text-muet">Le PDF sera joint automatiquement. Le client pourra vous répondre sur {p.email || "votre adresse"}.</p>
            <Bouton enCours={enCours} cle="envoi" className="btn-primaire mt-4 w-full" onClick={envoyer}><IcoEnvoyer /> Envoyer maintenant</Bouton>
          </>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            <p className="rounded-xl bg-fond px-3 py-2 text-muet">L'envoi automatique n'est pas activé. Téléchargez le PDF, puis joignez-le à votre e-mail.</p>
            {!d.numero && <Bouton enCours={enCours} cle="valider" className="btn-secondaire w-full" onClick={valider}>1. Attribuer le numéro</Bouton>}
            <a href={`${pdfUrl}?telecharger=1`} className="btn-secondaire w-full"><IcoTelecharger /> {d.numero ? "1." : "2."} Télécharger le PDF</a>
            <a href={mailto} className="btn-primaire w-full" onClick={() => { if (d.statut === "brouillon" && d.numero) statut(devis ? "envoye" : "envoyee"); }}><IcoEnvoyer /> {d.numero ? "2." : "3."} Ouvrir mon e-mail</a>
            {d.numero && d.statut === "brouillon" && <Bouton enCours={enCours} cle={devis ? "envoye" : "envoyee"} className="btn-secondaire w-full" onClick={() => statut(devis ? "envoye" : "envoyee")}>J'ai envoyé le document autrement</Bouton>}
          </div>
        )}
      </Modale>

      {/* ---------------------------------------------------------------- Paiement */}
      <Modale titre="Facture payée" ouvert={panneau === "paiement"} fermer={() => setPanneau(null)}>
        <p className="mb-4 text-lg">Le client a réglé <strong>{euros(t.net_a_payer)}</strong>.</p>
        <label>
          <span className="etiquette">Reçu le</span>
          <input className="champ" type="date" value={payeLe} onChange={(e) => setPayeLe(e.target.value)} max={aujourdhui()} />
        </label>
        <div className="mt-3">
          <span className="etiquette">Comment ?</span>
          <div className="grid grid-cols-2 gap-2">
            {MODES_PAIEMENT.map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)} className={`btn-secondaire btn-petit ${mode === m ? "border-accent bg-accent-fond text-accent-fonce" : ""}`}>{m}</button>
            ))}
          </div>
        </div>
        <Bouton enCours={enCours} cle="payee" className="btn-ok mt-5 w-full" onClick={() => statut("payee", { paye_le: payeLe, mode_paiement: mode })}><IcoCheck /> C'est payé</Bouton>
      </Modale>

      {/* ---------------------------------------------------------------- Acompte */}
      <Modale titre="Facture d'acompte" ouvert={panneau === "acompte"} fermer={() => setPanneau(null)}>
        <p className="mb-4 text-lg">Quel pourcentage du devis ({euros(t.net_a_payer)}) demandez-vous maintenant ?</p>
        <div className="mb-3 grid grid-cols-4 gap-2">
          {[20, 30, 40, 50].map((x) => (
            <button key={x} type="button" onClick={() => setPourcent(String(x))} className={`btn-secondaire btn-petit ${pourcent === String(x) ? "border-accent bg-accent-fond text-accent-fonce" : ""}`}>{x} %</button>
          ))}
        </div>
        <label>
          <span className="etiquette">Ou un autre pourcentage</span>
          <input className="champ" type="number" min="1" max="100" value={pourcent} onChange={(e) => setPourcent(e.target.value)} />
        </label>
        <p className="mt-3 text-lg">Montant de l'acompte : <strong>{euros((t.net_a_payer * (Number(pourcent) || 0)) / 100)}</strong></p>
        <Bouton enCours={enCours} cle="acompte" className="btn-primaire mt-4 w-full" onClick={() => creer({ depuis_devis: d.id, mode: "acompte", acompte_pourcent: Number(pourcent) }, "acompte")}>Préparer la facture d'acompte</Bouton>
      </Modale>

      <Confirmation ouvert={panneau === "supprimer"} titre="Supprimer ce brouillon ?" message="Le document sera définitivement supprimé." libelleOui="Oui, supprimer" danger enCours={enCours === "supprimer"} oui={supprimer} non={() => setPanneau(null)} />
      <Confirmation ouvert={panneau === "refuser"} titre="Le client a refusé ce devis ?" message="Le devis sera classé comme refusé. Vous pourrez toujours en refaire un identique." libelleOui="Oui, refusé" enCours={enCours === "refuse"} oui={() => statut("refuse")} non={() => setPanneau(null)} />
      <Confirmation
        ouvert={panneau === "avoir"}
        titre="Annuler cette facture ?"
        message={<>Une facture validée ne se supprime pas : la loi impose de l'annuler par un <strong>avoir</strong> (une facture en négatif du même montant). L'avoir sera créé en brouillon, à envoyer au client, et cette facture passera en « annulée ». Vous pourrez ensuite refaire une facture correcte.</>}
        libelleOui="Oui, créer l'avoir"
        danger
        enCours={enCours === "avoir"}
        oui={() => agir("avoir", async () => {
          const { id } = await appeler<{ id: string }>("/api/documents", "POST", { avoir_de: d.id });
          await appeler(`/api/documents/${d.id}/statut`, "POST", { statut: "annulee" }).catch(() => undefined);
          router.push(`/documents/${id}`);
        })}
        non={() => setPanneau(null)}
      />
    </div>
  );
}
