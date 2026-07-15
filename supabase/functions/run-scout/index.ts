type JsonRecord = Record<string, unknown>;

type YouTubeVideo = {
  id: string;
  channel_id: string;
  title: string;
  description: string;
  published_at: string | null;
  duration: string | null;
  view_count: number | null;
  like_count: number | null;
  comment_count: number | null;
  thumbnail_url: string | null;
  raw: JsonRecord;
};

type YouTubeChannel = {
  id: string;
  title: string;
  description: string;
  published_at: string | null;
  subscriber_count: number | null;
  video_count: number | null;
  view_count: number | null;
  thumbnail_url: string | null;
  raw: JsonRecord;
};

type ScanVideoSummary = {
  rank: number;
  video_id: string;
  title: string;
  channel_id: string;
  channel_title: string;
  view_count: number | null;
  like_count: number | null;
  comment_count: number | null;
  published_at: string | null;
  thumbnail_url: string | null;
};

type BusinessScores = {
  money_score: number;
  attack_score: number;
  speed_cash_score: number;
  quality_gap_score: number;
  weak_competitor_score: number;
  upload_pressure_score: number;
  ecosystem_score: number;
  confidence: number;
};

type ScanAnalysis = {
  model_version: string;
  opportunity_title: string;
  verdict: "GO" | "WATCH" | "SKIP";
  scores: BusinessScores;
  summary: string;
  evidence_video_ids: string[];
  competitor_channels: string[];
};

type OpportunitySummary = {
  id: string;
  scan_id: string;
  keyword: string;
  title: string;
  verdict: "GO" | "WATCH" | "SKIP";
  model_version: string;
  summary: string;
  scores: BusinessScores;
  evidence_video_ids: string[];
  competitor_channels: string[];
  execution_plan: {
    angle: string;
    first_test: string;
    criteria_go: string;
    notes: string;
  };
  source: string;
  created_at: string;
  updated_at: string;
};

type CompetitorDataSummary = {
  scan_id: string;
  channel_id: string;
  channel_title: string;
  subscriber_count: number | null;
  channel_video_count: number | null;
  channel_view_count: number | null;
  observed_video_count: number;
  average_views: number;
  total_views: number;
  best_video_id: string | null;
  best_video_title: string;
  weak_signals: number;
  attack_tag: "WEAK_TARGET" | "BENCHMARK" | "WATCH";
  weakness_summary: string;
  created_at?: string;
  updated_at?: string;
};

type ExecutionExperimentSummary = {
  id: string;
  opportunity_scan_id: string;
  keyword: string;
  title: string;
  decision_label: "ATTAQUER" | "TESTER" | "VEILLE";
  priority_score: number;
  status: "READY" | "RUNNING" | "DONE" | "PAUSED";
  outcome: "UNKNOWN" | "PASSED" | "FAILED";
  next_action: string;
  success_criteria: string;
  result_note: string;
  evidence_video_ids: string[];
  created_at: string;
  updated_at: string;
};

type DecisionEventSummary = {
  id: string;
  experiment_id: string | null;
  opportunity_scan_id: string | null;
  keyword: string;
  event_type: "CREATED" | "STATUS_CHANGED" | "OUTCOME_RECORDED" | "NOTE_UPDATED";
  previous_status: string | null;
  next_status: string | null;
  previous_outcome: string | null;
  next_outcome: string | null;
  decision_label: "ATTAQUER" | "TESTER" | "VEILLE" | null;
  priority_score: number | null;
  note: string;
  created_at: string;
};

type ProductionDraftSummary = {
  id: string;
  opportunity_scan_id: string;
  experiment_id: string | null;
  keyword: string;
  title: string;
  status: "DRAFT" | "READY" | "USED";
  content: JsonRecord;
  created_at: string;
  updated_at: string;
};

type ProductionAsset = {
  scene: string;
  storyboard: string;
  visualPrompt: string;
  voicePrompt: string;
  screenText: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
};

type LlmProvider = "openai" | "openrouter" | "groq" | "local" | "fallback";

type LlmConfig = {
  provider: LlmProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
  pricing: LlmProviderPricing;
};

type LlmProviderPricing = {
  inputPerMillion: number;
  outputPerMillion: number;
};

type LlmProviderSetting = {
  provider: LlmProvider;
  label: string;
  description: string;
  enabled: boolean;
  defaultProvider: boolean;
  baseUrl: string;
  model: string;
  estimatedCostPerRunUsd: number;
  pricing: LlmProviderPricing;
  sortOrder: number;
};

type LlmUsageEstimate = {
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
};

type LlmBudgetSettings = {
  dailyLimitUsd: number;
  monthlyLimitUsd: number;
  enforceLimits: boolean;
};

type LlmBudgetSnapshot = {
  settings: LlmBudgetSettings;
  todayCostUsd: number;
  monthCostUsd: number;
};

