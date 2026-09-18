# Devis BTP

Application web de devis et de factures pour un artisan du bâtiment, pensée pour quelqu'un qui n'est pas à l'aise avec l'informatique : gros boutons, une action à la fois, sauvegarde automatique, aucun jargon.

## Ce qu'elle fait

- **Clients** : fiche simple (nom, téléphone, e-mail, adresse), particulier ou professionnel.
- **Catalogue de prestations** : les ouvrages habituels avec leur prix et leur unité, ajoutés au devis en un appui.
- **Devis** : brouillon → envoyé → accepté / refusé. Numérotation automatique `D-2026-0001` à l'envoi. Lignes libres, titres de parties, commentaires, remise globale, date de début et durée des travaux, cadre « Bon pour accord ».
- **Factures** : une seule facture par chantier, préparée d'un appui depuis le devis accepté. Facture libre possible. Les modalités de paiement (40 / 40 / 20 par défaut) et l'IBAN figurent sur le devis. Numérotation continue et chronologique `F-2026-0001`, document figé une fois validé ; annulation par **avoir**.
- **PDF** propre (A4) avec toutes les mentions obligatoires : SIRET, immatriculation, assurance décennale, « TVA non applicable, art. 293 B du CGI » (ou TVA par taux si assujetti), pénalités de retard, IBAN.
- **Envoi par e-mail** avec le PDF joint (Brevo), ou téléchargement + ouverture de la messagerie si l'envoi n'est pas configuré.

## Stack

Next.js 16 (App Router, `src/proxy.ts`), Tailwind 4, Supabase (Auth + Postgres, RLS par compte), `@react-pdf/renderer`, Brevo pour l'e-mail. Un compte Supabase = une entreprise : l'app peut servir plusieurs artisans sans rien changer.

## Démarrer

Voir [DEPLOIEMENT.md](DEPLOIEMENT.md). En résumé : créer le projet Supabase, coller `supabase/schema.sql`, remplir `.env.local`, `npm run seed`, `npm run dev`.

```bash
npm run dev        # http://localhost:3000
npm run typecheck  # types (next typegen + tsc)
npm run lint
npm test           # calculs des totaux, remise, TVA, acomptes, avoirs
```

Sans base, les écrans se regardent avec des données d'exemple sur `/apercu` (désactivé en production).

## Organisation du code

| Dossier | Rôle |
|---|---|
| `src/lib/calculs.ts` | Totaux, remise, TVA, répartition MO/fournitures, lignes d'acompte et d'avoir (testé) |
| `src/lib/documents.ts` | Règles métier côté serveur : création, modification, validation/numérotation |
| `src/lib/pdf/` | Mise en page du PDF |
| `src/app/api/` | Routes API (session Supabase, RLS active) |
| `src/components/` | Écrans : `EditeurDocument`, `FicheDocument`, clients, catalogue, réglages |
| `supabase/schema.sql` | Tables, RLS, fonction `numeroter_document` |
| `scripts/seed.mjs` | Compte de l'artisan + paramètres + catalogue de départ |
