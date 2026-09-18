-- Échéancier de paiement : les étapes de règlement d'un chantier (ex. 40 % à la signature, 40 % à mi-travaux, 20 % à la fin).
-- À coller dans Supabase → SQL Editor → Run. Relançable sans risque.
alter table parametres add column if not exists echeancier jsonb not null default
  '[{"libelle":"à la signature du devis","pourcent":40},{"libelle":"à la moitié des travaux","pourcent":40},{"libelle":"à la fin des travaux","pourcent":20}]'::jsonb;
