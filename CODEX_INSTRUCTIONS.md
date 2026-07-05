# Instructions de travail

## Avant toute modification

1. Lire `PROJECT_FOUNDATION.md`.
2. Lire `ARCHITECTURE.md`.
3. Lire `ROADMAP.md`.
4. Lire `CHANGELOG.md`.
5. Inspecter l’état Git.
6. Expliquer brièvement le plan.

## Règles

- préserver le périmètre V1 ;
- ne pas copier automatiquement V4 ;
- ne pas développer directement sur `main` après le premier checkpoint ;
- préférer les modifications ciblées ;
- ne pas remplacer un fichier entier sans justification ;
- ne pas ajouter de second runtime pour contourner le premier ;
- ne pas utiliser `localStorage` comme base métier ;
- ne pas exposer de secret dans `VITE_*` ;
- ne jamais remplacer silencieusement une erreur réelle par une simulation ;
- versionner les contrats et le scoring ;
- signaler les ambiguïtés et risques hors périmètre.

## Vérifications minimales

Frontend :

```bash
npm --prefix frontend run lint
npm --prefix frontend run typecheck
npm --prefix frontend run test
npm --prefix frontend run build
```

Backend :

```bash
uv run --directory backend ruff check .
uv run --directory backend pytest
```

Projet :

```bash
git diff --check
git status --short
```

## Compte rendu

Après modification :

- lister les fichiers modifiés ;
- expliquer le comportement réellement obtenu ;
- donner les commandes de vérification exécutées ;
- distinguer ce qui reste incomplet ;
- mettre à jour `CHANGELOG.md` et `ROADMAP.md` si nécessaire.
