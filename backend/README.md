# Machine Backend

API FastAPI et futur worker de IA Agent Tool.

## Installation

```bash
uv sync
```

## Lancement

```bash
uv run fastapi dev app/main.py
```

Worker Scout, une tâche à la fois :

```bash
uv run python -m app.workers.scout
```

Le worker nécessite `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` et `YOUTUBE_API_KEY`.

## Vérification

```bash
uv run ruff check .
uv run pytest
```
