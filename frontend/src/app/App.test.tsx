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
    expect((await screen.findAllByRole("heading", { name: "mini drama ia" })).length).toBeGreaterThan(0);
    expect(
      await screen.findByText("I Made a Netflix-Level Drama Series in 24 HOURS Using ONLY AI!", {
        selector: ".video-result__title",
      }),
    ).toBeInTheDocument();
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
    expect(screen.getByRole("heading", { name: "File de tests" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Créer test" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pack production" })).toBeInTheDocument();
    expect(screen.getByText("3 hooks")).toBeInTheDocument();
    expect(screen.getByText("Script 30-45s")).toBeInTheDocument();
    expect(
      screen.getAllByText("Lancer 5 épisodes courts autour de mini drama ia sur 7 jours").length,
    ).toBeGreaterThan(0);
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
      };
      created_at: string;
      updated_at: string;
    }> = [];

    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes("/functions/v1/run-scout")) {
        if (init?.method === "GET") {
          if (url.includes("view=experiments")) {
            return Promise.resolve(
              new Response(JSON.stringify({ experiments }), {
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
                    model_version: "edge-business-heuristic-v0.2",
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
          const experiment = {
            ...experiments[0],
            status: patch.status,
            outcome: patch.outcome,
            result_note: patch.result_note,
            updated_at: "2026-07-08T13:40:00Z",
          };

          experiments = [experiment];

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
            content: payload.content,
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
            status: "DRAFT" | "READY" | "USED";
          };
          const draft = {
            ...drafts[0],
            status: patch.status,
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
              analysis: {
                model_version: "edge-business-heuristic-v0.2",
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
                model_version: "edge-business-heuristic-v0.2",
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
      await screen.findByText("edge-business-heuristic-v0.2", { selector: ".model-version" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Chaîne musicale IA monétisable").length).toBeGreaterThan(0);
    expect(screen.getByText("ATTAQUER · 91")).toBeInTheDocument();
    expect(screen.getByText("Décision ATTAQUER · score 91/100")).toBeInTheDocument();
    expect(screen.getByText("BENCHMARK")).toBeInTheDocument();
    expect(
      screen.getAllByText("Publier 7 morceaux courts autour de ai music channel avec visuels cohérents").length,
    ).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Créer test" }));

    expect(await screen.findByText("READY")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Test créé" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Démarrer" }));

    expect(await screen.findByText("RUNNING")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Apprentissages" })).toBeInTheDocument();
    expect(screen.getByText("Collecter les résultats de ai music channel")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Note résultat"), {
      target: { value: "Bon signal initial, continuer le test." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Réussi" }));

    expect(await screen.findByText("PASSED")).toBeInTheDocument();
    expect(screen.getByText("Doubler le test sur ai music channel")).toBeInTheDocument();
    expect(screen.getAllByText("Bon signal initial, continuer le test.").length).toBeGreaterThan(0);
    expect(screen.getByText("J’ai créé une musique IA addictive sur ai music channel")).toBeInTheDocument();
    expect(screen.getByText("Sauvegarde si tu veux la version longue.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sauvegarder draft" }));

    expect(await screen.findByRole("button", { name: "Draft sauvegardé" })).toBeDisabled();
    expect(screen.getByRole("heading", { name: "Drafts production" })).toBeInTheDocument();
    expect(screen.getAllByText("J’ai créé une musique IA addictive sur ai music channel").length).toBeGreaterThan(0);
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

    expect(screen.getByRole("button", { name: "ATTAQUER 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "TESTER 1" })).toBeInTheDocument();
    expect(
      screen.getByText("How To Start an AI Music YouTube Channel", {
        selector: ".video-result__title",
      }),
    ).toBeInTheDocument();

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
    });
  });
});
