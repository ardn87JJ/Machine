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

  it("affiche le périmètre fondateur", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
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
      ),
    );

    renderApp();

    expect(
      screen.getByRole("heading", {
        name: "Scout → Analyste → Décision humaine",
      }),
    ).toBeInTheDocument();
    expect(await screen.findByText("API opérationnelle · test")).toBeInTheDocument();
  });
});
