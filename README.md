# Desert Ceram — site vitrine de démonstration

Site vitrine d'un **fabricant de céramique fictif**, réalisé comme projet de portfolio.
Structure inspirée des sites de fabricants de carrelage (accueil, catalogue filtrable, fiches techniques,
réseau de distribution, demande de devis), avec une marque, des textes et des visuels entièrement originaux.

## Ce que montre le projet

- **Astro** : site statique multi-pages, composants réutilisables, données en JSON.
- **Catalogue filtrable** (catégorie, format, finition, couleur, recherche), filtres reflétés dans l'URL.
- **Fiche produit** en `<dialog>` accessible, lien direct partageable (`/collections/?p=tassili`),
  bouton « précédent » du navigateur géré, et **aperçu du carreau posé** (simulation CSS 3D à l'échelle du format).
- **Calculateur de devis** : surface + chutes (10 ou 15 %) → nombre de boîtes, à partir du conditionnement réel.
- **Formulaire** avec validation accessible (messages liés par `aria-describedby`, `aria-invalid`),
  récapitulatif construit en `textContent` (aucune injection HTML).
- **Visuels générés par code** (`scripts/gen-tiles.mjs`) : marbre, pierre, bois, terrazzo, zellige, relief dunes —
  SVG déterministes, aucune image externe, quelques Ko chacun.
- **Sécurité** : CSP stricte sans `unsafe-inline` (`public/_headers`), aucun script ni style inline,
  aucune ressource tierce. Le style dynamique passe par le CSSOM, autorisé par la CSP.
- **Responsive** et menu mobile sans JavaScript (`<details>`).

## Arborescence

```
scripts/gen-tiles.mjs      génère public/tiles/*.svg et public/img/*.svg à partir des données
src/data/products.json     13 produits (spécifications complètes)
src/data/distributors.json 14 points de vente fictifs
src/pages/                 /, /collections/, /distributeurs/, /devis/, 404
src/scripts/               filtres + fiche produit, distributeurs, devis
src/styles/global.css      design (variables en tête de fichier)
```

## Commandes

```bash
npm install
npm run dev     # http://localhost:4321
npm run build   # régénère les visuels puis construit dist/
```

Ajouter un produit : une entrée dans `products.json` (avec son motif `pattern`), puis `npm run build`.

## Déploiement Cloudflare Pages

Dépôt GitHub → Cloudflare **Workers & Pages → Create → Pages → Connect to Git** :
preset `Astro`, build `npm run build`, output `dist`. Mettre ensuite l'URL réelle dans `astro.config.mjs`.

## Pistes d'évolution

- Envoi réel du devis via une **Pages Function** (`functions/api/devis.ts`) + service d'email.
- Version **arabe (RTL)** et anglaise.
- Fiches techniques PDF générées au build.

> Desert Ceram n'existe pas. Produits, chiffres et distributeurs sont inventés.
