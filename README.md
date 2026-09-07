# Chemical Stock Manager

Application web professionnelle de gestion d'inventaire de produits chimiques,
pensée mobile-first (Android / iPhone), avec identification par QR code.

**Aucune dépendance Microsoft / Azure / cloud.** Tout est auto-hébergé :

- **Frontend** : React + Vite, PWA installable, scanner QR caméra (`@zxing/browser`), génération QR (`qrcode`). Peut aussi être compilé en **APK Android natif** (via Capacitor).
- **Backend** : Node.js + Express, données stockées **localement** (fichiers JSON sur disque).
- **Auth** : comptes utilisateurs **locaux** (nom d'utilisateur + mot de passe géré par bcrypt), sessions par JWT auto-signé.
- **Excel** : pas de synchronisation en direct — un bouton **« Exporter vers Excel »** génère à la demande un fichier `.xlsx` avec la structure `Inventaire` / `Mouvements`, téléchargeable et compatible avec Excel/LibreOffice/Google Sheets.

Cette page explique tout ce qu'il faut faire pour installer, configurer et
déployer l'application. Pour le déploiement en production, voir
[`DEPLOYMENT.md`](./DEPLOYMENT.md). Pour l'architecture technique, voir
[`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

---

## Sommaire

1. [Installation](#1-installation)
2. [Créer un compte utilisateur](#2-créer-un-compte-utilisateur)
3. [Lancement local](#3-lancement-local)
4. [Variables d'environnement](#4-variables-denvironnement)
5. [Export vers Excel](#5-export-vers-excel)
6. [Déploiement HTTPS](#6-déploiement-https)
7. [Installer l'app sur téléphone (PWA)](#7-installer-lapp-sur-téléphone-pwa)
8. [Générer un vrai fichier APK Android](#8-générer-un-vrai-fichier-apk-android)
9. [Test caméra sur téléphone](#9-test-caméra-sur-téléphone)
10. [Test d'impression d'étiquette](#10-test-dimpression-détiquette)
11. [Tests automatisés](#11-tests-automatisés)
12. [Structure du projet](#12-structure-du-projet)
13. [Sauvegardes](#13-sauvegardes)

---

## 1. Installation

Prérequis : **Node.js ≥ 18**. Rien d'autre — pas de compte cloud, pas
d'inscription, pas d'administrateur à solliciter.

```bash
git clone <url-du-repo> chemical-stock-manager
cd chemical-stock-manager

# Backend
cd backend
npm install
cp .env.example .env
cd ..

# Frontend
cd frontend
npm install
cp .env.example .env.local
cd ..
```

Ouvrez `backend/.env` et générez une vraie valeur pour `JWT_SECRET` :

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Collez le résultat dans `JWT_SECRET=` du fichier `backend/.env`.

## 2. Créer un compte utilisateur

Il n'y a volontairement **aucune page d'inscription publique** (pour éviter
que n'importe qui sur le réseau puisse créer un compte). Les comptes sont
créés en ligne de commande, sur le serveur :

```bash
cd backend
npm run create-user -- j.dupont "MotDePasse123!" "Jean Dupont" technicien
```

Paramètres : `<nom_utilisateur> <mot_de_passe> [nom_affiché] [role]`
(`role` = `technicien` ou `admin`, `technicien` par défaut). Répétez la
commande pour chaque personne devant utiliser l'application. Le mot de
passe doit faire au moins 8 caractères.

## 3. Lancement local

Deux terminaux :

```bash
# Terminal 1 - backend (port 4000 par défaut)
cd backend
npm run dev
```

```bash
# Terminal 2 - frontend (port 5173, HTTPS auto via certificat auto-signé)
cd frontend
npm run dev
```

Ouvrez `https://localhost:5173`. Le navigateur affichera un avertissement de
certificat auto-signé (normal en local) : acceptez l'exception. **HTTPS est
obligatoire**, même en local, car l'accès à la caméra du téléphone (scanner
QR) est refusé par les navigateurs en dehors d'un "secure context".

Connectez-vous avec le compte créé à l'étape 2.

Pour tester depuis un téléphone sur le même réseau Wi-Fi, remplacez
`localhost` par l'adresse IP locale de votre ordinateur (ex :
`https://192.168.1.20:5173`), et mettez à jour `VITE_API_BASE_URL` dans
`frontend/.env.local` avec cette même IP (ex :
`https://192.168.1.20:4000/api`), ainsi que `CORS_ORIGIN` dans
`backend/.env`.

## 4. Variables d'environnement

Deux fichiers, jamais commités (voir `.gitignore`) :

- **`backend/.env`** : `JWT_SECRET` (obligatoire, aléatoire, gardé secret),
  `DATA_DIR` (dossier de stockage des données), seuils de stock, port, CORS.
- **`frontend/.env.local`** : `VITE_API_BASE_URL` (adresse du backend),
  seuils d'affichage. Aucun secret ici — ce fichier finit dans le code
  JavaScript envoyé au navigateur.

Chaque variable est commentée dans les fichiers `.env.example`
correspondants.

