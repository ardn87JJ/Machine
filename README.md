# IA Agent Tool

Backoffice IA business pour détecter, scorer et préparer l’exploitation
d’opportunités de contenu monétisables à partir de données réelles.

La V1 se limite à :

```text
Scout → Analyste → Décision humaine
```

Le cadrage produit opérationnel est défini dans [PRODUCT_BRIEF.md](./PRODUCT_BRIEF.md).
Le périmètre normatif de reconstruction est défini dans
[PROJECT_FOUNDATION.md](./PROJECT_FOUNDATION.md).

## État actuel

Phase 1 — première tranche verticale Scout :

- dépôt indépendant ;
- documentation d’architecture ;
- frontend React/TypeScript minimal ;
- backend FastAPI minimal ;
- tests et CI ;
- préparation Supabase ;
- création et liste de scans Scout stockés côté Supabase ;
- création d’une tâche serveur associée à chaque scan ;
- worker Scout pour réserver une tâche, appeler YouTube et stocker les premiers
  résultats vidéo/chaîne ;
- aperçu visible d’une collecte réelle YouTube.

La prochaine priorité n’est pas une liste de vidéos plus jolie, mais un écran Scout
business : signaux de niche, concurrents faibles, opportunités et premiers scores.

## Prérequis

- Node.js 22 ou version LTS compatible ;
- npm 10 ou supérieur ;
- Python 3.12 ou supérieur ;
- [uv](https://docs.astral.sh/uv/) ;
- Supabase CLI seulement lorsque les migrations distantes commenceront.

## Installation

```bash
cp .env.example .env
npm --prefix frontend install
uv sync --directory backend
```

## Développement

Backend :

```bash
uv run --directory backend fastapi dev app/main.py
```

Frontend :

```bash
npm --prefix frontend run dev
```

Build GitHub Pages :

```bash
GITHUB_ACTIONS=true GITHUB_REPOSITORY=ardn87JJ/Machine npm --prefix frontend run build
```

Adresses par défaut :

- frontend : `http://localhost:5173`
- API : `http://localhost:8000`
- documentation API : `http://localhost:8000/docs`

## Vérifications

```bash
npm --prefix frontend run lint
npm --prefix frontend run typecheck
npm --prefix frontend run test
npm --prefix frontend run build

uv run --directory backend ruff check .
uv run --directory backend pytest
```

## Documents d’autorité

- [PROJECT_FOUNDATION.md](./PROJECT_FOUNDATION.md) : produit, périmètre et règles fondatrices ;
- [PRODUCT_BRIEF.md](./PRODUCT_BRIEF.md) : intention business, agents et GO MONEY MODE ;
- [ARCHITECTURE.md](./ARCHITECTURE.md) : architecture réellement implémentée ;
- [ROADMAP.md](./ROADMAP.md) : ordre de livraison ;
- [CHANGELOG.md](./CHANGELOG.md) : changements significatifs ;
- [CODEX_INSTRUCTIONS.md](./CODEX_INSTRUCTIONS.md) : règles de collaboration et modification.

## Ancienne version

`ia-agent-tool-v4` est une archive de référence fonctionnelle. Son code ne doit pas être copié automatiquement dans ce dépôt.
