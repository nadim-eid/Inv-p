# Structure exacte des tables (export Excel)

Le bouton **« Exporter vers Excel »** de l'application génère un fichier
`.xlsx` avec deux feuilles, structurées exactement comme suit. C'est un
export à la demande (instantané des données actuelles), pas un fichier que
l'application lit en continu : il n'y a rien à créer ou configurer à
l'avance, ce document sert uniquement de référence sur le contenu de
l'export.

## Feuille "Inventaire" — table nommée `Inventaire`

| Colonne                | Type attendu                  | Exemple                     |
|--------------------------|-------------------------------|------------------------------|
| `ID`                      | Texte, unique                 | `CHEM-A81F42D3`              |
| `Nom`                     | Texte                          | `Acétone`                    |
| `Tare_g`                  | Nombre                         | `120`                        |
| `MasseInitiale_g`         | Nombre                         | `1000`                       |
| `MasseRestante_g`         | Nombre                         | `825`                        |
| `PoidsBrutActuel_g`       | Nombre (= `Tare_g` + `MasseRestante_g`) | `945`         |
| `Emplacement`             | Texte                          | `Armoire A3`                 |
| `DateEntree`              | Date (AAAA-MM-JJ)              | `2026-01-15`                 |
| `QRValue`                 | Texte — **contient uniquement `ID`** | `CHEM-A81F42D3`         |
| `DerniereModification`    | Date/heure ISO 8601            | `2026-09-07T10:32:00.000Z`   |

Règles :
- `ID` est généré par le backend (`CHEM-XXXXXXXX`, 8 caractères hexadécimaux
  majuscules) au moment de l'ajout d'un produit ; il n'est jamais réutilisé.
- `QRValue` est strictement identique à `ID` — le QR imprimé n'encode
  **jamais** le nom, la quantité ou l'emplacement, uniquement l'identifiant.
  Toute information affichée après un scan provient d'une lecture fraîche
  des données de l'application, jamais du contenu du QR code lui-même.
- `PoidsBrutActuel_g` est recalculé par le backend à chaque création de
  produit et à chaque soutirage — il n'y a pas de formule à maintenir dans
  l'export.

## Feuille "Mouvements" — table nommée `Mouvements`

| Colonne          | Type attendu       | Exemple                     |
|--------------------|---------------------|-------------------------------|
| `MovementID`         | Texte, unique        | `MOV-3F9A1B2C4D`             |
| `DateHeure`          | Date/heure ISO 8601   | `2026-09-07T10:32:00.000Z`   |
| `ProductID`          | Texte                 | `CHEM-A81F42D3`               |
| `NomProduit`         | Texte                 | `Acétone`                     |
| `Type`               | Texte                 | `Soutirage`                   |
| `Quantite_g`         | Nombre                | `25`                          |
| `StockAvant_g`       | Nombre                | `850`                         |
| `StockApres_g`       | Nombre                | `825`                         |
| `Utilisateur`        | Texte (nom affiché)   | `Jean Dupont`                 |

Chaque soutirage validé dans l'application ajoute **exactement une ligne**
dans cette table (voir `backend/src/services/productService.js`, fonction
`applyWithdrawalAndRecordMovement`), et met à jour la ligne correspondante
d'`Inventaire` dans la même opération.

## Comment obtenir ce fichier

Aucune préparation manuelle n'est nécessaire. Depuis l'écran d'accueil de
l'application, appuyez sur **« ⬇️ Exporter vers Excel »** : le fichier est
généré à la volée avec la structure ci-dessus et téléchargé directement sur
votre appareil.