## 5. Export vers Excel

Depuis l'écran d'accueil, le bouton **« ⬇️ Exporter vers Excel »** télécharge
un fichier `Inventaire_Chimique_AAAA-MM-JJ.xlsx` généré à l'instant à partir
des données actuelles, avec exactement la même structure de tables que
documentée dans [`docs/EXCEL_TABLES.md`](./docs/EXCEL_TABLES.md) :
une feuille `Inventaire` et une feuille `Mouvements`.

C'est un **instantané téléchargeable**, pas une synchronisation en direct :
ouvrez-le dans Excel/LibreOffice/Google Sheets pour analyser, archiver ou
partager les données quand vous le souhaitez. Pour une sauvegarde
automatique régulière, voir [section 13](#13-sauvegardes).

## 6. Déploiement HTTPS

Voir [`DEPLOYMENT.md`](./DEPLOYMENT.md) pour le détail complet. Résumé :
**HTTPS est obligatoire en production**, sans exception, car l'API
`getUserMedia` (caméra) et les Service Workers (PWA) l'exigent sur tous les
navigateurs mobiles ciblés.

## 7. Installer l'app sur téléphone (PWA)

Sans rien compiler, l'application s'installe déjà comme une app :

- **Android (Chrome/Edge)** : ouvrez l'URL HTTPS de l'app → menu ⋮ →
  **"Ajouter à l'écran d'accueil" / "Installer l'application"**.
- **iPhone (Safari)** : ouvrez l'URL → bouton Partager → **"Sur l'écran
  d'accueil"**.

L'icône obtenue se comporte comme une app native (plein écran, pas de barre
d'adresse, icône dédiée). C'est le moyen le plus simple d'avoir "une app sur
le téléphone" sans passer par un store ni compiler quoi que ce soit.

## 8. Générer un vrai fichier APK Android

Si vous avez besoin d'un fichier `.apk` distribuable (installation directe,
sans passer par le Play Store), le projet Android natif est déjà généré
dans `frontend/android/` (via [Capacitor](https://capacitorjs.com)), prêt à
compiler. **Cette compilation nécessite Android Studio** (SDK Android +
Gradle), qui n'est pas quelque chose qu'on peut générer sans cet outil sur
votre machine.

```bash
cd frontend
npm run build           # build web a jour
npx cap sync android    # copie le build dans le projet Android
npm run android:open    # ouvre le projet dans Android Studio
```

Dans Android Studio : **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
Le fichier `.apk` généré se trouve ensuite dans
`android/app/build/outputs/apk/debug/app-debug.apk`, à copier sur le
téléphone et installer (autoriser "Sources inconnues" si demandé).

Avant un déploiement réel, pensez à :
- Modifier `VITE_API_BASE_URL` dans `frontend/.env.local` avec l'URL
  **publique HTTPS** de votre backend (pas `localhost`) avant de builder,
  puisque l'APK n'aura plus accès à votre réseau local de développement.
- Remplacer l'icône par défaut via l'outil **Image Asset** d'Android Studio
  (clic droit sur `res/` → New → Image Asset), en partant de
  `frontend/public/icons/icon-512.png`.
- Signer l'APK en mode "release" (et non "debug") pour une distribution
  hors développement — voir la documentation Android Studio sur la
  signature d'application.

## 9. Test caméra sur téléphone

1. Ouvrez l'application (PWA installée, ou APK) sur le téléphone.
2. Connectez-vous avec votre compte local.
3. Depuis l'accueil, appuyez sur **📷 SCANNER**.
4. Le navigateur/l'app doit demander la permission d'accès à la caméra :
   acceptez.
5. La caméra **arrière** doit s'activer automatiquement
   (`facingMode: environment`). Visez une étiquette imprimée
   ([section 10](#10-test-dimpression-détiquette)) : la fiche produit doit
   s'afficher en moins d'une seconde après détection.
6. Testez le cas d'échec : refusez la permission caméra → un message clair
   doit apparaître et le champ de **saisie manuelle de l'identifiant** doit
   rester utilisable.
7. Testez un identifiant inexistant dans le champ manuel (ex :
   `CHEM-00000000`) → l'écran doit afficher clairement **"Produit
   inconnu"**, sans jamais inventer de fiche produit.

## 10. Test d'impression d'étiquette

1. Ajoutez un produit de test (**➕ AJOUTER UN PRODUIT**).
2. L'écran **Étiquette** s'affiche avec le QR code, le nom, l'ID, la tare et
   l'emplacement.
3. Appuyez sur **🖨️ Imprimer l'étiquette** :
   - Vérifiez que **seule l'étiquette** apparaît dans l'aperçu d'impression
     (pas le menu, pas les boutons de l'application).
   - Le format papier proposé doit correspondre à **50 mm × 30 mm** par
     défaut.
4. Scannez l'étiquette réellement imprimée pour vérifier que le QR est bien
   lisible et pointe vers le bon produit.
5. Pour changer le format d'étiquette, modifiez uniquement
   `frontend/src/config/labelConfig.js` (`ACTIVE_LABEL_SIZE`), ou changez
   le format directement depuis un sélecteur sur l'écran Étiquette.

## 11. Tests automatisés

```bash
# Backend : logique de stock, génération d'ID, authentification locale,
# routes (produit inconnu, double-validation simultanée, quantités
# négatives/nulles/excessives)
cd backend
npm test

# Frontend : logique pure des indicateurs de stock (vert/orange/rouge)
cd frontend
npm test
```

Cas couverts explicitement par les tests backend (`backend/tests/`) :

| Scénario                                   | Résultat attendu                        |
|---------------------------------------------|------------------------------------------|
| Stock = 1000 g, soutirage = 100 g            | Nouveau stock = 900 g                    |
| Stock = 850 g, soutirage = 25 g              | Nouveau stock = 825 g                    |
| Stock = 50 g, soutirage = 60 g               | Opération refusée (stock insuffisant)    |
| Stock = 50 g, soutirage = -10 g              | Opération refusée (quantité négative)    |
| Soutirage = 0 g                              | Opération refusée (quantité nulle)       |
| Identifiant/QR inconnu                       | "Produit inconnu"                        |
| Deux validations simultanées sur un produit  | Une seule est acceptée, l'autre refusée (409) |
| Mot de passe incorrect / utilisateur inconnu | Connexion refusée (401), aucun token émis|

## 12. Structure du projet

```
chemical-stock-manager/
├── backend/
│   ├── server.js
│   ├── data/                     <- fichiers JSON (products/movements/users), cree au 1er lancement
│   ├── scripts/createUser.js     <- creation de compte en ligne de commande
│   ├── src/
│   │   ├── config/env.js
│   │   ├── db/store.js           <- stockage local (remplace Excel/Graph)
│   │   ├── middleware/ (auth.js, errorHandler.js)
│   │   ├── routes/ (auth.js, products.js, movements.js, export.js, health.js)
│   │   ├── services/
│   │   │   ├── productService.js <- logique produits/mouvements sur le stockage local
│   │   │   ├── userService.js    <- comptes locaux (bcrypt + JWT)
│   │   │   ├── exportService.js  <- generation du .xlsx a la demande
│   │   │   ├── idGenerator.js
│   │   │   └── stockLogic.js     <- calculs/validation, testes unitairement
│   │   └── utils/operationLock.js
│   ├── tests/
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/client.js
│   │   ├── auth/session.js       <- session locale (remplace MSAL)
│   │   ├── context/AuthContext.jsx
│   │   ├── config/labelConfig.js
│   │   ├── components/ (Layout.jsx, StockBadge.jsx)
│   │   ├── pages/ (Login, Home, AddProduct, Scanner, ProductDetail, Inventory, History, Label)
│   │   ├── styles/ (index.css, print.css)
│   │   └── utils/stockLevel.js
│   ├── android/                  <- projet Android natif (Capacitor), pret a compiler en .apk
│   ├── public/ (manifest.webmanifest, icons/)
│   ├── capacitor.config.ts
│   ├── tests/
│   └── .env.example
├── docs/
│   ├── ARCHITECTURE.md
│   └── EXCEL_TABLES.md
├── README.md
├── DEPLOYMENT.md
└── .env.example
```

## 13. Sauvegardes

Toutes les données vivent dans `backend/data/` (trois fichiers JSON
lisibles). Sauvegarder l'application revient à sauvegarder ce dossier :

```bash
# Sauvegarde manuelle simple
cp -r backend/data backend/data-backup-$(date +%Y%m%d)

# Ou, automatiquement, planifiez une tache cron qui copie ce dossier
# (ou le fichier .xlsx exporte via l'API) vers un stockage de votre choix.
```

Il est recommandé de mettre en place une sauvegarde régulière (cron,
sauvegarde système, ou export Excel périodique via un script qui appelle
`GET /api/export/excel`) adaptée à votre environnement d'hébergement.

---

## Principes de sécurité et de fiabilité appliqués

- Les mots de passe ne sont jamais stockés en clair (hachage bcrypt).
- Les sessions sont des JWT signés avec `JWT_SECRET` (à générer aléatoirement
  et à garder secret), avec une durée de validité limitée
  (`JWT_EXPIRES_IN`).
- Aucune route d'inscription publique : seule une personne ayant accès au
  serveur (ligne de commande) peut créer des comptes.
- Toute erreur d'écriture est remontée telle quelle à l'écran :
  **« Enregistrement impossible. Aucune modification n'a été
  enregistrée. »** — jamais de faux succès.
- Les quantités négatives, nulles, ou supérieures au stock disponible sont
  rejetées à la fois côté frontend et côté backend
  (`services/stockLogic.js`, seule source de vérité).
- Un verrou serveur (`utils/operationLock.js`) empêche deux soutirages
  simultanés sur le même produit.
- Le QR code n'encode **que** l'identifiant produit (`QRValue = ID`),
  jamais le détail du produit.
- Toutes les données restent sur votre propre serveur : aucune donnée
  n'est envoyée à un service tiers.