type LlmGenerationResult = {
  asset: ProductionAsset;
  usage: LlmUsageEstimate;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const youtubeApiKey = Deno.env.get("YOUTUBE_API_KEY") ?? "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const llmBaseUrl = (
  Deno.env.get("LLM_BASE_URL") ??
  Deno.env.get("llm_base_url") ??
  "https://api.openai.com/v1"
).replace(/\/$/, "");
const llmModel = Deno.env.get("LLM_MODEL") ?? Deno.env.get("llm_model") ?? "gpt-4o-mini";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method === "GET") {
    try {
      assertConfigured();
      const url = new URL(request.url);

      if (url.searchParams.get("view") === "experiments") {
        return json(await listExecutionExperiments(request));
      }

      if (url.searchParams.get("view") === "decision-events") {
        return json(await listDecisionEvents(request));
      }

      if (url.searchParams.get("view") === "drafts") {
        return json(await listProductionDrafts(request));
      }

      if (url.searchParams.get("view") === "llm-status") {
        return json(await buildLlmStatus());
      }

      if (url.searchParams.get("view") === "llm-usage") {
        return json(await listLlmUsage(request));
      }

      return json(await listScoutLedger(request));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue.";
      return json({ error: "list_scout_ledger_failed", message }, 500);
    }
  }

  if (request.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  try {
    const body = await request.json().catch(() => ({}));

    if (body.action === "create-experiment") {
      assertConfigured();
      return json(await createExecutionExperiment(body));
    }

    if (body.action === "update-experiment") {
      assertConfigured();
      return json(await updateExecutionExperiment(body));
    }

    if (body.action === "create-draft") {
      assertConfigured();
      return json(await createProductionDraft(body));
    }

    if (body.action === "update-draft") {
      assertConfigured();
      return json(await updateProductionDraft(body));
    }

    if (body.action === "regenerate-asset") {
      assertConfigured();
      return json(await regenerateProductionAsset(body));
    }

    if (body.action === "update-llm-budget-settings") {
      assertConfigured();
      return json(await updateLlmBudgetSettings(body));
    }

    if (body.action === "update-llm-provider-settings") {
      assertConfigured();
      return json(await updateLlmProviderSettings(body));
    }

    if (body.action === "test-llm-provider") {
      assertConfigured();
      return json(await testLlmProvider(body));
    }

    const keyword = normalizeKeyword(String(body.keyword ?? ""));

    if (keyword.length < 2) {
      return json({ error: "invalid_keyword", message: "Le mot-cle doit contenir au moins 2 caracteres." }, 400);
    }

    assertConfigured();

    const scan = await createScan(keyword);
    const collection = await collectYouTube(keyword);
    await storeCollection(scan.id, collection);

    const videos = toVideoSummaries(collection);
    const competitorData = buildCompetitorData(scan.id, videos, collection.channels);
    const analysis = buildScanAnalysis(keyword, videos, competitorData);
    await updateScan(scan.id, "completed", null, null);
    await upsertCompetitorData(competitorData).catch((error) => {
      if (!isMissingTable(error)) {
        throw error;
      }
    });
    await upsertOpportunity(scan.id, keyword, analysis).catch((error) => {
      if (!isMissingTable(error)) {
        throw error;
      }
    });

    return json({
      scan: {
        ...scan,
        status: "completed",
        updated_at: new Date().toISOString(),
      },
      videos,
      competitor_data: competitorData,
      analysis,
      opportunity: buildOpportunityPayload(scan.id, keyword, analysis),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue.";
    return json({ error: "run_scout_failed", message }, 500);
  }
});

async function listProductionDrafts(request: Request) {
  const url = new URL(request.url);
  const limit = Math.max(1, Math.min(50, Number(url.searchParams.get("limit") ?? 20)));
  const drafts = await supabaseFetch<ProductionDraftSummary[]>(
    `/rest/v1/production_drafts?select=id,opportunity_scan_id,experiment_id,keyword,title,status,content,created_at,updated_at&order=created_at.desc&limit=${limit}`,
  );

  return { drafts };
}

async function createProductionDraft(body: JsonRecord) {
  const scanId = String(body.opportunity_scan_id ?? "");
  const keyword = normalizeKeyword(String(body.keyword ?? ""));
  const title = String(body.title ?? "").trim();
  const experimentId = body.experiment_id ? String(body.experiment_id) : null;
  const content = body.content as JsonRecord | undefined;
  const status = String(body.status ?? "DRAFT") as ProductionDraftSummary["status"];
  const allowedStatuses = new Set(["DRAFT", "READY", "USED"]);

  if (!scanId) {
    throw new Error("opportunity_scan_id est requis pour sauvegarder un draft.");
  }

  if (!keyword || !title || !content || typeof content !== "object") {
    throw new Error("keyword, title et content sont requis pour sauvegarder un draft.");
  }

  if (!allowedStatuses.has(status)) {
    throw new Error("Statut de draft invalide.");
  }

  const rows = await supabaseFetch<ProductionDraftSummary[]>(
    "/rest/v1/production_drafts?on_conflict=opportunity_scan_id",
    {
      method: "POST",
      headers: { Prefer: "return=representation,resolution=merge-duplicates" },
      body: JSON.stringify({
        opportunity_scan_id: scanId,
        experiment_id: experimentId,
        keyword,
        title,
        status,
        content,
        updated_at: new Date().toISOString(),
      }),
    },
  );

  return { draft: rows[0] };
}

async function updateProductionDraft(body: JsonRecord) {
  const draftId = String(body.draft_id ?? "");
  const status = body.status ? String(body.status) as ProductionDraftSummary["status"] : null;
  const title = body.title ? String(body.title).trim().slice(0, 240) : null;
  const content = body.content as JsonRecord | undefined;
  const allowedStatuses = new Set(["DRAFT", "READY", "USED"]);

  if (!draftId) {
    throw new Error("draft_id est requis pour mettre a jour un draft.");
  }

  if (status && !allowedStatuses.has(status)) {
    throw new Error("Statut de draft invalide.");
  }

  if (content && typeof content !== "object") {
    throw new Error("content doit etre un objet JSON.");
  }

  const patch: JsonRecord = {
    updated_at: new Date().toISOString(),
  };

  if (status) {
    patch.status = status;
  }

  if (title) {
    patch.title = title;
  }

  if (content) {
    patch.content = content;
  }

  if (!status && !title && !content) {
    throw new Error("Aucun changement fourni pour le draft.");
  }

  const rows = await supabaseFetch<ProductionDraftSummary[]>(
    `/rest/v1/production_drafts?id=eq.${draftId}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(patch),
    },
  );

  if (!rows[0]) {
    throw new Error("Draft introuvable.");
  }

  return { draft: rows[0] };
}

async function regenerateProductionAsset(body: JsonRecord) {
  const draftId = String(body.draft_id ?? "");
  const scene = String(body.scene ?? "").trim();
  const currentAsset = body.asset as Partial<ProductionAsset> | undefined;
  const providerSettings = await getLlmProviderSettings();
  const provider = normalizeLlmProvider(String(body.provider ?? Deno.env.get("LLM_PROVIDER") ?? getDefaultLlmProvider(providerSettings)));

  if (!draftId || !scene) {
    throw new Error("draft_id et scene sont requis pour regenerer un asset.");
  }

  if (!currentAsset || typeof currentAsset !== "object") {
    throw new Error("asset courant requis pour regenerer une scene.");
  }

  const rows = await supabaseFetch<ProductionDraftSummary[]>(
    `/rest/v1/production_drafts?id=eq.${draftId}&select=id,keyword,title,status,content,created_at,updated_at&limit=1`,
  );
  const draft = rows[0];

  if (!draft) {
    throw new Error("Draft introuvable.");
  }

  const fallbackAsset = buildRegeneratedAsset(draft, scene, currentAsset);
  const llmConfig = resolveLlmConfig(provider, providerSettings);

  if (!llmConfig) {
    const usage = estimateLlmUsage(provider, "", draft, currentAsset, fallbackAsset, "fallback");
    await insertLlmUsageEvent({
      draftId,
      scene,
      provider,
      model: "",
      source: "fallback",
      status: "fallback",
      usage,
      warning: buildMissingLlmConfigMessage(provider),
    });

    return {
      asset: fallbackAsset,
      source: "fallback",
      provider,
      warning: buildMissingLlmConfigMessage(provider),
    };
  }

  const budgetGuard = await evaluateLlmBudgetGuard(llmConfig, draft, currentAsset, fallbackAsset);

  if (budgetGuard.blocked) {
    await insertLlmUsageEvent({
      draftId,
      scene,
      provider,
      model: llmConfig.model,
      source: "fallback",
      status: "fallback",
      usage: budgetGuard.usage,
      warning: budgetGuard.message,
    });

    return {
      asset: fallbackAsset,
      source: "fallback",
      provider,
      model: llmConfig.model,
      warning: budgetGuard.message,
    };
  }

  try {
    const generated = await generateAssetWithLlm(draft, scene, currentAsset, fallbackAsset, llmConfig);
    await insertLlmUsageEvent({
      draftId,
      scene,
      provider: llmConfig.provider,
      model: llmConfig.model,
      source: "llm",
      status: "success",
      usage: generated.usage,
      warning: null,
    });

    return {
      asset: generated.asset,
      source: "llm",
      provider: llmConfig.provider,
      model: llmConfig.model,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur LLM inconnue.";
    const usage = estimateLlmUsage(provider, llmConfig.model, draft, currentAsset, fallbackAsset, "fallback", undefined, llmConfig.pricing);
    await insertLlmUsageEvent({
      draftId,
      scene,
      provider,
      model: llmConfig.model,
      source: "fallback",
      status: "fallback",
      usage,
      warning: message,
    });

    return {
      asset: fallbackAsset,
      source: "fallback",
      provider,
      model: llmConfig.model,
      warning: `LLM indisponible: ${message}`,
    };
  }
}

function normalizeLlmProvider(value: string): LlmProvider {
  if (["openai", "openrouter", "groq", "local", "fallback"].includes(value)) {
    return value as LlmProvider;
  }

  return "openai";
}

function resolveLlmConfig(provider: LlmProvider, settings: LlmProviderSetting[]): LlmConfig | null {
  const setting = findLlmProviderSetting(settings, provider);

  if (!setting.enabled) {
    return null;
  }

  if (provider === "fallback") {
    return null;
  }

  if (provider === "openai") {
    return resolveOpenAiCompatibleConfig({
      provider,
      apiKey: pickEnv(["OPENAI_API_KEY", "openai_api_key", "LLM_API_KEY", "llm_api_key"]),
      baseUrl: pickEnv(["OPENAI_BASE_URL", "openai_base_url", "LLM_BASE_URL", "llm_base_url"]) || setting.baseUrl || llmBaseUrl,
      model: pickEnv(["OPENAI_MODEL", "openai_model", "LLM_MODEL", "llm_model"]) || setting.model || llmModel,
      pricing: setting.pricing,
    });
  }

  if (provider === "openrouter") {
    return resolveOpenAiCompatibleConfig({
      provider,
      apiKey: pickEnv(["OPENROUTER_API_KEY", "openrouter_api_key"]),
      baseUrl: pickEnv(["OPENROUTER_BASE_URL", "openrouter_base_url"]) || setting.baseUrl,
      model: pickEnv(["OPENROUTER_MODEL", "openrouter_model"]) || setting.model,
      pricing: setting.pricing,
    });
  }

  if (provider === "groq") {
    return resolveOpenAiCompatibleConfig({
      provider,
      apiKey: pickEnv(["GROQ_API_KEY", "groq_api_key"]),
      baseUrl: pickEnv(["GROQ_BASE_URL", "groq_base_url"]) || setting.baseUrl,
      model: pickEnv(["GROQ_MODEL", "groq_model"]) || setting.model,
      pricing: setting.pricing,
    });
  }

  return resolveOpenAiCompatibleConfig({
    provider,
    apiKey: pickEnv(["LOCAL_LLM_API_KEY", "local_llm_api_key"]) || "local",
    baseUrl: pickEnv(["LOCAL_LLM_BASE_URL", "local_llm_base_url"]) || setting.baseUrl,
    model: pickEnv(["LOCAL_LLM_MODEL", "local_llm_model"]) || setting.model,
    pricing: setting.pricing,
  });
}

async function buildLlmStatus() {
  const settings = await getLlmProviderSettings();

  return {
    providers: settings.map((setting) => {
      const provider = setting.provider;
      const config = resolveLlmConfig(provider, settings);

      if (provider === "fallback") {
        return {
          provider,
          label: setting.label,
          description: setting.description,
          enabled: setting.enabled,
          default_provider: setting.defaultProvider,
          configured: true,
          model: "deterministic",
          base_url: setting.baseUrl,
          base_url_configured: true,
          estimated_cost_per_run_usd: setting.estimatedCostPerRunUsd,
          input_per_million_usd: setting.pricing.inputPerMillion,
          output_per_million_usd: setting.pricing.outputPerMillion,
          sort_order: setting.sortOrder,
          message: "Disponible sans coût API.",
        };
      }

      return {
        provider,
        label: setting.label,
        description: setting.description,
        enabled: setting.enabled,
        default_provider: setting.defaultProvider,
        configured: setting.enabled && Boolean(config),
        model: config?.model ?? setting.model,
        base_url: setting.baseUrl,
        base_url_configured: Boolean(config?.baseUrl || setting.baseUrl),
        estimated_cost_per_run_usd: setting.estimatedCostPerRunUsd,
        input_per_million_usd: setting.pricing.inputPerMillion,
        output_per_million_usd: setting.pricing.outputPerMillion,
        sort_order: setting.sortOrder,
        message: !setting.enabled
          ? "Fournisseur desactive dans Supabase."
          : config
          ? "Configuration présente. Le fournisseur peut encore refuser selon quota, modèle ou billing."
          : buildMissingLlmConfigMessage(provider),
      };
    }),
  };
}

function resolveOpenAiCompatibleConfig(config: LlmConfig): LlmConfig | null {
  if (!config.baseUrl || !config.model || !config.apiKey) {
    return null;
  }

  return {
    ...config,
    baseUrl: config.baseUrl.replace(/\/$/, ""),
  };
}

async function getLlmProviderSettings(): Promise<LlmProviderSetting[]> {
  try {
    const rows = await supabaseFetch<JsonRecord[]>(
      "/rest/v1/llm_provider_settings?select=provider,label,description,enabled,default_provider,base_url,model,estimated_cost_per_run_usd,input_per_million_usd,output_per_million_usd,sort_order&order=sort_order.asc",
    );

    if (rows.length === 0) {
      return getDefaultLlmProviderSettings();
    }

    return rows.map(normalizeLlmProviderSetting).sort((left, right) => left.sortOrder - right.sortOrder);
  } catch (error) {
    if (isMissingTable(error)) {
      return getDefaultLlmProviderSettings();
    }

    throw error;
  }
}

async function updateLlmProviderSettings(body: JsonRecord) {
  const provider = normalizeLlmProvider(String(body.provider ?? ""));
  const currentSettings = await getLlmProviderSettings();
  const fallback = findLlmProviderSetting(currentSettings, provider);
  const enabled = provider === "fallback" ? true : body.enabled !== false;
  const defaultProvider = body.defaultProvider === true || body.default_provider === true;

  if (!enabled && defaultProvider) {
    throw new Error("Un fournisseur par defaut doit etre actif.");
  }

  const label = sanitizeShortText(body.label, fallback.label, 80);
  const description = sanitizeShortText(body.description, fallback.description, 240);
  const baseUrl = sanitizeUrlText(body.baseUrl ?? body.base_url, fallback.baseUrl);
  const model = sanitizeShortText(body.model, fallback.model, 120);
  const estimatedCostPerRunUsd = parseProviderNumber(
    body.estimatedCostPerRunUsd ?? body.estimated_cost_per_run_usd,
    "estimatedCostPerRunUsd",
    fallback.estimatedCostPerRunUsd,
  );
  const inputPerMillionUsd = parseProviderNumber(
    body.inputPerMillionUsd ?? body.input_per_million_usd,
    "inputPerMillionUsd",
    fallback.pricing.inputPerMillion,
  );
  const outputPerMillionUsd = parseProviderNumber(
    body.outputPerMillionUsd ?? body.output_per_million_usd,
    "outputPerMillionUsd",
    fallback.pricing.outputPerMillion,
  );

  if (provider !== "fallback" && !model) {
    throw new Error("Le modele provider est requis.");
  }

  if (defaultProvider) {
    await supabaseFetch("/rest/v1/llm_provider_settings?default_provider=eq.true", {
      method: "PATCH",
      body: JSON.stringify({
        default_provider: false,
        updated_at: new Date().toISOString(),
      }),
    });
  }

  const rows = await supabaseFetch<JsonRecord[]>(
    "/rest/v1/llm_provider_settings?on_conflict=provider",
    {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify({
        provider,
        label,
        description,
        enabled,
        default_provider: defaultProvider,
        base_url: baseUrl,
        model,
        estimated_cost_per_run_usd: estimatedCostPerRunUsd,
        input_per_million_usd: inputPerMillionUsd,
        output_per_million_usd: outputPerMillionUsd,
        sort_order: fallback.sortOrder,
        updated_at: new Date().toISOString(),
      }),
    },
  );

  if (!rows[0]) {
    throw new Error("Impossible de sauvegarder le fournisseur IA.");
  }

  return await buildLlmStatus();
}

async function testLlmProvider(body: JsonRecord) {
  const providerSettings = await getLlmProviderSettings();
  const provider = normalizeLlmProvider(String(body.provider ?? getDefaultLlmProvider(providerSettings)));
  const setting = findLlmProviderSetting(providerSettings, provider);
  const startedAt = Date.now();

  if (provider === "fallback") {
    return {
      provider,
      ok: true,
      configured: true,
      latency_ms: Date.now() - startedAt,
      model: "deterministic",
      base_url_configured: true,
      message: "Fallback deterministe disponible sans appel externe.",
    };
  }

  if (!setting.enabled) {
    return {
      provider,
      ok: false,
      configured: false,
      latency_ms: Date.now() - startedAt,
      model: setting.model,
      base_url_configured: Boolean(setting.baseUrl),
      message: "Fournisseur desactive dans Supabase.",
    };
  }

  const config = resolveLlmConfig(provider, providerSettings);

  if (!config) {
    return {
      provider,
      ok: false,
      configured: false,
      latency_ms: Date.now() - startedAt,
      model: setting.model,
      base_url_configured: Boolean(setting.baseUrl),
      message: buildMissingLlmConfigMessage(provider),
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await fetch(`${config.baseUrl}/models`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    const bodyText = await response.text().catch(() => "");

    if (!response.ok) {
      return {
        provider,
        ok: false,
        configured: true,
        latency_ms: Date.now() - startedAt,
        model: config.model,
        base_url_configured: true,
        message: `HTTP ${response.status}${formatLlmErrorDetail(bodyText)}`,
      };
    }

    const payload = tryParseJson(bodyText) as JsonRecord | null;
    const modelCount = Array.isArray(payload?.data) ? payload.data.length : null;

    return {
      provider,
      ok: true,
      configured: true,
      latency_ms: Date.now() - startedAt,
      model: config.model,
      base_url_configured: true,
      message: modelCount === null
        ? "Connexion provider OK."
        : `Connexion provider OK, ${modelCount} modeles visibles.`,
    };
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError"
      ? "Timeout provider apres 8 secondes."
      : error instanceof Error
      ? error.message
      : "Erreur provider inconnue.";

    return {
      provider,
      ok: false,
      configured: true,
      latency_ms: Date.now() - startedAt,
      model: config.model,
      base_url_configured: true,
      message,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeLlmProviderSetting(row: JsonRecord): LlmProviderSetting {
  const provider = normalizeLlmProvider(String(row.provider ?? "fallback"));
  const fallback = findLlmProviderSetting(getDefaultLlmProviderSettings(), provider);

  return {
    provider,
    label: String(row.label ?? fallback.label),
    description: String(row.description ?? fallback.description),
    enabled: row.enabled !== false,
    defaultProvider: row.default_provider === true,
    baseUrl: String(row.base_url ?? fallback.baseUrl).trim(),
    model: String(row.model ?? fallback.model).trim(),
    estimatedCostPerRunUsd: toPositiveNumber(row.estimated_cost_per_run_usd, fallback.estimatedCostPerRunUsd),
    pricing: {
      inputPerMillion: toPositiveNumber(row.input_per_million_usd, fallback.pricing.inputPerMillion),
      outputPerMillion: toPositiveNumber(row.output_per_million_usd, fallback.pricing.outputPerMillion),
    },
    sortOrder: toPositiveInteger(row.sort_order) || fallback.sortOrder,
  };
}

function sanitizeShortText(value: unknown, fallback: string, maxLength: number) {
  const text = typeof value === "string" ? value.trim() : "";
  return (text || fallback).slice(0, maxLength);
}

function sanitizeUrlText(value: unknown, fallback: string) {
  const text = typeof value === "string" ? value.trim() : "";
  return (text || fallback).replace(/\/$/, "").slice(0, 240);
}

function parseProviderNumber(value: unknown, fieldName: string, fallback: number) {
  const numberValue = value === undefined || value === null || value === "" ? fallback : Number(value);

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    throw new Error(`${fieldName} doit etre un nombre positif ou zero.`);
  }

  return Math.round(numberValue * 1_000_000) / 1_000_000;
}

function getDefaultLlmProvider(settings: LlmProviderSetting[]) {
  return settings.find((setting) => setting.defaultProvider && setting.enabled)?.provider ?? "fallback";
}

function findLlmProviderSetting(settings: LlmProviderSetting[], provider: LlmProvider) {
  return settings.find((setting) => setting.provider === provider) ??
    getDefaultLlmProviderSettings().find((setting) => setting.provider === provider) ??
    getDefaultLlmProviderSettings()[0];
}

function getDefaultLlmProviderSettings(): LlmProviderSetting[] {
  return [
    {
      provider: "openai",
      label: "OpenAI",
      description: "Qualite stable, facturation OpenAI API.",
      enabled: true,
      defaultProvider: false,
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-4o-mini",
      estimatedCostPerRunUsd: 0.006,
      pricing: { inputPerMillion: 0.75, outputPerMillion: 4.5 },
      sortOrder: 10,
    },
    {
      provider: "openrouter",
      label: "OpenRouter",
      description: "Routeur multi-modeles compatible OpenAI.",
      enabled: true,
      defaultProvider: false,
      baseUrl: "https://openrouter.ai/api/v1",
      model: "openai/gpt-4o-mini",
      estimatedCostPerRunUsd: 0.004,
      pricing: { inputPerMillion: 0.5, outputPerMillion: 1.5 },
      sortOrder: 20,
    },
    {
      provider: "groq",
      label: "Groq",
      description: "Modeles rapides compatibles OpenAI.",
      enabled: true,
      defaultProvider: false,
      baseUrl: "https://api.groq.com/openai/v1",
      model: "llama-3.1-8b-instant",
      estimatedCostPerRunUsd: 0.002,
      pricing: { inputPerMillion: 0.1, outputPerMillion: 0.3 },
      sortOrder: 30,
    },
    {
      provider: "local",
      label: "Local",
      description: "LLM PC via URL publique/tunnel compatible OpenAI.",
      enabled: true,
      defaultProvider: false,
      baseUrl: "",
      model: "llama3.1:8b",
      estimatedCostPerRunUsd: 0,
      pricing: { inputPerMillion: 0, outputPerMillion: 0 },
      sortOrder: 40,
    },
    {
      provider: "fallback",
      label: "Fallback",
      description: "Aucun cout API, generation deterministe.",
      enabled: true,
      defaultProvider: true,
      baseUrl: "",
      model: "deterministic",
      estimatedCostPerRunUsd: 0,
      pricing: { inputPerMillion: 0, outputPerMillion: 0 },
      sortOrder: 50,
    },
  ];
}

function pickEnv(names: string[]) {
  for (const name of names) {
    const value = Deno.env.get(name)?.trim();

    if (value) {
      return value;
    }
  }

  return "";
}

function buildMissingLlmConfigMessage(provider: LlmProvider) {
  if (provider === "fallback") {
    return "Mode fallback selectionne: regeneration deterministe utilisee.";
  }

  if (provider === "local") {
    return "LOCAL_LLM_BASE_URL/local_llm_base_url absent: Supabase doit pouvoir joindre une URL publique compatible OpenAI.";
  }

  return `Secrets ${provider} absents: regeneration deterministe utilisee.`;
}

async function generateAssetWithLlm(
  draft: ProductionDraftSummary,
  scene: string,
  currentAsset: Partial<ProductionAsset>,
  fallbackAsset: ProductionAsset,
  llmConfig: LlmConfig,
): Promise<LlmGenerationResult> {
  const content = draft.content;
  const factory = content.factory as JsonRecord | undefined;
  const payload = {
    objective: "Regenerer une seule scene de contenu court vertical monetisable.",
    constraints: [
      "Repondre uniquement en JSON valide.",
      "Ne pas ajouter de markdown.",
      "Garder le meme nom de scene.",
      "Produire du contenu directement exploitable en production.",
      "Texte ecran court et lisible.",
      "Prompt visuel vertical 9:16 avec zone sous-titres libre.",
      "Prompt voix direct, rythme rapide, sans intro generique.",
    ],
    output_schema: {
      scene: "string",
      status: "TODO | IN_PROGRESS | DONE",
      storyboard: "string",
      screenText: "string",
      visualPrompt: "string",
      voicePrompt: "string",
    },
    draft: {
      keyword: draft.keyword,
      title: String(content.title ?? draft.title),
      concept: String(content.concept ?? ""),
      cta: String(content.cta ?? ""),
      selectedTitle: String(factory?.selectedTitle ?? content.title ?? draft.title),
      selectedHook: String(factory?.selectedHook ?? ""),
      montagePlan: Array.isArray(factory?.montagePlan) ? factory?.montagePlan : [],
      voicePrompt: String(factory?.voicePrompt ?? ""),
    },
    scene,
    currentAsset,
    deterministicFallback: fallbackAsset,
  };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(`${llmConfig.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${llmConfig.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: llmConfig.model,
        temperature: 0.6,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: [
              "Tu es un producteur de Shorts/Reels business.",
              "Tu transformes une opportunite en asset de production concret.",
              "Tu respectes strictement le schema JSON demande.",
            ].join(" "),
          },
          {
            role: "user",
            content: JSON.stringify(payload),
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`HTTP ${response.status}${formatLlmErrorDetail(errorText)}`);
    }

    const json = await response.json() as JsonRecord;
    const choices = json.choices as Array<{ message?: { content?: string } }> | undefined;
    const contentText = choices?.[0]?.message?.content;
    const usage = json.usage as JsonRecord | undefined;

    if (!contentText) {
      throw new Error("reponse vide");
    }

    const asset = sanitizeLlmAsset(scene, currentAsset, parseJsonObject(contentText));

    return {
      asset,
      usage: estimateLlmUsage(
        llmConfig.provider,
        llmConfig.model,
        draft,
        currentAsset,
        asset,
        "llm",
        usage,
        llmConfig.pricing,
      ),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function insertLlmUsageEvent(event: {
  draftId: string;
  scene: string;
  provider: LlmProvider;
  model: string;
  source: "llm" | "fallback";
  status: "success" | "fallback" | "error";
  usage: LlmUsageEstimate;
  warning: string | null;
}) {
  await supabaseFetch("/rest/v1/llm_usage_events", {
    method: "POST",
    body: JSON.stringify({
      draft_id: event.draftId,
      scene: event.scene,
      provider: event.provider,
      model: event.model,
      source: event.source,
      status: event.status,
      estimated_input_tokens: event.usage.inputTokens,
      estimated_output_tokens: event.usage.outputTokens,
      estimated_cost_usd: event.usage.costUsd,
      warning: event.warning,
    }),
  }).catch((error) => {
    if (!isMissingTable(error)) {
      throw error;
    }
  });
}

async function listLlmUsage(request: Request) {
  const url = new URL(request.url);
  const limit = Math.max(1, Math.min(100, Number(url.searchParams.get("limit") ?? 25)));

  try {
    const events = await supabaseFetch<JsonRecord[]>(
      `/rest/v1/llm_usage_events?select=id,draft_id,scene,provider,model,source,status,estimated_input_tokens,estimated_output_tokens,estimated_cost_usd,warning,created_at&order=created_at.desc&limit=${limit}`,
    );
    const budget = await getLlmBudgetSnapshot();
    const todayPrefix = new Date().toISOString().slice(0, 10);
    const todayEvents = events.filter((event) => String(event.created_at ?? "").startsWith(todayPrefix));
    const totalCostUsd = sumUsageCost(events);
    const todayCostUsd = sumUsageCost(todayEvents);

    return {
      summary: {
        total_calls: events.length,
        today_calls: todayEvents.length,
        total_estimated_cost_usd: totalCostUsd,
        today_estimated_cost_usd: todayCostUsd,
      },
      budget,
      events,
    };
  } catch (error) {
    if (isMissingTable(error)) {
      const settings = getDefaultLlmBudgetSettings();

      return {
        summary: {
          total_calls: 0,
          today_calls: 0,
          total_estimated_cost_usd: 0,
          today_estimated_cost_usd: 0,
        },
        budget: {
          settings,
          todayCostUsd: 0,
          monthCostUsd: 0,
        },
        events: [],
        warning: "Table llm_usage_events absente. Appliquer la migration pour activer l'historique.",
      };
    }

    throw error;
  }
}

async function evaluateLlmBudgetGuard(
  llmConfig: LlmConfig,
  draft: ProductionDraftSummary,
  currentAsset: Partial<ProductionAsset>,
  fallbackAsset: ProductionAsset,
) {
  const usage = estimateLlmUsage(
    llmConfig.provider,
    llmConfig.model,
    draft,
    currentAsset,
    fallbackAsset,
    "llm",
    undefined,
    llmConfig.pricing,
  );

  if (llmConfig.provider === "local" || usage.costUsd <= 0) {
    return { blocked: false, usage, message: "" };
  }

  const budget = await getLlmBudgetSnapshot();

  if (!budget.settings.enforceLimits) {
    return { blocked: false, usage, message: "" };
  }

  const projectedDailyCost = budget.todayCostUsd + usage.costUsd;
  const projectedMonthlyCost = budget.monthCostUsd + usage.costUsd;

  if (projectedDailyCost > budget.settings.dailyLimitUsd) {
    return {
      blocked: true,
      usage,
      message: `Budget journalier LLM depasse: ${projectedDailyCost.toFixed(4)} $ > ${budget.settings.dailyLimitUsd.toFixed(4)} $.`,
    };
  }

  if (projectedMonthlyCost > budget.settings.monthlyLimitUsd) {
    return {
      blocked: true,
      usage,
      message: `Budget mensuel LLM depasse: ${projectedMonthlyCost.toFixed(4)} $ > ${budget.settings.monthlyLimitUsd.toFixed(4)} $.`,
    };
  }

  return { blocked: false, usage, message: "" };
}

async function getLlmBudgetSnapshot(): Promise<LlmBudgetSnapshot> {
  const settings = await getLlmBudgetSettings();
  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const [todayEvents, monthEvents] = await Promise.all([
    listLlmUsageSince(todayStart),
    listLlmUsageSince(monthStart),
  ]);

  return {
    settings,
    todayCostUsd: sumUsageCost(todayEvents),
    monthCostUsd: sumUsageCost(monthEvents),
  };
}

async function getLlmBudgetSettings(): Promise<LlmBudgetSettings> {
  try {
    const rows = await supabaseFetch<JsonRecord[]>(
      "/rest/v1/llm_budget_settings?id=eq.default&select=daily_limit_usd,monthly_limit_usd,enforce_limits&limit=1",
    );
    const row = rows[0];

    if (!row) {
      return getDefaultLlmBudgetSettings();
    }

    return {
      dailyLimitUsd: toPositiveNumber(row.daily_limit_usd, 0.25),
      monthlyLimitUsd: toPositiveNumber(row.monthly_limit_usd, 5),
      enforceLimits: row.enforce_limits !== false,
    };
  } catch (error) {
    if (isMissingTable(error)) {
      return getDefaultLlmBudgetSettings();
    }

    throw error;
  }
}

function getDefaultLlmBudgetSettings(): LlmBudgetSettings {
  return {
    dailyLimitUsd: 0.25,
    monthlyLimitUsd: 5,
    enforceLimits: true,
  };
}

async function updateLlmBudgetSettings(body: JsonRecord) {
  const dailyLimitUsd = parseBudgetLimit(body.dailyLimitUsd ?? body.daily_limit_usd, "dailyLimitUsd");
  const monthlyLimitUsd = parseBudgetLimit(body.monthlyLimitUsd ?? body.monthly_limit_usd, "monthlyLimitUsd");
  const enforceLimits = body.enforceLimits ?? body.enforce_limits;

  if (monthlyLimitUsd < dailyLimitUsd) {
    throw new Error("La limite mensuelle doit etre superieure ou egale a la limite journaliere.");
  }

  const rows = await supabaseFetch<JsonRecord[]>(
    "/rest/v1/llm_budget_settings?on_conflict=id",
    {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify({
        id: "default",
        daily_limit_usd: dailyLimitUsd,
        monthly_limit_usd: monthlyLimitUsd,
        enforce_limits: enforceLimits !== false,
        updated_at: new Date().toISOString(),
      }),
    },
  );
  const row = rows[0];

  if (!row) {
    throw new Error("Impossible de sauvegarder les limites budget IA.");
  }

  return {
    budget: {
      ...(await getLlmBudgetSnapshot()),
      settings: {
        dailyLimitUsd: toPositiveNumber(row.daily_limit_usd, dailyLimitUsd),
        monthlyLimitUsd: toPositiveNumber(row.monthly_limit_usd, monthlyLimitUsd),
        enforceLimits: row.enforce_limits !== false,
      },
    },
  };
}

function parseBudgetLimit(value: unknown, fieldName: string) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    throw new Error(`${fieldName} doit etre un nombre positif ou zero.`);
  }

  return Math.round(numberValue * 1_000_000) / 1_000_000;
}

async function listLlmUsageSince(isoDate: string) {
  try {
    return await supabaseFetch<JsonRecord[]>(
      `/rest/v1/llm_usage_events?select=estimated_cost_usd&created_at=gte.${encodeURIComponent(isoDate)}&limit=1000`,
    );
  } catch (error) {
    if (isMissingTable(error)) {
      return [];
    }

    throw error;
  }
}

function sumUsageCost(events: JsonRecord[]) {
  return Number(events.reduce((total, event) => {
    const value = Number(event.estimated_cost_usd ?? 0);
    return total + (Number.isFinite(value) ? value : 0);
  }, 0).toFixed(6));
}

function estimateLlmUsage(
  provider: LlmProvider,
  model: string,
  draft: ProductionDraftSummary,
  currentAsset: Partial<ProductionAsset>,
  asset: ProductionAsset,
  source: "llm" | "fallback",
  usage?: JsonRecord,
  pricingOverride?: LlmProviderPricing,
): LlmUsageEstimate {
  if (source === "fallback" || provider === "fallback" || provider === "local") {
    return { inputTokens: 0, outputTokens: 0, costUsd: 0 };
  }

  const inputTokens = toPositiveInteger(usage?.prompt_tokens) ||
    estimateTokens(JSON.stringify({ draft: draft.content, currentAsset }));
  const outputTokens = toPositiveInteger(usage?.completion_tokens) || estimateTokens(JSON.stringify(asset));
  const pricing = pricingOverride ?? getProviderPricing(provider, model);
  const costUsd = ((inputTokens * pricing.inputPerMillion) + (outputTokens * pricing.outputPerMillion)) / 1_000_000;

  return {
    inputTokens,
    outputTokens,
    costUsd: Number(costUsd.toFixed(6)),
  };
}

function estimateTokens(value: string) {
  return Math.max(1, Math.ceil(value.length / 4));
}

function toPositiveInteger(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? Math.round(numberValue) : 0;
}

function toPositiveNumber(value: unknown, fallback: number) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : fallback;
}

function getProviderPricing(provider: LlmProvider, model: string) {
  if (provider === "openai") {
    return model.includes("mini")
      ? { inputPerMillion: 0.75, outputPerMillion: 4.5 }
      : { inputPerMillion: 0.2, outputPerMillion: 1.25 };
  }

  if (provider === "groq") {
    return { inputPerMillion: 0.1, outputPerMillion: 0.3 };
  }

  if (provider === "openrouter") {
    return { inputPerMillion: 0.5, outputPerMillion: 1.5 };
  }

  return { inputPerMillion: 0, outputPerMillion: 0 };
}

function parseJsonObject(value: string): JsonRecord {
  const trimmed = value.trim();
  const direct = tryParseJson(trimmed);

  if (direct) {
    return direct;
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start >= 0 && end > start) {
    const extracted = tryParseJson(trimmed.slice(start, end + 1));

    if (extracted) {
      return extracted;
    }
  }

  throw new Error("JSON invalide");
}

function formatLlmErrorDetail(value: string) {
  const parsed = tryParseJson(value);
  const error = parsed?.error as JsonRecord | undefined;
  const message = typeof error?.message === "string" ? error.message : "";
  const code = typeof error?.code === "string" ? error.code : "";
  const detail = [code, message].filter(Boolean).join(": ");

  if (detail) {
    return ` (${detail.slice(0, 240)})`;
  }

  return "";
}

function tryParseJson(value: string): JsonRecord | null {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as JsonRecord : null;
  } catch {
    return null;
  }
}

