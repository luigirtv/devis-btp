import assert from "node:assert/strict";
import { calculerTotaux, lignesAcompte, lignesAvoir, ligneVide, totalLigne } from "../../src/lib/calculs.ts";

const mo = ligneVide({ libelle: "Pose carrelage", quantite: 20, unite: "m²", prix_unitaire: 45, nature: "main_oeuvre", tva: 10 });
const four = ligneVide({ libelle: "Carrelage grès", quantite: 22, unite: "m²", prix_unitaire: 30, nature: "fourniture", tva: 20 });
const titre = ligneVide({ genre: "titre", libelle: "Salle de bain" });

assert.equal(totalLigne(mo), 900);
assert.equal(totalLigne(four), 660);
assert.equal(totalLigne(titre), 0, "un titre ne compte pas");

// Franchise en base : pas de TVA, TTC = HT
let t = calculerTotaux({ lignes: [titre, mo, four] });
assert.equal(t.sous_total_ht, 1560);
assert.equal(t.total_tva, 0);
assert.equal(t.total_ttc, 1560);
assert.deepEqual(t.repartition, { main_oeuvre: 900, fourniture: 660 });

// Remise 10 % répartie au prorata
t = calculerTotaux({ lignes: [mo, four], remise_pourcent: 10 });
assert.equal(t.remise, 156);
assert.equal(t.total_ht, 1404);
assert.deepEqual(t.repartition, { main_oeuvre: 810, fourniture: 594 });

// Assujetti : TVA par taux
t = calculerTotaux({ lignes: [mo, four], assujetti_tva: true });
assert.deepEqual(t.tva_par_taux, [{ taux: 20, base: 660, montant: 132 }, { taux: 10, base: 900, montant: 90 }]);
assert.equal(t.total_ttc, 1782);

// Arrondis : 3 × 0,1 doit donner 0,30 et pas 0,30000000000000004
t = calculerTotaux({ lignes: [ligneVide({ quantite: 3, prix_unitaire: 0.1 })] });
assert.equal(t.total_ttc, 0.3);

// Acompte 30 % : une ligne par nature, somme = 30 % du devis
const acompte = lignesAcompte({ lignes: [titre, mo, four], remise_pourcent: 0, numero: "D-2026-0001" }, 30, false);
assert.equal(acompte.length, 2);
assert.equal(acompte.reduce((s, l) => s + totalLigne(l), 0), 468);
assert.ok(acompte[0].libelle.includes("30 %"));
assert.ok(acompte.every((l) => l.unite === "forfait" && l.quantite === 1));

// Solde : déduction de l'acompte
t = calculerTotaux({ lignes: [mo, four], deductions: [{ facture_id: "x", numero: "F-2026-0001", libelle: "Acompte", montant_ttc: 468, repartition: { main_oeuvre: 270, fourniture: 198 } }] });
assert.equal(t.total_ttc, 1560);
assert.equal(t.net_a_payer, 1092);

// Avoir : lignes négatives, les titres restent tels quels
const avoir = lignesAvoir({ lignes: [titre, mo] });
assert.equal(calculerTotaux({ lignes: avoir }).total_ttc, -900);
assert.equal(avoir[0].genre, "titre");

console.log("calculs : 22 assertions OK");
