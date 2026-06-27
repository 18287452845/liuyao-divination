import { supabase } from '../lib/supabase';

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
  void supabase.auth.signOut();

  if (redirect) {
    redirectToLogin();
  }
}

export function getStoredAccessToken() {
  return localStorage.getItem('accessToken');
}

export async function refreshAuthTokens(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const { data, error } = await supabase.auth.refreshSession();

        if (error || !data.session?.access_token) {
          clearStoredAuth(true);
          return null;
        }

        localStorage.setItem('accessToken', data.session.access_token);
        localStorage.setItem('refreshToken', data.session.refresh_token);

        return data.session.access_token;
      } catch {
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
