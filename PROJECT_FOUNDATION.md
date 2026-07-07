# IA Agent Tool — Document fondateur

**Statut :** référence normative pour la réécriture

**Version :** 1.0

**Date :** 5 juillet 2026

**Nom de travail :** IA Agent Tool

**Périmètre actif :** Scout + Analyste sur YouTube

---

## 1. Rôle de ce document

Ce document définit le produit à reconstruire, ses limites, son architecture et ses règles de développement.

Il doit servir de référence avant toute décision de conception ou modification importante. Le nouveau projet ne doit pas reproduire automatiquement l’architecture ni le code de `ia-agent-tool-v4`. L’ancienne application est une preuve de concept et une source d’enseignements, pas une base technique à prolonger.

En cas de contradiction, l’ordre de priorité est :

1. sécurité et intégrité des données ;
2. périmètre V1 défini ici ;
3. règles métier et critères d’acceptation ;
4. architecture technique ;
5. préférences d’interface ;
6. idées futures.

Toute modification de ce document doit être volontaire, expliquée et inscrite dans le changelog du futur projet.

---

## 2. Résumé du produit

IA Agent Tool est un backoffice d’aide à la décision destiné à détecter des opportunités de contenus monétisables à partir de données réelles issues de plateformes sociales.

Le cadrage opérationnel court est documenté dans [PRODUCT_BRIEF.md](./PRODUCT_BRIEF.md).
Ce brief précise la philosophie “machine business IA”, la logique `GO MONEY MODE`,
les agents Scout / Analyste / Producteur et les scores business à faire émerger.

La première version exploitable se concentre exclusivement sur YouTube et sur deux responsabilités :

- **Scout** collecte, normalise et conserve les signaux de marché ;
- **Analyste** transforme ces signaux en opportunités classées, explicables et actionnables.

La question centrale du produit est :

> Parmi les marchés observés, quelles opportunités méritent d’être testées, pourquoi, avec quel niveau de confiance et selon quel premier plan d’action ?

La chaîne logique de long terme reste :

```text
Scout → Analyste → Producteur
```

Mais seul le parcours suivant appartient à la V1 :

```text
Scan réel → Données vérifiables → Analyse → Opportunité → Décision humaine
```

---

## 3. Problème à résoudre

La recherche manuelle de niches et de formats de contenu est :

- lente ;
- répétitive ;
- difficile à comparer dans le temps ;
- influencée par l’intuition et les biais ;
- pauvrement documentée ;
- rarement reliée aux résultats obtenus ensuite.

Les outils existants affichent souvent beaucoup de métriques sans produire de décision claire. À l’inverse, les générateurs IA peuvent produire des recommandations convaincantes sans preuves suffisantes.

IA Agent Tool doit relier les deux :

1. collecter des faits ;
2. calculer des indicateurs compréhensibles ;
3. présenter les preuves ;
4. recommander une décision ;
5. conserver l’historique ;
6. apprendre ultérieurement des tests réellement exécutés.

---

## 4. Proposition de valeur

Le produit doit permettre à son utilisateur de :

- lancer en quelques minutes une étude reproductible sur une niche ;
- découvrir des chaînes, vidéos et formats pertinents ;
- comparer plusieurs niches avec une méthode constante ;
- comprendre pourquoi une opportunité est bien ou mal classée ;
- distinguer les faits, calculs, estimations et données manquantes ;
- décider rapidement de tester, surveiller ou rejeter une opportunité ;
- retrouver les décisions et données sources plus tard ;
- utiliser l’application depuis plusieurs appareils sans perdre l’historique.

Le bénéfice recherché n’est pas le nombre de scans réalisés. Le bénéfice est la qualité et la rapidité des décisions prises.

---

## 5. Principes fondateurs

### 5.1 Vérité avant démonstration

Une erreur réelle ne doit jamais être remplacée silencieusement par une simulation.

Si l’API YouTube échoue, l’interface affiche l’échec, sa cause et les actions possibles. Un mode démonstration peut exister, mais il doit être explicitement activé, visuellement distinct et stocké séparément.

### 5.2 Preuves avant éloquence

Une recommandation doit renvoyer aux vidéos, chaînes, dates et métriques qui la justifient.

Un texte généré par IA ne constitue pas une preuve.

### 5.3 Explicabilité avant sophistication

Un score simple, versionné et compréhensible vaut mieux qu’un score complexe impossible à auditer.

### 5.4 Action avant décoration

L’interface est un outil interne. Elle doit privilégier :

- les actions principales ;
- l’état du traitement ;
- les résultats ;
- les erreurs ;
- les preuves ;
- la décision.

### 5.5 Une seule vérité technique

Il ne doit exister qu’un seul service actif pour chaque responsabilité métier :

- un service Scout ;
- un service Analyste ;
- un contrat de données partagé ;
- une source de vérité distante ;
- une définition de chaque état.

Les runtimes concurrents, clés de stockage synonymes et événements globaux non typés sont interdits.

### 5.6 L’humain décide

L’Analyste recommande. L’utilisateur valide, surveille ou rejette.

La V1 n’exécute aucune publication, dépense ni action externe irréversible.

### 5.7 Construire verticalement

Chaque étape de développement doit produire un parcours complet et testable, même limité. Une fonctionnalité n’est pas terminée lorsqu’un composant existe ; elle est terminée quand les données réelles traversent tout le système et sont visibles dans l’interface.

---

## 6. Utilisateur cible

### 6.1 Utilisateur principal

Une personne ou une petite équipe qui recherche des opportunités de contenus rentables et souhaite industrialiser son analyse sans déléguer la décision finale.

### 6.2 Besoins principaux

- explorer rapidement une niche ;
- contrôler la consommation de quota ;
- reconnaître une tendance réelle ;
- mesurer la pression concurrentielle ;
- détecter un écart de qualité exploitable ;
- comparer plusieurs opportunités ;
- documenter une décision ;
- préparer un premier test de contenu.

