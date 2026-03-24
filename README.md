# LinkTracker PRO

Outil de surveillance de backlinks achetés. Permet de suivre si les liens sont toujours en place, avec la bonne ancre, le bon statut nofollow/dofollow, et d'historiser les vérifications.

## Fonctionnalités

- **Gestion de campagnes** : regroupez vos backlinks par campagne SEO avec domaine cible, fréquence de vérification et dates
- **Suivi d'articles** : ajoutez des articles un par un ou en masse via CSV (jusqu'à 500 lignes)
- **Statut manuel** : marquez chaque backlink comme En attente / Envoyé / Confirmé / Supprimé
- **Historique des vérifications** : chaque vérification de backlink (statut, code HTTP, redirection) est horodatée
- **Vérification d'indexation** : modèle prévu pour tracker l'indexation via Google Search Console ou scraping
- **Alertes** : système d'alertes prévu (backlink perdu, changement d'indexation, erreur de crawl, résumé hebdo)
- **Gestion d'équipe** : rôles Admin / Member, partage de campagnes entre collaborateurs
- **Interface en français**

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
| CSV | PapaParse |
| Notifications | Sonner |
| Déploiement | Docker + Docker Compose |

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
| `DB_PASSWORD` | Mot de passe DB (Docker uniquement, reconstruit DATABASE_URL) | `password` |
| `NEXTAUTH_URL` | URL publique de l'app | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Clé secrète JWT (générer avec `openssl rand -base64 32`) | `...` |

## Structure du projet

```
link-tracker/
├── src/
│   ├── app/
│   │   ├── (auth)/login/          # Page de connexion
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx           # Dashboard (stats globales)
│   │   │   ├── campaigns/         # Liste, création, édition de campagnes
│   │   │   │   └── [campaignId]/
│   │   │   │       ├── page.tsx   # Détail campagne (onglets Articles / Infos / Membres)
│   │   │   │       ├── edit/      # Édition campagne
│   │   │   │       └── articles/
│   │   │   │           ├── new/   # Ajout manuel d'article
│   │   │   │           └── import/ # Import CSV
│   │   │   └── settings/          # Profil utilisateur
│   │   └── api/
│   │       ├── auth/[...nextauth] # Endpoints NextAuth
│   │       ├── users/             # Liste des utilisateurs
│   │       └── campaigns/         # CRUD campagnes + articles
│   ├── components/
│   │   ├── articles/              # ArticleTable, ArticleForm, CsvImportForm, StatusBadge
│   │   ├── campaigns/             # CampaignTable, CampaignForm
│   │   ├── layout/                # Header, Sidebar, MobileSidebar
│   │   └── ui/                    # Composants shadcn/ui
│   └── lib/
│       ├── auth.ts / auth-options.ts  # Config NextAuth
│       ├── prisma.ts              # Singleton Prisma
│       └── validations/           # Schémas Zod (campaign, article)
├── prisma/
│   ├── schema.prisma              # Schéma de base de données
│   └── seed.ts                    # Données initiales
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
 ├── id, name, description, targetDomain
 ├── status: ACTIVE | PAUSED | COMPLETED
 ├── checkFrequency: DAILY | WEEKLY | MONTHLY
 ├── startDate, endDate
 └── → Article[], CampaignMember[]

Article
 ├── id, articleUrl, targetUrl, anchorText
 ├── manualStatus: PENDING | SENT | CONFIRMED | DELETED
 └── → BacklinkCheck[], IndexationCheck[], Alert[]

BacklinkCheck
 ├── checkedAt, httpCode, redirectUrl
 └── status: FOUND | NOT_FOUND | ERROR | REDIRECTED

IndexationCheck
 ├── checkedAt
 ├── status: INDEXED | NOT_INDEXED | UNKNOWN
 └── source: GSC | SCRAPING

Alert
 └── type: BACKLINK_LOST | INDEXATION_CHANGE | CRAWL_ERROR | WEEKLY_SUMMARY
```

## Import CSV

Format attendu (colonnes flexibles, snake_case ou camelCase) :

```csv
article_url,target_url,anchor_text,status
https://site-partenaire.com/article,https://monsite.com,Mon ancre,CONFIRMED
https://autre-site.com/post,https://monsite.com/page,Texte ancre,PENDING
```

Colonnes acceptées :
- `article_url` / `articleUrl` / `url_article`
- `target_url` / `targetUrl` / `url_cible`
- `anchor_text` / `anchorText` / `ancre` (optionnel)
- `status` (optionnel, défaut : PENDING)

Limite : 500 lignes par import.

## API Routes

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/[...nextauth]` | Login / logout |
| GET | `/api/users` | Liste des utilisateurs |
| GET/POST | `/api/campaigns` | Liste / création campagne |
| GET/PUT/DELETE | `/api/campaigns/[id]` | Détail / édition / suppression |
| GET/POST | `/api/campaigns/[id]/members` | Membres de la campagne |
| DELETE | `/api/campaigns/[id]/members` | Retirer un membre |
| GET/POST | `/api/campaigns/[id]/articles` | Liste / création article |
| GET/PUT/DELETE | `/api/campaigns/[id]/articles/[id]` | Détail / édition / suppression article |
| POST | `/api/campaigns/[id]/articles/import` | Import CSV |

## Rôles et permissions

| Action | ADMIN | MEMBER |
|---|---|---|
| Voir toutes les campagnes | ✅ | ❌ (seulement les siennes) |
| Créer une campagne | ✅ | ✅ |
| Supprimer une campagne | ✅ | ❌ |
| Gérer les membres | ✅ | ❌ |
| Ajouter / importer des articles | ✅ | ✅ |
| Supprimer un article | ✅ | ❌ |
| Modifier le statut d'un article | ✅ | ✅ |

## Commandes utiles

```bash
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run lint         # Vérification ESLint + TypeScript

npx prisma studio    # Interface visuelle de la BDD
npx prisma db push   # Synchroniser le schéma sans migration
npx tsx prisma/seed.ts  # Réinitialiser les données de démo
```

## Roadmap

- [ ] Vérification automatique des backlinks (crawler)
- [ ] Détection nofollow / dofollow / sponsored / UGC
- [ ] Suivi d'indexation via Google Search Console
- [ ] Alertes email (backlink perdu, changement d'indexation)
- [ ] Résumé hebdomadaire par email
- [ ] Tableau de bord avec graphiques et métriques avancées
- [ ] Export CSV des résultats de vérification
