import assert from "node:assert/strict";
import { correspond, normaliser } from "../../src/lib/recherche.ts";

assert.equal(normaliser("Rénovation (SDB), été"), "renovation sdb ete");
assert.ok(correspond("Marie Dupont Rénovation de la salle de bain D-2026-0003", "dupont"));
assert.ok(correspond("Marie Dupont Rénovation de la salle de bain", "RENOVATION dupont"), "ordre des mots et accents indifférents");
assert.ok(correspond("Terrasse (bois), essai", "terrasse (bois), essai"), "la ponctuation ne gêne pas");
assert.ok(correspond("Devis D-2026-0003", "2026-0003"));
assert.ok(correspond("Devis D-2026-0003", "d20260003"), "numéro tapé sans tirets");
assert.ok(!correspond("Marie Dupont", "durand"));
assert.ok(!correspond("Marie Dupont salle de bain", "dupont cuisine"), "tous les mots doivent y être");
assert.ok(correspond("n'importe quoi", "  "), "recherche vide : tout correspond");
console.log("recherche : 9 assertions OK");
