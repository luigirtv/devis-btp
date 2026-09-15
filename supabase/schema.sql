-- Devis BTP — schéma initial. À coller dans Supabase → SQL Editor → Run.
-- Idempotent : peut être relancé sans casse.
-- Modèle : un compte Supabase Auth = une entreprise (l'artisan). Tout est cloisonné par owner_id via la RLS.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- Paramètres de l'entreprise (une ligne par compte)
create table if not exists parametres (
  owner_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  nom_entreprise text not null default '',
  nom_contact text not null default '',
  adresse text not null default '',
  code_postal text not null default '',
  ville text not null default '',
  telephone text not null default '',
  email text not null default '',
  siret text not null default '',
  immatriculation text not null default '',          -- ex. « RM 123 456 789 – CMA du Var »
  assujetti_tva boolean not null default false,        -- false = franchise en base (art. 293 B du CGI)
  numero_tva text not null default '',
  assurance_nom text not null default '',              -- assurance décennale / RC pro (mention obligatoire en BTP)
  assurance_contrat text not null default '',
  assurance_couverture text not null default 'France métropolitaine',
  iban text not null default '',
  bic text not null default '',
  validite_devis_jours int not null default 30,
  delai_paiement_jours int not null default 30,
  acompte_pourcent numeric(5,2) not null default 30,
  mentions_devis text not null default '',
  mentions_facture text not null default '',
  logo_data text,                                      -- data URL (png/jpeg redimensionné côté client)
  prefixe_devis text not null default 'D',
  prefixe_facture text not null default 'F',
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- Clients
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  nom text not null,
  type text not null default 'particulier' check (type in ('particulier','professionnel')),
  adresse text not null default '',
  code_postal text not null default '',
  ville text not null default '',
  telephone text not null default '',
  email text not null default '',
  siret text not null default '',
  notes text not null default '',
  archive boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists clients_owner_nom on clients(owner_id, nom);

-- ---------------------------------------------------------------- Catalogue de prestations
create table if not exists prestations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  libelle text not null,
  description text not null default '',
  unite text not null default 'u',
  prix_unitaire numeric(12,2) not null default 0,
  nature text not null default 'main_oeuvre' check (nature in ('main_oeuvre','fourniture')),
  tva numeric(5,2) not null default 0,
  actif boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists prestations_owner on prestations(owner_id, libelle);

-- ---------------------------------------------------------------- Documents (devis et factures)
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  type text not null check (type in ('devis','facture')),
  sous_type text not null default 'standard' check (sous_type in ('standard','acompte','solde','avoir')),
  numero text,                                         -- attribué à la validation (numeroter_document), jamais modifié ensuite
  annee int,
  statut text not null default 'brouillon',
  client_id uuid references clients(id) on delete set null,
  client_snapshot jsonb,                               -- copie du client figée à la validation
  objet text not null default '',
  adresse_chantier text not null default '',
  date_document date not null default current_date,
  date_validite date,                                  -- devis
  date_echeance date,                                  -- facture
  date_debut_travaux date,                             -- devis (mention obligatoire pour des travaux)
  duree_travaux text not null default '',
  lignes jsonb not null default '[]'::jsonb,
  remise_pourcent numeric(5,2) not null default 0,
  deductions jsonb not null default '[]'::jsonb,       -- acomptes déduits sur une facture de solde
  devis_id uuid references documents(id) on delete set null,      -- facture issue d'un devis
  facture_origine_id uuid references documents(id) on delete set null, -- avoir → facture annulée
  acompte_pourcent numeric(5,2),
  total_ht numeric(12,2) not null default 0,
  total_tva numeric(12,2) not null default 0,
  total_ttc numeric(12,2) not null default 0,
  net_a_payer numeric(12,2) not null default 0,
  notes text not null default '',
  paye_le date,
  mode_paiement text,
  accepte_le date,
  envoye_le timestamptz,
  envoye_a text,
  valide_le timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint statut_valide check (
    (type = 'devis' and statut in ('brouillon','envoye','accepte','refuse')) or
    (type = 'facture' and statut in ('brouillon','envoyee','payee','annulee'))
  )
);
create index if not exists documents_owner_type_date on documents(owner_id, type, date_document desc);
create index if not exists documents_devis on documents(devis_id);
create unique index if not exists documents_numero_unique on documents(owner_id, type, numero) where numero is not null;

-- ---------------------------------------------------------------- Compteurs de numérotation (par type et par année)
create table if not exists compteurs (
  owner_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  annee int not null,
  dernier int not null default 0,
  primary key (owner_id, type, annee)
);

-- ---------------------------------------------------------------- RLS : chacun ne voit que ses données
alter table parametres enable row level security;
alter table clients enable row level security;
alter table prestations enable row level security;
alter table documents enable row level security;
alter table compteurs enable row level security;

do $$
declare t text;
begin
  foreach t in array array['parametres','clients','prestations','documents','compteurs'] loop
    execute format('drop policy if exists proprietaire on %I', t);
    execute format('create policy proprietaire on %I for all using (owner_id = auth.uid()) with check (owner_id = auth.uid())', t);
  end loop;
end $$;

-- ---------------------------------------------------------------- Numérotation
-- Attribue un numéro séquentiel, continu et chronologique : F-2026-0001, D-2026-0012…
-- Une facture prend la date du jour au moment de sa validation (date d'émission), et son échéance.
create or replace function numeroter_document(doc uuid) returns text
language plpgsql security definer set search_path = public as $$
declare
  d documents%rowtype;
  p parametres%rowtype;
  n int;
  an int;
  num text;
  d_doc date;
begin
  select * into d from documents where id = doc and owner_id = auth.uid() for update;
  if not found then raise exception 'Document introuvable'; end if;
  if d.numero is not null then return d.numero; end if;
  select * into p from parametres where owner_id = d.owner_id;
  d_doc := case when d.type = 'facture' then current_date else d.date_document end;
  an := extract(year from d_doc)::int;
  insert into compteurs (owner_id, type, annee, dernier) values (d.owner_id, d.type, an, 1)
    on conflict (owner_id, type, annee) do update set dernier = compteurs.dernier + 1
    returning dernier into n;
  num := (case when d.type = 'devis' then coalesce(p.prefixe_devis, 'D') else coalesce(p.prefixe_facture, 'F') end)
         || '-' || an || '-' || lpad(n::text, 4, '0');
  update documents
     set numero = num,
         annee = an,
         valide_le = now(),
         date_document = d_doc,
         date_echeance = case when d.type = 'facture' then d_doc + coalesce(p.delai_paiement_jours, 30) else date_echeance end,
         updated_at = now()
   where id = doc;
  return num;
end $$;

-- updated_at automatique
create or replace function toucher_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists documents_touch on documents;
create trigger documents_touch before update on documents for each row execute function toucher_updated_at();
drop trigger if exists parametres_touch on parametres;
create trigger parametres_touch before update on parametres for each row execute function toucher_updated_at();
