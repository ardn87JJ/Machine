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

## Tranche en cours

Activer le vrai moteur IA en environnement Supabase :

- ajouter le secret `LLM_API_KEY` ou `llm_api_key` ;
- optionnellement definir `LLM_BASE_URL` / `llm_base_url` et `LLM_MODEL` /
  `llm_model` ;
- tester `regenerate-asset` avec `source: "llm"`.

## Prochaine etape apres cette tranche

Configurer les secrets LLM Supabase :

- `LLM_API_KEY` ou `llm_api_key` est requis pour activer le modele ;
- `LLM_BASE_URL` / `llm_base_url` vaut `https://api.openai.com/v1` par defaut ;
- `LLM_MODEL` / `llm_model` vaut `gpt-4o-mini` par defaut ;
- le secret doit etre un secret d'environnement Edge Function lisible par
  `Deno.env`, pas une cle API Supabase projet ;
- sans secret, la fonction reste operationnelle en fallback.
