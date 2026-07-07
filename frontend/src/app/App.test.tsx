import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
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
    vi.unstubAllGlobals();
  });

  it("affiche le périmètre fondateur et les scans", async () => {
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
                    status: "queued",
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

        return Promise.reject(new Error(`Unhandled fetch for ${url}`));
      }),
    );

    renderApp();

    expect(
      screen.getByRole("heading", {
        name: "Scout → Analyste → Décision humaine",
      }),
    ).toBeInTheDocument();
    expect(await screen.findByText("API opérationnelle · test")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "mini drama ia" })).toBeInTheDocument();
  });
});
