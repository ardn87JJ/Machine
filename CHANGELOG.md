# Changelog

Les changements significatifs du projet sont documentés ici.

Le format suit les principes de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/). Le projet n’a pas encore de version publiée.

## Non publié

### Ajouté

- document fondateur de la réécriture ;
- dépôt Git autonome relié à `ardn87JJ/Machine` ;
- documentation d’architecture et roadmap ;
- configuration d’environnement de référence ;
- squelette React/TypeScript ;
- squelette FastAPI ;
- tests de santé frontend et backend ;
- workflow CI ;
- structure Supabase initiale ;
- table Supabase `scans` pour les demandes Scout ;
- routes backend `/api/v1/scout/scans` pour créer et lister les scans ;
- création d’une tâche `scout.scan` lors de la création d’un scan ;
- worker Scout minimal capable de réserver une tâche `scout.scan` ;
- persistance des erreurs worker dans `jobs`, `scans` et `job_events` ;
- panneau frontend Scout pour saisir un mot-clé et afficher les scans récents ;
- erreurs API structurées côté frontend.

### Décidé

- YouTube est l’unique plateforme de la V1 ;
- Scout et Analyste sont les seuls domaines actifs ;
- Supabase/PostgreSQL sera la source de vérité ;
- les secrets fournisseurs restent côté serveur ;
- les scores seront déterministes et versionnés ;
- aucun fallback réel vers des données simulées.
