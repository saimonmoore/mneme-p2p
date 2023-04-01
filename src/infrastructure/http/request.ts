export type FetchResponse<T> = {
  error?: string;
  cause?: unknown;
  data?: T;
};

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS';

type RequestOptions = {
  method: Method;
  headers?: Record<string, string>;
  body?: unknown;
};

type FetchOptions = {
  method: Method;
  headers: Record<string, string>;
  body?: string;
};

export type Callback<T = unknown, S = unknown> = (
  data?: T,
  context?: S
) => void;

export class HTTPError extends Error {
  status?: number;

  constructor(message?: string, status?: number) {
    super(message);

    this.status = status;
  }
}

export const request = async <T>(
  url: string,
  { method, body, headers = {} }: RequestOptions
): Promise<FetchResponse<T>> => {
  const defaultHeaders = {
    'content-type': 'application/json',
  };

  const fetchOptions: FetchOptions = {
    method,
    headers: {
      ...defaultHeaders,
      ...(headers || {}),
    },
  };

  if (body && typeof body === 'object') {
    fetchOptions.body = JSON.stringify(body);
  }

  if (body && typeof body === 'string') {
    fetchOptions.body = body;
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    return { error: 'Invalid request', cause: response.status };
  }

  return { data: response.json() as T };
};
