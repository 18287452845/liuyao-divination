/**
 * 八字 API 客户端
 */

import api from './api';
import { fetchWithAutoRefresh } from './tokenRefresh';
import { normalizeLegacyData, normalizeLegacyText } from './textNormalize';
import type {
  CreateBaziRequest,
  BaziRecord,
  GetRecordsRequest,
  GetRecordsResponse,
  CreateBaziResponse,
  CalculatePillarsResponse,
  ApiResponse,
  AiAnalyzeRequest,
  SSEChunk,
  Gender
} from '../types/bazi';

function normalizeApiResponse<T>(response: ApiResponse<T>): ApiResponse<T> {
  return {
    ...response,
    message: response.message ? normalizeLegacyText(response.message) : response.message,
    error: response.error ? normalizeLegacyText(response.error) : response.error,
    data: response.data === undefined ? undefined : normalizeLegacyData(response.data)
  };
}

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

export const baziApi = {
  createBazi: async (data: CreateBaziRequest): Promise<ApiResponse<CreateBaziResponse>> => {
    const response = await api.post('/bazi', data);
    return normalizeApiResponse(response.data);
  },

  getRecords: async (params?: GetRecordsRequest): Promise<ApiResponse<GetRecordsResponse>> => {
    const response = await api.get('/bazi/records', { params });
    return normalizeApiResponse(response.data);
  },

  getRecordById: async (id: string): Promise<ApiResponse<BaziRecord>> => {
    const response = await api.get(`/bazi/records/${id}`);
    return normalizeApiResponse(response.data);
  },

  deleteRecord: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/bazi/records/${id}`);
    return normalizeApiResponse(response.data);
  },

  updateAiAnalysis: async (id: string, aiAnalysis: string): Promise<ApiResponse<void>> => {
    const response = await api.put(`/bazi/records/${id}/analysis`, { aiAnalysis });
    return normalizeApiResponse(response.data);
  },

  updateVerification: async (
    id: string,
    data: {
      actualFeedback: string;
      accuracyRating: number;
      userNotes?: string;
    }
  ): Promise<ApiResponse<void>> => {
    const response = await api.put(`/bazi/records/${id}/verification`, data);
    return normalizeApiResponse(response.data);
  },

  calculatePillars: async (data: {
    gender: Gender;
    birthDatetime: number;
    useTrueSolarTime?: boolean;
    birthLocation?: string;
  }): Promise<ApiResponse<CalculatePillarsResponse>> => {
    const response = await api.post('/bazi/tools/calculate-pillars', data);
    return normalizeApiResponse(response.data);
  }
};

export const analyzeBaziStream = async (
  data: AiAnalyzeRequest,
  onChunk: (content: string) => void,
  onError: (error: string) => void,
  onComplete?: () => void
): Promise<void> => {
  let hasContent = false;

  try {
    const response = await fetchWithAutoRefresh('/api/bazi/ai/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(getResponseErrorMessage(errorText, `AI分析请求失败 (${response.status})`));
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法读取流式响应');
    }

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (!line.startsWith('data: ')) {
          continue;
        }

        const dataStr = line.slice(6);
        if (dataStr === '[DONE]') {
          onComplete?.();
          return;
        }

        try {
          const parsed: SSEChunk = JSON.parse(dataStr);

          if (parsed.content) {
            hasContent = true;
            onChunk(parsed.content);
          }

          if (parsed.error) {
            onError(normalizeLegacyText(parsed.error));
            return;
          }

          if (parsed.done) {
            if (hasContent) {
              onComplete?.();
            }
            return;
          }
        } catch (error) {
          console.warn('解析 SSE 数据失败:', error, dataStr);
        }
      }
    }

    if (hasContent) {
      onComplete?.();
    }
  } catch (error: any) {
    console.error('AI分析流式请求错误:', error);
    onError(normalizeLegacyText(error.message || 'AI分析失败'));
  }
};

export const analyzeBaziSync = async (
  data: AiAnalyzeRequest
): Promise<ApiResponse<{ analysis: string; model: string }>> => {
  const response = await api.post('/bazi/ai/analyze-sync', data);
  return normalizeApiResponse(response.data);
};

export default baziApi;
