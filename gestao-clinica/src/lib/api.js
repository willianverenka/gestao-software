export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function apiRequest(path, options = {}) {
  const { token, headers, body, ...rest } = options;
  const requestHeaders = new Headers(headers || {});

  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  let requestBody = body;
  if (
    requestBody &&
    typeof requestBody === 'object' &&
    !(requestBody instanceof FormData) &&
    !(requestBody instanceof Blob) &&
    !(requestBody instanceof URLSearchParams) &&
    !(requestBody instanceof ArrayBuffer)
  ) {
    requestBody = JSON.stringify(requestBody);
  }

  if (typeof requestBody === 'string' && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: requestHeaders,
    body: requestBody ?? undefined,
  });
}

export async function readResponseData(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    return text ? { text } : null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function readErrorMessage(response, fallback = 'Erro inesperado.') {
  const data = await readResponseData(response);
  if (!data) return fallback;
  if (typeof data.detail === 'string') return data.detail;
  if (typeof data.message === 'string') return data.message;
  if (typeof data.text === 'string') return data.text;
  return fallback;
}
