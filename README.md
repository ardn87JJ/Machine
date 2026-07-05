# IA Agent Tool

Backoffice d’aide à la décision pour détecter et analyser des opportunités de contenu à partir de données YouTube réelles.

La V1 se limite à :

```text
Scout → Analyste → Décision humaine
```

Le périmètre complet et les décisions normatives sont définis dans [PROJECT_FOUNDATION.md](./PROJECT_FOUNDATION.md).

## État actuel

Phase 0 — fondation du nouveau projet :

- dépôt indépendant ;
- documentation d’architecture ;
- frontend React/TypeScript minimal ;
- backend FastAPI minimal ;
- tests et CI ;
- préparation Supabase.

Aucune logique Scout ou donnée simulée n’est encore intégrée.

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
- [ARCHITECTURE.md](./ARCHITECTURE.md) : architecture réellement implémentée ;
- [ROADMAP.md](./ROADMAP.md) : ordre de livraison ;
- [CHANGELOG.md](./CHANGELOG.md) : changements significatifs ;
- [CODEX_INSTRUCTIONS.md](./CODEX_INSTRUCTIONS.md) : règles de collaboration et modification.

## Ancienne version

`ia-agent-tool-v4` est une archive de référence fonctionnelle. Son code ne doit pas être copié automatiquement dans ce dépôt.
