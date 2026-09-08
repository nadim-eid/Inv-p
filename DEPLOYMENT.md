# Déploiement — Chemical Stock Manager

Ce document couvre le déploiement en production. Pour l'installation et la
configuration initiale, voir [`README.md`](./README.md). Application
entièrement auto-hébergée : aucun compte cloud ni service tiers requis.

## Vue d'ensemble

```
[Téléphone Android/iPhone, ou APK installé]
        │  HTTPS obligatoire (caméra + PWA)
        ▼
[Frontend statique - React/Vite build]  (Nginx/Caddy, ou tout hebergeur de fichiers statiques HTTPS)
        │  HTTPS, appels API (Authorization: Bearer <JWT local>)
        ▼
[Backend Node/Express]  (VM, conteneur, Raspberry Pi, NAS... tout ce qui fait tourner Node.js)
        │
        ▼
[Fichiers JSON locaux - backend/data/]
```

Le frontend et le backend peuvent tourner sur la même machine (le plus
simple pour un labo), ou être séparés. Aucune dépendance externe : tout
peut fonctionner **entièrement hors ligne d'Internet**, sur un réseau local
uniquement, si c'est votre besoin (labo isolé, réseau industriel, etc.).

## 1. HTTPS — non négociable

- **Caméra (scanner QR)** : les navigateurs mobiles bloquent `getUserMedia`
  en dehors d'un "secure context". Seuls `https://` et `http://localhost`
  sont autorisés.
- **PWA / Service Worker** : idem.
- Utilisez un certificat valide. Deux cas de figure fréquents :
  - **Domaine public** : Let's Encrypt (gratuit) via `certbot` ou
    l'intégration native de Caddy.
  - **Réseau local uniquement (pas de domaine public)** : générez un
    certificat auto-signé et installez-le comme "certificat de confiance"
    sur chaque téléphone utilisant l'app (Paramètres → Sécurité →
    Installer un certificat, sur Android ; Réglages → Général → À propos →
    Certificats de confiance, sur iPhone), ou utilisez un outil comme
    `mkcert` pour générer un certificat local reconnu.

## 2. Build et déploiement du frontend

```bash
cd frontend
npm install
npm run build
```

Produit un dossier `dist/` statique à déployer sur n'importe quel serveur
HTTPS (Nginx, Caddy, ou un simple `serve -s dist` derrière un reverse-proxy
TLS). Avant de builder, définissez l'URL réelle du backend dans
`frontend/.env.production` :

```
VITE_API_BASE_URL=https://api.votre-domaine.exemple.com/api
VITE_STOCK_SEUIL_FAIBLE_G=100
VITE_STOCK_SEUIL_CRITIQUE_G=20
```

### Exemple minimal avec Caddy (HTTPS automatique)

```
votre-domaine.exemple.com {
    root * /var/www/chemical-stock-manager/dist
    file_server
    try_files {path} /index.html
}

api.votre-domaine.exemple.com {
    reverse_proxy localhost:4000
}
```

## 3. Déploiement du backend

```bash
cd backend
npm install --production
```

Définissez les variables de `backend/.env.example` comme variables
d'environnement de votre serveur (jamais dans un fichier commité) :
`JWT_SECRET` (généré aléatoirement, unique par installation), `DATA_DIR`
(chemin persistant, en dehors du dossier de code si vous redéployez
régulièrement), `CORS_ORIGIN` (URL exacte du frontend déployé), `PORT`,
`NODE_ENV=production`.

Démarrage : `npm start` (ou via PM2 / systemd / conteneur pour un
redémarrage automatique en cas de crash ou de redémarrage serveur).

Créez ensuite les comptes utilisateurs :

```bash
npm run create-user -- j.dupont "MotDePasseSolide123!" "Jean Dupont" technicien
```

## 4. Persistance des données

`DATA_DIR` (par défaut `backend/data/`) contient trois fichiers JSON. En
production :

- Pointez `DATA_DIR` vers un **volume persistant** (pas un dossier éphémère
  de conteneur) pour ne pas perdre les données à chaque redéploiement.
- Mettez en place une sauvegarde régulière de ce dossier (cron, snapshot de
  volume, etc.) — voir README section 13.

## 5. CORS

`backend/.env` : `CORS_ORIGIN` doit lister exactement l'origine HTTPS du
frontend déployé.

## 6. Distribution de l'APK Android (optionnel)

Si vous distribuez un `.apk` (voir README section 8) en dehors du Play
Store :

- Buildez-le en mode **release** signé (pas *debug*) pour la distribution
  réelle — voir la documentation Android Studio sur la signature.
- Avant de builder, `VITE_API_BASE_URL` doit pointer vers l'URL **publique
  HTTPS** définitive du backend (l'APK n'a pas accès à votre réseau de
  développement local).
- Distribution simple : partagez le fichier `.apk` directement (email,
  stockage partagé, site interne) ; l'utilisateur devra autoriser
  "Sources inconnues" lors de l'installation. Pour une distribution plus
  large, un dépôt d'entreprise (Managed Google Play) ou un magasin
  d'applications interne est recommandé.

## 7. Vérifications post-déploiement

- [ ] Connexion avec un compte local fonctionne.
- [ ] `GET https://api.votre-domaine/api/health` répond `200`.
- [ ] Ajout d'un produit → apparaît dans l'inventaire.
- [ ] Export Excel (`⬇️ Exporter vers Excel`) télécharge un `.xlsx` valide
      avec les données actuelles.
- [ ] Scan caméra fonctionne sur Chrome Android, Edge Android, Safari
      iPhone, Edge iPhone (voir README section 9).
- [ ] Impression d'étiquette au format 50×30 mm imprime uniquement
      l'étiquette (voir README section 10).
- [ ] Un soutirage met à jour `MasseRestante_g`, `PoidsBrutActuel_g`, et
      ajoute une ligne dans l'historique.
- [ ] Simulez une erreur d'écriture (ex : rendez `DATA_DIR` temporairement
      en lecture seule) : l'application doit afficher clairement
      « Enregistrement impossible. Aucune modification n'a été
      enregistrée. », jamais un faux succès.
- [ ] L'application peut être installée sur l'écran d'accueil (PWA) sur
      Android et iOS.
- [ ] Les sauvegardes de `DATA_DIR` sont en place et testées (restauration
      vérifiée au moins une fois).
