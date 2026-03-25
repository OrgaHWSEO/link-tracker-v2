# LinkTracker PRO

Outil de surveillance de backlinks achetés. Permet de suivre si les liens sont toujours en place, avec la bonne ancre, le bon statut nofollow/dofollow, et d'historiser les vérifications.

## Fonctionnalités

### Vérifications automatiques
- **Détection de présence** : Playwright (navigateur headless) + exécution JS — détecte les liens même sur les SPA React/Vue
- **Détection dofollow / nofollow / sponsored / ugc** : lecture du vrai DOM, comparaison stricte hostname + pathname
- **Vérification d'indexation** : Google `site:URL` via Playwright + stealth plugin, gestion de la page GDPR
- **Anti-ban Google** : queue globale (1 requête à la fois, 6–11 s de délai), scroll humain, viewports aléatoires
- **Rotation de proxies** : liste de proxies actifs en base, sélection aléatoire avant chaque check Google
- **Déclenchement automatique** : à la création d'un backlink (unitaire ou import CSV), fire-and-forget
- **Cron mensuel** : re-vérifie chaque backlink à sa date anniversaire (`GET /api/cron/verify`, protégé par `CRON_SECRET`)

### Campagnes
- Création / édition avec domaine cible, plateforme, statut, fréquence de vérification
- Liste avec barre de recherche (nom + domaine) et filtres par site (pills cliquables)

### Page détail d'une campagne
- **KPIs** : total, actifs, dofollow, indexés
- **Tableau accordéon** par domaine de parution : vue compacte (URL + 3 badges) / vue dépliée (table complète)
- **3 badges par backlink** : Actif/Inactif · Dofollow/Nofollow · Indexé/Non indexé
- **Filtres** : Tous / Actifs / Inactifs / Dofollow / Nofollow / Indexés / Non indexés (avec compteurs)
- **Actions globales** : Tout ouvrir · Tout fermer · Re-vérifier tous les backlinks
- **Historique par backlink** : modal avec onglets Présence + Indexation, timeline complète de tous les checks
- **Bouton Rapport** : accès à la page rapport de la campagne

### Page rapport d'une campagne
- KPIs : total, actifs %, dofollow, indexés, budget total investi
- **Graphique d'évolution** semaine par semaine (actifs vs inactifs) — recharts
- Répartition par type (Article / Forum / Communiqué) avec barres de progression
- Répartition par source / plateforme avec barres de progression
- Section "Backlinks récemment perdus" (présents puis disparus)

