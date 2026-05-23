# 2Cheries — Documentation Complète

> Plateforme de réservation de commandes de vêtements sur mesure  
> Dakar, Sénégal · Rouge Bordeaux & Or

---

## Architecture du projet

```
2cheries/
├── backend/                  # API Node.js + Express + PostgreSQL
│   ├── config/
│   │   ├── database.js       # Pool de connexion PostgreSQL
│   │   ├── migrate.js        # Création des tables
│   │   └── seed.js           # Données initiales (semaines + événements)
│   ├── middleware/
│   │   └── auth.js           # JWT — vérification client & admin
│   ├── routes/
│   │   ├── auth.js           # Inscription, connexion, admin login
│   │   ├── weeks.js          # Semaines + réservations semaines
│   │   ├── events.js         # Événements spéciaux + réservations
│   │   └── admin.js          # Stats, gestion clients
│   ├── server.js             # Point d'entrée Express
│   ├── package.json
│   └── .env.example
│
└── frontend/                 # React 18 + React Query + React Router
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── Modal.jsx
    │   │   ├── LoginModal.jsx
    │   │   ├── RegisterModal.jsx
    │   │   ├── ReserveWeekModal.jsx
    │   │   ├── ReserveEventModal.jsx
    │   │   ├── Countdown.jsx
    │   │   └── ProtectedRoute.jsx
    │   ├── contexts/
    │   │   └── AuthContext.jsx   # État global authentification
    │   ├── pages/
    │   │   ├── HomePage.jsx          # Héro, calendrier, événements
    │   │   ├── MyOrdersPage.jsx      # Espace client
    │   │   ├── AdminLoginPage.jsx    # Connexion admin dédiée
    │   │   └── AdminDashboardPage.jsx # Dashboard complet
    │   ├── utils/
    │   │   └── api.js            # Instance axios configurée
    │   ├── App.jsx               # Routing principal
    │   ├── index.jsx             # Point d'entrée React
    │   └── index.css             # Variables CSS + styles globaux
    └── package.json
```

---

## Prérequis

- **Node.js** ≥ 18
- **PostgreSQL** ≥ 14
- **npm** ou **yarn**

---

## Installation — Backend

### 1. Installer les dépendances

```bash
cd backend
npm install
```

### 2. Configurer les variables d'environnement

```bash
cp .env.example .env
```

Éditez `.env` avec vos paramètres :

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=2cheries_db
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe

JWT_SECRET=changez_ce_secret_en_production
JWT_EXPIRES_IN=7d

ADMIN_USERNAME=admin2cheries
ADMIN_PASSWORD=2cheries2026!

FRONTEND_URL=http://localhost:3000
```

### 3. Créer la base de données

```bash
# Depuis psql ou pgAdmin
CREATE DATABASE 2cheries_db;
```

### 4. Lancer la migration (créer les tables)

```bash
npm run migrate
```

### 5. Insérer les données initiales (semaines + événements)

```bash
npm run seed
```

### 6. Démarrer le serveur

```bash
# Développement (avec rechargement automatique)
npm run dev

# Production
npm start
```

Le serveur écoute sur **http://localhost:5000**

---

## Installation — Frontend

### 1. Installer les dépendances

```bash
cd frontend
npm install
```

### 2. Variables d'environnement (optionnel)

Si le backend tourne sur un port différent, créez `.env` dans `frontend/` :

```env
REACT_APP_API_URL=http://localhost:5000/api
```

Sans ce fichier, le proxy défini dans `package.json` (`"proxy": "http://localhost:5000"`) gère automatiquement les appels `/api/...`.

### 3. Démarrer le frontend

```bash
npm start
```

L'interface est disponible sur **http://localhost:3000**

---

## Accès au site

| URL | Description |
|-----|-------------|
| `http://localhost:3000` | Site public + espace client |
| `http://localhost:3000/mes-commandes` | Commandes du client connecté |
| `http://localhost:3000/admin/login` | Connexion administrateur |
| `http://localhost:3000/admin` | Dashboard admin (accès restreint) |

### Identifiants admin par défaut

```
Identifiant : admin2cheries
Mot de passe : 2cheries2026!
```

> ⚠️ Changez ces identifiants dans le `.env` avant mise en production.

---

## API — Endpoints

### Auth

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/register` | Créer un compte client |
| POST | `/api/auth/login` | Connexion client |
| POST | `/api/auth/admin/login` | Connexion admin |
| GET  | `/api/auth/me` | Profil utilisateur connecté |

### Semaines

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| GET  | `/api/weeks` | Public | Liste des semaines + compteurs |
| POST | `/api/weeks/:weekId/reserve` | Client | Créer une réservation |
| GET  | `/api/weeks/orders/mine` | Client | Mes commandes semaines |
| GET  | `/api/weeks/orders/all` | Admin | Toutes les commandes |
| PATCH | `/api/weeks/orders/:id/status` | Admin | Changer le statut |

### Événements

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| GET  | `/api/events` | Public | Événements + places restantes |
| POST | `/api/events/:eventId/reserve` | Client | Réserver pour un événement |
| GET  | `/api/events/orders/mine` | Client | Mes réservations événements |
| GET  | `/api/events/orders/all` | Admin | Toutes les réservations |
| PATCH | `/api/events/orders/:id/status` | Admin | Changer le statut |

### Admin

| Méthode | Route | Description |
|---------|-------|-------------|
| GET  | `/api/admin/stats` | Statistiques globales |
| GET  | `/api/admin/clients` | Liste des clients |
| PATCH | `/api/admin/clients/:id/toggle` | Activer/désactiver un client |

---

## Statuts des commandes

| Statut | Description |
|--------|-------------|
| `pending_wave` | En attente du paiement Wave |
| `wave_sent` | Wave envoyé par le client (à vérifier) |
| `confirmed` | Paiement confirmé par l'admin |
| `cancelled` | Commande annulée |

---

## Règles métier

- **12 commandes max par semaine** (régulières)
- **30–40 places par événement spécial** (ne comptent pas dans les 12)
- La semaine suivante n'ouvre que quand la précédente est complète
- La semaine du **1–7 juin 2026** est bouclée (fermée)
- **Magal de Touba** : 30 places, ouverture jusqu'au 20 juillet, événement le 2 août
- Confirmation : le client envoie **50% du montant** par Wave au **78 157 32 91**
- L'admin confirme manuellement après vérification du paiement

---

## Déploiement en production

### Backend

1. Hébergement recommandé : **Railway**, **Render**, **VPS Ubuntu**
2. Configurez toutes les variables d'environnement
3. `NODE_ENV=production`
4. Utilisez un `JWT_SECRET` fort et unique
5. Activez HTTPS

### Frontend

1. Build : `npm run build`
2. Déployez le dossier `build/` sur **Netlify**, **Vercel**, ou servez avec Nginx
3. Configurez `REACT_APP_API_URL` vers l'URL de production du backend
4. Sur Netlify/Vercel : ajoutez la règle de redirection `/* → /index.html` pour React Router

### Nginx (exemple config frontend)

```nginx
server {
    listen 80;
    server_name 2cheries.com;
    root /var/www/2cheries/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Support

Wave : **78 157 32 91**  
Site : **2cheries.com**
