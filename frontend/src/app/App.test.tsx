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

        return Promise.reject(new Error(`Unhandled fetch for ${url}`));
      }),
    );

    renderApp();

    expect(screen.getByRole("heading", { name: "GO MONEY MODE" })).toBeInTheDocument();
    expect(await screen.findByText("API réelle · test")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "START SCAN" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "SCAN 10" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "SCAN 50" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "mini drama ia" })).toBeInTheDocument();
    expect(
      await screen.findByText("I Made a Netflix-Level Drama Series in 24 HOURS Using ONLY AI!", {
        selector: ".video-result__title",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Scoring business" })).toBeInTheDocument();
    expect(await screen.findByText("business-heuristic-v0.1")).toBeInTheDocument();
    expect(screen.getByText("money_score")).toBeInTheDocument();
    expect(screen.getByText("weak_competitor_score")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Plan d’attaque" })).toBeInTheDocument();
    expect(screen.getByText("5 épisodes courts en 7 jours")).toBeInTheDocument();
    expect(screen.getByText("Scans visibles")).toBeInTheDocument();
  });

  it("garde le scan visible en mode local quand l'API n'est pas joignable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    renderApp();

    expect(await screen.findByText("API indisponible · mode local")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "START SCAN" })[0]);

    expect(await screen.findByRole("heading", { name: "mini drama ia" })).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "mini drama ia · opportunité locale" }),
    ).toBeInTheDocument();
    expect(screen.getByText("frontend-offline-v0")).toBeInTheDocument();
  });
});
