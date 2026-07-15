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

- [x] Remplacer l’aperçu statique par le chemin réel dans le cockpit.
- [x] Ajouter un sélecteur explicite réel / démonstration si un mode demo est gardé.
- [x] Créer un écran Scout Core orienté action.
- [x] Ajouter boutons `start`, `stop`, scan par lot et état `WORKING...`.
- [x] Recherches par lots.
- [x] Expansion contrôlée des mots-clés.
- [ ] Génération aléatoire limitée de mots-clés.
- [ ] Estimation et suivi du quota.
- [ ] Cache.
- [ ] Snapshots.
- [x] Déduplication.
- [ ] Progression.
- [ ] Annulation coopérative.
- [ ] Reprise après incident.
- [ ] Historique des scans.
- [x] Première synthèse business du scan : niches, formats, concurrents, signaux.
- [x] Détection de concurrents faibles.
- [x] Détection de quality gaps.

## Phase 3 — Analyste V1

- [ ] Remplacer tout échange Scout -> Analyste fondé sur `localStorage`.
- [x] Afficher une première console Analyste avec scores business heuristiques.
- [x] Exposer une première analyse backend versionnée d’un scan.
- [ ] Score de demande.
- [ ] Score de monétisation.
- [x] Score d’accessibilité.
- [ ] Score de faisabilité.
- [ ] `money_score`.
- [x] `attack_score`.
- [ ] `speed_cash_score`.
- [x] `quality_gap_score`.
- [x] `weak_competitor_score`.
- [ ] `upload_pressure_score`.
- [ ] `ecosystem_score`.
- [ ] Niveau de confiance séparé.
- [x] Versionnement du scoring.
- [ ] Preuves associées.
- [x] Classement des opportunités.
- [x] Table `opportunities`.
- [x] Table `competitor_data`.
- [ ] Table `execution_plans`.
- [ ] Jeux de données de référence.

## Phase 4 — Décisions

- [ ] Décisions `GO`, `WATCH`, `REJECT`.
- [x] Historique append-only.
- [ ] Premier plan de test.
- [ ] Comparaison d’opportunités.
- [x] Daily logs et apprentissages.

## Producteur futur

- [x] Concepts de contenu.
- [x] Scripts.
- [x] Hooks.
- [x] Titres et descriptions.
- [x] Prompts image.
- [x] Drafts sauvegardés dans Supabase.
- [x] Statuts de draft `DRAFT`, `READY`, `USED`.
- [x] Copie/export texte d’un draft.
- [x] Sélection d’un draft actif.
- [x] Variantes de hooks/titres.
- [x] Checklist de production courte.
- [x] Liaison visuelle draft utilisé / résultat de test dans l’Optimizer.
- [x] Variantes choisies sauvegardées.
- [x] Checklist persistante.
- [x] Prompts voix.
- [x] Plan de montage.
- [x] File `assets à produire`.
- [x] Export Markdown complet.
- [ ] Statuts par asset persistants.
- [ ] Export par asset.

## Plateformes futures

- [ ] TikTok.
- [ ] Instagram Reels.

## Hors V1 immédiate

- Publisher ;
- feedback automatisé ;
- Optimizer complet ;
- [x] Backlog priorisé des prochains tests.
- [x] Distinction relancer / pivoter / abandonner.
- [x] Synthèse des apprentissages par niche.
- publication automatique ;
- orchestration multi-agent en chemin critique.
