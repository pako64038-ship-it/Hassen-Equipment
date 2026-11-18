# Hassen Equipment · Pack 3D Designer

Plateforme 3D (Next.js) pour choisir les packs et équipements Hassen Equipment, voir le local en 3D et demander un devis par WhatsApp.

Site : https://pako64038-ship-it.github.io/Hassen-Equipment/

## Structure

- `app/` : page Next.js (`layout.tsx`, `page.tsx`, `globals.css`)
- `components/` : interface React (en-tête, panneau, catalogue, scène 3D, barre du bas)
- `lib/engine.js` : moteur 3D (three.js) et logique du catalogue, des packs et du devis
- `public/images/` : photos des produits
- `public/data/equipment.json` : équipements ajoutés en mode vendeur

## Développement

```bash
npm install
npm run dev
```

## Publication

`npm run build` crée le site statique dans `out/`, publié sur la branche `gh-pages`.

## Mode vendeur

Ajouter `#admin` à la fin du lien pour ajouter des équipements et leurs modèles. Le bouton « نزّل المعدات » télécharge `equipment.json`, à placer dans `public/data/`.
