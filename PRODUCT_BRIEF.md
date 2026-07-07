# IA Agent Tool / Agent Scout — Brief produit

## Intention

IA Agent Tool est une machine business IA interne. Son rôle est de détecter des
opportunités de contenu monétisables, de les analyser, puis de préparer leur
exploitation.

Ce n’est pas une app grand public, un dashboard décoratif ou un générateur de prompts.
C’est un backoffice utilitaire, orienté résultats, argent, vitesse d’exécution et
apprentissage.

La V4 sert de référence fonctionnelle pour le cockpit agentique, mais Machine doit
corriger ses faiblesses : simulation branchée par défaut, données métier en
`localStorage`, Scout réel non visible, orchestration factice. Les leçons détaillées
sont consignées dans [docs/decisions/0001-v4-lessons.md](./docs/decisions/0001-v4-lessons.md).

## Principe central

L’application transforme des données réelles du web et des plateformes sociales en
décisions concrètes :

- quelles niches attaquer ;
- quels contenus créer ;
- quels formats fonctionnent ;
- quels concurrents sont faibles ;
- où lancer rapidement quelque chose de rentable.

La logique validée est proche de :

```text
GO MONEY MODE
```

Détecter vite, analyser froidement, scorer, prioriser, exécuter, mesurer,
recommencer.

## Architecture fonctionnelle

La contrainte principale reste :

```text
Scout -> Analyste -> Producteur
```

### Scout

Le Scout est le radar.

Il doit :

- scanner YouTube puis, plus tard, TikTok et Instagram ;
- générer ou utiliser des mots-clés ;
- lancer des scans par lots, par exemple 10 ou 50 recherches ;
- détecter tendances, niches et formats qui montent ;
- repérer des chaînes concurrentes ;
- collecter vidéos, vues, titres, formats et signaux d’intérêt ;
- stocker les opportunités détectées ;
- pouvoir être lancé, arrêté et relancé.

Le Scout regroupe aussi la logique Market Intel. Il ne faut pas multiplier les onglets
si un espace Scout puissant suffit.

### Analyste

L’Analyste transforme les données brutes en décisions business.

Il doit :

- analyser les résultats du Scout ;
- évaluer la concurrence ;
- repérer les faiblesses des chaînes concurrentes ;
- détecter les niches sous-exploitées ;
- attribuer des scores ;
- formuler une opportunité exploitable ;
- préparer un plan d’action.

Les scores métier à considérer sont :

- `money_score` : potentiel financier ;
- `attack_score` : facilité à attaquer la niche ;
- `moat_score` : capacité à construire un avantage ;
- `speed_cash_score` : rapidité de monétisation possible ;
- `quality_gap_score` : écart de qualité exploitable ;
- `weak_competitor_score` : faiblesse des concurrents ;
- `intent_clarity_score` : clarté de l’intention utilisateur ;
- `upload_pressure_score` : intensité concurrentielle ;
- `ecosystem_score` : richesse globale de la niche.

L’objectif n’est pas de dire qu’une niche est “intéressante”, mais de la noter comme
une opportunité business concrète.

### Producteur

Le Producteur vient plus tard. Il transformera une opportunité validée en concept,
scripts, hooks, titres, visuels, voix, montage et préparation d’upload.

Il n’est pas prioritaire tant que Scout et Analyste ne sont pas exploitables.

## Workflow cible

```text
Tendances
-> Détection d’opportunités
-> Analyse concurrentielle
-> Scoring business
-> Concept de contenu
-> Script
-> Voix
-> Visuel
-> Montage
-> Upload
-> Analyse des performances
-> Optimisation
```

Version active :

```text
Scout
-> collecte données
-> Analyste
-> scoring
-> opportunité exploitable
-> plan d’action
```

## Plateformes

YouTube est prioritaire parce que l’API permet de collecter recherches, vidéos,
chaînes, titres, descriptions, dates, vues et statistiques publiques.

TikTok et Instagram sont des plateformes futures importantes pour les formats courts,
les hooks, les Reels, les signaux viraux et les niches lifestyle, mais leur accès aux
données est plus contraint.

## Modules prévus

### Trend Hunter

Détecter les tendances, sujets qui montent, formats émergents et niches en croissance.

### Social Competitor Analyzer

Comparer chaînes, vues, fréquence, formats et faiblesses concurrentes.

### Content Factory

Module futur pour concepts, scripts, titres, miniatures, hooks et séquences courtes.

### Optimizer

Module futur pour analyser performances, rétention, watch time, CTR, replay,
commentaires et recommander les prochains ajustements.

## Données métier attendues

Tables ou concepts métier à faire émerger :

- `money_scans` : scans lancés par le Scout ;
- `opportunities` : opportunités détectées ;
- `competitor_data` : données concurrentes ;
- `execution_plans` : plans d’action ;
- `daily_logs` : historique et apprentissages.

## Interface

L’interface doit rester simple :

- lancer un scan ;
- voir le statut ;
- voir les résultats ;
- comprendre les scores ;
- sélectionner une opportunité ;
- préparer une action.

Elle doit proposer une barre Machine ou un équivalent clair pour comprendre l’étape du
workflow. Les actions Scout doivent être directes : start, stop, scan par lot, statut
`WORKING...`, auto-refresh.

Le cockpit doit afficher le chemin réel par défaut. Un mode démonstration peut exister,
mais il doit être explicitement signalé et ne jamais remplacer silencieusement les
données réelles.

## Priorité actuelle

La priorité n’est pas d’afficher une liste de vidéos. La priorité est de transformer
les données collectées en signaux business exploitables :

- opportunités détectées ;
- concurrence faible ;
- formats monétisables ;
- qualité moyenne des concurrents ;
- potentiel multi-plateforme ;
- production automatisable ;
- scores orientés argent et vitesse d’exécution.
