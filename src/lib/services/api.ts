export class ApiError extends Error {
  constructor(message: string, public status: number, public payload?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiCallOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  searchParams?: Record<string, string | number | undefined>;
}

function buildUrl(path: string, searchParams?: Record<string, string | number | undefined>): string {
  if (!searchParams) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export async function apiCall<T = unknown>(
  path: string,
  options: ApiCallOptions = {}
): Promise<T> {
  const { body, headers, searchParams, ...rest } = options;

  const init: RequestInit = { ...rest, headers: { ...headers } };

  if (body !== undefined && !(body instanceof FormData)) {
    init.headers = { 'Content-Type': 'application/json', ...init.headers };
    init.body = JSON.stringify(body);
  } else if (body instanceof FormData) {
    init.body = body;
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, searchParams), init);
  } catch (err) {
    throw new ApiError(
      err instanceof Error ? err.message : 'Network error',
      0,
      err
    );
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    const message =
      (payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
        ? payload.error
        : null) || `HTTP ${res.status}`;
    throw new ApiError(message, res.status, payload);
  }

  return payload as T;
}

export const api = {
  get: <T = unknown>(path: string, options?: Omit<ApiCallOptions, 'method' | 'body'>) =>
    apiCall<T>(path, { ...options, method: 'GET' }),
  post: <T = unknown>(path: string, body?: unknown, options?: Omit<ApiCallOptions, 'method' | 'body'>) =>
    apiCall<T>(path, { ...options, method: 'POST', body }),
  put: <T = unknown>(path: string, body?: unknown, options?: Omit<ApiCallOptions, 'method' | 'body'>) =>
    apiCall<T>(path, { ...options, method: 'PUT', body }),
  delete: <T = unknown>(path: string, options?: Omit<ApiCallOptions, 'method' | 'body'>) =>
    apiCall<T>(path, { ...options, method: 'DELETE' }),
};