### 6.3 Compétences supposées

L’utilisateur comprend les notions de niche, chaîne, format, vues, engagement et monétisation. Il ne doit pas avoir besoin de comprendre l’architecture du worker, la base de données ou les détails de l’API YouTube.

---

## 7. Périmètre de la V1

### 7.1 Inclus

- authentification simple ;
- YouTube comme unique plateforme ;
- création d’un scan ;
- recherches par lots ;
- mots-clés manuels ;
- expansion contrôlée de mots-clés ;
- filtres par pays, langue, période et format ;
- suivi de progression ;
- demande d’annulation ;
- reprise contrôlée après incident ;
- collecte de vidéos et chaînes ;
- cache et contrôle de quota ;
- stockage distant ;
- normalisation des données ;
- analyse concurrentielle ;
- quatre scores métier principaux ;
- score global et niveau de confiance ;
- preuves associées à chaque opportunité ;
- classement et filtres ;
- décision humaine ;
- premier plan de test ;
- historique des scans et décisions ;
- mode démonstration séparé si nécessaire.

### 7.2 Explicitement exclu

- TikTok ;
- Instagram ;
- génération complète de scripts ;
- génération de voix, images ou vidéos ;
- montage ;
- publication automatique ;
- Publisher ;
- Feedback automatisé ;
- Optimizer ;
- orchestration multi-agent ;
- CrewAI ;
- LangGraph ;
- n8n dans le chemin critique ;
- Telegram ou Discord ;
- marketplace de prompts ;
- chat généraliste ;
- application mobile native ;
- facturation ;
- rôles et permissions avancés ;
- fonctionnement multi-organisation complexe.

### 7.3 Règle d’extension

Une fonctionnalité exclue ne peut entrer dans la V1 que si elle est nécessaire au parcours principal et si son absence empêche de valider la valeur de Scout ou Analyste.

---

## 8. Terminologie officielle

### Scan

Une campagne de collecte lancée avec une configuration précise.

### Requête de scan

Une recherche individuelle portant sur un mot-clé au sein d’un scan.

### Signal

Une mesure ou observation issue des données collectées.

### Opportunité

Une hypothèse business construite à partir de plusieurs signaux et accompagnée de preuves.

### Preuve

Une donnée source ou un calcul traçable utilisé pour justifier une analyse.

### Score

Une mesure normalisée produite par une version identifiée du moteur de scoring.

### Confiance

Une évaluation séparée de la qualité, quantité, cohérence et fraîcheur des données utilisées.

### Décision

Le choix humain appliqué à une opportunité : `GO`, `WATCH` ou `REJECT`.

### Expérience

Le premier test concret proposé pour valider ou invalider une opportunité.

---

## 9. Parcours utilisateur principal

```text
1. L’utilisateur crée un scan.
2. Il choisit ses mots-clés et paramètres.
3. L’application estime le coût en quota.
4. L’utilisateur confirme le lancement.
5. Le worker collecte les données YouTube.
6. L’interface affiche la progression réelle.
7. Les résultats sont normalisés et dédupliqués.
8. L’Analyste calcule les indicateurs.
9. Les opportunités sont classées.
10. L’utilisateur ouvre une fiche.
11. Il consulte les preuves et limites.
12. Il décide GO, WATCH ou REJECT.
13. Pour un GO, il documente un premier test.
```

Le parcours ne doit exiger aucun changement manuel d’onglet pour “initialiser” un service.

---

## 10. Exigences du Scout

### 10.1 Responsabilité

Le Scout observe et collecte. Il ne produit ni concept, ni script, ni recommandation finale.

### 10.2 Configuration d’un scan

Champs minimums :

- nom facultatif ;
- mots-clés initiaux ;
- pays ;
- langue ;
- période observée ;
- type de contenu : tous, Shorts, vidéos longues ;
- nombre de résultats par requête ;
- nombre maximal de requêtes ;
- budget de quota ;
- mode d’expansion des mots-clés ;
- mode réel ou démonstration.

### 10.3 Presets

L’interface peut proposer :

- scan rapide ;
- scan standard ;
- scan approfondi.

Les nombres `10` et `50` ne doivent pas être inscrits dans la logique métier. Ils sont des valeurs de configuration, pas des concepts du domaine.

### 10.4 Génération des mots-clés

Ordre de préférence :

1. mots-clés manuels ;
2. variantes contrôlées ;
3. combinaisons avec formats, publics ou intentions ;
4. suggestions externes autorisées ;
5. exploration aléatoire limitée.

Chaque mot-clé conserve :

- sa valeur ;
- sa provenance ;
- son mot-clé parent ;
- sa date de génération ;
- la méthode utilisée.

### 10.5 Données collectées

Pour chaque vidéo, selon disponibilité :

- identifiant YouTube ;
- titre ;
- description ;
- chaîne ;
- date de publication ;
- durée ;
- type estimé : Short ou long ;
- vues ;
- likes ;
- commentaires ;
- miniatures ;
- tags publics ;
- date de collecte.

Pour chaque chaîne, selon disponibilité :

- identifiant YouTube ;
- nom ;
- description ;
- pays public ;
- date de création ;
- abonnés publics ;
- nombre de vidéos ;
- vues globales publiques ;
- date de collecte.

### 10.6 Snapshots

Les statistiques évolutives doivent être conservées sous forme de snapshots datés. Une nouvelle collecte ne doit pas écraser la valeur précédente.

Cette règle permet de calculer ultérieurement :

- croissance des vues ;
- accélération ;
- évolution d’une chaîne ;
- changement de fréquence ;
- fraîcheur d’un signal.

### 10.7 Déduplication

Une vidéo ou une chaîne peut apparaître dans plusieurs requêtes. L’entité est stockée une seule fois, mais son association à chaque requête est conservée.

### 10.8 Cache

