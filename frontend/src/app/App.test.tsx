import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  );
}

describe("App", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("affiche le cockpit agents et les résultats connectés", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((input: RequestInfo | URL) => {
        const url = String(input);

        if (url.endsWith("/api/v1/status")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                name: "IA Agent Tool API",
                environment: "test",
                status: "ok",
                version: "0.1.0",
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              },
            ),
          );
        }

        if (url.endsWith("/api/v1/scout/scans")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                scans: [
                  {
                    id: "11111111-1111-1111-1111-111111111111",
                    platform: "youtube",
                    keyword: "mini drama ia",
                    status: "completed",
                    error_code: null,
                    error_message: null,
                    created_at: "2026-07-05T08:00:00Z",
                    updated_at: "2026-07-05T08:00:00Z",
                  },
                ],
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              },
            ),
          );
        }

        if (
          url.endsWith(
            "/api/v1/scout/scans/11111111-1111-1111-1111-111111111111/videos",
          )
        ) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                videos: [
                  {
                    rank: 1,
                    video_id: "L48-pHflCnk",
                    title: "I Made a Netflix-Level Drama Series in 24 HOURS Using ONLY AI!",
                    channel_id: "UCq0ZFvhu1GQvL4r8pM3sGPw",
                    channel_title: "AI Creator",
                    view_count: 19863,
                    like_count: 1200,
                    comment_count: 45,
                    published_at: "2026-07-01T12:00:00Z",
                    thumbnail_url: "https://img.youtube.com/vi/L48-pHflCnk/hqdefault.jpg",
                  },
                ],
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              },
            ),
          );
        }

        if (
          url.endsWith(
            "/api/v1/scout/scans/11111111-1111-1111-1111-111111111111/analysis",
          )
        ) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                model_version: "business-heuristic-v0.1",
                opportunity_title: "Mini-drama IA vertical court",
                verdict: "GO",
                scores: {
                  money_score: 82,
                  attack_score: 71,
                  speed_cash_score: 68,
                  quality_gap_score: 77,
                  weak_competitor_score: 74,
                  upload_pressure_score: 63,
                  ecosystem_score: 69,
                  confidence: 72,
                },
                summary: "19863 vues moyennes sur 1 vidéos, 1 chaînes observées, 1 quality gaps.",
                evidence_video_ids: ["L48-pHflCnk"],
                competitor_channels: ["AI Creator"],
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              },
            ),
          );
        }

        if (url.endsWith("/api/v1/scout/opportunities")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                opportunities: [
                  {
                    id: "33333333-3333-3333-3333-333333333333",
                    scan_id: "11111111-1111-1111-1111-111111111111",
                    keyword: "mini drama ia",
                    title: "Mini-drama IA vertical court",
                    verdict: "GO",
                    model_version: "business-heuristic-v0.1",
                    summary: "19863 vues moyennes sur 1 vidéos, 1 chaînes observées, 1 quality gaps.",
                    scores: {
                      money_score: 82,
                      attack_score: 71,
                      speed_cash_score: 68,
                      quality_gap_score: 77,
                      weak_competitor_score: 74,
                      upload_pressure_score: 63,
                      ecosystem_score: 69,
                      confidence: 72,
                    },
                    evidence_video_ids: ["L48-pHflCnk"],
                    competitor_channels: ["AI Creator"],
                    execution_plan: {
                      angle: "Série verticale IA sur tension dramatique courte",
                      first_test: "Lancer 5 épisodes courts autour de mini drama ia sur 7 jours",
                      criteria_go: "Un épisode dépasse le benchmark de vues initial en 48h",
                      notes: "Accélérer le hook, garder des formats courts, pousser le volume d'itérations.",
                    },
                    source: "scout",
                    created_at: "2026-07-05T09:00:00Z",
                    updated_at: "2026-07-05T09:00:00Z",
                  },
                ],
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              },
            ),
          );
        }

        return Promise.reject(new Error(`Unhandled fetch for ${url}`));
      }),
    );

    renderApp();

    expect(screen.getByRole("heading", { name: "Centre de commande" })).toBeInTheDocument();
    expect(await screen.findByText("API réelle · test")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "START REAL SCAN" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "SCAN 10" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "SCAN 50" })).toBeInTheDocument();
    expect(screen.getByText("File Scout contrôlée")).toBeInTheDocument();
    expect(screen.getByLabelText("Mots-clés additionnels")).toBeInTheDocument();
    expect(screen.getByText(/Quota estimé:/)).toBeInTheDocument();
    expect((await screen.findAllByRole("heading", { name: "mini drama ia" })).length).toBeGreaterThan(0);
    expect(
      await screen.findByText("I Made a Netflix-Level Drama Series in 24 HOURS Using ONLY AI!", {
        selector: ".video-result__title",
      }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Décision/ }));

    expect(screen.getByRole("heading", { name: "Scoring business" })).toBeInTheDocument();
    expect(
      await screen.findByText("business-heuristic-v0.1", { selector: ".model-version" }),
    ).toBeInTheDocument();
    expect(screen.getByText("money_score")).toBeInTheDocument();
    expect(screen.getByText("weak_competitor_score")).toBeInTheDocument();
    expect(screen.getByText("Intel concurrents")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Qui attaquer / copier" })).toBeInTheDocument();
    expect(screen.getByText("CIBLE FAIBLE")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Classement exploitable" })).toBeInTheDocument();
    expect(screen.getByText("Fiche action")).toBeInTheDocument();
    expect(screen.getByText("Décision TESTER · score 75/100")).toBeInTheDocument();
    expect(screen.getByText("Prochaine action")).toBeInTheDocument();
    expect(
      screen.getAllByText("Lancer 5 épisodes courts autour de mini drama ia sur 7 jours").length,
    ).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Créer test" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Optimizer/ }));
    expect(screen.getByRole("heading", { name: "File de tests" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Factory/ }));
    expect(screen.getByRole("heading", { name: "Pack production" })).toBeInTheDocument();
    expect(screen.getByText("3 hooks")).toBeInTheDocument();
    expect(screen.getByText("Script 30-45s")).toBeInTheDocument();
    expect(screen.getByText("Scans visibles")).toBeInTheDocument();
  });

  it("lance le Scout Edge quand l'API FastAPI n'est pas joignable", async () => {
    let experiments: Array<{
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
    }> = [];
    let decisionEvents: Array<{
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
    }> = [];
    let drafts: Array<{
      id: string;
      opportunity_scan_id: string;
      experiment_id: string | null;
      keyword: string;
      title: string;
      status: "DRAFT" | "READY" | "USED";
      content: {
        status: string;
        concept: string;
        hooks: string[];
        title: string;
        script: string[];
        visualPrompt: string;
        description: string;
        cta: string;
        factory?: {
          selectedTitle: string;
          selectedHook: string;
          checklist: Array<{ label: string; done: boolean }>;
          montagePlan: string[];
          voicePrompt: string;
          assets?: Array<{
            scene: string;
            storyboard: string;
            visualPrompt: string;
            voicePrompt: string;
            screenText: string;
            status: "TODO" | "IN_PROGRESS" | "DONE";
          }>;
          updatedAt: string;
        };
      };
      created_at: string;
      updated_at: string;
    }> = [];

    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes("/functions/v1/run-scout")) {
        if (init?.method === "GET") {
          if (url.includes("view=llm-status")) {
            return Promise.resolve(
              new Response(JSON.stringify({
                providers: [
                  {
                    provider: "fallback",
                    label: "Fallback",
                    description: "Aucun coût API, génération déterministe.",
                    enabled: true,
                    default_provider: true,
                    configured: true,
                    model: "deterministic",
                    base_url: "",
                    base_url_configured: true,
                    estimated_cost_per_run_usd: 0,
                    input_per_million_usd: 0,
                    output_per_million_usd: 0,
                    sort_order: 50,
                    message: "Disponible sans coût API.",
                  },
                  {
                    provider: "local",
                    label: "Local",
                    description: "LLM PC via URL publique/tunnel compatible OpenAI.",
                    enabled: true,
                    default_provider: false,
                    configured: false,
                    model: "llama3.1:8b",
                    base_url: "",
                    base_url_configured: false,
                    estimated_cost_per_run_usd: 0,
                    input_per_million_usd: 0,
                    output_per_million_usd: 0,
                    sort_order: 40,
                    message: "LOCAL_LLM_BASE_URL/local_llm_base_url absent.",
                  },
                ],
              }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              }),
            );
          }

          if (url.includes("view=llm-usage")) {
            return Promise.resolve(
              new Response(JSON.stringify({
                summary: {
                  total_calls: 2,
                  today_calls: 1,
                  total_estimated_cost_usd: 0.012,
                  today_estimated_cost_usd: 0.006,
                },
                budget: {
                  settings: {
                    dailyLimitUsd: 0.25,
                    monthlyLimitUsd: 5,
                    enforceLimits: true,
                  },
                  todayCostUsd: 0.006,
                  monthCostUsd: 0.012,
                },
                events: [],
              }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              }),
            );
          }

          if (url.includes("view=experiments")) {
            return Promise.resolve(
              new Response(JSON.stringify({ experiments }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              }),
            );
          }

          if (url.includes("view=decision-events")) {
            return Promise.resolve(
              new Response(JSON.stringify({ events: decisionEvents }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              }),
            );
          }

          if (url.includes("view=drafts")) {
            return Promise.resolve(
              new Response(JSON.stringify({ drafts }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              }),
            );
          }

          return Promise.resolve(
            new Response(
              JSON.stringify({
                opportunities: [
                  {
                    id: "55555555-5555-5555-5555-555555555555",
                    scan_id: "55555555-5555-5555-5555-555555555551",
                    keyword: "persisted edge niche",
                    title: "Chaîne faceless stories automatisable",
                    verdict: "WATCH",
                    model_version: "edge-business-heuristic-v0.3",
                    summary: "50000 vues moyennes sur 1 vidéos, 1 chaînes observées, 1 quality gaps.",
                    scores: {
                      money_score: 90,
                      attack_score: 80,
                      speed_cash_score: 60,
                      quality_gap_score: 70,
                      weak_competitor_score: 68,
                      upload_pressure_score: 58,
                      ecosystem_score: 72,
                      confidence: 82,
                    },
                    evidence_video_ids: ["persisted-video-1"],
                    competitor_channels: ["Persisted Creator"],
                    execution_plan: {
                      angle: "Observer et resserrer: Chaîne faceless stories automatisable",
                      first_test: "Tester 3 hooks et 2 formulations de persisted edge niche",
                      criteria_go: "Le score money et le score attack montent au-dessus de 70",
                      notes: "Historique Edge persistant.",
                    },
                    source: "edge-run-scout",
                    created_at: "2026-07-08T13:20:00Z",
                    updated_at: "2026-07-08T13:20:10Z",
                  },
                ],
                scans: [
                  {
                    id: "55555555-5555-5555-5555-555555555551",
                    platform: "youtube",
                    keyword: "persisted edge niche",
                    status: "completed",
                    error_code: null,
                    error_message: null,
                    created_at: "2026-07-08T13:20:00Z",
                    updated_at: "2026-07-08T13:20:10Z",
                  },
                ],
                videos_by_scan: {
                  "55555555-5555-5555-5555-555555555551": [
                    {
                      rank: 1,
                      video_id: "persisted-video-1",
                      title: "Persisted Edge Scout Result",
                      channel_id: "persisted-channel-1",
                      channel_title: "Persisted Creator",
                      view_count: 50000,
                      like_count: 500,
                      comment_count: 20,
                      published_at: "2026-07-01T12:00:00Z",
                      thumbnail_url: "https://img.youtube.com/vi/persisted-video-1/hqdefault.jpg",
                    },
                  ],
                },
                competitor_data_by_scan: {
                  "55555555-5555-5555-5555-555555555551": [
                    {
                      scan_id: "55555555-5555-5555-5555-555555555551",
                      channel_id: "persisted-channel-1",
                      channel_title: "Persisted Creator",
                      subscriber_count: 1200,
                      channel_video_count: 18,
                      channel_view_count: 240000,
                      observed_video_count: 1,
                      average_views: 50000,
                      total_views: 50000,
                      best_video_id: "persisted-video-1",
                      best_video_title: "Persisted Edge Scout Result",
                      weak_signals: 2,
                      attack_tag: "WEAK_TARGET",
                      weakness_summary: "2 videos faibles sur 1, moyenne 50 000 vues.",
                      created_at: "2026-07-08T13:20:00Z",
                      updated_at: "2026-07-08T13:20:10Z",
                    },
                  ],
                },
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              },
            ),
          );
        }

        const body = JSON.parse(String(init?.body ?? "{}")) as { keyword?: string };

        if ((body as { action?: string }).action === "create-experiment") {
          const scanId = String((body as { scan_id?: string }).scan_id);
          const experiment = {
            id: "experiment-ai-music-channel",
            opportunity_scan_id: scanId,
            keyword: "ai music channel",
            title: "Chaîne musicale IA monétisable",
            decision_label: "ATTAQUER" as const,
            priority_score: 91,
            status: "READY" as const,
            outcome: "UNKNOWN" as const,
            next_action: "Publier 7 morceaux courts autour de ai music channel avec visuels cohérents",
            success_criteria: "Un morceau dépasse le benchmark de vues initial en 72h",
            result_note: "",
            evidence_video_ids: ["edge-video-1"],
            created_at: "2026-07-08T13:35:00Z",
            updated_at: "2026-07-08T13:35:00Z",
          };

          experiments = [experiment];
          decisionEvents = [
            {
              id: "decision-event-created",
              experiment_id: experiment.id,
              opportunity_scan_id: experiment.opportunity_scan_id,
              keyword: experiment.keyword,
              event_type: "CREATED",
              previous_status: null,
              next_status: "READY",
              previous_outcome: null,
              next_outcome: "UNKNOWN",
              decision_label: experiment.decision_label,
              priority_score: experiment.priority_score,
              note: "Test cree depuis une opportunite Scout.",
              created_at: "2026-07-08T13:35:00Z",
            },
            ...decisionEvents,
          ];

          return Promise.resolve(
            new Response(JSON.stringify({ experiment }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }

        if ((body as { action?: string }).action === "update-experiment") {
          const patch = body as {
            experiment_id: string;
            status: "READY" | "RUNNING" | "DONE" | "PAUSED";
            outcome: "UNKNOWN" | "PASSED" | "FAILED";
            result_note: string;
          };
          const previousExperiment = experiments[0]!;
          const experiment = {
            ...previousExperiment,
            status: patch.status,
            outcome: patch.outcome,
            result_note: patch.result_note,
            updated_at: "2026-07-08T13:40:00Z",
          };

          experiments = [experiment];
          decisionEvents = [
            {
              id: `decision-event-${patch.status}-${patch.outcome}`,
              experiment_id: experiment.id,
              opportunity_scan_id: experiment.opportunity_scan_id,
              keyword: experiment.keyword,
              event_type: patch.outcome === "PASSED" || patch.outcome === "FAILED"
                ? "OUTCOME_RECORDED"
                : "STATUS_CHANGED",
              previous_status: previousExperiment?.status ?? null,
              next_status: patch.status,
              previous_outcome: previousExperiment?.outcome ?? null,
              next_outcome: patch.outcome,
              decision_label: experiment.decision_label,
              priority_score: experiment.priority_score,
              note: patch.result_note,
              created_at: "2026-07-08T13:40:00Z",
            },
            ...decisionEvents,
          ];

          return Promise.resolve(
            new Response(JSON.stringify({ experiment }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }

        if ((body as { action?: string }).action === "create-draft") {
          const payload = body as {
            opportunity_scan_id: string;
            experiment_id: string | null;
            keyword: string;
            title: string;
            status: "DRAFT" | "READY" | "USED";
            content: {
              status: string;
              concept: string;
              hooks: string[];
              title: string;
              script: string[];
              visualPrompt: string;
              description: string;
              cta: string;
            };
          };
          const draft = {
            id: "draft-ai-music-channel",
            opportunity_scan_id: payload.opportunity_scan_id,
            experiment_id: payload.experiment_id,
            keyword: payload.keyword,
            title: payload.title,
            status: payload.status,
            content: {
              ...payload.content,
              factory: {
                selectedTitle: payload.title,
                selectedHook: payload.content.hooks[0],
                checklist: [],
                montagePlan: [],
                voicePrompt: "Legacy voice prompt without assets.",
                updatedAt: "2026-07-08T13:45:00Z",
              },
            },
            created_at: "2026-07-08T13:45:00Z",
            updated_at: "2026-07-08T13:45:00Z",
          };

          drafts = [draft];

          return Promise.resolve(
            new Response(JSON.stringify({ draft }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }

        if ((body as { action?: string }).action === "update-draft") {
          const patch = body as {
            draft_id: string;
            status?: "DRAFT" | "READY" | "USED";
            title?: string;
            content?: {
              status: string;
              concept: string;
              hooks: string[];
              title: string;
              script: string[];
              visualPrompt: string;
              description: string;
              cta: string;
              factory?: {
                selectedTitle: string;
                selectedHook: string;
                checklist: Array<{ label: string; done: boolean }>;
                montagePlan: string[];
                voicePrompt: string;
                assets: Array<{
                  scene: string;
                  storyboard: string;
                  visualPrompt: string;
                  voicePrompt: string;
                  screenText: string;
                  status: "TODO" | "IN_PROGRESS" | "DONE";
                }>;
                updatedAt: string;
              };
            };
          };
          const draft = {
            ...drafts[0],
            status: patch.status ?? drafts[0].status,
            title: patch.title ?? drafts[0].title,
            content: patch.content ?? drafts[0].content,
            updated_at: "2026-07-08T13:50:00Z",
          };

          drafts = [draft];

          return Promise.resolve(
            new Response(JSON.stringify({ draft }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }

        if ((body as { action?: string }).action === "regenerate-asset") {
          const payload = body as {
            scene: string;
            asset: {
              status: "TODO" | "IN_PROGRESS" | "DONE";
            };
          };
          const asset = {
            scene: payload.scene,
            storyboard: `Storyboard regenere pour ${payload.scene}`,
            screenText: "Signal marche regenere",
            visualPrompt: "Prompt visuel regenere depuis Edge Function",
            voicePrompt: "Prompt voix regenere depuis Edge Function",
            status: payload.asset.status,
          };

          return Promise.resolve(
            new Response(JSON.stringify({ asset, source: "llm" }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }

        if ((body as { action?: string }).action === "update-llm-budget-settings") {
          return Promise.resolve(
            new Response(JSON.stringify({
              budget: {
                settings: {
                  dailyLimitUsd: Number((body as { dailyLimitUsd: number }).dailyLimitUsd),
                  monthlyLimitUsd: Number((body as { monthlyLimitUsd: number }).monthlyLimitUsd),
                  enforceLimits: Boolean((body as { enforceLimits: boolean }).enforceLimits),
                },
                todayCostUsd: 0.006,
                monthCostUsd: 0.012,
              },
            }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }

        if ((body as { action?: string }).action === "update-llm-provider-settings") {
          return Promise.resolve(
            new Response(JSON.stringify({
              providers: [
                {
                  provider: (body as { provider: string }).provider,
                  label: "Fallback",
                  description: "Aucun coût API, génération déterministe.",
                  enabled: true,
                  default_provider: Boolean((body as { defaultProvider: boolean }).defaultProvider),
                  configured: true,
                  model: String((body as { model: string }).model),
                  base_url: String((body as { baseUrl: string }).baseUrl),
                  base_url_configured: true,
                  estimated_cost_per_run_usd: Number((body as { estimatedCostPerRunUsd: number }).estimatedCostPerRunUsd),
                  input_per_million_usd: Number((body as { inputPerMillionUsd: number }).inputPerMillionUsd),
                  output_per_million_usd: Number((body as { outputPerMillionUsd: number }).outputPerMillionUsd),
                  sort_order: 50,
                  message: "Disponible sans coût API.",
                },
              ],
            }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }

        if ((body as { action?: string }).action === "test-llm-provider") {
          return Promise.resolve(
            new Response(JSON.stringify({
              provider: (body as { provider: string }).provider,
              ok: true,
              configured: true,
              latency_ms: 42,
              model: "deterministic",
              base_url_configured: true,
              message: "Fallback deterministe disponible sans appel externe.",
            }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }

        const keyword = body.keyword ?? "ai music channel";
        const scanId = `scan-${keyword.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;

        return Promise.resolve(
          new Response(
            JSON.stringify({
              scan: {
                id: scanId,
                platform: "youtube",
                keyword,
                status: "completed",
                error_code: null,
                error_message: null,
                created_at: "2026-07-08T13:30:00Z",
                updated_at: "2026-07-08T13:30:10Z",
              },
              videos: [
                {
                  rank: 1,
                  video_id: "edge-video-1",
                  title: "How To Start an AI Music YouTube Channel",
                  channel_id: "edge-channel-1",
                  channel_title: "Edge Creator",
                  view_count: 210278,
                  like_count: 4200,
                  comment_count: 310,
                  published_at: "2026-07-01T12:00:00Z",
                  thumbnail_url: "https://img.youtube.com/vi/edge-video-1/hqdefault.jpg",
                },
              ],
              competitor_data: [
                {
                  scan_id: scanId,
                  channel_id: "edge-channel-1",
                  channel_title: "Edge Creator",
                  subscriber_count: 8200,
                  channel_video_count: 44,
                  channel_view_count: 820000,
                  observed_video_count: 1,
                  average_views: 210278,
                  total_views: 210278,
                  best_video_id: "edge-video-1",
                  best_video_title: "How To Start an AI Music YouTube Channel",
                  weak_signals: 0,
                  attack_tag: "BENCHMARK",
                  weakness_summary: "Benchmark utile: moyenne 210 278 vues sur 1 video.",
                },
              ],
              analysis: {
                model_version: "edge-business-heuristic-v0.3",
                opportunity_title: "Chaîne musicale IA monétisable",
                verdict: "GO",
                scores: {
                  money_score: 100,
                  attack_score: 96,
                  speed_cash_score: 65,
                  quality_gap_score: 91,
                  weak_competitor_score: 88,
                  upload_pressure_score: 67,
                  ecosystem_score: 73,
                  confidence: 95,
                },
                summary: "210278 vues moyennes sur 1 vidéos, 1 chaînes observées, 0 quality gaps.",
                evidence_video_ids: ["edge-video-1"],
                competitor_channels: ["Edge Creator"],
              },
              opportunity: {
                scan_id: scanId,
                keyword,
                title: "Chaîne musicale IA monétisable",
                verdict: "GO",
                model_version: "edge-business-heuristic-v0.3",
                summary: "210278 vues moyennes sur 1 vidéos, 1 chaînes observées, 0 quality gaps.",
                scores: {
                  money_score: 100,
                  attack_score: 96,
                  speed_cash_score: 65,
                  quality_gap_score: 91,
                  weak_competitor_score: 88,
                  upload_pressure_score: 67,
                  ecosystem_score: 73,
                  confidence: 95,
                },
                evidence_video_ids: ["edge-video-1"],
                competitor_channels: ["Edge Creator"],
                execution_plan: {
                  angle: "Chaîne musicale IA faceless orientée playlists et émotions",
                  first_test: `Publier 7 morceaux courts autour de ${keyword} avec visuels cohérents`,
                  criteria_go: "Un morceau dépasse le benchmark de vues initial en 72h",
                  notes: "Tester style musical, niche émotionnelle, miniature et boucle Shorts.",
                },
                source: "edge-run-scout",
              },
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          ),
        );
      }

      return Promise.reject(new Error("offline"));
    });

    vi.stubGlobal(
      "fetch",
      fetchMock,
    );

    renderApp();

    expect(await screen.findByText("Edge Supabase · scan public")).toBeInTheDocument();
    expect((await screen.findAllByRole("heading", { name: "persisted edge niche" })).length).toBeGreaterThan(0);

    const keywordInput = screen.getByLabelText("Niche / mot-clé de départ");
    fireEvent.change(keywordInput, { target: { value: "ai music channel" } });
    fireEvent.click(screen.getAllByRole("button", { name: "RUN EDGE SCOUT" })[0]);

    expect((await screen.findAllByRole("heading", { name: "ai music channel" })).length).toBeGreaterThan(0);
    expect(
      await screen.findByText("edge-business-heuristic-v0.3", { selector: ".model-version" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Chaîne musicale IA monétisable").length).toBeGreaterThan(0);
    expect(screen.getByText("ATTAQUER · 91")).toBeInTheDocument();
    expect(screen.getByText("Décision ATTAQUER · score 91/100")).toBeInTheDocument();
    expect(screen.getByText("BENCHMARK")).toBeInTheDocument();
    expect(screen.getByText("Benchmark utile: moyenne 210 278 vues sur 1 video.")).toBeInTheDocument();
    expect(screen.getByText("Score enrichi par competitor_data : 0 cibles faibles, 1 benchmarks, 0 à surveiller.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cibles récurrentes" })).toBeInTheDocument();
    expect(screen.getByText("Persisted Creator")).toBeInTheDocument();
    expect(screen.getAllByText("Edge Creator").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Publier 7 morceaux courts autour de ai music channel avec visuels cohérents").length,
    ).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Créer test" }));

    expect(await screen.findByText("READY")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "File de tests" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Démarrer" }));

    expect(await screen.findByText("RUNNING")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Apprentissages" })).toBeInTheDocument();
    expect(screen.getByText("Collecter les résultats de ai music channel")).toBeInTheDocument();
    expect(screen.getByText("Backlog priorisé")).toBeInTheDocument();
    expect(screen.getAllByText("MESURER").length).toBeGreaterThan(0);
    expect(screen.getByText("Apprentissages par niche")).toBeInTheDocument();
    expect(screen.getByText("Historique décisions")).toBeInTheDocument();
    expect(screen.getByText("STATUS_CHANGED")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Note résultat"), {
      target: { value: "Bon signal initial, continuer le test." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Réussi" }));

    expect(await screen.findByRole("heading", { name: "Pack production" })).toBeInTheDocument();
    expect(screen.getByText("J’ai créé une musique IA addictive sur ai music channel")).toBeInTheDocument();
    expect(screen.getByText("Sauvegarde si tu veux la version longue.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sauvegarder draft" }));

    expect(await screen.findByRole("button", { name: "Draft sauvegardé" })).toBeDisabled();
    expect(screen.getByRole("heading", { name: "Drafts production" })).toBeInTheDocument();
    expect(screen.getAllByText("J’ai créé une musique IA addictive sur ai music channel").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Atelier draft" })).toBeInTheDocument();
    expect(screen.getByText("Variantes titres")).toBeInTheDocument();
    expect(screen.getByText("Variantes hooks")).toBeInTheDocument();
    expect(screen.getByText("Checklist production courte")).toBeInTheDocument();
    expect(screen.getByText("Budget IA")).toBeInTheDocument();
    expect(screen.getByText("Historique")).toBeInTheDocument();
    expect(screen.getByText("0.0060 $ aujourd'hui")).toBeInTheDocument();
    expect(screen.getByLabelText("Limite jour IA")).toHaveValue(0.25);
    expect(screen.getByLabelText("Limite mois IA")).toHaveValue(5);
    expect(screen.getByLabelText("Bloquer dépassement budget IA")).toBeChecked();
    expect(screen.getByLabelText("Fournisseur LLM")).toHaveValue("fallback");
    expect(screen.getByText(/Statut: configuré/)).toBeInTheDocument();
    expect(screen.getByLabelText("Modèle fournisseur IA")).toHaveValue("deterministic");
    expect(screen.getByLabelText("Provider actif")).toBeChecked();
    expect(screen.getByLabelText("Provider par défaut")).toBeChecked();
    fireEvent.change(screen.getByLabelText("Coût par run fournisseur IA"), { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: "Sauvegarder provider" }));
    expect(await screen.findByText("Fournisseur IA sauvegardé.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tester provider" }));
    expect(await screen.findByText(/Test provider: OK · 42 ms/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Fournisseur LLM"), { target: { value: "local" } });
    expect(screen.getByText("LLM local")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Preset Ollama" }));
    expect(screen.getByLabelText("Modèle fournisseur IA")).toHaveValue("llama3.1:8b");
    expect(screen.getByLabelText("URL fournisseur IA")).toHaveValue("https://TON-TUNNEL.trycloudflare.com/v1");
    fireEvent.change(screen.getByLabelText("Fournisseur LLM"), { target: { value: "fallback" } });
    fireEvent.change(screen.getByLabelText("Limite jour IA"), { target: { value: "0.5" } });
    fireEvent.click(screen.getByRole("button", { name: "Sauvegarder budget IA" }));
    expect(await screen.findByText("Budget IA serveur sauvegarde.")).toBeInTheDocument();
    expect(screen.getByText("Liaison test")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Factory/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Draft actif" })).toBeDisabled();
    fireEvent.click(screen.getByLabelText("ai music channel: le test qui decide si on attaque"));
    fireEvent.click(screen.getByLabelText("Monter en vertical 9:16 avec sous-titres lisibles."));
    fireEvent.change(screen.getByLabelText("Statut Scene 1"), { target: { value: "IN_PROGRESS" } });
    fireEvent.change(screen.getByLabelText("Texte écran Scene 1"), {
      target: { value: "Hook edite pour test terrain" },
    });
    fireEvent.change(screen.getByLabelText("Prompt visuel Scene 1"), {
      target: { value: "Plan serre vertical avec interface musique IA visible" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sauvegarder factory" }));

    expect(await screen.findByText(/Dernière sauvegarde/)).toBeInTheDocument();
    expect(screen.getByText("Plan montage")).toBeInTheDocument();
    expect(screen.getAllByText("Prompt voix").length).toBeGreaterThan(0);
    expect(screen.getByText("Assets à produire")).toBeInTheDocument();
    expect(screen.getByText("Scene 1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("IN_PROGRESS")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Hook edite pour test terrain")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Plan serre vertical avec interface musique IA visible")).toBeInTheDocument();
    expect(screen.getAllByText("Texte écran").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Regenerer" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Copier asset" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Export asset" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Copier Markdown" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export Markdown" })).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Regenerer" })[0]);

    expect(await screen.findByDisplayValue("Signal marche regenere")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Prompt visuel regenere depuis Edge Function")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Prompt voix regenere depuis Edge Function")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sauvegarder factory" }));

    expect(screen.getByText("Script détaillé")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copier" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exporter TXT" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Marquer USED" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Marquer USED" })).toBeDisabled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Marquer READY" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Marquer READY" })).toBeDisabled();
    });

    fireEvent.click(screen.getByRole("button", { name: /^Scout/ }));

    expect(screen.getByRole("button", { name: "ATTAQUER 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "TESTER 1" })).toBeInTheDocument();
    expect(
      screen.getByText("How To Start an AI Music YouTube Channel", {
        selector: ".video-result__title",
      }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Scout/ }));
    fireEvent.change(screen.getByLabelText("Niche / mot-clé de départ"), {
      target: { value: "ai music channel" },
    });
    fireEvent.click(screen.getByRole("button", { name: "SCAN 10" }));

    await waitFor(() => {
      const postedKeywords = fetchMock.mock.calls
        .filter(([url, init]) => String(url).includes("/functions/v1/run-scout") && init?.method === "POST")
        .map(([, init]) => JSON.parse(String(init?.body ?? "{}")))
        .filter((payload) => !payload.action)
        .map((payload) => payload.keyword)
        .filter(Boolean);

      expect(postedKeywords).toHaveLength(11);
      expect(postedKeywords.slice(1, 4)).toEqual([
        "ai music channel",
        "mini drama ia",
        "ai mini drama shorts",
      ]);
      expect(postedKeywords).not.toContain("ai music channel mini drama ia");
      expect(
        fetchMock.mock.calls.some(([, init]) => {
          const payload = JSON.parse(String(init?.body ?? "{}")) as { action?: string; result_note?: string };
          return payload.action === "update-experiment" && payload.result_note === "Bon signal initial, continuer le test.";
        }),
      ).toBe(true);
      expect(
        fetchMock.mock.calls.some(([, init]) => {
          const payload = JSON.parse(String(init?.body ?? "{}")) as { action?: string; title?: string };
          return payload.action === "create-draft" && payload.title === "J’ai créé une musique IA addictive sur ai music channel";
        }),
      ).toBe(true);
      expect(
        fetchMock.mock.calls.some(([, init]) => {
          const payload = JSON.parse(String(init?.body ?? "{}")) as { action?: string; status?: string };
          return payload.action === "update-draft" && payload.status === "READY";
        }),
      ).toBe(true);
      expect(
        fetchMock.mock.calls.some(([, init]) => {
          const payload = JSON.parse(String(init?.body ?? "{}")) as { action?: string; status?: string };
          return payload.action === "update-draft" && payload.status === "USED";
        }),
      ).toBe(true);
      expect(
        fetchMock.mock.calls.some(([, init]) => {
          const payload = JSON.parse(String(init?.body ?? "{}")) as {
            action?: string;
            scene?: string;
            provider?: string;
          };
          return payload.action === "regenerate-asset" &&
            payload.scene === "Scene 1" &&
            payload.provider === "fallback";
        }),
      ).toBe(true);
      expect(
        fetchMock.mock.calls.some(([, init]) => {
          const payload = JSON.parse(String(init?.body ?? "{}")) as {
            action?: string;
            title?: string;
            content?: {
              factory?: {
                selectedTitle?: string;
                montagePlan?: string[];
                voicePrompt?: string;
                assets?: Array<{
                  scene: string;
                  status: string;
                  screenText: string;
                  visualPrompt: string;
                }>;
              };
            };
          };
          return payload.action === "update-draft" &&
            payload.title === "ai music channel: le test qui decide si on attaque" &&
            payload.content?.factory?.selectedTitle === "ai music channel: le test qui decide si on attaque" &&
            Array.isArray(payload.content.factory.montagePlan) &&
            Boolean(payload.content.factory.voicePrompt) &&
            payload.content.factory.assets?.[0]?.scene === "Scene 1" &&
            payload.content.factory.assets[0].status === "IN_PROGRESS" &&
            payload.content.factory.assets[0].screenText === "Signal marche regenere" &&
            payload.content.factory.assets[0].visualPrompt === "Prompt visuel regenere depuis Edge Function";
        }),
      ).toBe(true);
    });
  }, 15_000);
});