function sanitizeLlmAsset(
  scene: string,
  currentAsset: Partial<ProductionAsset>,
  value: JsonRecord,
): ProductionAsset {
  const status = typeof value.status === "string" && ["TODO", "IN_PROGRESS", "DONE"].includes(value.status)
    ? value.status as ProductionAsset["status"]
    : currentAsset.status && ["TODO", "IN_PROGRESS", "DONE"].includes(currentAsset.status)
      ? currentAsset.status
      : "IN_PROGRESS";

  return {
    scene,
    status,
    storyboard: sanitizeAssetField(value.storyboard, "Storyboard indisponible."),
    screenText: sanitizeAssetField(value.screenText, "Signal a tester."),
    visualPrompt: sanitizeAssetField(value.visualPrompt, "Vertical 9:16, composition claire, zone sous-titres libre."),
    voicePrompt: sanitizeAssetField(value.voicePrompt, "Voix off courte, directe, rythme rapide."),
  };
}

function sanitizeAssetField(value: unknown, fallback: string) {
  const text = typeof value === "string" ? value.trim() : "";
  return (text || fallback).slice(0, 1400);
}

function buildRegeneratedAsset(
  draft: ProductionDraftSummary,
  scene: string,
  currentAsset: Partial<ProductionAsset>,
): ProductionAsset {
  const content = draft.content;
  const factory = content.factory as JsonRecord | undefined;
  const selectedHook = String(factory?.selectedHook ?? (Array.isArray(content.hooks) ? content.hooks[0] : "") ?? "");
  const cta = String(content.cta ?? "Tester la prochaine version.");
  const keyword = normalizeKeyword(draft.keyword);
  const title = String(content.title ?? draft.title);
  const sceneNumber = Math.max(1, Number(scene.replace(/\D+/g, "")) || 1);
  const status = currentAsset.status && ["TODO", "IN_PROGRESS", "DONE"].includes(currentAsset.status)
    ? currentAsset.status
    : "IN_PROGRESS";
  const screenText = buildRegeneratedScreenText(sceneNumber, selectedHook, keyword, title, cta);
  const storyboard = [
    `${scene}: ouvrir sur un plan vertical lisible lie a ${keyword}.`,
    `Montrer le signal business en moins de 4 secondes, sans introduction generique.`,
    `Faire avancer l'idee centrale: ${title}.`,
  ].join(" ");

  return {
    scene,
    status,
    storyboard,
    screenText,
    visualPrompt: [
      `Vertical 9:16, scene ${sceneNumber}, niche ${keyword}.`,
      "Composition claire, sujet principal visible, contraste fort, zone sous-titres libre.",
      `Texte ecran integre: ${screenText}.`,
      "Style exploitable pour Short/Reel, pas d'element illisible, pas de surcharge.",
    ].join(" "),
    voicePrompt: [
      `Segment voix ${sceneNumber} pour ${keyword}.`,
      `Dire clairement: ${screenText}.`,
      "Ton direct, phrases courtes, rythme rapide, orientation opportunite business.",
      `Objectif: pousser le spectateur vers ${cta}`,
    ].join(" "),
  };
}