Le cache doit :

- réduire la consommation de quota ;
- être associé aux paramètres de la requête ;
- avoir une durée explicite ;
- signaler à l’utilisateur qu’un résultat provient du cache ;
- permettre un rafraîchissement forcé si le budget le permet.

### 10.9 Quota

Avant lancement, l’application affiche une estimation du coût.

Pendant le scan, elle conserve :

- quota estimé ;
- quota consommé ;
- requêtes réussies ;
- requêtes échouées ;
- quota restant selon la configuration locale.

Un scan ne dépasse jamais son budget sans confirmation.

### 10.10 États du scan

États autorisés :

```text
DRAFT
QUEUED
RUNNING
CANCEL_REQUESTED
CANCELLED
COMPLETED
PARTIAL
FAILED
```

Les transitions doivent être validées côté serveur.

### 10.11 Annulation

L’annulation est coopérative :

1. l’utilisateur demande l’arrêt ;
2. le scan passe à `CANCEL_REQUESTED` ;
3. le worker termine l’appel en cours ;
4. les résultats déjà collectés sont conservés ;
5. le scan passe à `CANCELLED`.

### 10.12 Reprise et idempotence

Un worker redémarré ne doit pas recommencer aveuglément toutes les requêtes. Chaque tâche possède :

- une clé d’idempotence ;
- un compteur de tentatives ;
- un propriétaire temporaire ;
- une date d’expiration du verrou ;
- un heartbeat ;
- une erreur structurée.

---

## 11. Exigences de l’Analyste

### 11.1 Responsabilité

L’Analyste interprète les données du Scout, construit les opportunités et explique ses conclusions.

Il ne doit pas masquer les données absentes ni présenter une estimation comme une mesure réelle.

### 11.2 Statut de chaque donnée

Chaque indicateur significatif doit pouvoir être classé :

- `OBSERVED` : valeur directement collectée ;
- `CALCULATED` : valeur calculée à partir de données observées ;
- `ESTIMATED` : estimation reposant sur des hypothèses ;
- `MISSING` : donnée indisponible.

### 11.3 Dimensions de scoring

La V1 utilise quatre dimensions.

#### Demande

Question :

> Existe-t-il une audience active et un signal récent suffisamment fort ?

Exemples de facteurs :

- vues par jour ;
- croissance observée entre snapshots ;
- quantité de vidéos récentes performantes ;
- engagement public ;
- régularité du signal sur plusieurs chaînes.

#### Monétisation

Question :

> Cette audience semble-t-elle compatible avec un modèle économique identifiable ?

Exemples de facteurs :

- intention commerciale du sujet ;
- présence de produits, services ou annonceurs observables ;
- compatibilité avec affiliation, produit, service ou publicité ;
- profondeur du catalogue potentiel.

Ce score ne doit pas être présenté comme un revenu prévisionnel.

#### Accessibilité

Question :

> Un nouvel acteur peut-il raisonnablement entrer sur ce marché ?

Exemples de facteurs :

- concentration des vues ;
- poids des grandes chaînes ;
- qualité apparente des acteurs existants ;
- fréquence de publication ;
- diversité des formats ;
- présence de petites chaînes performantes.

#### Faisabilité

Question :

> Peut-on produire un test crédible avec les ressources disponibles ?

Exemples de facteurs :

- complexité de production ;
- besoin d’expertise ;
- dépendance à une personnalité ;
- coût probable ;
- vitesse de production ;
- potentiel de répétition.

Cette dimension nécessite des paramètres propres à l’utilisateur. Elle ne peut pas être déduite uniquement de YouTube.

Ces quatre dimensions sont la base explicable du modèle, mais l’interface Analyste doit
les traduire en scores business plus directement actionnables, notamment :

- `money_score` ;
- `attack_score` ;
- `moat_score` ;
- `speed_cash_score` ;
- `quality_gap_score` ;
- `weak_competitor_score` ;
- `intent_clarity_score` ;
- `upload_pressure_score` ;
- `ecosystem_score`.

Ces scores ne doivent pas devenir des décorations. Chacun doit relier des preuves
observées, calculées ou estimées à une décision exploitable.

### 11.4 Score global initial

Hypothèse de départ :

```text
Opportunity score =
  Demande × 35 %
+ Monétisation × 25 %
+ Accessibilité × 25 %
+ Faisabilité × 15 %
```

Ces poids sont une configuration versionnée. Ils ne doivent pas être dispersés dans l’interface ou plusieurs fichiers.

### 11.5 Niveau de confiance

Le niveau de confiance est indépendant du score d’opportunité.

Il dépend notamment :

- du nombre de vidéos pertinentes ;
- du nombre de chaînes représentées ;
- de la fraîcheur des données ;
- de la part de données observées ;
- de la cohérence entre les signaux ;
- de la disponibilité de plusieurs snapshots.

Une opportunité peut avoir un score élevé et une confiance faible.

### 11.6 Politique de recommandation initiale

Valeurs de départ, à valider sur le terrain :

- `GO` : score au moins 70, confiance au moins 60, aucun blocage majeur ;
- `WATCH` : score entre 50 et 69, ou confiance insuffisante ;
- `REJECT` : score inférieur à 50 ou blocage explicite.

La recommandation automatique et la décision humaine sont stockées séparément.

### 11.7 Versionnement

Chaque analyse conserve :

- version du modèle de scoring ;
- poids utilisés ;
- facteurs disponibles ;
- valeurs normalisées ;
- date de calcul ;
- éventuel modèle IA utilisé ;
- prompt versionné si un LLM intervient.

Une modification du scoring ne réécrit pas l’historique. Elle peut déclencher une nouvelle analyse.

### 11.8 Rôle éventuel d’un LLM

Un modèle de langage peut :

- synthétiser les preuves ;
- regrouper des thèmes ;
- décrire un écart de qualité ;
- proposer des hypothèses ;
- rédiger un résumé ;
- suggérer un premier test.

