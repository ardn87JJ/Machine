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
    expect(await screen.findByRole("heading", { name: "mini drama ia" })).toBeInTheDocument();
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
    expect(screen.getByRole("heading", { name: "Classement exploitable" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Plan d’attaque" })).toBeInTheDocument();
    expect(
      screen.getByText("Lancer 5 épisodes courts autour de mini drama ia sur 7 jours"),
    ).toBeInTheDocument();
    expect(screen.getByText("Scans visibles")).toBeInTheDocument();
  });

  it("lance le Scout Edge quand l'API FastAPI n'est pas joignable", async () => {
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes("/functions/v1/run-scout")) {
        if (init?.method === "GET") {
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
    expect(await screen.findByRole("heading", { name: "persisted edge niche" })).toBeInTheDocument();

    const keywordInput = screen.getByLabelText("Niche / mot-clé de départ");
    fireEvent.change(keywordInput, { target: { value: "ai music channel" } });
    fireEvent.click(screen.getAllByRole("button", { name: "RUN EDGE SCOUT" })[0]);

    expect(await screen.findByRole("heading", { name: "ai music channel" })).toBeInTheDocument();
    expect(
      await screen.findByText("edge-business-heuristic-v0.2", { selector: ".model-version" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Chaîne musicale IA monétisable").length).toBeGreaterThan(0);
    expect(screen.getByText("ATTAQUER · 91")).toBeInTheDocument();
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
        .map(([, init]) => JSON.parse(String(init?.body ?? "{}")).keyword);

      expect(postedKeywords).toHaveLength(11);
      expect(postedKeywords.slice(1, 4)).toEqual([
        "ai music channel",
        "mini drama ia",
        "ai mini drama shorts",
      ]);
      expect(postedKeywords).not.toContain("ai music channel mini drama ia");
    });
  });
});
