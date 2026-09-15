// Crée le compte de l'artisan (SEED_EMAIL / SEED_MDP dans .env.local), ses paramètres par défaut
// et un catalogue de prestations de départ. Idempotent. Usage : `npm run seed`
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

for (const ligne of readFileSync(".env.local", "utf8").split("\n")) {
  const m = ligne.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.SEED_EMAIL;
const mdp = process.env.SEED_MDP;
if (!url || !cle) throw new Error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis dans .env.local");
if (!email || !mdp) throw new Error("SEED_EMAIL et SEED_MDP sont requis dans .env.local");
const sb = createClient(url, cle, { auth: { persistSession: false } });

const { data: liste } = await sb.auth.admin.listUsers({ perPage: 1000 });
let id = liste?.users.find((u) => u.email === email)?.id;
if (!id) {
  const { data, error } = await sb.auth.admin.createUser({ email, password: mdp, email_confirm: true });
  if (error) throw error;
  id = data.user.id;
  console.log(`Compte créé : ${email}`);
} else {
  console.log(`Compte déjà présent : ${email}`);
}

const { data: params } = await sb.from("parametres").select("owner_id").eq("owner_id", id).maybeSingle();
if (!params) {
  const { error } = await sb.from("parametres").insert({
    owner_id: id,
    email,
    mentions_devis: "Devis gratuit. Les travaux commenceront à la date convenue après acceptation du devis et versement de l'acompte.",
    mentions_facture: "En cas de retard de paiement, des pénalités de retard au taux légal en vigueur sont exigibles, ainsi qu'une indemnité forfaitaire de 40 € pour frais de recouvrement pour les clients professionnels (art. L441-10 du Code de commerce). Pas d'escompte pour paiement anticipé."
  });
  if (error) throw error;
  console.log("Paramètres par défaut créés (à compléter dans « Mon entreprise »)");
}

const CATALOGUE = [
  { libelle: "Main-d'œuvre", unite: "h", prix_unitaire: 45, nature: "main_oeuvre", tva: 10 },
  { libelle: "Déplacement", unite: "forfait", prix_unitaire: 30, nature: "main_oeuvre", tva: 10 },
  { libelle: "Dépose et évacuation des gravats", unite: "forfait", prix_unitaire: 150, nature: "main_oeuvre", tva: 10 },
  { libelle: "Pose de carrelage sol", description: "Pose droite, joints compris", unite: "m²", prix_unitaire: 40, nature: "main_oeuvre", tva: 10 },
  { libelle: "Pose de faïence murale", unite: "m²", prix_unitaire: 45, nature: "main_oeuvre", tva: 10 },
  { libelle: "Peinture murs et plafonds", description: "Deux couches, préparation comprise", unite: "m²", prix_unitaire: 22, nature: "main_oeuvre", tva: 10 },
  { libelle: "Pose de cloison en plaques de plâtre", unite: "m²", prix_unitaire: 35, nature: "main_oeuvre", tva: 10 },
  { libelle: "Carrelage grès cérame", unite: "m²", prix_unitaire: 28, nature: "fourniture", tva: 20 },
  { libelle: "Colle et joints", unite: "forfait", prix_unitaire: 60, nature: "fourniture", tva: 20 },
  { libelle: "Peinture acrylique", unite: "L", prix_unitaire: 9, nature: "fourniture", tva: 20 },
  { libelle: "Plaques de plâtre BA13 et rails", unite: "m²", prix_unitaire: 14, nature: "fourniture", tva: 20 }
];
const { count } = await sb.from("prestations").select("id", { count: "exact", head: true }).eq("owner_id", id);
if (!count) {
  const { error } = await sb.from("prestations").insert(CATALOGUE.map((p) => ({ owner_id: id, description: "", ...p })));
  if (error) throw error;
  console.log(`${CATALOGUE.length} prestations de départ ajoutées au catalogue`);
}
console.log("\nPrêt. Connexion :", email, "/ mot de passe :", mdp);