Il ne doit pas :

- inventer des métriques ;
- remplacer les calculs déterministes ;
- modifier silencieusement un score ;
- présenter une estimation comme certaine ;
- exécuter une action extérieure sans validation.

---

## 12. Fiche d’opportunité

Chaque opportunité doit présenter les sections suivantes.

### 12.1 Identité

- titre ;
- niche ;
- plateforme ;
- date de détection ;
- scan d’origine ;
- statut actuel.

### 12.2 Résumé décisionnel

- recommandation automatique ;
- décision humaine ;
- score global ;
- confiance ;
- horizon temporel ;
- principale raison d’agir ;
- principale raison de prudence.

### 12.3 Scores

- demande ;
- monétisation ;
- accessibilité ;
- faisabilité ;
- explication de chaque score ;
- données manquantes.

### 12.4 Preuves

- vidéos de référence ;
- chaînes de référence ;
- métriques observées ;
- tendances calculées ;
- dates de collecte ;
- liens vers les données sources.

### 12.5 Concurrence

- acteurs dominants ;
- petites chaînes performantes ;
- fréquence moyenne ;
- formats dominants ;
- écarts observés ;
- limites de l’analyse.

### 12.6 Risques

- signal trop récent ;
- données insuffisantes ;
- marché concentré ;
- dépendance à une personnalité ;
- coût de production ;
- contrainte réglementaire ;
- saisonnalité ;
- hypothèse non vérifiée.

### 12.7 Premier test

- hypothèse ;
- audience cible ;
- format ;
- angle ;
- volume initial ;
- durée du test ;
- ressources ;
- métriques de succès ;
- critère d’arrêt.

---

## 13. Architecture technique cible

### 13.1 Vue générale

```text
Navigateur
  React + TypeScript
        │
        ▼
API métier
  FastAPI + Python
        │
        ├──────────────► Supabase Auth
        │
        ▼
PostgreSQL / Supabase
  données + tâches + événements
        ▲
        │
Worker Python
        │
        ├──────────────► YouTube Data API
        └──────────────► LLM optionnel côté serveur
```

### 13.2 Frontend

Choix :

- React ;
- TypeScript strict ;
- Vite ;
- React Router ;
- bibliothèque de requêtes serveur, par exemple TanStack Query ;
- composants accessibles ;
- CSS simple avec système de tokens minimal.

Responsabilités :

- afficher les données ;
- envoyer les commandes ;
- suivre les tâches ;
- valider les formulaires ;
- présenter les erreurs ;
- gérer l’état d’interface local.

Le frontend ne doit pas :

- contenir la clé YouTube ;
- appeler directement l’API YouTube ;
- calculer le scoring de référence ;
- servir de source de vérité métier ;
- conserver les résultats principaux dans `localStorage`.

### 13.3 API

Choix :

- Python ;
- FastAPI ;
- modèles Pydantic ;
- accès PostgreSQL explicite ;
- migrations versionnées ;
- erreurs structurées.

Responsabilités :

- authentification et autorisation ;
- validation des commandes ;
- création des tâches ;
- exposition des données ;
- application des transitions d’état ;
- décisions humaines ;
- déclenchement des analyses ;
- contrôle de l’accès aux secrets.

### 13.4 Worker

Un worker Python indépendant traite les tâches.

Responsabilités :

- réserver une tâche ;
- maintenir un heartbeat ;
- appeler YouTube ;
- respecter les quotas ;
- écrire les snapshots ;
- publier la progression ;
- relancer les erreurs temporaires ;
- terminer ou libérer proprement une tâche.

La V1 peut utiliser PostgreSQL comme file de tâches. Redis, Celery ou un orchestrateur supplémentaire ne sont ajoutés que si une limite mesurée le justifie.

### 13.5 Base de données

Supabase fournit :

- PostgreSQL ;
- authentification ;
- Row Level Security ;
- migrations ;
- éventuellement Realtime pour la progression.

La base est la source de vérité. `localStorage` peut conserver uniquement des préférences non critiques, comme un filtre d’affichage.

---

## 14. Modèle de données cible

Les noms définitifs peuvent évoluer pendant la conception des migrations, mais les responsabilités doivent rester distinctes.

### 14.1 `scans`

- `id`
- `owner_id`
- `name`
- `platform`
- `mode`
- `status`
- `country_code`
- `language_code`
- `content_type`
- `published_after`
- `max_queries`
- `results_per_query`
- `quota_budget`
- `quota_estimated`
- `quota_used`
- `progress_current`
- `progress_total`
- `cancel_requested_at`
- `started_at`
- `finished_at`
- `created_at`
- `updated_at`
- `error_code`
- `error_message`

### 14.2 `scan_queries`

- `id`
- `scan_id`
- `keyword`
- `source_type`
- `parent_query_id`
- `status`
- `position`
- `attempt_count`
- `quota_used`
- `result_count`
- `started_at`
- `finished_at`
- `error_code`
- `error_message`

Contrainte d’unicité sur le scan, le mot-clé normalisé et les paramètres significatifs.

### 14.3 `videos`

- `id`
- `platform`
- `external_id`
- `channel_id`
- `title`
- `description`
- `published_at`
- `duration_seconds`
- `content_type`
- `url`
- `thumbnail_url`
- `created_at`
- `updated_at`

Contrainte d’unicité sur `platform + external_id`.

### 14.4 `video_snapshots`

- `id`
- `video_id`
- `observed_at`
- `view_count`
- `like_count`
- `comment_count`
- `raw_payload`

### 14.5 `channels`

- `id`
- `platform`
- `external_id`
- `name`
- `description`
- `country_code`
- `published_at`
- `url`
- `thumbnail_url`
- `created_at`
- `updated_at`

### 14.6 `channel_snapshots`

