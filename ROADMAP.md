# Roadmap

## Phase 0 — Fondation

- [x] Créer le document fondateur.
- [x] Isoler `Machine` comme dépôt Git.
- [x] Relier le dépôt local au nouveau GitHub.
- [x] Créer les documents racine.
- [x] Poser le squelette frontend.
- [x] Poser le squelette backend.
- [x] Ajouter les tests de santé.
- [x] Ajouter la CI.
- [x] Préparer Supabase.
- [x] Valider les commandes depuis un clone propre.
- [x] Créer le premier commit local.
- [x] Pousser le checkpoint sur GitHub.

Critère de sortie :

> Le projet s’installe, se teste et se construit à partir d’un clone propre.

## Phase 1 — Tranche verticale réelle

- [ ] Authentification minimale.
- [x] Créer un scan à un mot-clé.
- [x] Créer la tâche correspondante.
- [x] Réserver et traiter une tâche Scout côté worker.
- [x] Exécuter un appel YouTube côté worker.
- [x] Stocker une vidéo et une chaîne.
- [x] Afficher le scan dans le frontend.
- [x] Afficher le résultat collecté dans le frontend.
- [x] Afficher une erreur réelle sans fallback simulé.

## Phase 2 — Scout exploitable

- [ ] Remplacer l’aperçu statique par le chemin réel dans le cockpit.
- [ ] Ajouter un sélecteur explicite réel / démonstration si un mode demo est gardé.
- [ ] Créer un écran Scout Core orienté action.
- [ ] Ajouter boutons `start`, `stop`, scan par lot et état `WORKING...`.
- [ ] Recherches par lots.
- [ ] Expansion contrôlée des mots-clés.
- [ ] Génération aléatoire limitée de mots-clés.
- [ ] Estimation et suivi du quota.
- [ ] Cache.
- [ ] Snapshots.
- [ ] Déduplication.
- [ ] Progression.
- [ ] Annulation coopérative.
- [ ] Reprise après incident.
- [ ] Historique des scans.
- [ ] Première synthèse business du scan : niches, formats, concurrents, signaux.
- [ ] Détection de concurrents faibles.
- [ ] Détection de quality gaps.

## Phase 3 — Analyste V1

- [ ] Remplacer tout échange Scout -> Analyste fondé sur `localStorage`.
- [ ] Score de demande.
- [ ] Score de monétisation.
- [ ] Score d’accessibilité.
- [ ] Score de faisabilité.
- [ ] `money_score`.
- [ ] `attack_score`.
- [ ] `speed_cash_score`.
- [ ] `quality_gap_score`.
- [ ] `weak_competitor_score`.
- [ ] `upload_pressure_score`.
- [ ] `ecosystem_score`.
- [ ] Niveau de confiance séparé.
- [ ] Versionnement du scoring.
- [ ] Preuves associées.
- [ ] Classement des opportunités.
- [ ] Table `opportunities`.
- [ ] Table `competitor_data`.
- [ ] Table `execution_plans`.
- [ ] Jeux de données de référence.

## Phase 4 — Décisions

- [ ] Décisions `GO`, `WATCH`, `REJECT`.
- [ ] Historique append-only.
- [ ] Premier plan de test.
- [ ] Comparaison d’opportunités.
- [ ] Daily logs et apprentissages.

## Producteur futur

- [ ] Concepts de contenu.
- [ ] Scripts.
- [ ] Hooks.
- [ ] Titres et descriptions.
- [ ] Prompts image / voix.
- [ ] Plan de montage.

## Plateformes futures

- [ ] TikTok.
- [ ] Instagram Reels.

## Hors V1 immédiate

- Publisher ;
- feedback automatisé ;
- Optimizer complet ;
- publication automatique ;
- orchestration multi-agent en chemin critique.
