import { Document as Pdf, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { calculerTotaux, formatPourcent, totalLigne } from "@/lib/calculs";
import { dateFr, euros, nombre } from "@/lib/format";
import type { ClientSnapshot, Document, Parametres } from "@/lib/types";

const MARINE = "#0f2a4a";
const GRIS = "#5f6f83";
const LIGNE = "#dde3ea";

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9.5, color: "#0f1c2e", paddingTop: 36, paddingBottom: 70, paddingHorizontal: 40 },
  entete: { flexDirection: "row", justifyContent: "space-between", marginBottom: 22 },
  logo: { maxWidth: 140, maxHeight: 60, marginBottom: 8, objectFit: "contain" },
  entreprise: { fontSize: 12, fontFamily: "Helvetica-Bold", color: MARINE },
  petit: { color: GRIS, fontSize: 9 },
  titre: { fontSize: 22, fontFamily: "Helvetica-Bold", color: MARINE, textAlign: "right" },
  numero: { fontSize: 11, fontFamily: "Helvetica-Bold", textAlign: "right", marginTop: 2 },
  blocs: { flexDirection: "row", justifyContent: "space-between", marginBottom: 18 },
  bloc: { width: "47%", padding: 10, borderRadius: 4, backgroundColor: "#f3f5f8" },
  etiquette: { fontSize: 8, color: GRIS, textTransform: "uppercase", marginBottom: 3, letterSpacing: 0.5 },
  gras: { fontFamily: "Helvetica-Bold" },
  objet: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 10 },
  table: { marginBottom: 12 },
  tete: { flexDirection: "row", backgroundColor: MARINE, color: "#fff", paddingVertical: 5, paddingHorizontal: 6, fontFamily: "Helvetica-Bold", fontSize: 8.5 },
  rang: { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 6, borderBottomWidth: 0.5, borderBottomColor: LIGNE },
  rangTitre: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 6, backgroundColor: "#e8f0fe", fontFamily: "Helvetica-Bold", marginTop: 4 },
  rangCommentaire: { paddingVertical: 4, paddingHorizontal: 6, color: GRIS, fontStyle: "italic" },
  cDesignation: { flex: 1, paddingRight: 6 },
  cQte: { width: 48, textAlign: "right" },
  cUnite: { width: 40, textAlign: "center" },
  cPu: { width: 70, textAlign: "right" },
  cTotal: { width: 76, textAlign: "right" },
  description: { color: GRIS, fontSize: 8.5, marginTop: 1.5 },
  totaux: { alignSelf: "flex-end", width: 250, marginBottom: 16 },
  ligneTotal: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, paddingHorizontal: 6 },
  net: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 7, paddingHorizontal: 8, backgroundColor: MARINE, color: "#fff", fontFamily: "Helvetica-Bold", fontSize: 12, borderRadius: 4, marginTop: 4 },
  section: { marginBottom: 12 },
  sectionTitre: { fontSize: 9, fontFamily: "Helvetica-Bold", color: MARINE, marginBottom: 3 },
  signature: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  cadre: { width: "47%", height: 80, borderWidth: 1, borderColor: LIGNE, borderRadius: 4, padding: 8 },
  pied: { position: "absolute", left: 40, right: 40, bottom: 28, borderTopWidth: 0.5, borderTopColor: LIGNE, paddingTop: 6, fontSize: 7.5, color: GRIS, textAlign: "center" },
  filigrane: { position: "absolute", top: 300, left: 0, right: 0, textAlign: "center", fontSize: 80, color: "#e5e7eb", fontFamily: "Helvetica-Bold", transform: "rotate(-25deg)" }
});

function adresse(a: { adresse: string; code_postal: string; ville: string }): string[] {
  return [a.adresse, `${a.code_postal} ${a.ville}`.trim()].filter(Boolean);
}

function titrePdf(d: Document): string {
  if (d.type === "devis") return "DEVIS";
  if (d.sous_type === "avoir") return "AVOIR";
  if (d.sous_type === "acompte") return "FACTURE D'ACOMPTE";
  if (d.sous_type === "solde") return "FACTURE DE SOLDE";
  return "FACTURE";
}