- `id`
- `channel_id`
- `observed_at`
- `subscriber_count`
- `video_count`
- `view_count`
- `subscribers_hidden`
- `raw_payload`

### 14.7 `query_videos`

- `scan_query_id`
- `video_id`
- `rank`
- `collected_at`

Cette association conserve la provenance d’une vidéo.

### 14.8 `opportunities`

- `id`
- `owner_id`
- `scan_id`
- `title`
- `niche`
- `summary`
- `automated_recommendation`
- `human_status`
- `opportunity_score`
- `confidence_score`
- `scoring_model_version`
- `primary_reason`
- `primary_risk`
- `created_at`
- `updated_at`

### 14.9 `opportunity_scores`

- `id`
- `opportunity_id`
- `dimension`
- `score`
- `confidence`
- `data_status`
- `explanation`
- `inputs`
- `scoring_model_version`
- `calculated_at`

Contrainte d’unicité sur opportunité, dimension et version.

### 14.10 `opportunity_evidence`

- `id`
- `opportunity_id`
- `evidence_type`
- `video_id`
- `channel_id`
- `metric_name`
- `metric_value`
- `data_status`
- `explanation`
- `observed_at`

### 14.11 `decisions`

- `id`
- `opportunity_id`
- `user_id`
- `decision`
- `reason`
- `created_at`

Les décisions sont append-only. La dernière décision détermine le statut courant.

### 14.12 `execution_experiments`

- `id`
- `opportunity_id`
- `status`
- `hypothesis`
- `target_audience`
- `format`
- `angle`
- `initial_volume`
- `test_duration_days`
- `required_resources`
- `success_metrics`
- `stop_conditions`
- `created_at`
- `updated_at`

### 14.13 `jobs`

- `id`
- `job_type`
- `entity_type`
- `entity_id`
- `status`
- `idempotency_key`
- `priority`
- `attempt_count`
- `max_attempts`
- `locked_by`
- `locked_until`
- `heartbeat_at`
- `available_at`
- `started_at`
- `finished_at`
- `error_code`
- `error_message`
- `payload`

### 14.14 `job_events`

- `id`
- `job_id`
- `event_type`
- `level`
- `message`
- `details`
- `created_at`

### 14.15 `scoring_models`

- `id`
- `version`
- `status`
- `weights`
- `thresholds`
- `description`
- `created_at`
- `activated_at`

Une seule version peut être active à un instant donné.

---

## 15. Contrat des tâches asynchrones

### 15.1 Commande

Une commande utilisateur crée ou met à jour une entité métier, puis crée une tâche avec une clé d’idempotence.

### 15.2 Réservation

Le worker réserve atomiquement une tâche disponible pour une durée limitée.

### 15.3 Progression

Le worker met à jour :

- l’étape courante ;
- le total connu ;
- le heartbeat ;
- le quota consommé ;
- les événements utiles.

### 15.4 Relance

Les erreurs sont classées :

- temporaires et relançables ;
- quota dépassé ;
- authentification ;
- validation ;
- erreur permanente ;
- annulation demandée.

Le délai entre tentatives augmente progressivement.

### 15.5 Fin

Une tâche terminée écrit son état final et l’événement associé dans la même transaction lorsque c’est nécessaire.

---

## 16. API fonctionnelle indicative

### Authentification

- `GET /me`

### Scans

- `POST /scans`
- `GET /scans`
- `GET /scans/{scan_id}`
- `POST /scans/{scan_id}/start`
- `POST /scans/{scan_id}/cancel`
- `POST /scans/{scan_id}/retry`
- `GET /scans/{scan_id}/queries`
- `GET /scans/{scan_id}/events`

### Opportunités

- `GET /opportunities`
- `GET /opportunities/{opportunity_id}`
- `POST /opportunities/{opportunity_id}/reanalyze`
- `GET /opportunities/{opportunity_id}/evidence`
- `POST /opportunities/{opportunity_id}/decisions`

### Expériences

- `POST /opportunities/{opportunity_id}/experiments`
- `PATCH /experiments/{experiment_id}`

### Configuration

- `GET /scoring-models/active`
- `GET /quota/status`

Les routes sont une base de conception, pas une obligation de nommage définitif.

---

## 17. Structure de l’interface

### 17.1 Navigation V1

La navigation principale contient quatre entrées :

1. Dashboard
2. Scout
3. Opportunités
4. Historique

Les paramètres sont accessibles depuis un menu secondaire.

Il n’existe pas d’onglet Producteur actif dans la V1.

### 17.2 Dashboard

Objectif : montrer ce qui demande une action.

Contenu :

- scans actifs ;
- scans en erreur ;
- opportunités nouvelles ;
- décisions en attente ;
- dernières opportunités `GO` ;
- consommation récente de quota ;
- raccourci “Nouveau scan”.

Le Dashboard ne doit pas multiplier les métriques décoratives.

### 17.3 Scout — liste

Contenu :

- bouton “Nouveau scan” ;
- statut ;
- progression ;
- date ;
- nombre de requêtes ;
- nombre de résultats ;
- quota utilisé ;
- actions disponibles.

### 17.4 Scout — création

Formulaire simple, avec :

- paramètres principaux visibles ;
- paramètres avancés repliés ;
- estimation du quota ;
- résumé avant confirmation ;
- validation claire.

### 17.5 Scout — détail

Contenu :

- état global ;
- barre de progression ;
- requête en cours ;
- requêtes terminées ;
- erreurs ;
- quota ;
- résultats ;
- événements techniques utiles ;
- bouton d’annulation selon l’état.

### 17.6 Opportunités — liste

Colonnes principales :

- opportunité ;
- score ;
- confiance ;
- demande ;
- monétisation ;
- accessibilité ;
- faisabilité ;
- recommandation ;
- décision humaine ;
- date.

Filtres :

- statut ;
- score ;
- confiance ;
- niche ;
- date ;
- scan.

