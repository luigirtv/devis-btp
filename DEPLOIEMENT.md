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

## 3. E-mail : envoi depuis sa propre boîte

Le bouton « Envoyer au client par e-mail » envoie le PDF **depuis la boîte de l'artisan** : c'est lui l'expéditeur, le client lui répond directement, et il reçoit une copie. Aucun prestataire d'envoi.

Il faut une seule fois un **mot de passe d'application** (un mot de passe spécial, différent du sien, que la boîte génère pour un logiciel) :

| Boîte | Où le créer |
|---|---|
| Gmail | myaccount.google.com → Sécurité → activer la validation en deux étapes → « Mots de passe des applications » |
| Microsoft (live.fr, hotmail, outlook) | account.microsoft.com → Sécurité → Options de sécurité avancées → activer la vérification en deux étapes → « Créer un mot de passe d'application ». **Attention : Microsoft ferme progressivement cet accès sur les boîtes personnelles. Si le test échoue, voir plus bas.** |
| Orange | Espace client → Mail → le mot de passe de la messagerie convient |
| Free, SFR, La Poste, Yahoo, iCloud | réglages de sécurité de la boîte, rubrique mots de passe d'application |

Puis, dans `.env.local` :

```
SMTP_USER=son.adresse@exemple.fr
SMTP_PASS=le-mot-de-passe-d-application
```

et tester tout de suite :

```bash
npm run test:email
```

Le script dit « Connexion acceptée » et lui envoie un e-mail d'essai, ou explique en clair ce qui bloque. Quand ça passe, recopier `SMTP_USER` et `SMTP_PASS` dans Vercel (Settings → Environment Variables) et redéployer. Le serveur d'envoi est deviné d'après l'adresse ; pour une boîte professionnelle, ajouter `SMTP_HOST` et `SMTP_PORT`.

**Si sa boîte refuse** (cas probable avec une adresse Microsoft personnelle) : créer une adresse Gmail pour l'entreprise, par exemple `renov.martin@gmail.com`, y créer le mot de passe d'application, et l'utiliser comme `SMTP_USER`. Mettre sa vraie adresse dans « Mon entreprise » : les réponses des clients et la copie de chaque envoi y arrivent quand même.

Sans ces variables, le bouton propose de télécharger le PDF puis d'ouvrir la messagerie : utilisable, mais il doit joindre le fichier lui-même.

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
- **Facturation électronique** : à partir de septembre 2027, les factures entre professionnels (client avec SIRET) devront passer par une plateforme agréée. Les factures aux particuliers ne sont pas concernées. À revoir en 2027.
