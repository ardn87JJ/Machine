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
- structure Supabase initiale.

### Décidé

- YouTube est l’unique plateforme de la V1 ;
- Scout et Analyste sont les seuls domaines actifs ;
- Supabase/PostgreSQL sera la source de vérité ;
- les secrets fournisseurs restent côté serveur ;
- les scores seront déterministes et versionnés ;
- aucun fallback réel vers des données simulées.
