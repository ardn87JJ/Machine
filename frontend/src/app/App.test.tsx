import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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

    expect(screen.getByRole("heading", { name: "GO MONEY MODE" })).toBeInTheDocument();
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
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((input: RequestInfo | URL) => {
        const url = String(input);

        if (url.includes("/functions/v1/run-scout")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                scan: {
                  id: "44444444-4444-4444-4444-444444444444",
                  platform: "youtube",
                  keyword: "ai music channel",
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
                  model_version: "edge-business-heuristic-v0.1",
                  opportunity_title: "Mini-drama IA vertical court",
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
                  scan_id: "44444444-4444-4444-4444-444444444444",
                  keyword: "ai music channel",
                  title: "Mini-drama IA vertical court",
                  verdict: "GO",
                  model_version: "edge-business-heuristic-v0.1",
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
                    angle: "Série verticale IA sur tension dramatique courte",
                    first_test: "Lancer 5 épisodes courts autour de ai music channel sur 7 jours",
                    criteria_go: "Un épisode dépasse le benchmark de vues initial en 48h",
                    notes: "Accélérer le hook.",
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
      }),
    );

    renderApp();

    expect(await screen.findByText("Edge Supabase · scan public")).toBeInTheDocument();

    const keywordInput = screen.getByLabelText("Niche / mot-clé de départ");
    fireEvent.change(keywordInput, { target: { value: "ai music channel" } });
    fireEvent.click(screen.getAllByRole("button", { name: "RUN EDGE SCOUT" })[0]);

    expect(await screen.findByRole("heading", { name: "ai music channel" })).toBeInTheDocument();
    expect(
      await screen.findByText("edge-business-heuristic-v0.1", { selector: ".model-version" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("How To Start an AI Music YouTube Channel", {
        selector: ".video-result__title",
      }),
    ).toBeInTheDocument();
  });
});