function buildRegeneratedScreenText(
  sceneNumber: number,
  selectedHook: string,
  keyword: string,
  title: string,
  cta: string,
) {
  if (sceneNumber === 1) {
    return selectedHook || `Cette niche ${keyword} cache un signal exploitable.`;
  }

  if (sceneNumber === 2) {
    return `Signal marche: ${keyword}`;
  }

  if (sceneNumber === 3) {
    return title;
  }

  return cta;
}

async function listExecutionExperiments(request: Request) {
  const url = new URL(request.url);
  const limit = Math.max(1, Math.min(50, Number(url.searchParams.get("limit") ?? 20)));
  const experiments = await supabaseFetch<ExecutionExperimentSummary[]>(
    `/rest/v1/execution_experiments?select=id,opportunity_scan_id,keyword,title,decision_label,priority_score,status,outcome,next_action,success_criteria,result_note,evidence_video_ids,created_at,updated_at&order=created_at.desc&limit=${limit}`,
  );

  return { experiments };
}

async function listDecisionEvents(request: Request) {
  const url = new URL(request.url);
  const limit = Math.max(1, Math.min(100, Number(url.searchParams.get("limit") ?? 50)));
  const events = await supabaseFetch<DecisionEventSummary[]>(
    `/rest/v1/decision_events?select=id,experiment_id,opportunity_scan_id,keyword,event_type,previous_status,next_status,previous_outcome,next_outcome,decision_label,priority_score,note,created_at&order=created_at.desc&limit=${limit}`,
  );

  return { events };
}

