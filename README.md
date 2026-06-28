# QCM Service

API REST minimaliste pour gérer des QCM (Questionnaires à Choix Multiples).

Ce projet fournit un backend Node.js/Express avec authentification JWT, persistance via Prisma (Postgres ou SQLite selon configuration), et endpoints pour créer, parcourir, répondre et obtenir les résultats d'un QCM.

**Technologies**

- Node.js + Express
- Prisma (ORM)
- JWT pour l'authentification (access + refresh tokens)
- bcrypt pour le hash des mots de passe
- Joi pour la validation des payloads
- Jest + Supertest pour les tests

**Structure**

- `src/app.js` : point d'entrée de l'application
- `src/routes/` : définition des routes (`/auth`, `/users`, `/qcms`)
- `src/controllers/` : logique métier pour l'authentification et la gestion des QCMs
- `src/middlewares/` : middlewares d'authentification, validation et gestion des erreurs
- `prisma/schema.prisma` : modèle de données (Questions, Propositions, QCM, Réponses, Users)
- `tests/` : tests unitaires / d'intégration

## Installation

1. Installer les dépendances :

```bash
npm install
```

2. Configurer les variables d'environnement (exemple `.env`):

```
PORT=3000
DATABASE_URL="file:./dev.db" # ou votre connexion Postgres
JWT_SECRET=change_me
JWT_REFRESH_SECRET=change_me_too
```

3. Initialiser la base Prisma (exemple SQLite) :

```bash
npx prisma migrate dev --name init
npx prisma generate
```

## Usage

Démarrer le serveur en développement :

```bash
npm run dev
```

## Endpoints principaux

- POST `/api/v1/auth/register` : création d'un compte (body: `email`, `password`, `name`)
- POST `/api/v1/auth/login` : authentification (body: `email`, `password`) → renvoie `accessToken` et `refreshToken`
- POST `/api/v1/auth/refresh` : rotation des tokens (body: `refreshToken`)
- GET `/api/v1/auth/me` : informations sur l'utilisateur (protected)

- Toutes les routes `/api/v1/qcms` sont protégées par JWT :
  - POST `/api/v1/qcms` : créer un QCM (body: `title`, `question1`, `question2` avec leurs `propositions`)
  - GET `/api/v1/qcms` : lister les QCMs
  - GET `/api/v1/qcms/:id` : récupérer un QCM (les propositions sont mélangées)
  - GET `/api/v1/qcms/:id/question` : obtenir la prochaine question non répondue pour l'utilisateur
  - POST `/api/v1/qcms/:id/response` : soumettre une réponse (body: `questionId`, `propositionId`)
  - GET `/api/v1/qcms/:id/result` : obtenir le score pour l'utilisateur
  - DELETE `/api/v1/qcms/:id` : supprimer un QCM et ses questions associées

## Tests

Lancer la suite de tests :

```bash
npm test
```

## Remarques & limites

- Le controller d'`auth` utilise actuellement un stockage en mémoire (`Map`) pour les utilisateurs et un `Set` pour les refresh tokens — adapté pour le développement uniquement. En production, remplacez par une vraie table `User` et un stockage persistant des refresh tokens (BD ou Redis).