# 0001 — Leçons de IA Agent Tool V4

## Contexte

IA Agent Tool V4 sert de référence produit et fonctionnelle, mais ne doit pas être
copié automatiquement. L’analyse de V4 montre une application cockpit organisée autour
du pipeline :

```text
Scout -> Analyste -> Producteur
```

La V4 contient des idées utiles, mais aussi des écarts importants entre simulation et
exécution réelle.

## Constats V4

### Scout

Deux chemins coexistent :

- un Scout simulé, branché dans l’interface principale, basé sur des opportunités de
  démonstration ;
- un Scout réel, capable d’appeler YouTube, mais non branché comme chemin principal.

Le problème à éviter dans Machine est clair : une fonctionnalité réelle non visible
dans le cockpit ne compte pas comme livrée.

### Analyste

L’Analyste V4 calcule des verdicts à partir de scores heuristiques et de coefficients.
Il récupère les résultats du Scout par `localStorage`.

Machine doit conserver l’idée des scores et verdicts, mais remplacer le bus
`localStorage` par une source distante versionnée et auditable.

### Producteur

Le Producteur V4 prépare titres, scripts et prompts à partir des opportunités validées.
Cette direction reste pertinente, mais n’est pas prioritaire tant que Scout et Analyste
ne produisent pas des opportunités fiables.

### Orchestrateur

L’orchestrateur V4 simule un cycle complet Scout -> Analyste -> Producteur. Machine doit
éviter de reconstruire une orchestration spectaculaire mais factice. Le cycle doit être
réel, traçable et persistant.

## Décisions pour Machine

1. Le Scout réel est le chemin principal. Un mode démonstration peut exister, mais doit
   être explicite, séparé et visible comme tel.
2. Aucune donnée métier principale ne transite par `localStorage`.
3. Supabase/PostgreSQL est la source de vérité des scans, opportunités, concurrents,
   décisions et plans.
4. Le frontend n’appelle pas YouTube directement et ne contient pas de clé YouTube.
5. Le cockpit doit afficher les résultats du chemin réel, pas une simulation branchée
   par défaut.
6. L’Analyste doit produire des scores business exploitables, pas seulement des
   métriques vidéo.
7. Le Producteur reste une étape future, déclenchée par des opportunités validées.

## Reprise utile de V4

Les concepts suivants doivent inspirer Machine :

- cockpit agentique ;
- barre Machine / workflow ;
- onglet Scout unique regroupant Market Intel ;
- contrôles `start`, `stop`, scan par lot, `WORKING...` ;
- scores et verdicts Analyste ;
- atelier Producteur orienté exécution ;
- historique des runs ;
- files d’attente et mémoire d’exécution.

## Corrections prioritaires

Machine doit corriger les points faibles V4 dans cet ordre :

1. Supprimer toute dépendance métier à `localStorage`.
2. Brancher le Scout réel comme chemin principal.
3. Persister les scans, résultats, opportunités et décisions dans Supabase.
4. Construire un Scout Core capable de scans par lots.
5. Ajouter un Analyste business avec scores orientés argent, attaque, concurrence,
   qualité et vitesse d’exécution.
6. Afficher une synthèse d’opportunité exploitable, pas une simple liste de vidéos.