async function createExecutionExperiment(body: JsonRecord) {
  const scanId = String(body.scan_id ?? "");
  const decisionLabel = String(body.decision_label ?? "TESTER") as ExecutionExperimentSummary["decision_label"];
  const priorityScore = Number(body.priority_score ?? 0);

  if (!scanId) {
    throw new Error("scan_id est requis pour creer un test.");
  }

  const opportunities = await supabaseFetch<OpportunitySummary[]>(
    `/rest/v1/opportunities?select=id,scan_id,keyword,title,execution_plan,evidence_video_ids&scan_id=eq.${scanId}&limit=1`,
  );
  const opportunity = opportunities[0];

  if (!opportunity) {
    throw new Error("Opportunite introuvable pour ce scan.");
  }

  const rows = await supabaseFetch<ExecutionExperimentSummary[]>(
    "/rest/v1/execution_experiments?on_conflict=opportunity_scan_id",
    {
      method: "POST",
      headers: { Prefer: "return=representation,resolution=merge-duplicates" },
      body: JSON.stringify({
        opportunity_scan_id: opportunity.scan_id,
        keyword: opportunity.keyword,
        title: opportunity.title,
        decision_label: decisionLabel,
        priority_score: priorityScore,
        status: "READY",
        outcome: "UNKNOWN",
        next_action: opportunity.execution_plan.first_test,
        success_criteria: opportunity.execution_plan.criteria_go,
        result_note: "",
        evidence_video_ids: opportunity.evidence_video_ids,
        updated_at: new Date().toISOString(),
      }),
    },
  );

  if (rows[0]) {
    await insertDecisionEvent({
      experiment: rows[0],
      eventType: "CREATED",
      previousStatus: null,
      nextStatus: rows[0].status,
      previousOutcome: null,
      nextOutcome: rows[0].outcome,
      note: "Test cree depuis une opportunite Scout.",
    });
  }

  return { experiment: rows[0] };
}

