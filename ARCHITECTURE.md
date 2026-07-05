# Architecture

## Statut

Architecture initiale de la phase 0. Ce document décrit uniquement ce qui est retenu pour la nouvelle application.

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

Le point d’entrée initial expose uniquement :

- `/health`
- `/api/v1/status`

Les routes métier seront ajoutées par tranches verticales.

## Worker

Le worker sera ajouté pendant la phase 1. Il réservera des tâches dans PostgreSQL avec :

- clé d’idempotence ;
- verrou expirant ;
- heartbeat ;
- nombre maximal de tentatives ;
- erreurs structurées.

Redis, Celery, LangGraph et CrewAI ne font pas partie de la fondation.

## Données

Supabase/PostgreSQL sera la source de vérité. La première migration pose les types et tables techniques minimales. Les tables Scout seront ajoutées avec leur fonctionnalité pour éviter un schéma spéculatif.

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