### 17.7 Opportunité — détail

La fiche respecte les sections définies au chapitre 12.

L’action principale est la décision humaine.

### 17.8 Historique

L’historique rassemble :

- scans ;
- analyses ;
- décisions ;
- changements de statut ;
- expériences.

Il ne doit pas afficher les logs techniques bruts par défaut.

### 17.9 Barre d’état globale

Une barre légère peut afficher :

```text
2 scans actifs · 1 erreur · 4 décisions requises
```

Elle sert à informer et naviguer. Elle ne doit pas dupliquer toutes les commandes du Scout.

---

## 18. États d’interface

Chaque écran asynchrone doit gérer :

- chargement initial ;
- absence de données ;
- succès ;
- données partielles ;
- erreur récupérable ;
- erreur permanente ;
- accès refusé ;
- perte de connexion ;
- action en cours ;
- confirmation d’action sensible.

Un bouton lancé affiche son état et devient non répétable jusqu’à la réponse, sauf si l’opération utilise explicitement une clé d’idempotence.

Les messages d’erreur doivent expliquer :

- ce qui a échoué ;
- ce qui a été conservé ;
- ce que l’utilisateur peut faire ;
- si une relance consommera du quota.

---

## 19. Mode démonstration

Le mode démonstration est optionnel.

S’il existe :

- il est activé explicitement ;
- il utilise un espace de données séparé ;
- toutes les pages portent une indication persistante ;
- aucun résultat démo ne peut être confondu avec un résultat réel ;
- aucun fallback automatique ne bascule du réel vers la démo ;
- les données démo ne participent pas aux scores ou statistiques réels.

---

## 20. Sécurité

### 20.1 Secrets

- clé YouTube uniquement côté serveur ;
- clés de modèles IA uniquement côté serveur ;
- aucun secret dans les variables `VITE_*` ;
- secrets différents selon les environnements ;
- rotation possible sans reconstruction du frontend.

La clé publique Supabase peut être exposée au frontend uniquement avec des politiques RLS correctes. Elle n’est pas une protection en elle-même.

### 20.2 Accès aux données

- RLS activée sur toutes les tables utilisateur ;
- chaque requête est limitée au propriétaire ;
- le worker utilise un rôle serveur séparé ;
- les actions administratives ne passent pas par le navigateur ;
- les données brutes sensibles ne sont pas journalisées.

### 20.3 Validation

- validation des entrées côté frontend pour l’ergonomie ;
- validation obligatoire côté API ;
- limites sur taille, nombre de mots-clés et plage de dates ;
- normalisation des codes pays et langues ;
- protection contre les doubles commandes.

### 20.4 Journalisation

Les logs doivent contenir des identifiants techniques et des codes d’erreur, pas les secrets ni les tokens.

---

## 21. Limites des données et honnêteté produit

L’application ne doit pas prétendre obtenir les métriques privées des concurrents.

Pour une chaîne non possédée, sont généralement indisponibles :

- CTR réel ;
- rétention ;
- watch time ;
- taux de replay fiable ;
- revenus ;
- sources de trafic ;
- données démographiques détaillées.

Ces métriques ne doivent pas être inventées ni remplacées par des chiffres pseudo-précis.

Si des approximations sont utiles, elles sont :

- nommées comme estimations ;
- accompagnées de leur méthode ;
- assorties d’un intervalle ou niveau de confiance ;
- exclues des preuves observées.

---

## 22. Exigences de qualité

### 22.1 Frontend

- TypeScript strict ;
- lint sans erreur ;
- formatage automatique ;
- composants testables ;
- aucun fichier métier gigantesque ;
- aucune mutation métier dispersée dans les composants ;
- accessibilité clavier minimale ;
- interface responsive pour ordinateur et tablette.

### 22.2 Backend

- typage Python ;
- validation Pydantic ;
- migrations versionnées ;
- transactions explicites ;
- erreurs structurées ;
- tests unitaires du scoring ;
- tests d’intégration des transitions de tâches ;
- client YouTube remplaçable par un faux en test.

### 22.3 Dépendances

- versions bornées ;
- lockfiles commités ;
- mises à jour volontaires ;
- audit de sécurité en CI ;
- pas de dépendance ajoutée pour une fonctionnalité triviale.

### 22.4 Intégration continue

Chaque changement doit exécuter :

- lint frontend ;
- typecheck frontend ;
- tests frontend ;
- build frontend ;
- lint backend ;
- typecheck backend ;
- tests backend ;
- validation des migrations ;
- contrôle des secrets ;
- contrôle du diff.

---

## 23. Stratégie de tests

### 23.1 Tests unitaires

- normalisation YouTube ;
- déduplication ;
- calcul de chaque score ;
- calcul de confiance ;
- recommandation ;
- transitions d’état ;
- estimation de quota ;
- cache.

### 23.2 Tests d’intégration

- création puis exécution d’un scan ;
- annulation ;
- reprise après expiration d’un verrou ;
- erreur YouTube ;
- quota dépassé ;
- création d’opportunités ;
- décision humaine ;
- isolation entre utilisateurs.

### 23.3 Tests de parcours

Parcours minimum :

```text
Connexion
→ Nouveau scan
→ Lancement
→ Progression
→ Résultats
→ Opportunité
→ Décision GO
→ Création d’un premier test
```

### 23.4 Jeux de données de référence

Le scoring doit être testé sur des fixtures stables. Les résultats attendus sont versionnés afin de détecter les changements involontaires de classement.

---

## 24. Organisation recommandée du nouveau dépôt

