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

## Vérification

```bash
uv run ruff check .
uv run pytest
```
