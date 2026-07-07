# Architecture

## Statut

Architecture de la fondation et du début de phase 1. Ce document décrit uniquement ce qui est retenu pour la nouvelle application.

## Principes

- une source de vérité distante ;
- un backend pour les secrets et règles métier ;
- un seul service par responsabilité ;
- tâches asynchrones idempotentes ;
- scores déterministes, explicables et versionnés ;
- aucune simulation silencieuse ;
- aucune dépendance à l’ancienne V4.

## Vue d’ensemble

```text
React + TypeScript
        │ HTTP
        ▼
FastAPI
        │
        ├── PostgreSQL / Supabase
        ├── file de tâches PostgreSQL
        └── worker Python
                  │
                  └── YouTube Data API
```

## Frontend

Responsabilités :

- navigation ;
- formulaires ;
- affichage des données ;
- progression des tâches ;
- décisions humaines ;
- erreurs compréhensibles.

Interdictions :

- clé YouTube dans le bundle ;
- scoring de référence dans le navigateur ;
- données métier durables dans `localStorage` ;
- appels directs à YouTube ;
- services installés par effets de bord globaux.

## Backend

Responsabilités :

- contrats API ;
- validation ;
- autorisation ;
- transitions d’état ;
- création des tâches ;
- accès à la base ;
- scoring ;
- accès aux fournisseurs externes.

Les points d’entrée exposés sont :

- `/health`
- `/api/v1/status`
- `/api/v1/scout/scans`

La route Scout crée un scan, normalise le mot-clé et enregistre une tâche `scout.scan`
associée. Elle dépend de Supabase et retourne une erreur structurée si la configuration
serveur manque.

## Worker

Le worker Scout initial traite une tâche à la fois avec :

- clé d’idempotence ;
- verrou expirant ;
- heartbeat ;
- nombre maximal de tentatives ;
- erreurs structurées.

La commande `python -m app.workers.scout` réserve la prochaine tâche `scout.scan`,
marque le scan en cours, puis échoue explicitement si `YOUTUBE_API_KEY` manque. Le
collecteur YouTube réel et le stockage vidéo/chaîne restent à ajouter.

Redis, Celery, LangGraph et CrewAI ne font pas partie de la fondation.

## Données

Supabase/PostgreSQL sera la source de vérité. La première migration pose les types et
tables techniques minimales. La table `scans` conserve les demandes Scout explicites et
référence indirectement la file `jobs` via les tâches `scout.scan`.

## Configuration

- les variables `VITE_*` sont publiques par définition ;
- les secrets fournisseurs sont lus uniquement par le backend ;
- `.env.example` documente les noms sans contenir de valeur ;
- la configuration est validée au démarrage.

## Structure

```text
frontend/   application React
backend/    API et futur worker Python
supabase/   configuration et migrations PostgreSQL
docs/       décisions et documentation spécialisée
```

## Décisions différées

- hébergement ;
- fournisseur LLM ;
- stratégie exacte de déploiement du worker ;
- Realtime ou polling ;
- politique d’authentification finale.

Ces choix ne doivent pas bloquer la première tranche verticale.
