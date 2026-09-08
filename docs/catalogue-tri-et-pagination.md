# Catalogue de profils — tri et pagination

Note d'une page pour Florine : algorithme de classement du catalogue recruteur
(`GET /api/videos`), critères de filtrage disponibles, et garantie de pagination.

## 1. Algorithme de classement

Tri par défaut, deux colonnes, jamais une seule :

```
ORDER BY user.updatedAt DESC, video.id DESC
```

- `user.updatedAt` : date de dernière mise à jour du profil du candidat (décroissante —
  les profils les plus récemment mis à jour en premier).
- `video.id` : clé de départage. Sans elle, deux profils mis à jour à la même date
  n'auraient aucun ordre garanti entre deux exécutions.

Implémenté dans [lib/catalog.ts](../lib/catalog.ts) et utilisé tel quel par
[app/api/videos/route.ts](../app/api/videos/route.ts) — le script de démonstration
(section 3) importe les mêmes fonctions, ce n'est pas une réimplémentation séparée.

## 2. Critères de filtrage et de tri disponibles

Filtres acceptés par `GET /api/videos` (implémentés dans
[lib/catalog.ts](../lib/catalog.ts), fonction `parseCatalogFilters`) :

- `sector` — une valeur de l'enum `ActivitySector` (ex. `TECHNOLOGY`), rejetée avec une
  erreur 400 si elle n'en fait pas partie.
- `location` — recherche insensible à la casse sur la localisation du profil
  (`contains`, pas une correspondance exacte).
- `certified` — `true` ou `false` ; filtre sur la présence d'une date de certification.
- `validated` (filtre technique de modération, pas un critère recruteur).

Ces filtres se combinent avec le tri : ils réduisent l'ensemble des profils avant
application de l'`ORDER BY` et de la pagination par curseur (section 1), donc la
garantie de stabilité décrite en section 4 s'applique aussi bien avec filtres qu'sans.

Le paramètre `sortBy`, lui, n'accepte aujourd'hui qu'une seule valeur, `date` (le tri
par défaut ci-dessus) — toute autre valeur est rejetée avec une erreur 400.
**Aucun critère de popularité (vues, likes, messages) n'est accepté par l'API**, ni
comme filtre ni comme tri, même si le compteur de vues existe par ailleurs dans le
modèle de données à d'autres fins. Étendre `sortBy` pour trier explicitement par
secteur/localisation/certification (et non plus seulement filtrer dessus) reste hors de
cette livraison : ces colonnes acceptent des valeurs nulles, ce qui demande une gestion
de curseur plus fine pour rester garantie stable — à ne livrer que testée.

## 3. Preuve de stabilité (double parcours)

`npm run verify:catalog-order` parcourt deux fois de suite l'intégralité du catalogue
(profils validés) page par page, écrit chaque liste d'identifiants dans un fichier
([docs/catalog-order-run-1.txt](catalog-order-run-1.txt),
[docs/catalog-order-run-2.txt](catalog-order-run-2.txt)), et vérifie : ordre identique,
aucun doublon, total égal au `COUNT(*)` réel. Le script échoue (code de sortie 1) si
l'une de ces trois conditions n'est pas remplie.

## 4. Modification concurrente pendant la pagination

La pagination est par curseur ("keyset"), pas par `OFFSET`/`LIMIT` : chaque page
demande "les profils suivants strictement après tel `(updatedAt, id)`", jamais "les
profils à partir du rang N". Conséquence pour le cas où un profil est modifié pendant
qu'un recruteur pagine :

- **Garantie offerte** : aucun profil n'est jamais montré deux fois au recruteur au
  cours d'un même parcours, quel que soit le nombre de modifications survenant entre
  les pages.
- **Garantie non offerte** : un profil déjà dépassé par la pagination et modifié en
  cours de route devient plus récent que le curseur courant et **disparaît** du reste
  de ce parcours — il ne réapparaîtra, en tête de liste, qu'au prochain chargement
  complet du catalogue par le recruteur.

Aucune duplication n'est donc possible ; une disparition temporaire d'un profil modifié
en cours de pagination reste possible et n'est pas corrigée par cette livraison.
