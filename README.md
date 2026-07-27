# L'Ami Doré — Catalogue en ligne

Catalogue de pâtisserie statique (HTML + CSS + JS pur, aucune dépendance),
prêt à héberger gratuitement sur **GitHub Pages**.

## Structure du projet

```
ami-dore-catalogue/
├── index.html          → page principale
├── css/
│   └── style.css        → design (couleurs, typographie, mise en page)
├── js/
│   └── script.js         → logique (recherche, filtres, tri, popup)
├── data/
│   └── products.json    → la liste des produits (à modifier)
└── images/               → dossier pour vos photos de produits
```

## Modifier les produits

Tout se passe dans `data/products.json`. Chaque produit est un objet :

```json
{
  "id": "p01",
  "name": "Croissant au Beurre",
  "category": "Viennoiseries",
  "price": 8,
  "description": "Croissant pur beurre, feuilletage 27 tours...",
  "image": ""
}
```

- **id** : identifiant unique (ex: `p16`, `p17`...)
- **category** : les catégories et leurs couleurs sont générées automatiquement.
  Pour ajouter une nouvelle catégorie avec une couleur personnalisée, ajoutez une
  ligne dans `css/style.css` :
  ```css
  [data-category="Confiseries"]{ --cat: #8A5A44; }
  ```
- **image** : laissez `""` vide pour afficher un badge doré avec l'initiale du
  produit (aucune photo requise pour commencer). Ou mettez un chemin, ex:
  `"images/croissant.jpg"`, après avoir déposé votre photo dans `images/`.

Ajoutez, supprimez ou dupliquez des blocs `{ ... }` pour gérer votre carte —
aucune autre modification n'est nécessaire, la page se met à jour toute seule.

## Tester en local

Les navigateurs bloquent le chargement de `products.json` si vous ouvrez
`index.html` directement (double-clic). Lancez un petit serveur local :

```bash
cd ami-dore-catalogue
python3 -m http.server 8000
```

Puis ouvrez `http://localhost:8000` dans votre navigateur.

## Publier gratuitement sur GitHub Pages

1. Créez un nouveau dépôt sur GitHub (ex: `ami-dore-catalogue`).
2. Poussez ce dossier :
   ```bash
   cd ami-dore-catalogue
   git init
   git add .
   git commit -m "Catalogue L'Ami Doré"
   git branch -M main
   git remote add origin https://github.com/VOTRE-UTILISATEUR/ami-dore-catalogue.git
   git push -u origin main
   ```
3. Sur GitHub : **Settings → Pages → Source** → choisissez la branche `main`
   et le dossier `/ (root)` → **Save**.
4. Après 1–2 minutes, votre catalogue sera en ligne à :
   `https://VOTRE-UTILISATEUR.github.io/ami-dore-catalogue/`

## Fonctionnalités incluses

- ✅ Recherche par nom / description en direct
- ✅ Filtres par catégorie (générés automatiquement depuis vos données)
- ✅ Tri par prix (croissant / décroissant) et par nom
- ✅ Fiche produit en popup (image, description, prix)
- ✅ Design responsive (mobile, tablette, desktop)
- ✅ Aucune dépendance externe à installer — juste des polices Google Fonts

## Panneau d'administration (`admin.html`)

Une page `admin.html` permet d'**ajouter, modifier et supprimer des produits**
(avec photo, nom, prix, catégorie, description) depuis un formulaire, sans
toucher au code. Comme le site est 100% statique (pas de serveur ni de base
de données), ce panneau enregistre vos changements en écrivant directement
dans `data/products.json` de votre dépôt GitHub, via un jeton d'accès que
vous seul possédez. Chaque sauvegarde crée un commit ; le site public se
met à jour automatiquement 30 à 90 secondes après.

**Avant de l'utiliser, votre dépôt doit déjà être en ligne sur GitHub**
(voir la section publication ci-dessus).

### Créer votre jeton d'accès

1. GitHub → photo de profil (en haut à droite) → **Settings**.
2. Dans le menu de gauche, tout en bas : **Developer settings**.
3. **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
4. **Repository access** → *Only select repositories* → choisissez votre
   dépôt (ex: `ami-dore-catalogue`).
5. **Permissions** → **Repository permissions** → réglez **Contents** sur
   **Read and write**.
6. **Generate token**, puis copiez-le (il ne sera affiché qu'une seule fois).

### Utiliser le panneau

1. Ouvrez `https://VOTRE-UTILISATEUR.github.io/ami-dore-catalogue/admin.html`
2. Renseignez votre nom d'utilisateur GitHub, le nom du dépôt, la branche
   (`main` par défaut) et collez votre jeton.
3. Ajoutez un produit : nom, prix, catégorie, description, et une photo
   (facultative — sans photo, un badge doré avec l'initiale s'affiche
   automatiquement, comme sur le site).
4. Modifiez ou supprimez un produit existant depuis le tableau à droite.

### ⚠️ Sécurité — à lire

- Ce panneau **n'a pas de mot de passe intégré** : quiconque connaît l'URL
  `admin.html` peut l'ouvrir, mais **sans votre jeton il ne peut rien
  modifier**. Ne mettez jamais de lien vers `admin.html` dans votre menu
  public, et ne partagez jamais votre jeton.
- Le jeton est gardé uniquement dans la mémoire de l'onglet
  (`sessionStorage`) : il disparaît si vous fermez l'onglet, et n'est
  jamais envoyé ailleurs qu'à `api.github.com`.
- Pour plus de sécurité, créez le jeton avec une **expiration courte**
  (ex: 7 ou 30 jours) et limitez-le à ce seul dépôt, comme indiqué ci-dessus.
- Si vous soupçonnez une fuite de votre jeton, révoquez-le immédiatement
  depuis GitHub → Settings → Developer settings → Personal access tokens.

## Personnaliser les couleurs

Toutes les couleurs sont définies en haut de `css/style.css` :

```css
--cream:     #FBF6EE;   /* fond */
--ink:       #2B1B14;   /* texte principal */
--gold:      #C9A24B;   /* accent doré (identité de marque) */
--burgundy:  #6E2B3A;   /* prix, accents */
```
