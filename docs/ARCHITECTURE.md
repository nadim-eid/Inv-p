# Architecture — authentification locale et stockage local

## Pourquoi cette architecture

Cette version de Chemical Stock Manager ne dépend d'**aucun service
externe** (pas de Microsoft, pas de cloud, pas de compte tiers). Deux
raisons principales :

- Certaines organisations bloquent la création d'inscriptions d'applications
  Entra ID / Azure AD aux utilisateurs non-administrateurs.
- Un labo ou un petit atelier n'a pas forcément de tenant Microsoft 365 du
  tout, ou souhaite un outil totalement autonome, y compris utilisable sans
  connexion Internet.

## Authentification

```
1. Un administrateur cree un compte sur le serveur, en ligne de commande :
     npm run create-user -- j.dupont "MotDePasse123!" "Jean Dupont"
   Le mot de passe est hache avec bcrypt avant d'etre stocke
   (backend/data/users.json) : le mot de passe en clair n'est jamais
   conserve.

2. L'utilisateur se connecte depuis l'app (page Login) :
     POST /api/auth/login { username, password }
   Le backend verifie le mot de passe (bcrypt.compare), puis emet un JWT
   signe avec JWT_SECRET, contenant l'identite de l'utilisateur (id,
   username, displayName, role) et une expiration (JWT_EXPIRES_IN).

3. Le frontend conserve ce token en sessionStorage (src/auth/session.js) et
   l'envoie dans l'en-tete Authorization: Bearer <token> de chaque appel API.

4. Le backend (middleware/auth.js) verifie la signature et l'expiration du
   token a chaque requete. Si invalide/expire : 401, et le frontend force
   une reconnexion.
```

Aucun secret n'est jamais transmis au navigateur : le mot de passe est
verifie uniquement cote serveur, et `JWT_SECRET` (qui signe les tokens)
reste dans `backend/.env`, jamais exponse au frontend.

## Stockage des donnees

```
backend/data/
├── products.json    <- equivalent de la table "Inventaire"
├── movements.json   <- equivalent de la table "Mouvements"
└── users.json       <- comptes locaux (mot de passe hache)
```

`src/db/store.js` charge ces fichiers en memoire au demarrage et reecrit le
fichier concerne (ecriture atomique via fichier temporaire + renommage)
apres chaque modification. Aucun autre module du projet ne connait le
detail du stockage : remplacer ce fichier par une vraie base de donnees
(SQLite, Postgres...) ne demanderait de changer que `src/db/store.js`, tout
le reste de l'application (routes, services, frontend) resterait
identique.

## Export Excel (au lieu d'une synchronisation en direct)

`src/services/exportService.js` genere, a la demande
(`GET /api/export/excel`), un fichier `.xlsx` avec la meme structure de
colonnes que documentee dans `docs/EXCEL_TABLES.md`, a partir des donnees
actuellement en memoire. C'est un instantane telecharge par
l'utilisateur, pas une synchronisation continue vers un fichier partage :
plus simple, sans dependance externe, mais sans edition collaborative en
temps reel du fichier Excel lui-meme (les modifications passent toujours
par l'application, jamais par une edition directe du fichier exporte).

## Pourquoi pas de synchronisation multi-appareils en temps reel ?

Le backend est un serveur central : plusieurs telephones peuvent s'y
connecter simultanement (chacun avec son propre compte) et partagent les
memes donnees en temps reel, tant qu'ils pointent vers la meme instance de
backend. Ce qui a disparu, ce n'est pas le "multi-appareils", mais la
synchronisation vers un fichier Excel externe stocke sur un cloud tiers :
desormais, l'application elle-meme est la source de verite, et Excel n'est
qu'un format d'export/sauvegarde.
