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
- collecteur YouTube initial basé sur `search.list`, `videos.list` et `channels.list` ;
- tables Supabase `youtube_channels`, `youtube_videos` et `scan_videos` ;
- stockage des premiers résultats vidéo et chaîne d’un scan Scout ;
- panneau frontend Scout pour saisir un mot-clé et afficher les scans récents ;
- erreurs API structurées côté frontend.
- brief produit `PRODUCT_BRIEF.md` pour cadrer IA Agent Tool comme machine business IA ;
- roadmap réalignée sur Scout Core, scoring business, opportunités et plans d’action.
- note de décision `0001-v4-lessons` pour cadrer ce qui doit être repris ou corrigé
  depuis IA Agent Tool V4.
- cockpit Machine visible avec navigation Scout, Analyste et Producteur ;
- console Scout Core avec mode réel / démonstration, `START SCAN`, `SCAN 10`, `SCAN 50`
  et statut `WORKING...` ;
- route backend `/api/v1/scout/worker/run-once` pour déclencher le worker sans exposer
  la clé YouTube au frontend ;
- route backend `/api/v1/scout/scans/{scan_id}/analysis` pour exposer une première
  analyse business versionnée ;
- première console Analyste avec scores business heuristiques et détection de signaux ;
- première console Producteur avec plan d’attaque issu de l’opportunité détectée.
- fichier `HANDOFF.md` pour reprendre le projet proprement après un chat interrompu ;
- persistance Supabase des drafts Producteur dans `production_drafts` ;
- actions Producteur pour sauvegarder, marquer `READY` / `USED`, copier et exporter un
  draft de production ;
- affichage d’un script détaillé à partir d’un draft sauvegardé.
- atelier Content Factory avec draft actif, variantes de hooks/titres, checklist de
  production courte et liaison visible avec le test associé ;
- Optimizer enrichi avec les drafts prêts et utilisés.
- persistance des choix Content Factory dans le JSON du draft : titre choisi, hook
  choisi, checklist, plan de montage et prompt voix.
- file `assets à produire` générée par scène avec storyboard, texte écran, prompt
  visuel, prompt voix et export Markdown complet.
- interface PC segmentée par espaces `Scout`, `Décision`, `Factory` et `Optimizer`
  pour éviter la longue page unique.
- pilotage exécutable des assets Content Factory : statut par scène
  `TODO` / `IN_PROGRESS` / `DONE`, sauvegarde dans le draft et export Markdown
  individuel par asset.
- édition manuelle des assets par scène : storyboard, texte écran, prompt visuel
  et prompt voix, avec sauvegarde dans le draft Supabase.
- régénération assistée par scène via l’Edge Function `run-scout`, avec retour
  JSON structuré et remplacement local de l’asset ciblé.
- branchement LLM serveur optionnel sur `regenerate-asset` via `LLM_API_KEY`,
  `LLM_BASE_URL` et `LLM_MODEL`, avec validation JSON stricte et fallback
  déterministe si le modèle est indisponible.
- compatibilité avec les secrets Supabase en minuscules `llm_api_key`,
  `llm_base_url` et `llm_model`.
- sélecteur de fournisseur LLM dans Content Factory (`Fallback`, `OpenAI`,
  `OpenRouter`, `Groq`, `Local`) et panneau Budget IA avec estimation par
  session avant régénération d’assets.

### Décidé

- YouTube est l’unique plateforme de la V1 ;
- Scout et Analyste sont les seuls domaines actifs ;
- Supabase/PostgreSQL sera la source de vérité ;
- les secrets fournisseurs restent côté serveur ;
- les scores seront déterministes et versionnés ;
- aucun fallback réel vers des données simulées.
- l’interface doit évoluer vers un centre de commande `GO MONEY MODE`, pas rester une
  simple liste de résultats YouTube.
- la simulation V4 ne doit pas redevenir le chemin principal ; le Scout réel doit être
  branché, persistant et visible.