```text
/
├── README.md
├── PROJECT_FOUNDATION.md
├── ARCHITECTURE.md
├── ROADMAP.md
├── CHANGELOG.md
├── CODEX_INSTRUCTIONS.md
├── .env.example
├── .gitignore
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── scans/
│   │   │   ├── opportunities/
│   │   │   └── history/
│   │   ├── lib/
│   │   ├── routes/
│   │   └── types/
│   └── tests/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── services/
│   │   │   ├── scout/
│   │   │   ├── analyst/
│   │   │   ├── scoring/
│   │   │   └── youtube/
│   │   ├── workers/
│   │   └── main.py
│   └── tests/
├── supabase/
│   ├── config.toml
│   └── migrations/
├── docs/
│   ├── decisions/
│   ├── data-dictionary.md
│   └── scoring.md
└── .github/
    └── workflows/
```

Les sauvegardes, copies datées, scripts de réparation temporaires et dépôts de recherche externes ne doivent pas être stockés dans le code actif.

---

## 25. Règles de développement

### 25.1 Protection du projet

- ne jamais développer directement sur `main` ;
- une branche par étape cohérente ;
- commits petits et explicites ;
- aucun fichier généré inutile dans Git ;
- aucune sauvegarde datée au milieu de `src/` ;
- aucune modification destructive sans sauvegarde et explication ;
- ne pas réutiliser automatiquement le code de V4.

### 25.2 Avant de coder

Relire :

- `PROJECT_FOUNDATION.md` ;
- `ARCHITECTURE.md` ;
- `ROADMAP.md` ;
- `CHANGELOG.md` ;
- `CODEX_INSTRUCTIONS.md`.

Puis :

1. inspecter l’état Git ;
2. expliquer le plan ;
3. identifier les fichiers concernés ;
4. signaler les risques et ambiguïtés.

### 25.3 Pendant le développement

- modifications ciblées ;
- pas de réécriture complète non justifiée ;
- pas de nouvelle abstraction sans usage réel ;
- pas de deuxième runtime pour contourner le premier ;
- pas de fallback simulé silencieux ;
- pas de donnée métier durable dans `localStorage`.

### 25.4 Après une modification

- exécuter les vérifications proportionnées ;
- contrôler `git diff --check` ;
- documenter les fichiers modifiés ;
- mettre à jour le changelog ;
- confirmer ce qui est réellement fonctionnel ;
- distinguer ce qui reste simulé ou incomplet.

---

## 26. Décisions d’architecture initiales

### ADR-001 — Repartir de zéro

**Décision :** créer un nouveau projet au lieu de refactorer V4.

**Raison :** V4 mélange plusieurs générations d’interface, runtimes concurrents, stockage local et fonctions simulées. Le coût de clarification dépasse la valeur de réutilisation structurelle.

**Conséquence :** l’ancien projet reste consultable comme archive fonctionnelle.

### ADR-002 — YouTube uniquement en V1

**Décision :** aucune abstraction multi-plateforme complexe avant validation de YouTube.

**Raison :** YouTube offre l’accès aux données le plus stable et suffit pour valider la proposition de valeur.

### ADR-003 — Backend obligatoire

**Décision :** les collectes, secrets et scores de référence vivent côté serveur.

**Raison :** sécurité, reprise, quota, cohérence et accès multi-appareil.

### ADR-004 — Pas de framework d’agents

**Décision :** Scout et Analyste sont d’abord des services métier et des tâches.

**Raison :** CrewAI ou LangGraph ajouteraient une orchestration avant que les contrats métier soient stabilisés.

### ADR-005 — Scoring déterministe et versionné

**Décision :** les scores principaux sont calculés par du code testable.

**Raison :** reproductibilité, comparaison historique et explicabilité.

### ADR-006 — LLM optionnel

**Décision :** un LLM peut enrichir les synthèses, pas définir la vérité des données.

### ADR-007 — Aucun fallback réel vers simulation

**Décision :** une erreur réelle reste une erreur visible.

### ADR-008 — Une source de vérité distante

**Décision :** PostgreSQL/Supabase remplace `localStorage` pour toutes les données métier.

---

## 27. Feuille de route de reconstruction

### Phase 0 — Fondation

Livrables :

- dépôt Git indépendant initialisé dans le dossier du projet ;
- vérification que la racine Git n’est pas `/var/home/JJ` ni un dossier parent partagé ;
- dépôt propre ;
- documents racine ;
- frontend et backend minimaux ;
- configuration des environnements ;
- Supabase local ;
- CI ;
- conventions de code ;
- page de santé technique.

Critère de sortie :

> Le projet s’installe, se teste et se construit à partir d’un clone propre.

### Phase 1 — Tranche verticale minimale

Livrables :

- connexion ;
- création d’un scan à un mot-clé ;
- tâche worker ;
- appel YouTube réel ;
- stockage d’une vidéo et d’une chaîne ;
- affichage du résultat ;
- gestion d’erreur.

Critère de sortie :

> Un utilisateur lance une collecte réelle et retrouve le résultat depuis un autre navigateur.

### Phase 2 — Scout exploitable

Livrables :

- scans par lots ;
- expansion contrôlée ;
- progression ;
- annulation ;
- reprise ;
- quota ;
- cache ;
- snapshots ;
- déduplication ;
- historique.

Critère de sortie :

> Un scan de taille standard peut finir, échouer partiellement ou être annulé sans perdre les résultats valides.

### Phase 3 — Analyste V1

Livrables :

- quatre dimensions ;
- confiance ;
- scoring versionné ;
- opportunités ;
- preuves ;
- classement ;
- recommandations ;
- tests de référence.

Critère de sortie :

> Chaque opportunité classée peut être expliquée à partir de données conservées.

### Phase 4 — Décision et expérimentation

Livrables :

- décisions humaines ;
- premier plan de test ;
- historique ;
- filtres ;
- comparaison des opportunités.

Critère de sortie :

> L’utilisateur peut transformer une analyse en décision documentée.

### Phase 5 — Validation terrain

Travail :

- utilisation réelle sur plusieurs semaines ;
- mesure des opportunités acceptées ;
- suivi des faux positifs ;
- ajustement des poids ;
- amélioration de la confiance ;
- suppression des indicateurs inutiles.

