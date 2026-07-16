import { getJson, postJson } from "../../lib/api";

export type ScanStatus =
  | "queued"
  | "running"
  | "cancel_requested"
  | "cancelled"
  | "completed"
  | "failed";

export interface ScanSummary {
  id: string;
  platform: "youtube";
  keyword: string;
  status: ScanStatus;
  error_code: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScanVideoSummary {
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
}

export interface BusinessScores {
  money_score: number;
  attack_score: number;
  speed_cash_score: number;
  quality_gap_score: number;
  weak_competitor_score: number;
  upload_pressure_score: number;
  ecosystem_score: number;
  confidence: number;
}

export interface ScanAnalysis {
  model_version: string;
  opportunity_title: string;
  verdict: "GO" | "WATCH" | "SKIP";
  scores: BusinessScores;
  summary: string;
  evidence_video_ids: string[];
  competitor_channels: string[];
}

export interface ExecutionPlan {
  angle: string;
  first_test: string;
  criteria_go: string;
  notes: string;
}

export interface OpportunitySummary {
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
  execution_plan: ExecutionPlan;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface CompetitorDataSummary {
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
}

export interface ExecutionExperimentSummary {
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
}

export interface ExecutionPlanStep {
  id: "h24" | "h48" | "h72";
  label: string;
  objective: string;
  measure: string;
  success_criteria: string;
  status: "TODO" | "DONE";
}

export interface ExecutionPlanSummary {
  id: string;
  experiment_id: string;
  opportunity_scan_id: string;
  keyword: string;
  title: string;
  steps: ExecutionPlanStep[];
  created_at: string;
  updated_at: string;
}

export interface ProductionPackContent {
  status: string;
  concept: string;
  hooks: string[];
  title: string;
  script: string[];
  visualPrompt: string;
  description: string;
  cta: string;
  cluster?: {
    title: string;
    keywords: string[];
    variants: Array<{
      keyword: string;
      title: string;
      hook: string;
      angle: string;
    }>;
    sourceExperimentId: string | null;
  };
  factory?: {
    selectedTitle: string;
    selectedHook: string;
    checklist: Array<{
      label: string;
      done: boolean;
    }>;
    montagePlan: string[];
    voicePrompt: string;
    assets: ProductionAsset[];
    updatedAt: string;
  };
}

export interface ProductionAsset {
  scene: string;
  storyboard: string;
  visualPrompt: string;
  voicePrompt: string;
  screenText: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
}

export type LlmProvider = "openai" | "openrouter" | "groq" | "local" | "fallback";

export interface ProductionDraftSummary {
  id: string;
  opportunity_scan_id: string;
  experiment_id: string | null;
  keyword: string;
  title: string;
  status: "DRAFT" | "READY" | "USED";
  content: ProductionPackContent;
  created_at: string;
  updated_at: string;
}

interface ListScansResponse {
  scans: ScanSummary[];
}

interface CreateScanResponse {
  scan: ScanSummary;
}

interface ListScanVideosResponse {
  videos: ScanVideoSummary[];
}

interface RunScoutWorkerResponse {
  status: "no_job" | "completed" | "failed";
  job_id: string | null;
  scan_id: string | null;
  error_code: string | null;
  error_message: string | null;
}

interface ListOpportunitiesResponse {
  opportunities: OpportunitySummary[];
}

export interface RunEdgeScoutResponse {
  scan: ScanSummary;
  videos: ScanVideoSummary[];
  competitor_data?: CompetitorDataSummary[];
  analysis: ScanAnalysis;
  opportunity: Omit<OpportunitySummary, "id" | "created_at" | "updated_at">;
}

export interface EdgeScoutLedgerResponse {
  opportunities: OpportunitySummary[];
  scans: ScanSummary[];
  videos_by_scan: Record<string, ScanVideoSummary[]>;
  competitor_data_by_scan?: Record<string, CompetitorDataSummary[]>;
}

interface EdgeExperimentsResponse {
  experiments: ExecutionExperimentSummary[];
}

export interface DecisionEventSummary {
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
}

interface EdgeDecisionEventsResponse {
  events: DecisionEventSummary[];
}

interface EdgeExecutionPlansResponse {
  plans: ExecutionPlanSummary[];
}

interface UpdateEdgeExecutionPlanStepResponse {
  plan: ExecutionPlanSummary;
}

interface CreateEdgeExperimentResponse {
  experiment: ExecutionExperimentSummary;
}

interface UpdateEdgeExperimentResponse {
  experiment: ExecutionExperimentSummary;
}

interface EdgeProductionDraftsResponse {
  drafts: ProductionDraftSummary[];
}

interface CreateEdgeProductionDraftResponse {
  draft: ProductionDraftSummary;
}

interface UpdateEdgeProductionDraftResponse {
  draft: ProductionDraftSummary;
}

export interface EdgeLlmStatusSummary {
  provider: LlmProvider;
  label: string;
  description: string;
  enabled: boolean;
  default_provider: boolean;
  configured: boolean;
  model: string;
  base_url: string;
  base_url_configured: boolean;
  estimated_cost_per_run_usd: number;
  input_per_million_usd: number;
  output_per_million_usd: number;
  sort_order: number;
  message: string;
}

interface EdgeLlmStatusResponse {
  providers: EdgeLlmStatusSummary[];
}

export interface UpdateEdgeLlmProviderSettingsPayload {
  provider: LlmProvider;
  label: string;
  description: string;
  enabled: boolean;
  defaultProvider: boolean;
  baseUrl: string;
  model: string;
  estimatedCostPerRunUsd: number;
  inputPerMillionUsd: number;
  outputPerMillionUsd: number;
}

export interface TestEdgeLlmProviderResponse {
  provider: LlmProvider;
  ok: boolean;
  configured: boolean;
  latency_ms: number;
  model: string;
  base_url_configured: boolean;
  message: string;
}

export interface EdgeLlmUsageEvent {
  id: string;
  draft_id: string | null;
  scene: string;
  provider: LlmProvider;
  model: string;
  source: "llm" | "fallback";
  status: "success" | "fallback" | "error";
  estimated_input_tokens: number;
  estimated_output_tokens: number;
  estimated_cost_usd: number;
  warning: string | null;
  created_at: string;
}

export interface EdgeLlmBudgetSettings {
  dailyLimitUsd: number;
  monthlyLimitUsd: number;
  enforceLimits: boolean;
}

export interface EdgeLlmUsageResponse {
  summary: {
    total_calls: number;
    today_calls: number;
    total_estimated_cost_usd: number;
    today_estimated_cost_usd: number;
  };
  budget: {
    settings: EdgeLlmBudgetSettings;
    todayCostUsd: number;
    monthCostUsd: number;
  };
  events: EdgeLlmUsageEvent[];
  warning?: string;
}

export interface UpdateEdgeLlmBudgetSettingsResponse {
  budget: EdgeLlmUsageResponse["budget"];
}

export interface RegenerateEdgeProductionAssetResponse {
  asset: ProductionAsset;
  source: "llm" | "fallback";
  provider?: LlmProvider;
  model?: string;
  warning?: string;
}

const configuredScoutFunctionUrl = import.meta.env.VITE_SCOUT_FUNCTION_URL?.trim();
const configuredSupabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const defaultSupabaseUrl = "https://uscmdnzbwvsjrocemset.supabase.co";

export const SCOUT_FUNCTION_URL =
  configuredScoutFunctionUrl ||
  `${(configuredSupabaseUrl || defaultSupabaseUrl).replace(/\/$/, "")}/functions/v1/run-scout`;

export function listScans() {
  return getJson<ListScansResponse>("/api/v1/scout/scans");
}

export function createScan(keyword: string) {
  return postJson<{ keyword: string }, CreateScanResponse>("/api/v1/scout/scans", {
    keyword,
  });
}

export function listScanVideos(scanId: string) {
  return getJson<ListScanVideosResponse>(`/api/v1/scout/scans/${scanId}/videos`);
}

export function getScanAnalysis(scanId: string) {
  return getJson<ScanAnalysis>(`/api/v1/scout/scans/${scanId}/analysis`);
}

export function listOpportunities() {
  return getJson<ListOpportunitiesResponse>("/api/v1/scout/opportunities");
}

export function runScoutWorkerOnce() {
  return postJson<Record<string, never>, RunScoutWorkerResponse>(
    "/api/v1/scout/worker/run-once",
    {},
  );
}

export async function runEdgeScout(keyword: string) {
  const response = await fetch(SCOUT_FUNCTION_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ keyword }),
  });

  if (!response.ok) {
    let message = `La fonction Scout a repondu avec le statut ${response.status}.`;

    try {
      const payload = (await response.json()) as { message?: string };
      message = payload.message || message;
    } catch {
      // Keep the status-based message when the Edge Function does not return JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<RunEdgeScoutResponse>;
}

export async function listEdgeScoutLedger() {
  const response = await fetch(`${SCOUT_FUNCTION_URL}?limit=20`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    let message = `La fonction Scout a repondu avec le statut ${response.status}.`;

    try {
      const payload = (await response.json()) as { message?: string };
      message = payload.message || message;
    } catch {
      // Keep the status-based message when the Edge Function does not return JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<EdgeScoutLedgerResponse>;
}

export async function listEdgeExperiments() {
  const response = await fetch(`${SCOUT_FUNCTION_URL}?view=experiments&limit=20`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    let message = `La fonction Scout a repondu avec le statut ${response.status}.`;

    try {
      const payload = (await response.json()) as { message?: string };
      message = payload.message || message;
    } catch {
      // Keep the status-based message when the Edge Function does not return JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<EdgeExperimentsResponse>;
}

export async function listEdgeDecisionEvents() {
  const response = await fetch(`${SCOUT_FUNCTION_URL}?view=decision-events&limit=50`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    let message = `La fonction Scout a repondu avec le statut ${response.status}.`;

    try {
      const payload = (await response.json()) as { message?: string };
      message = payload.message || message;
    } catch {
      // Keep the status-based message when the Edge Function does not return JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<EdgeDecisionEventsResponse>;
}

export async function listEdgeExecutionPlans() {
  const response = await fetch(`${SCOUT_FUNCTION_URL}?view=execution-plans&limit=50`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    let message = `La fonction Scout a repondu avec le statut ${response.status}.`;

    try {
      const payload = (await response.json()) as { message?: string };
      message = payload.message || message;
    } catch {
      // Keep the status-based message when the Edge Function does not return JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<EdgeExecutionPlansResponse>;
}

export async function updateEdgeExecutionPlanStep(payload: {
  plan_id: string;
  step_id: ExecutionPlanStep["id"];
  status: ExecutionPlanStep["status"];
}) {
  const response = await fetch(SCOUT_FUNCTION_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "update-execution-plan-step",
      ...payload,
    }),
  });

  if (!response.ok) {
    let message = `La fonction Scout a repondu avec le statut ${response.status}.`;

    try {
      const payload = (await response.json()) as { message?: string };
      message = payload.message || message;
    } catch {
      // Keep the status-based message when the Edge Function does not return JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<UpdateEdgeExecutionPlanStepResponse>;
}

export async function createEdgeExperiment(payload: {
  scan_id: string;
  decision_label: "ATTAQUER" | "TESTER" | "VEILLE";
  priority_score: number;
}) {
  const response = await fetch(SCOUT_FUNCTION_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "create-experiment",
      ...payload,
    }),
  });

  if (!response.ok) {
    let message = `La fonction Scout a repondu avec le statut ${response.status}.`;

    try {
      const errorPayload = (await response.json()) as { message?: string };
      message = errorPayload.message || message;
    } catch {
      // Keep the status-based message when the Edge Function does not return JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<CreateEdgeExperimentResponse>;
}

export async function createEdgeClusterExperiment(payload: {
  scan_id: string;
  keyword: string;
  title: string;
  decision_label: "ATTAQUER" | "TESTER" | "VEILLE";
  priority_score: number;
  next_action: string;
  success_criteria: string;
  evidence_video_ids: string[];
}) {
  const response = await fetch(SCOUT_FUNCTION_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "create-cluster-experiment",
      ...payload,
    }),
  });

  if (!response.ok) {
    let message = `La fonction Scout a repondu avec le statut ${response.status}.`;

    try {
      const errorPayload = (await response.json()) as { message?: string };
      message = errorPayload.message || message;
    } catch {
      // Keep the status-based message when the Edge Function does not return JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<CreateEdgeExperimentResponse>;
}

export async function updateEdgeExperiment(payload: {
  experiment_id: string;
  status: ExecutionExperimentSummary["status"];
  outcome: ExecutionExperimentSummary["outcome"];
  result_note: string;
}) {
  const response = await fetch(SCOUT_FUNCTION_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "update-experiment",
      ...payload,
    }),
  });

  if (!response.ok) {
    let message = `La fonction Scout a repondu avec le statut ${response.status}.`;

    try {
      const errorPayload = (await response.json()) as { message?: string };
      message = errorPayload.message || message;
    } catch {
      // Keep the status-based message when the Edge Function does not return JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<UpdateEdgeExperimentResponse>;
}

export async function listEdgeProductionDrafts() {
  const response = await fetch(`${SCOUT_FUNCTION_URL}?view=drafts&limit=20`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    let message = `La fonction Scout a repondu avec le statut ${response.status}.`;

    try {
      const payload = (await response.json()) as { message?: string };
      message = payload.message || message;
    } catch {
      // Keep the status-based message when the Edge Function does not return JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<EdgeProductionDraftsResponse>;
}

export async function createEdgeProductionDraft(payload: {
  opportunity_scan_id: string;
  experiment_id: string | null;
  keyword: string;
  title: string;
  status: ProductionDraftSummary["status"];
  content: ProductionPackContent;
}) {
  const response = await fetch(SCOUT_FUNCTION_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "create-draft",
      ...payload,
    }),
  });

  if (!response.ok) {
    let message = `La fonction Scout a repondu avec le statut ${response.status}.`;

    try {
      const errorPayload = (await response.json()) as { message?: string };
      message = errorPayload.message || message;
    } catch {
      // Keep the status-based message when the Edge Function does not return JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<CreateEdgeProductionDraftResponse>;
}

export async function updateEdgeProductionDraftStatus(payload: {
  draft_id: string;
  status: ProductionDraftSummary["status"];
}) {
  return updateEdgeProductionDraft(payload);
}

export async function updateEdgeProductionDraft(payload: {
  draft_id: string;
  status?: ProductionDraftSummary["status"];
  title?: string;
  content?: ProductionPackContent;
}) {
  const response = await fetch(SCOUT_FUNCTION_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "update-draft",
      ...payload,
    }),
  });

  if (!response.ok) {
    let message = `La fonction Scout a repondu avec le statut ${response.status}.`;

    try {
      const errorPayload = (await response.json()) as { message?: string };
      message = errorPayload.message || message;
    } catch {
      // Keep the status-based message when the Edge Function does not return JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<UpdateEdgeProductionDraftResponse>;
}

export async function regenerateEdgeProductionAsset(payload: {
  draft_id: string;
  scene: string;
  asset: ProductionAsset;
  provider?: LlmProvider;
}) {
  const response = await fetch(SCOUT_FUNCTION_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "regenerate-asset",
      ...payload,
    }),
  });

  if (!response.ok) {
    let message = `La fonction Scout a repondu avec le statut ${response.status}.`;

    try {
      const errorPayload = (await response.json()) as { message?: string };
      message = errorPayload.message || message;
    } catch {
      // Keep the status-based message when the Edge Function does not return JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<RegenerateEdgeProductionAssetResponse>;
}

export async function listEdgeLlmStatus() {
  const response = await fetch(`${SCOUT_FUNCTION_URL}?view=llm-status`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    let message = `La fonction Scout a repondu avec le statut ${response.status}.`;

    try {
      const errorPayload = (await response.json()) as { message?: string };
      message = errorPayload.message || message;
    } catch {
      // Keep the status-based message when the Edge Function does not return JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<EdgeLlmStatusResponse>;
}

export async function listEdgeLlmUsage() {
  const response = await fetch(`${SCOUT_FUNCTION_URL}?view=llm-usage&limit=25`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    let message = `La fonction Scout a repondu avec le statut ${response.status}.`;

    try {
      const errorPayload = (await response.json()) as { message?: string };
      message = errorPayload.message || message;
    } catch {
      // Keep the status-based message when the Edge Function does not return JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<EdgeLlmUsageResponse>;
}

export async function updateEdgeLlmBudgetSettings(settings: EdgeLlmBudgetSettings) {
  const response = await fetch(SCOUT_FUNCTION_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "update-llm-budget-settings",
      ...settings,
    }),
  });

  if (!response.ok) {
    let message = `La fonction Scout a repondu avec le statut ${response.status}.`;

    try {
      const errorPayload = (await response.json()) as { message?: string };
      message = errorPayload.message || message;
    } catch {
      // Keep the status-based message when the Edge Function does not return JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<UpdateEdgeLlmBudgetSettingsResponse>;
}

export async function updateEdgeLlmProviderSettings(settings: UpdateEdgeLlmProviderSettingsPayload) {
  const response = await fetch(SCOUT_FUNCTION_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "update-llm-provider-settings",
      ...settings,
    }),
  });

  if (!response.ok) {
    let message = `La fonction Scout a repondu avec le statut ${response.status}.`;

    try {
      const errorPayload = (await response.json()) as { message?: string };
      message = errorPayload.message || message;
    } catch {
      // Keep the status-based message when the Edge Function does not return JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<EdgeLlmStatusResponse>;
}

export async function testEdgeLlmProvider(provider: LlmProvider) {
  const response = await fetch(SCOUT_FUNCTION_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "test-llm-provider",
      provider,
    }),
  });

  if (!response.ok) {
    let message = `La fonction Scout a repondu avec le statut ${response.status}.`;

    try {
      const errorPayload = (await response.json()) as { message?: string };
      message = errorPayload.message || message;
    } catch {
      // Keep the status-based message when the Edge Function does not return JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<TestEdgeLlmProviderResponse>;
}
