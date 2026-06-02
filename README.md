# Express API Template 🚀

Template prêt à l'emploi pour une API REST Express avec authentification JWT.

## Stack

- **Express 4** — framework HTTP
- **JWT** — access token (15min) + refresh token (7j) avec rotation
- **bcryptjs** — hashage des mots de passe
- **Joi** — validation des entrées
- **Helmet + CORS + Rate Limiting** — sécurité de base
- **Jest + Supertest** — tests

## Démarrage rapide

```bash
# 1. Clone et installe
git clone <repo> mon-projet && cd mon-projet
npm install

# 2. Configure l'environnement
cp .env.example .env
# Édite .env : change JWT_SECRET et JWT_REFRESH_SECRET !

# 3. Lance en dev
npm run dev
```

## Structure

```
src/
├── app.js                  # Point d'entrée, middlewares globaux
├── config/
│   └── jwt.js              # Génération et vérification des tokens
├── controllers/
│   ├── authController.js   # Register, login, refresh, logout, me
│   └── usersController.js  # Exemple de ressource protégée
├── middlewares/
│   ├── auth.js             # authenticate + authorize(role)
│   ├── errorHandler.js     # 404 + gestion globale des erreurs
│   └── validate.js         # Validation Joi + schémas
├── routes/
│   ├── index.js            # Router principal
│   ├── auth.js             # Routes /auth/*
│   └── users.js            # Routes /users/* (protégées)
└── utils/
    └── response.js         # Helpers JSON cohérents
tests/
└── auth.test.js
```

## Endpoints

### Auth
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/api/v1/auth/register` | ❌ | Créer un compte |
| POST | `/api/v1/auth/login` | ❌ | Se connecter |
| POST | `/api/v1/auth/refresh` | ❌ | Renouveler les tokens |
| POST | `/api/v1/auth/logout` | ❌ | Révoquer le refresh token |
| GET | `/api/v1/auth/me` | ✅ | Profil courant |

### Users (exemple)
| Méthode | Route | Auth | Rôle |
|---------|-------|------|------|
| GET | `/api/v1/users` | ✅ | admin |
| GET | `/api/v1/users/:id` | ✅ | owner ou admin |

## Utilisation des middlewares

```js
const { authenticate, authorize } = require('./middlewares/auth');

// Route protégée
router.get('/profile', authenticate, myController);

// Route réservée aux admins
router.delete('/:id', authenticate, authorize('admin'), myController);

// Plusieurs rôles acceptés
router.post('/', authenticate, authorize('admin', 'moderator'), myController);
```

## Ajouter une nouvelle ressource

```bash
# 1. Crée le controller
touch src/controllers/productsController.js

# 2. Crée les routes
touch src/routes/products.js

# 3. Enregistre dans l'index
# src/routes/index.js → router.use('/products', require('./products'));
```

## Tests

```bash
npm test           # Lance tous les tests
npm test -- --watch  # Mode watch
```

## Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `PORT` | Port du serveur | `3000` |
| `NODE_ENV` | Environnement | `development` |
| `JWT_SECRET` | Clé secrète access token | ⚠️ À changer |
| `JWT_EXPIRES_IN` | Durée access token | `15m` |
| `JWT_REFRESH_SECRET` | Clé secrète refresh token | ⚠️ À changer |
| `JWT_REFRESH_EXPIRES_IN` | Durée refresh token | `7d` |
| `ALLOWED_ORIGINS` | Origines CORS (séparées par `,`) | `http://localhost:3000` |

## TODO pour la prod

- [ ] Brancher une vraie DB (Prisma, Sequelize, Mongoose…)
- [ ] Stocker les refresh tokens en DB ou Redis (actuellement en mémoire)
- [ ] Ajouter des logs structurés (winston, pino)
- [ ] CI/CD (GitHub Actions)
- [ ] Docker