async function updateExecutionExperiment(body: JsonRecord) {
  const experimentId = String(body.experiment_id ?? "");
  const status = String(body.status ?? "");
  const outcome = String(body.outcome ?? "UNKNOWN");
  const resultNote = String(body.result_note ?? "").slice(0, 1000);
  const allowedStatuses = new Set(["READY", "RUNNING", "DONE", "PAUSED"]);
  const allowedOutcomes = new Set(["UNKNOWN", "PASSED", "FAILED"]);

  if (!experimentId) {
    throw new Error("experiment_id est requis pour mettre a jour un test.");
  }

  if (!allowedStatuses.has(status)) {
    throw new Error("Statut de test invalide.");
  }

  if (!allowedOutcomes.has(outcome)) {
    throw new Error("Resultat de test invalide.");
  }

  const previousRows = await supabaseFetch<ExecutionExperimentSummary[]>(
    `/rest/v1/execution_experiments?id=eq.${experimentId}&select=id,opportunity_scan_id,keyword,title,decision_label,priority_score,status,outcome,next_action,success_criteria,result_note,evidence_video_ids,created_at,updated_at&limit=1`,
  );
  const previous = previousRows[0];

  const rows = await supabaseFetch<ExecutionExperimentSummary[]>(
    `/rest/v1/execution_experiments?id=eq.${experimentId}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        status,
        outcome,
        result_note: resultNote,
        updated_at: new Date().toISOString(),
      }),
    },
  );

  if (!rows[0]) {
    throw new Error("Test introuvable.");
  }

  await insertDecisionEvent({
    experiment: rows[0],
    eventType: resolveDecisionEventType(previous, rows[0]),
    previousStatus: previous?.status ?? null,
    nextStatus: rows[0].status,
    previousOutcome: previous?.outcome ?? null,
    nextOutcome: rows[0].outcome,
    note: resultNote,
  });

  return { experiment: rows[0] };
}

function resolveDecisionEventType(
  previous: ExecutionExperimentSummary | undefined,
  next: ExecutionExperimentSummary,
): DecisionEventSummary["event_type"] {
  if (!previous) {
    return "STATUS_CHANGED";
  }

  if (previous.outcome !== next.outcome && next.outcome !== "UNKNOWN") {
    return "OUTCOME_RECORDED";
  }

  if (previous.status !== next.status) {
    return "STATUS_CHANGED";
  }

  return "NOTE_UPDATED";
}

async function insertDecisionEvent(event: {
  experiment: ExecutionExperimentSummary;
  eventType: DecisionEventSummary["event_type"];
  previousStatus: string | null;
  nextStatus: string | null;
  previousOutcome: string | null;
  nextOutcome: string | null;
  note: string;
}) {
  await supabaseFetch("/rest/v1/decision_events", {
    method: "POST",
    body: JSON.stringify({
      experiment_id: event.experiment.id,
      opportunity_scan_id: event.experiment.opportunity_scan_id,
      keyword: event.experiment.keyword,
      event_type: event.eventType,
      previous_status: event.previousStatus,
      next_status: event.nextStatus,
      previous_outcome: event.previousOutcome,
      next_outcome: event.nextOutcome,
      decision_label: event.experiment.decision_label,
      priority_score: event.experiment.priority_score,
      note: event.note.slice(0, 1000),
    }),
  });
}

async function listScoutLedger(request: Request) {
  const url = new URL(request.url);
  const limit = Math.max(1, Math.min(50, Number(url.searchParams.get("limit") ?? 20)));
  const opportunities = await supabaseFetch<OpportunitySummary[]>(
    `/rest/v1/opportunities?select=id,scan_id,keyword,title,verdict,model_version,summary,scores,evidence_video_ids,competitor_channels,execution_plan,source,created_at,updated_at&order=created_at.desc&limit=${limit}`,
  );
  const scanIds = opportunities.map((opportunity) => opportunity.scan_id);

  if (scanIds.length === 0) {
    return { opportunities, scans: [], videos_by_scan: {} };
  }

  const scans = await supabaseFetch<JsonRecord[]>(
    `/rest/v1/scans?select=id,platform,keyword,status,error_code,error_message,created_at,updated_at&id=in.(${scanIds.join(",")})`,
  );
  const scanVideos = await supabaseFetch<JsonRecord[]>(
    `/rest/v1/scan_videos?select=scan_id,rank,video_id,youtube_videos(title,channel_id,view_count,like_count,comment_count,published_at,thumbnail_url,youtube_channels(title))&scan_id=in.(${scanIds.join(",")})&order=rank.asc`,
  );
  const competitorData = await supabaseFetch<CompetitorDataSummary[]>(
    `/rest/v1/competitor_data?select=scan_id,channel_id,channel_title,subscriber_count,channel_video_count,channel_view_count,observed_video_count,average_views,total_views,best_video_id,best_video_title,weak_signals,attack_tag,weakness_summary,created_at,updated_at&scan_id=in.(${scanIds.join(",")})&order=average_views.desc`,
  ).catch((error) => {
    if (isMissingTable(error)) {
      return [];
    }

    throw error;
  });
  const videosByScan: Record<string, ScanVideoSummary[]> = {};
  const competitorDataByScan: Record<string, CompetitorDataSummary[]> = {};

  scanVideos.forEach((item) => {
    const scanId = String(item.scan_id);
    const video = item.youtube_videos as JsonRecord | undefined;
    const channel = video?.youtube_channels as JsonRecord | undefined;
    const summary = {
      rank: Number(item.rank),
      video_id: String(item.video_id),
      title: String(video?.title ?? ""),
      channel_id: String(video?.channel_id ?? ""),
      channel_title: String(channel?.title ?? ""),
      view_count: optionalNumber(video?.view_count),
      like_count: optionalNumber(video?.like_count),
      comment_count: optionalNumber(video?.comment_count),
      published_at: optionalString(video?.published_at),
      thumbnail_url: optionalString(video?.thumbnail_url),
    };

    videosByScan[scanId] = [...(videosByScan[scanId] ?? []), summary];
  });

  competitorData.forEach((competitor) => {
    competitorDataByScan[competitor.scan_id] = [
      ...(competitorDataByScan[competitor.scan_id] ?? []),
      competitor,
    ];
  });

  return {
    opportunities,
    scans,
    videos_by_scan: videosByScan,
    competitor_data_by_scan: competitorDataByScan,
  };
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function assertConfigured() {
  if (!youtubeApiKey) {
    throw new Error("YOUTUBE_API_KEY manque dans les secrets Supabase.");
  }

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manque dans les secrets Supabase.");
  }
}

function normalizeKeyword(keyword: string) {
  return keyword.trim().replace(/\s+/g, " ");
}

async function createScan(keyword: string) {
  const rows = await supabaseFetch<JsonRecord[]>("/rest/v1/scans", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ platform: "youtube", keyword, status: "running" }),
  });

  return rows[0] as {
    id: string;
    platform: "youtube";
    keyword: string;
    status: string;
    error_code: string | null;
    error_message: string | null;
    created_at: string;
    updated_at: string;
  };
}

async function updateScan(
  scanId: string,
  status: "completed" | "failed",
  errorCode: string | null,
  errorMessage: string | null,
) {
  await supabaseFetch(`/rest/v1/scans?id=eq.${scanId}`, {
    method: "PATCH",
    body: JSON.stringify({
      status,
      error_code: errorCode,
      error_message: errorMessage,
      updated_at: new Date().toISOString(),
    }),
  });
}

async function collectYouTube(keyword: string) {
  const searchPayload = await youtubeFetch("/search", {
    part: "snippet",
    q: keyword,
    type: "video",
    order: "relevance",
    maxResults: "5",
  });
  const ranks = extractVideoRanks(searchPayload);
  const videoIds = Object.keys(ranks);

  if (videoIds.length === 0) {
    return { channels: [], videos: [], ranks };
  }

  const videosPayload = await youtubeFetch("/videos", {
    part: "snippet,statistics,contentDetails",
    id: videoIds.join(","),
  });
  const videos = (videosPayload.items as JsonRecord[] | undefined ?? []).map(toYouTubeVideo);
  const channelIds = [...new Set(videos.map((video) => video.channel_id))];
  const channelsPayload = await youtubeFetch("/channels", {
    part: "snippet,statistics",
    id: channelIds.join(","),
  });
  const channels = (channelsPayload.items as JsonRecord[] | undefined ?? []).map(toYouTubeChannel);

  return { channels, videos, ranks };
}

async function youtubeFetch(path: string, params: Record<string, string>) {
  const url = new URL(`https://www.googleapis.com/youtube/v3${path}`);
  Object.entries({ ...params, key: youtubeApiKey }).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = (payload as { error?: { message?: string } }).error;
    throw new Error(error?.message ?? `YouTube a repondu avec le statut ${response.status}.`);
  }

  return payload as JsonRecord;
}

