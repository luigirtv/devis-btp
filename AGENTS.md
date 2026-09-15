# Devis BTP — conventions

Voir README.md pour le périmètre fonctionnel et DEPLOIEMENT.md pour la mise en route.

- **Langue** : tout en français (code, commentaires, UI). Vocabulaire UI : devis, facture, client, prestation, chantier, acompte, solde, avoir.
- **Public** : un artisan peu à l'aise avec l'informatique. Gros boutons (`btn-*`), une action évidente par écran, jamais de jargon, confirmation avant toute action irréversible, sauvegarde automatique dans l'éditeur.
- **Données** : un compte Supabase Auth = une entreprise. Toutes les tables ont `owner_id` avec une policy RLS `owner_id = auth.uid()`. Les routes API utilisent le client de session (`exigerSession()`), jamais la clé de service (sauf `scripts/seed.mjs`).
- **Lignes** : JSON dans `documents.lignes` (`Ligne` dans `src/lib/types.ts`). Les totaux sont recalculés côté serveur (`colonnesTotaux`) à chaque modification et stockés pour les listes.
- **Numérotation** : `numeroter_document(uuid)` en SQL, appelée par `validerDocument`. Un document numéroté : devis modifiable jusqu'à acceptation, facture jamais.
- **Calculs** : `src/lib/calculs.ts` est pur et testé (`npm test`). Toute règle de montant va là, pas dans les composants.
- **Vérifier** : `npm run typecheck && npm run lint && npm test`. Écrans sans base : `/apercu` (données de `src/lib/exemple.ts`, désactivé en production).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