### Gestion des backlinks
- Ajout unitaire ou import CSV (jusqu'à 500 lignes) avec auto-vérification
- Édition complète (URL article, URL cible, ancre, type, source, prix)
- Champs : `article_url`, `target_url`, `anchor_text`, `source`, `type`, `prix`, `status`

### Dashboard
- KPIs globaux calculés depuis les checks réels : actifs, dofollow, nofollow, indexés, ajouts ce mois
- Backlinks récents avec les 3 badges de statut
- Lien rapide vers toutes les campagnes actives

### Paramètres — Proxies
- CRUD proxies avec label optionnel et toggle actif/inactif
- Import en masse (textarea multi-lignes)
- Formats acceptés : `host:port`, `host:port:password`, `host:port:user:password`, URL standard (`http://`, `socks5://`…)
- Suppression multi-sélection

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 14 (App Router) |
| Langage | TypeScript 5 |
| Base de données | PostgreSQL 16 |
| ORM | Prisma 6 |
| Auth | NextAuth.js 4 (credentials + JWT) |
| UI | shadcn/ui + Tailwind CSS 3 |
| Formulaires | React Hook Form + Zod |
| Automatisation | Playwright + playwright-extra + puppeteer-extra-plugin-stealth |
| Graphiques | Recharts |
| CSV | PapaParse |
| Notifications | Sonner |
| Déploiement | Docker + Coolify |

## Prérequis

- Node.js 20+
- Docker & Docker Compose (pour la prod)
- PostgreSQL 16 (si lancement sans Docker)

## Lancement en développement

```bash
# 1. Installer les dépendances
npm install

# 2. Créer le fichier d'environnement
cp .env.example .env.local
# Remplir les variables (voir section Variables d'environnement)

# 3. Synchroniser le schéma Prisma
npx prisma db push

# 4. Seeder la base (admin + campagne démo)
npx tsx prisma/seed.ts

# 5. Lancer le serveur
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

Compte admin par défaut (seed) :
- Email : `admin@linktracker.local`
- Mot de passe : `admin123`

## Lancement avec Docker

```bash
# Copier et configurer les variables
cp .env.example .env

# Lancer l'app + PostgreSQL
docker compose up -d

# (optionnel) PgAdmin sur http://localhost:5050
docker compose --profile debug up -d
```

L'entrypoint Docker exécute automatiquement `prisma db push` au démarrage.

## Variables d'environnement

| Variable | Description | Exemple |
|---|---|---|
| `DATABASE_URL` | URL complète PostgreSQL | `postgresql://linktracker:password@localhost:5432/linktracker` |
| `DB_PASSWORD` | Mot de passe DB (Docker uniquement) | `password` |
| `NEXTAUTH_URL` | URL publique de l'app | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Clé secrète JWT (`openssl rand -base64 32`) | `...` |
| `CRON_SECRET` | Token pour protéger l'endpoint cron | `un-secret-long` |

## Configuration du cron mensuel

L'endpoint `GET /api/cron/verify` doit être appelé **chaque jour** par un scheduler externe (Coolify, cron système, etc.) :

```
# Chaque jour à 6h00
0 6 * * *  curl -s -H "Authorization: Bearer <CRON_SECRET>" https://votre-app/api/cron/verify
```

Il vérifie automatiquement les backlinks dont la date de création correspond au jour courant (anniversaire mensuel).

## Structure du projet

```
link-tracker/
├── src/
│   ├── app/
│   │   ├── (auth)/login/              # Page de connexion
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx               # Dashboard
│   │   │   ├── campaigns/
│   │   │   │   ├── page.tsx           # Liste campagnes (recherche + filtres)
│   │   │   │   └── [campaignId]/
│   │   │   │       ├── page.tsx       # Détail campagne (accordéon + filtres)
│   │   │   │       ├── edit/          # Édition campagne
│   │   │   │       ├── report/        # Rapport + graphique
│   │   │   │       └── articles/
│   │   │   │           ├── new/       # Ajout manuel
│   │   │   │           ├── import/    # Import CSV
│   │   │   │           └── [id]/edit/ # Édition backlink
│   │   │   └── settings/             # Profil + Proxies
│   │   └── api/
│   │       ├── auth/[...nextauth]
│   │       ├── campaigns/             # CRUD campagnes + articles
│   │       │   └── [id]/
│   │       │       ├── check-all/     # Re-vérifier tous les backlinks
│   │       │       └── articles/[id]/check/  # Re-vérifier un backlink
│   │       ├── proxies/               # CRUD proxies + bulk import
│   │       └── cron/verify/           # Endpoint cron mensuel
│   ├── components/
│   │   ├── articles/                  # ArticleTable, ArticleForm, CsvImportForm, ArticleHistoryModal
│   │   ├── campaigns/                 # CampaignTable, CampaignForm, BacklinksEvolutionChart
│   │   ├── settings/                  # ProxySettings, SettingsTabs
│   │   └── ui/                        # Composants shadcn/ui
│   └── lib/
│       ├── checkers/backlink.ts       # Vérification présence + dofollow
│       ├── checkers/indexation.ts     # Vérification indexation Google
│       ├── browser/instance.ts        # Singleton Playwright + stealth
│       ├── browser/google-queue.ts    # Queue anti-ban Google
│       ├── proxy-utils.ts             # Normalisation format proxy
│       └── validations/               # Schémas Zod
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── Dockerfile
├── docker-compose.yaml
└── docker-entrypoint.js
```

## Schéma de base de données

```
User
 ├── id, name, email, passwordHash
 ├── role: ADMIN | MEMBER
 └── → CampaignMember, Alert

Campaign
 ├── id, name, description, targetDomain, plateforme?
 ├── status: ACTIVE | PAUSED | COMPLETED
 ├── checkFrequency: DAILY | WEEKLY | MONTHLY
 └── → Article[], CampaignMember[]

Article
 ├── id, articleUrl, targetUrl, anchorText
 ├── manualStatus: PENDING | SENT | CONFIRMED | DELETED
 ├── prix?, type: ARTICLE | FORUM | COMMUNIQUE, source?
 └── → BacklinkCheck[], IndexationCheck[]

BacklinkCheck
 ├── checkedAt, httpCode, redirectUrl, isDofollow
 └── status: FOUND | NOT_FOUND | ERROR | REDIRECTED

IndexationCheck
 ├── checkedAt
 └── status: INDEXED | NOT_INDEXED | UNKNOWN

Proxy
 └── url (http://user:pass@host:port), label?, isActive
```

## Import CSV

Format attendu (colonnes flexibles, snake_case ou camelCase) :

```csv
article_url,target_url,anchor_text,source,type,prix,status
https://site-partenaire.com/article,https://monsite.com,Mon ancre,SEMJuice,ARTICLE,150,CONFIRMED
```

Colonnes acceptées :
- `article_url` / `articleUrl` / `url_article` — **requis**
- `target_url` / `targetUrl` / `url_cible` — **requis**
- `anchor_text` / `anchorText` / `ancre` — optionnel
- `source` / `plateforme` — optionnel
- `type` — ARTICLE, FORUM ou COMMUNIQUE (défaut : ARTICLE)
- `prix` / `price` — optionnel (en euros)
- `status` — optionnel (défaut : PENDING)

Limite : 500 lignes par import.

## API Routes

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/[...nextauth]` | Login / logout |
| GET/POST | `/api/campaigns` | Liste / création campagne |
| GET/PUT/DELETE | `/api/campaigns/[id]` | Détail / édition / suppression |
| GET/POST | `/api/campaigns/[id]/articles` | Liste / création backlink |
| GET/PUT/DELETE | `/api/campaigns/[id]/articles/[id]` | Détail / édition / suppression |
| POST | `/api/campaigns/[id]/articles/import` | Import CSV |
| POST | `/api/campaigns/[id]/articles/[id]/check` | Re-vérifier un backlink |
| POST | `/api/campaigns/[id]/check-all` | Re-vérifier tous les backlinks |
| GET/POST | `/api/proxies` | Liste / ajout proxy |
| PATCH/DELETE | `/api/proxies/[id]` | Toggle actif / suppression |
| POST | `/api/proxies/bulk` | Import proxies en masse |
| GET | `/api/cron/verify` | Cron mensuel (protégé par CRON_SECRET) |

## Rôles et permissions

| Action | ADMIN | MEMBER |
|---|---|---|
| Voir toutes les campagnes | ✅ | ❌ (seulement les siennes) |
| Créer une campagne | ✅ | ✅ |
| Supprimer une campagne | ✅ | ❌ |
| Ajouter / importer des backlinks | ✅ | ✅ |
| Modifier un backlink | ✅ | ✅ |
| Supprimer un backlink | ✅ | ❌ |
| Gérer les proxies | ✅ | ✅ |

## Commandes utiles

```bash
npm run dev              # Serveur de développement
npm run build            # Build de production
npm run lint             # Vérification ESLint + TypeScript

npx prisma studio        # Interface visuelle de la BDD
npx prisma db push       # Synchroniser le schéma sans migration
npx tsx prisma/seed.ts   # Réinitialiser les données de démo
```

## Roadmap

- [ ] Alertes email (backlink perdu, changement d'indexation)
- [ ] Export CSV des résultats de vérification
- [ ] Statut manuel modifiable depuis le tableau (sans passer par le formulaire d'édition)
- [ ] Métriques SEO automatiques (DR Ahrefs, TF Majestic, DA Moz) via API
- [ ] Résumé hebdomadaire par email
