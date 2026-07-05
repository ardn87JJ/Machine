const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

export const API_URL = configuredApiUrl || "http://localhost:8000";

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function getJson<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(
      `L’API a répondu avec le statut ${response.status}.`,
      response.status,
    );
  }

  return response.json() as Promise<T>;
}