export default function DocumentPdf({ d, p, client }: { d: Document; p: Parametres; client: ClientSnapshot | null }) {
  const t = calculerTotaux({ lignes: d.lignes, remise_pourcent: d.remise_pourcent, deductions: d.deductions, assujetti_tva: p.assujetti_tva });
  const devis = d.type === "devis";
  const brouillon = !d.numero;
  const mentions = devis ? p.mentions_devis : p.mentions_facture;
  const pro = client?.type === "professionnel";

  const piedParties = [
    p.nom_entreprise,
    p.siret ? `SIRET ${p.siret}` : "",
    p.immatriculation,
    p.assujetti_tva ? (p.numero_tva ? `TVA ${p.numero_tva}` : "") : "TVA non applicable, art. 293 B du CGI",
    p.assurance_nom ? `Assurance professionnelle et décennale : ${p.assurance_nom}${p.assurance_contrat ? ` (contrat ${p.assurance_contrat})` : ""}, couverture ${p.assurance_couverture || "France"}` : ""
  ].filter(Boolean);

  return (
    <Pdf title={`${titrePdf(d)} ${d.numero ?? ""}`.trim()} author={p.nom_entreprise}>
      <Page size="A4" style={s.page}>
        {brouillon && <Text style={s.filigrane} fixed>BROUILLON</Text>}

        <View style={s.entete}>
          <View style={{ maxWidth: 280 }}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            {p.logo_data && <Image src={p.logo_data} style={s.logo} />}
            <Text style={s.entreprise}>{p.nom_entreprise || "Mon entreprise"}</Text>
            {p.nom_contact && <Text>{p.nom_contact}</Text>}
            {adresse(p).map((l) => <Text key={l}>{l}</Text>)}
            {p.telephone && <Text style={s.petit}>Tél. {p.telephone}</Text>}
            {p.email && <Text style={s.petit}>{p.email}</Text>}
          </View>
          <View>
            <Text style={s.titre}>{titrePdf(d)}</Text>
            <Text style={s.numero}>{d.numero ? `N° ${d.numero}` : "Brouillon"}</Text>
            <Text style={{ textAlign: "right", marginTop: 6 }}>Date : {dateFr(d.date_document)}</Text>
            {devis && d.date_validite && <Text style={{ textAlign: "right" }}>Valable jusqu'au {dateFr(d.date_validite)}</Text>}
            {!devis && d.sous_type !== "avoir" && d.date_echeance && <Text style={{ textAlign: "right" }}>À régler avant le {dateFr(d.date_echeance)}</Text>}
            {!devis && d.sous_type === "avoir" && d.facture_origine_id && <Text style={{ textAlign: "right" }}>Annule la facture d'origine</Text>}
          </View>
        </View>

        <View style={s.blocs}>
          <View style={s.bloc}>
            <Text style={s.etiquette}>Client</Text>
            <Text style={s.gras}>{client?.nom ?? "—"}</Text>
            {client && adresse(client).map((l) => <Text key={l}>{l}</Text>)}
            {client?.telephone && <Text style={s.petit}>Tél. {client.telephone}</Text>}
            {client?.email && <Text style={s.petit}>{client.email}</Text>}
            {pro && client?.siret && <Text style={s.petit}>SIREN/SIRET {client.siret}</Text>}
          </View>
          <View style={s.bloc}>
            <Text style={s.etiquette}>Lieu des travaux</Text>
            <Text>{d.adresse_chantier || (client ? adresse(client).join(", ") : "—")}</Text>
            {devis && d.date_debut_travaux && <Text style={{ marginTop: 4 }}>Début des travaux : {dateFr(d.date_debut_travaux)}</Text>}
            {devis && d.duree_travaux && <Text>Durée estimée : {d.duree_travaux}</Text>}
          </View>
        </View>

        {d.objet ? <Text style={s.objet}>Objet : {d.objet}</Text> : null}

        <View style={s.table}>
          <View style={s.tete} fixed>
            <Text style={s.cDesignation}>Désignation</Text>
            <Text style={s.cQte}>Qté</Text>
            <Text style={s.cUnite}>Unité</Text>
            <Text style={s.cPu}>{p.assujetti_tva ? "P.U. HT" : "Prix unitaire"}</Text>
            <Text style={s.cTotal}>{p.assujetti_tva ? "Total HT" : "Montant"}</Text>
          </View>
          {d.lignes.map((l) => {
            if (l.genre === "titre") return <View key={l.id} style={s.rangTitre} wrap={false}><Text>{l.libelle}</Text></View>;
            if (l.genre === "commentaire") return <View key={l.id} style={s.rangCommentaire} wrap={false}><Text>{l.libelle}</Text></View>;
            return (
              <View key={l.id} style={s.rang} wrap={false}>
                <View style={s.cDesignation}>
                  <Text>{l.libelle}</Text>
                  {l.description ? <Text style={s.description}>{l.description}</Text> : null}
                </View>
                <Text style={s.cQte}>{nombre(l.quantite)}</Text>
                <Text style={s.cUnite}>{l.unite}</Text>
                <Text style={s.cPu}>{euros(l.prix_unitaire)}</Text>
                <Text style={s.cTotal}>{euros(totalLigne(l))}</Text>
              </View>
            );
          })}
        </View>

        <View style={s.totaux} wrap={false}>
          {t.remise > 0 && (
            <>
              <View style={s.ligneTotal}><Text>Sous-total</Text><Text>{euros(t.sous_total_ht)}</Text></View>
              <View style={s.ligneTotal}><Text>Remise ({formatPourcent(d.remise_pourcent)})</Text><Text>- {euros(t.remise)}</Text></View>
            </>
          )}
          <View style={s.ligneTotal}><Text style={s.gras}>Total HT</Text><Text style={s.gras}>{euros(t.total_ht)}</Text></View>
          {p.assujetti_tva ? (
            t.tva_par_taux.map((x) => <View key={x.taux} style={s.ligneTotal}><Text>TVA {formatPourcent(x.taux)} sur {euros(x.base)}</Text><Text>{euros(x.montant)}</Text></View>)
          ) : (
            <View style={s.ligneTotal}><Text style={s.petit}>TVA non applicable, art. 293 B du CGI</Text><Text style={s.petit}>0,00 €</Text></View>
          )}
          <View style={s.ligneTotal}><Text style={s.gras}>Total TTC</Text><Text style={s.gras}>{euros(t.total_ttc)}</Text></View>
          {d.deductions.map((x) => <View key={x.facture_id} style={s.ligneTotal}><Text>{x.libelle}</Text><Text>- {euros(x.montant_ttc)}</Text></View>)}
          <View style={s.net}><Text>{devis ? "Montant du devis" : d.sous_type === "avoir" ? "Montant de l'avoir" : "Net à payer"}</Text><Text>{euros(t.net_a_payer)}</Text></View>
        </View>

        {devis && d.acompte_pourcent === null && p.acompte_pourcent > 0 && (
          <View style={s.section}><Text>Un acompte de {formatPourcent(p.acompte_pourcent)}, soit {euros(t.net_a_payer * p.acompte_pourcent / 100)}, sera demandé à l'acceptation du devis.</Text></View>
        )}

        {!devis && d.sous_type !== "avoir" && (
          <View style={s.section} wrap={false}>
            <Text style={s.sectionTitre}>Règlement</Text>
            <Text>Paiement à réception, au plus tard le {dateFr(d.date_echeance)}{p.delai_paiement_jours ? ` (${p.delai_paiement_jours} jours)` : ""}.</Text>
            {p.iban && <Text>Par virement : IBAN {p.iban}{p.bic ? ` – BIC ${p.bic}` : ""}</Text>}
          </View>
        )}

        {d.notes ? <View style={s.section}><Text style={s.sectionTitre}>Remarques</Text><Text>{d.notes}</Text></View> : null}
        {mentions ? <View style={s.section}><Text style={s.petit}>{mentions}</Text></View> : null}

        {devis && (
          <View style={s.signature} wrap={false}>
            <View style={s.cadre}>
              <Text style={s.etiquette}>L'entreprise</Text>
              <Text>{p.nom_entreprise}</Text>
            </View>
            <View style={s.cadre}>
              <Text style={s.etiquette}>Le client – bon pour accord</Text>
              <Text style={s.petit}>Date et signature, précédées de la mention « Bon pour accord »</Text>
            </View>
          </View>
        )}

        <View style={s.pied} fixed>
          <Text>{piedParties.join(" · ")}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} style={{ marginTop: 2 }} />
        </View>
      </Page>
    </Pdf>
  );
}
