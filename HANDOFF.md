# Handoff Machine

Derniere mise a jour : 2026-07-16

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
- Dernier commit stable au depart de cette tranche : `47c22a4 Add cluster followup actions`
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
- empecher une cloture incoherente : `Reussi` et `Echec` restent bloques tant que
  H72 n'est pas cochee, et `run-scout` rejette aussi `DONE/PASSED` ou
  `DONE/FAILED` si le plan Supabase existe mais n'a pas H72 `DONE`.
- lancer une campagne Scout batch visible : chaque mot-cle du lot affiche son
  statut `queued`, `running`, `completed` ou `failed`, le lot continue si un scan
  echoue, puis le cockpit affiche un top opportunites consolide.
- lire l'Analyste multi-scans : l'espace Decision affiche des niches consolidees
  qui regroupent les mots-cles proches, agregent scores/concurrents et ouvrent la
  meilleure fiche representant le cluster.
- creer un test depuis une niche consolidee via `create-cluster-experiment`, avec
  keyword/titre/action/critere au niveau cluster et checklist H24/H48/H72 generee
  par `upsertExecutionPlan`.
- relier Factory aux tests cluster : les packs production sauvegardent
  `content.cluster`, exposent 2-3 variantes par mot-cle du cluster et enrichissent
  titres/hooks/checklist/montage/prompt voix.
- lire l'origine cluster partout dans l'execution : badge `CLUSTER` dans la file
  de tests, compteur dans Optimizer, priorite renforcee pour les clusters actifs,
  badge dans les drafts et panneau source cluster dans l'atelier Factory.
- consolider les tests cluster cote interface : l'Optimizer groupe les tests
  issus de niches consolidees par cluster, calcule actifs/reussis/echecs/taux de
  reussite, propose `CONTINUER`, `MESURER`, `PIVOTER` ou `ABANDONNER`, et
  l'Analyste affiche ce rappel terrain dans les cartes de niches consolidees.
- agir depuis la boucle cluster : `CONTINUER` cree un test de variante proche,
  `MESURER`/`PIVOTER` creent un test pivot d'angle, et un test cluster actif peut
  etre mis en pause avec une note de depriorisation dans l'historique decisionnel.
- exploiter les follow-ups cluster dans Factory : les tests `variante proche` et
  `pivot angle` sont reconnus comme cluster, affichent un badge dedie dans le Pack
  Producteur et l'atelier Factory, et adaptent titres, hooks, checklist, montage,
  prompt voix et export Markdown au mode de follow-up.

## Tranche en cours

Rendre les follow-ups cluster directement exploitables par Factory :

- afficher dans le Pack Producteur si le test vient d'un follow-up `variante`
  ou `pivot` ;
- injecter le mode follow-up dans les titres, hooks et checklist Factory ;
- faire apparaitre les tests follow-up dans Optimizer comme une sous-famille de
  leur cluster source.

## Prochaine etape apres cette tranche

Rendre la sous-famille follow-up lisible dans Optimizer :

- grouper les tests `variante proche` et `pivot angle` sous leur cluster source ;
- afficher combien de follow-ups viennent d'un cluster et lesquels ont reussi ;
- distinguer les tests initiaux cluster des tests de follow-up dans le backlog.
