import axios from 'axios';
import type { DivinationRecord, DivinationMethod, Gender, BaZi } from '../types';
import { clearStoredAuth, fetchWithAutoRefresh, getStoredAccessToken, refreshAuthTokens } from './tokenRefresh';
import { normalizeLegacyData, normalizeLegacyText } from './textNormalize';

function getResponseErrorMessage(errorText: string, fallback: string) {
  if (!errorText) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(errorText);
    return normalizeLegacyText(parsed?.message || parsed?.error || fallback);
  } catch {
    return normalizeLegacyText(errorText);
  }
}

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = getStoredAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    response.data = normalizeLegacyData(response.data);
    return response;
  },
  async (error) => {
    const originalRequest = error.config as any;
    const requestUrl = originalRequest?.url || '';

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !requestUrl.includes('/auth/login') &&
      !requestUrl.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;

      const refreshedAccessToken = await refreshAuthTokens();
      if (refreshedAccessToken) {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${refreshedAccessToken}`;
        return api(originalRequest);
      }
    }

    if (error.response?.status === 401) {
      clearStoredAuth(true);
    }

    return Promise.reject(error);
  }
);

export const divinationApi = {
  createDivination: async (data: {
    method: DivinationMethod;
    question: string;
    gender?: Gender;
    bazi?: BaZi;
    data?: any;
  }) => {
    const response = await api.post('/divination', data);
    return response.data;
  },

  simulateShake: async () => {
    const response = await api.get('/divination/simulate');
    return response.data;
  },

  getRecords: async (params?: { search?: string; limit?: number; offset?: number }) => {
    const response = await api.get<DivinationRecord[]>('/records', { params });
    return response.data;
  },

  getRecordById: async (id: string) => {
    const response = await api.get<DivinationRecord>(`/records/${id}`);
    return response.data;
  },

  updateAiAnalysis: async (id: string, aiAnalysis: string) => {
    const response = await api.put(`/records/${id}/analysis`, { aiAnalysis });
    return response.data;
  },

  deleteRecord: async (id: string) => {
    const response = await api.delete(`/records/${id}`);
    return response.data;
  },

  updateVerification: async (id: string, data: {
    actual_result: string;
    accuracy_rating: number;
    user_notes?: string;
  }) => {
    const response = await api.put(`/records/${id}/verification`, data);
    return response.data;
  },

  cancelVerification: async (id: string) => {
    const response = await api.delete(`/records/${id}/verification`);
    return response.data;
  },

  getVerifiedRecords: async (params?: { limit?: number; offset?: number }) => {
    const response = await api.get<DivinationRecord[]>('/records/verified/list', { params });
    return response.data;
  },

  getUnverifiedRecords: async (params?: { limit?: number; offset?: number }) => {
    const response = await api.get<DivinationRecord[]>('/records/unverified/list', { params });
    return response.data;
  },

  getStatistics: async () => {
    const response = await api.get('/statistics');
    return response.data;
  }
};

export const analyzeGuaStream = async (
  data: any,
  onChunk: (content: string) => void,
  onError: (error: string) => void,
  onComplete?: () => void
) => {
  let hasContent = false;

  try {
    const response = await fetchWithAutoRefresh('/api/ai/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        getResponseErrorMessage(errorText, `解卦请求失败 (${response.status})`)
      );
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('无法读取流式响应');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (!line.startsWith('data: ')) {
          continue;
        }

        const payload = line.slice(6);
        if (payload === '[DONE]') {
          if (hasContent && onComplete) {
            onComplete();
          }
          return;
        }

        try {
          const parsed = JSON.parse(payload);
          if (parsed.content) {
            hasContent = true;
            onChunk(parsed.content);
          } else if (parsed.error) {
            onError(normalizeLegacyText(parsed.error));
            return;
          }
        } catch {
          // Ignore malformed SSE chunks from upstream.
        }
      }
    }

    if (hasContent && onComplete) {
      onComplete();
    }
  } catch (error: any) {
    onError(normalizeLegacyText(error.message || '解卦失败'));
  }
};

export default api;