Critère de sortie :

> Les recommandations sont jugées suffisamment utiles et cohérentes pour justifier l’étape Producteur.

### Phase 6 — Producteur

Cette phase nécessite un nouveau cadrage. Elle ne commence pas automatiquement après la phase 5.

---

## 28. Critères d’acceptation de la V1

La V1 est acceptable si :

- un clone propre peut être installé avec une documentation complète ;
- les dépendances sont verrouillées ;
- la CI est verte ;
- les secrets ne sont pas exposés au navigateur ;
- un scan réel peut être créé, lancé, suivi, annulé et relancé ;
- une interruption du worker ne corrompt pas le scan ;
- le quota est estimé et mesuré ;
- les données sont persistantes et accessibles depuis plusieurs appareils ;
- les entités sont dédupliquées ;
- les snapshots conservent l’évolution ;
- les scores utilisent une version identifiée ;
- les preuves sont consultables ;
- faits et estimations sont distingués ;
- une erreur ne devient jamais une simulation silencieuse ;
- l’utilisateur peut décider `GO`, `WATCH` ou `REJECT` ;
- l’historique des décisions est conservé ;
- le parcours principal possède un test de bout en bout.

---

## 29. Indicateurs de succès produit

### Indicateurs V1

- temps moyen entre création du scan et première opportunité ;
- taux de scans terminés ;
- taux de scans partiels ou échoués ;
- consommation moyenne de quota par opportunité utile ;
- part des opportunités avec confiance suffisante ;
- part des opportunités examinées par l’utilisateur ;
- distribution des décisions `GO`, `WATCH`, `REJECT` ;
- taux d’opportunités jugées pertinentes ;
- nombre de doublons évités ;
- nombre de recommandations sans preuves suffisantes.

### Indicateurs futurs

- proportion de `GO` réellement testés ;
- performance des tests ;
- écart entre score prédit et résultat ;
- dimensions les plus prédictives ;
- délai entre détection et exécution.

Le nombre brut de pages, agents, analyses ou contenus générés n’est pas un indicateur de succès.

---

## 30. Risques principaux

### Quota YouTube

Réponse :

- estimation ;
- cache ;
- déduplication ;
- budget par scan ;
- limitation des expansions ;
- suivi des coûts.

### Fausse précision des scores

Réponse :

- peu de dimensions ;
- confiance séparée ;
- preuves ;
- versionnement ;
- validation terrain.

### Recommandations convaincantes mais fausses

Réponse :

- calcul déterministe ;
- LLM limité à la synthèse ;
- données manquantes visibles ;
- décision humaine.

### Complexité prématurée

Réponse :

- périmètre strict ;
- architecture simple ;
- pas d’orchestrateur d’agents ;
- critères de sortie par phase.

### Dérive vers une usine à fonctionnalités

Réponse :

- chaque ajout doit améliorer une décision mesurable ;
- Producteur et plateformes supplémentaires restent hors V1 ;
- suppression régulière des indicateurs inutilisés.

### Données concurrentes incomplètes

Réponse :

- limites affichées ;
- aucune métrique privée inventée ;
- confiance réduite ;
- historique de snapshots.

---

## 31. Questions ouvertes à trancher pendant la conception

Ces questions ne bloquent pas la fondation, mais elles devront être documentées avant le scoring final :

1. Quel modèle économique doit être privilégié : publicité, affiliation, produit, service ou combinaison ?
2. Quels pays et langues sont prioritaires ?
3. Quelles ressources réelles définissent la faisabilité de production ?
4. Faut-il analyser uniquement les niches sans visage ou toutes les niches ?
5. Quelle période définit une tendance exploitable ?
6. Comment distinguer Shorts et vidéos longues de manière fiable ?
7. Quels critères rendent une opportunité suffisamment différente d’une autre ?
8. Quelles données seront disponibles pour suivre les contenus réellement publiés ?
9. Un mode mono-utilisateur distant suffit-il au lancement ?
10. Quel fournisseur de modèle IA sera utilisé si la synthèse LLM est activée ?

Chaque réponse importante doit devenir une décision d’architecture ou une règle métier versionnée.

---

## 32. Ce que l’ancienne version nous apprend

À conserver dans l’esprit :

- la chaîne Scout → Analyste → Producteur ;
- la priorité donnée aux données réelles ;
- le cockpit orienté action ;
- la visibilité de la progression ;
- le lancement et l’arrêt des scans ;
- l’analyse de lots ;
- le marquage clair des simulations ;
- l’utilité avant le design.

À ne pas reproduire :

- les multiples versions V6 à V10 actives ensemble ;
- les runtimes chargés par effets de bord ;
- les contrats via `window` et événements globaux ;
- les nombreuses clés `localStorage` synonymes ;
- les fallbacks simulés après erreur réelle ;
- les fichiers de plusieurs milliers de lignes ;
- les sauvegardes dans `src/` ;
- les scripts de patch servant de système de version ;
- les interfaces Producteur, Publisher et Feedback avant validation de Scout ;
- les scores nombreux et insuffisamment démontrés ;
- les dépendances déclarées avec `latest` ;
- l’exposition de la clé YouTube au frontend.

---

## 33. Formulation courte de référence

> IA Agent Tool est un backoffice d’aide à la décision qui collecte des données YouTube réelles, détecte des opportunités de contenu, les classe selon quatre dimensions explicables et permet à un humain de décider quoi tester. La V1 se limite à Scout et Analyste, utilise un backend sécurisé et conserve toutes les preuves nécessaires pour comprendre et réévaluer chaque recommandation.

---

## 34. Règle finale

Si une fonctionnalité ne contribue pas directement à :

1. collecter des données plus fiables ;
2. produire une analyse plus explicable ;
3. prendre une meilleure décision ;
4. conserver l’historique de cette décision ;

elle ne fait pas partie de la V1.
