const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

export const API_URL = configuredApiUrl || "http://localhost:8000";

type ErrorPayload = {
  detail?: {
    code?: string;
    message?: string;
  } | string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function extractApiError(response: Response): Promise<ApiError> {
  let payload: ErrorPayload | null;

  try {
    payload = (await response.json()) as ErrorPayload;
  } catch {
    payload = null;
  }

  if (payload?.detail && typeof payload.detail === "object") {
    return new ApiError(
      payload.detail.message || `L'API a repondu avec le statut ${response.status}.`,
      response.status,
      payload.detail.code,
    );
  }

  if (typeof payload?.detail === "string") {
    return new ApiError(payload.detail, response.status);
  }

  return new ApiError(
    `L'API a repondu avec le statut ${response.status}.`,
    response.status,
  );
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
    throw await extractApiError(response);
  }

  return response.json() as Promise<T>;
}

export async function postJson<TRequest, TResponse>(
  path: string,
  body: TRequest,
): Promise<TResponse> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw await extractApiError(response);
  }

  return response.json() as Promise<TResponse>;
}