function extractVideoRanks(payload: JsonRecord) {
  const ranks: Record<string, number> = {};
  const items = payload.items as JsonRecord[] | undefined ?? [];

  items.forEach((item, index) => {
    const itemId = item.id as JsonRecord | undefined;
    const videoId = itemId?.videoId;

    if (typeof videoId === "string") {
      ranks[videoId] = index + 1;
    }
  });

  return ranks;
}

function toYouTubeVideo(item: JsonRecord): YouTubeVideo {
  const snippet = item.snippet as JsonRecord | undefined ?? {};
  const statistics = item.statistics as JsonRecord | undefined ?? {};
  const contentDetails = item.contentDetails as JsonRecord | undefined ?? {};

  return {
    id: String(item.id),
    channel_id: String(snippet.channelId ?? ""),
    title: String(snippet.title ?? ""),
    description: String(snippet.description ?? ""),
    published_at: optionalString(snippet.publishedAt),
    duration: optionalString(contentDetails.duration),
    view_count: optionalNumber(statistics.viewCount),
    like_count: optionalNumber(statistics.likeCount),
    comment_count: optionalNumber(statistics.commentCount),
    thumbnail_url: bestThumbnailUrl(snippet),
    raw: item,
  };
}

function toYouTubeChannel(item: JsonRecord): YouTubeChannel {
  const snippet = item.snippet as JsonRecord | undefined ?? {};
  const statistics = item.statistics as JsonRecord | undefined ?? {};

  return {
    id: String(item.id),
    title: String(snippet.title ?? ""),
    description: String(snippet.description ?? ""),
    published_at: optionalString(snippet.publishedAt),
    subscriber_count: optionalNumber(statistics.subscriberCount),
    video_count: optionalNumber(statistics.videoCount),
    view_count: optionalNumber(statistics.viewCount),
    thumbnail_url: bestThumbnailUrl(snippet),
    raw: item,
  };
}

function optionalString(value: unknown) {
  return value === undefined || value === null ? null : String(value);
}

function optionalNumber(value: unknown) {
  return value === undefined || value === null ? null : Number(value);
}

function bestThumbnailUrl(snippet: JsonRecord) {
  const thumbnails = snippet.thumbnails as Record<string, { url?: string }> | undefined;

  for (const key of ["maxres", "standard", "high", "medium", "default"]) {
    const url = thumbnails?.[key]?.url;

    if (typeof url === "string") {
      return url;
    }
  }

  return null;
}

async function storeCollection(
  scanId: string,
  collection: {
    channels: YouTubeChannel[];
    videos: YouTubeVideo[];
    ranks: Record<string, number>;
  },
) {
  if (collection.channels.length > 0) {
    await supabaseFetch("/rest/v1/youtube_channels?on_conflict=id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(collection.channels),
    });
  }

  if (collection.videos.length > 0) {
    await supabaseFetch("/rest/v1/youtube_videos?on_conflict=id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(collection.videos),
    });

    await supabaseFetch("/rest/v1/scan_videos?on_conflict=scan_id,video_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(
        collection.videos.map((video) => ({
          scan_id: scanId,
          video_id: video.id,
          rank: collection.ranks[video.id],
        })),
      ),
    });
  }
}

function toVideoSummaries(
  collection: {
    channels: YouTubeChannel[];
    videos: YouTubeVideo[];
    ranks: Record<string, number>;
  },
): ScanVideoSummary[] {
  const channelTitles = new Map(collection.channels.map((channel) => [channel.id, channel.title]));

  return collection.videos
    .map((video) => ({
      rank: collection.ranks[video.id],
      video_id: video.id,
      title: video.title,
      channel_id: video.channel_id,
      channel_title: channelTitles.get(video.channel_id) ?? "",
      view_count: video.view_count,
      like_count: video.like_count,
      comment_count: video.comment_count,
      published_at: video.published_at,
      thumbnail_url: video.thumbnail_url,
    }))
    .sort((left, right) => left.rank - right.rank);
}

function buildCompetitorData(
  scanId: string,
  videos: ScanVideoSummary[],
  channels: YouTubeChannel[],
): CompetitorDataSummary[] {
  const channelsById = new Map(channels.map((channel) => [channel.id, channel]));
  const videosByChannel = new Map<string, ScanVideoSummary[]>();

  videos.forEach((video) => {
    if (!video.channel_id) {
      return;
    }

    videosByChannel.set(video.channel_id, [...(videosByChannel.get(video.channel_id) ?? []), video]);
  });

  return Array.from(videosByChannel.entries())
    .map(([channelId, channelVideos]) => {
      const channel = channelsById.get(channelId);
      const totalViews = channelVideos.reduce((total, video) => total + (video.view_count ?? 0), 0);
      const averageViews = Math.round(totalViews / channelVideos.length);
      const bestVideo = [...channelVideos].sort((left, right) => (right.view_count ?? 0) - (left.view_count ?? 0))[0];
      const weakSignals = channelVideos.filter((video) => (video.view_count ?? 0) < 30000).length;
      const attackTag = resolveCompetitorAttackTag(averageViews, bestVideo.view_count ?? 0, weakSignals);

      return {
        scan_id: scanId,
        channel_id: channelId,
        channel_title: channel?.title || bestVideo.channel_title || channelId,
        subscriber_count: channel?.subscriber_count ?? null,
        channel_video_count: channel?.video_count ?? null,
        channel_view_count: channel?.view_count ?? null,
        observed_video_count: channelVideos.length,
        average_views: averageViews,
        total_views: totalViews,
        best_video_id: bestVideo.video_id,
        best_video_title: bestVideo.title,
        weak_signals: weakSignals,
        attack_tag: attackTag,
        weakness_summary: buildCompetitorWeaknessSummary(attackTag, weakSignals, averageViews, channelVideos.length),
      };
    })
    .sort((left, right) => {
      if (left.attack_tag !== right.attack_tag) {
        const order: Record<CompetitorDataSummary["attack_tag"], number> = {
          WEAK_TARGET: 0,
          BENCHMARK: 1,
          WATCH: 2,
        };

        return order[left.attack_tag] - order[right.attack_tag];
      }

      return right.average_views - left.average_views;
    });
}

