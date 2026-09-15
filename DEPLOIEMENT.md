# Mise en route

Compter 30 minutes. Ordre à respecter.

## 1. Supabase

1. https://supabase.com → **New project** (région Europe West, Paris ou Francfort). Note le mot de passe base.
2. **SQL Editor** → colle tout `supabase/schema.sql` → **Run**. Relançable sans risque.
3. **Project Settings → API** : copie `Project URL`, la clé `anon` (publishable) et la clé `service_role` (secret).
4. **Authentication → Providers → Email** : désactive « Allow new users to sign up » (personne ne doit créer de compte seul). « Confirm email » sans importance : le seed crée le compte déjà confirmé.

## 2. En local

```bash
cp .env.example .env.local
```

Remplis les trois variables Supabase, puis choisis `SEED_EMAIL` (l'e-mail de l'artisan) et `SEED_MDP` (un mot de passe simple à retenir, mais pas trivial). Ensuite :

```bash
npm install
npm run seed
npm run dev
```

http://localhost:3000 → se connecter → « Mon entreprise » : remplir nom, adresse, SIRET, immatriculation, assureur, IBAN. Tout apparaît sur les PDF.

Le seed ajoute un catalogue de départ (main-d'œuvre, carrelage, peinture…) à adapter dans « Mes prestations ».

## 3. E-mail (facultatif mais recommandé)

Sans configuration, le bouton « Envoyer au client » propose de télécharger le PDF puis d'ouvrir la messagerie du téléphone/PC. C'est déjà utilisable.

Pour l'envoi automatique avec le PDF joint :
1. Compte https://www.brevo.com (gratuit jusqu'à 300 e-mails/jour).
2. **Senders & IP** : ajouter et vérifier l'adresse d'expédition (idéalement celle de l'artisan, sinon une adresse à toi ; les réponses du client arrivent de toute façon chez l'artisan grâce au « répondre à »).
3. **SMTP & API → API Keys** : créer une clé.
4. `BREVO_API_KEY` et `EMAIL_EXPEDITEUR` dans `.env.local` puis dans Vercel.

## 4. Vercel

1. Repo GitHub privé, push.
2. Vercel → **Add New Project** → importer. Framework détecté : Next.js.
3. **Environment Variables** : les mêmes qu'en local (Production + Preview), sauf `SEED_*`.
4. Deploy. Vérifier `https://<projet>.vercel.app/api/health` → `{"ok":true}`.

Le plan Hobby suffit largement.

## 5. Sur les appareils de l'artisan

- **Téléphone / tablette** : ouvrir l'URL dans Chrome ou Safari, se connecter, puis « Ajouter à l'écran d'accueil ». L'app s'ouvre alors comme une application, sans barre d'adresse, et il reste connecté.
- **PC** : mettre l'URL en favori ou en raccourci sur le bureau (Chrome → menu → « Installer l'application »).

Lui montrer une seule chose au début : Accueil → « Nouveau devis » → choisir le client → « Mes prestations » → Terminer → « Envoyer au client ». Le reste vient tout seul.

## 6. Points légaux à savoir

- **Numérotation** : les factures sont numérotées sans trou, dans l'ordre chronologique, au moment de la validation. Une facture validée ne se modifie plus : on l'annule par un **avoir** (bouton sur la fiche) et on en refait une.
- **Franchise de TVA** : par défaut aucune TVA n'est facturée, ni sur la main-d'œuvre ni sur le matériel ; la mention légale est ajoutée automatiquement. Si l'artisan dépasse le plafond, cocher « Je facture la TVA » dans « Mon entreprise » : les taux 20 / 10 / 5,5 % apparaissent sur chaque ligne.
- **URSSAF** : chaque ligne est « main-d'œuvre » ou « fourniture ». La page « Chiffre d'affaires » donne les deux totaux à déclarer (taux de cotisation différents).
- **Facturation électronique** : à partir de septembre 2027, les factures entre professionnels (client avec SIRET) devront passer par une plateforme agréée. Les factures aux particuliers ne sont pas concernées. À revoir en 2027.
