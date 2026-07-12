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

## Tranche en cours

Rendre la configuration providers modifiable depuis l'interface :

- modifier le modèle et l'URL provider sans SQL manuel ;
- changer le provider par défaut ;
- activer/désactiver un provider depuis Factory ou Settings.

## Prochaine etape apres cette tranche

Brancher le LLM local de façon exploitable :

- documenter le tunnel public requis pour Supabase Cloud ;
- ajouter un test de connexion provider ;
- afficher une erreur claire si l'URL locale n'est pas joignable.