function resolveCompetitorAttackTag(
  averageViews: number,
  bestVideoViews: number,
  weakSignals: number,
): CompetitorDataSummary["attack_tag"] {
  if (averageViews < 30000 || weakSignals >= 2) {
    return "WEAK_TARGET";
  }

  if (bestVideoViews >= 100000) {
    return "BENCHMARK";
  }

  return "WATCH";
}

function buildCompetitorWeaknessSummary(
  attackTag: CompetitorDataSummary["attack_tag"],
  weakSignals: number,
  averageViews: number,
  observedVideoCount: number,
) {
  if (attackTag === "WEAK_TARGET") {
    return `${weakSignals} video(s) faibles sur ${observedVideoCount}, moyenne ${averageViews.toLocaleString("fr-FR")} vues.`;
  }

  if (attackTag === "BENCHMARK") {
    return `Benchmark utile: moyenne ${averageViews.toLocaleString("fr-FR")} vues sur ${observedVideoCount} video(s).`;
  }

  return `A surveiller: signal moyen avec ${observedVideoCount} video(s) observee(s).`;
}

function buildScanAnalysis(
  keyword: string,
  videos: ScanVideoSummary[],
  competitorData: CompetitorDataSummary[] = [],
): ScanAnalysis {
  const totalViews = videos.reduce((total, video) => total + (video.view_count ?? 0), 0);
  const averageViews = videos.length > 0 ? totalViews / videos.length : 0;
  const competitorChannels = [...new Set(videos.map((video) => video.channel_title || video.channel_id))].sort();
  const competitorCount = competitorData.length || competitorChannels.length;
  const weakTargetCount = competitorData.filter((competitor) => competitor.attack_tag === "WEAK_TARGET").length;
  const benchmarkCount = competitorData.filter((competitor) => competitor.attack_tag === "BENCHMARK").length;
  const watchCount = competitorData.filter((competitor) => competitor.attack_tag === "WATCH").length;
  const lowViewCount = videos.filter((video) => (video.view_count ?? 0) < 30000).length;
  const highViewCount = videos.filter((video) => (video.view_count ?? 0) >= 50000).length;

  const scores = {
    money_score: clampScore(48 + safeLog10(totalViews) * 10),
    attack_score: clampScore(
      45 + lowViewCount * 6 + weakTargetCount * 11 + benchmarkCount * 4 + competitorCount * 2 - watchCount,
    ),
    speed_cash_score: clampScore(42 + highViewCount * 13 + videos.length * 2),
    quality_gap_score: clampScore(35 + lowViewCount * 12 + weakTargetCount * 5),
    weak_competitor_score: clampScore(
      28 + weakTargetCount * 16 + lowViewCount * 8 + (competitorCount >= 4 ? 8 : 0) - benchmarkCount * 2,
    ),
    upload_pressure_score: clampScore(55 + videos.length * 5 - lowViewCount * 3),
    ecosystem_score: clampScore(40 + competitorCount * 7 + highViewCount * 6 + benchmarkCount * 3),
    confidence: clampScore(35 + videos.length * 8 + competitorCount * 4 + competitorData.length * 2),
  };
  let verdict: "GO" | "WATCH" | "SKIP" = "WATCH";

  if (scores.money_score >= 70 && scores.attack_score >= 65 && scores.confidence >= 55) {
    verdict = "GO";
  } else if (scores.money_score < 50 || scores.confidence < 40) {
    verdict = "SKIP";
  }

  return {
    model_version: "edge-business-heuristic-v0.3",
    opportunity_title: inferOpportunityTitle(keyword, videos),
    verdict,
    scores,
    summary: `${Math.round(averageViews).toLocaleString("fr-FR")} vues moyennes sur ${videos.length} vidéos, ${competitorCount} chaînes observées, ${weakTargetCount} cibles faibles, ${benchmarkCount} benchmarks.`,
    evidence_video_ids: videos.slice(0, 3).map((video) => video.video_id),
    competitor_channels: competitorChannels,
  };
}

function inferOpportunityTitle(keyword: string, videos: ScanVideoSummary[]) {
  const haystack = [keyword, ...videos.map((video) => video.title)].join(" ").toLowerCase();

  if (hasAny(haystack, ["music", "song", "suno", "udio", "ai music", "musique"])) {
    return "Chaîne musicale IA monétisable";
  }

  if (hasAny(haystack, ["faceless", "story", "stories", "narration", "reddit", "histoire"])) {
    return "Chaîne faceless stories automatisable";
  }

  if (hasAny(haystack, ["drama", "mini drama", "series", "romance", "revenge", "vertical"])) {
    return "Mini-drama IA vertical court";
  }

  if (hasAny(haystack, ["business", "money", "finance", "monetization", "cash", "income"])) {
    return "Shorts business faceless";
  }

  if (hasAny(haystack, ["reels", "shorts", "tiktok", "viral"])) {
    return "Format court viral automatisable";
  }

  return `${toTitleCase(keyword)} · niche contenu automatisable`;
}

function hasAny(value: string, needles: string[]) {
  return needles.some((needle) => value.includes(needle));
}

function toTitleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(" ");
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function safeLog10(value: number) {
  return value > 0 ? Math.log10(value) : 0;
}

function buildExecutionPlan(keyword: string, analysis: ScanAnalysis) {
  if (analysis.verdict === "GO") {
    if (analysis.opportunity_title === "Chaîne musicale IA monétisable") {
      return {
        angle: "Chaîne musicale IA faceless orientée playlists et émotions",
        first_test: `Publier 7 morceaux courts autour de ${keyword} avec visuels cohérents`,
        criteria_go: "Un morceau dépasse le benchmark de vues initial en 72h",
        notes: "Tester style musical, niche émotionnelle, miniature et boucle Shorts.",
      };
    }

    if (analysis.opportunity_title === "Chaîne faceless stories automatisable") {
      return {
        angle: "Stories faceless à tension immédiate",
        first_test: `Produire 5 histoires courtes autour de ${keyword} sur 7 jours`,
        criteria_go: "Un épisode dépasse le benchmark de vues initial en 48h",
        notes: "Optimiser hook narratif, payoff rapide et continuité entre épisodes.",
      };
    }

    return {
      angle: "Série verticale IA sur tension dramatique courte",
      first_test: `Lancer 5 épisodes courts autour de ${keyword} sur 7 jours`,
      criteria_go: "Un épisode dépasse le benchmark de vues initial en 48h",
      notes: "Accélérer le hook, garder des formats courts, pousser le volume d'itérations.",
    };
  }

  if (analysis.verdict === "WATCH") {
    return {
      angle: `Observer et resserrer: ${analysis.opportunity_title}`,
      first_test: `Tester 3 hooks et 2 formulations de ${keyword}`,
      criteria_go: "Le score money et le score attack montent au-dessus de 70",
      notes: "Le marché est intéressant mais la préparation doit être affinée.",
    };
  }

  return {
    angle: "Retirer cette piste du plan actif",
    first_test: `Conserver ${keyword} uniquement pour veille`,
    criteria_go: "Réouverture si la concurrence baisse ou si les signaux montent",
    notes: "Ne pas investir de temps de production pour l'instant.",
  };
}

function buildOpportunityPayload(scanId: string, keyword: string, analysis: ScanAnalysis) {
  return {
    scan_id: scanId,
    keyword,
    title: analysis.opportunity_title,
    verdict: analysis.verdict,
    model_version: analysis.model_version,
    summary: analysis.summary,
    scores: analysis.scores,
    evidence_video_ids: analysis.evidence_video_ids,
    competitor_channels: analysis.competitor_channels,
    execution_plan: buildExecutionPlan(keyword, analysis),
    source: "edge-run-scout",
  };
}

async function upsertOpportunity(scanId: string, keyword: string, analysis: ScanAnalysis) {
  await supabaseFetch("/rest/v1/opportunities?on_conflict=scan_id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify(buildOpportunityPayload(scanId, keyword, analysis)),
  });
}

async function upsertCompetitorData(competitors: CompetitorDataSummary[]) {
  if (competitors.length === 0) {
    return;
  }

  await supabaseFetch("/rest/v1/competitor_data?on_conflict=scan_id,channel_id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify(competitors.map(({ created_at: _, updated_at: __, ...competitor }) => ({
      ...competitor,
      updated_at: new Date().toISOString(),
    }))),
  });
}

async function supabaseFetch<T = unknown>(path: string, init: RequestInit = {}) {
  const response = await fetch(`${supabaseUrl}${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const error = new Error(
      typeof payload?.message === "string"
        ? payload.message
        : `Supabase a repondu avec le statut ${response.status}.`,
    );
    Object.assign(error, { status: response.status, payload });
    throw error;
  }

  return payload as T;
}

function isMissingTable(error: unknown) {
  const payload = (error as { payload?: { code?: string } }).payload;
  return payload?.code === "PGRST205";
}
