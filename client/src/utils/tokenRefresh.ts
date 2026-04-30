const LOGIN_PATH = '/login';

let refreshPromise: Promise<string | null> | null = null;

function redirectToLogin() {
  if (window.location.pathname !== LOGIN_PATH) {
    window.location.href = LOGIN_PATH;
  }
}

export function clearStoredAuth(redirect = false) {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');

  if (redirect) {
    redirectToLogin();
  }
}

export function getStoredAccessToken() {
  return localStorage.getItem('accessToken');
}

export async function refreshAuthTokens(): Promise<string | null> {
  const storedRefreshToken = localStorage.getItem('refreshToken');

  if (!storedRefreshToken) {
    clearStoredAuth(true);
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken: storedRefreshToken }),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success || !data?.data?.accessToken) {
          clearStoredAuth(true);
          return null;
        }

        localStorage.setItem('accessToken', data.data.accessToken);
        if (data.data.refreshToken) {
          localStorage.setItem('refreshToken', data.data.refreshToken);
        }

        return data.data.accessToken as string;
      } catch (error) {
        clearStoredAuth(true);
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

export async function fetchWithAutoRefresh(
  input: RequestInfo | URL,
  init: RequestInit = {},
  retry = true
): Promise<Response> {
  const headers = new Headers(init.headers || {});
  const accessToken = getStoredAccessToken();

  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  if (response.status !== 401 || !retry) {
    return response;
  }

  const refreshedAccessToken = await refreshAuthTokens();
  if (!refreshedAccessToken) {
    return response;
  }

  const retryHeaders = new Headers(init.headers || {});
  retryHeaders.set('Authorization', `Bearer ${refreshedAccessToken}`);

  return fetch(input, {
    ...init,
    headers: retryHeaders,
  });
}
