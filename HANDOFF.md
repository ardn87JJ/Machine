# Handoff Machine

Derniere mise a jour : 2026-07-10

## Objectif produit

IA Agent Tool / Machine est un backoffice d'agents IA oriente business. La chaine
fonctionnelle reste :

```text
Scout -> Analyste -> Producteur
```

Le but court terme est de transformer des donnees YouTube reelles en opportunites
scorables, tests actionnables, drafts de production et apprentissages.

## Comportement attendu de Codex

- avancer vite mais avec des patchs non destructifs ;
- lire `PROJECT_FOUNDATION.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `CHANGELOG.md`
  avant une tranche large ;
- verifier avec tests/build avant de conclure ;
- ne pas exposer de secret dans le frontend ;
- ne pas remplacer une erreur reelle par une simulation silencieuse ;
- ne pas utiliser `localStorage` comme base metier durable ;
- quand une tache est terminee, annoncer la prochaine etape concrete.

## Etat courant

- Depot Git : `ardn87JJ/Machine`
- Branche : `main`
- Dernier commit stable au depart de cette tranche : `1e36eca Add asset regeneration action`
- App publique : `https://ardn87jj.github.io/Machine/`
- Supabase project ref : `uscmdnzbwvsjrocemset`
- Edge Function active : `run-scout`

## Parcours visible deja en place

- lancer un scan Scout Edge depuis l'interface ;
- afficher ledger d'opportunites ;
- scorer et classer les opportunites ;
- creer un test d'execution depuis une opportunite ;
- suivre les tests `READY`, `RUNNING`, `PAUSED`, `DONE` ;
- noter le resultat d'un test ;
- afficher une recommandation Optimizer simple ;
- generer un pack Producteur depuis l'opportunite selectionnee ;
- sauvegarder un draft Producteur dans Supabase.
- marquer un draft `READY` ou `USED`, copier/exporter le pack et voir un script
  detaille.
- selectionner un draft actif, voir variantes titres/hooks, checklist courte et
  liaison au test associe.
- sauvegarder titre/hook choisis, checklist, plan de montage et prompt voix dans
  Supabase via le JSON du draft.
- utiliser une interface PC segmentee par espaces `Scout`, `Decision`, `Factory`
  et `Optimizer`.
- piloter les assets par scene avec statuts `TODO`, `IN_PROGRESS`, `DONE`,
  sauvegarde dans le draft et export Markdown individuel.
- modifier les assets par scene : storyboard, texte ecran, prompt visuel et
  prompt voix, puis sauvegarder ces edits dans le draft Supabase.
- regenerer une scene via l'Edge Function `run-scout`, recevoir un JSON asset
  structure et remplacer uniquement la scene cible dans l'atelier.
- appeler un endpoint LLM compatible OpenAI depuis `regenerate-asset` quand
  `LLM_API_KEY` ou `llm_api_key` existe, valider le JSON, puis basculer en
  fallback deterministe si le modele est absent ou invalide.
- selectionner le fournisseur LLM depuis Content Factory : `fallback`,
  `openai`, `openrouter`, `groq` ou `local`.
- suivre un budget IA estime par session dans l'atelier Factory.
- lire un diagnostic fournisseur non sensible via `view=llm-status` :
  configure/non configure, modele et message, sans exposer les secrets.
- bloquer les regenerations payantes quand le garde-fou de session est depasse.
- stocker chaque regeneration dans `llm_usage_events` avec provider, modele,
  source, tokens estimes, cout estime et warning.
- afficher le cout IA persistant du jour et le total recent dans Budget IA.
- appliquer une limite serveur persistante depuis `llm_budget_settings` avant
  chaque regeneration payante.
- modifier depuis Content Factory les limites budget IA jour/mois et le blocage
  serveur, sans SQL manuel.
- lire les fournisseurs IA depuis `llm_provider_settings` : label, description,
  modèle, URL compatible OpenAI, coût estimé et prix par million de tokens.
- alimenter `llm-status`, le sélecteur Factory et le calcul budget serveur avec
  cette configuration Supabase non secrète.
- modifier depuis Content Factory le modèle, l'URL, l'activation, le provider
  par défaut et les coûts non secrets d'un fournisseur IA.
- tester un fournisseur IA depuis Content Factory via l'Edge Function :
  fallback instantané ou appel léger `/models` compatible OpenAI avec latence
  et erreur lisible.
- guider le branchement local depuis Factory : preset Ollama, preset LM Studio,
  commande de tunnel et format d'URL publique `/v1`.
- piloter une file Scout contrôlée : mots-clés additionnels, prévisualisation
  des lots 10/50, estimation quota et copie du lot avant scan.
- lire l'Optimizer comme un backlog decisionnel : priorite, action recommandee,
  relancer / produire / doubler / pivoter / abandonner, et apprentissages par niche.
- conserver un historique append-only dans `decision_events` pour les tests :
  creation, changement de statut, resultat et note terrain.

## Tranche en cours

Revenir au coeur Scout / Analyste sans dépendance LLM :

- afficher le taux d'avancement des plans dans Optimizer ;
- recommander `MESURER` tant que H48/H72 ne sont pas cochés ;
- utiliser le prochain jalon incomplet comme action prioritaire.

## Prochaine etape apres cette tranche

Finaliser la boucle test :

- pousser vers `PASSED` ou `FAILED` quand H72 est terminée ;
- afficher un avertissement si un test est marqué terminé sans H72 cochée ;
- intégrer l'état du plan dans les apprentissages par niche.
