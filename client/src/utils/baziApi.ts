/**
 * 八字批命 API 客户端
 *
 * 提供八字功能相关的所有API调用方法
 */

import api from './api';
import type {
  CreateBaziRequest,
  BaziRecord,
  GetRecordsRequest,
  GetRecordsResponse,
  CreateBaziResponse,
  CalculatePillarsResponse,
  ApiResponse,
  AiAnalyzeRequest,
  SSEChunk
} from '../types/bazi';

/**
 * 八字批命API
 */
export const baziApi = {
  /**
   * 创建八字记录（保存到数据库）
   */
  createBazi: async (data: CreateBaziRequest): Promise<ApiResponse<CreateBaziResponse>> => {
    const response = await api.post('/bazi', data);
    return response.data;
  },

  /**
   * 获取八字记录列表
   */
  getRecords: async (params?: GetRecordsRequest): Promise<ApiResponse<GetRecordsResponse>> => {
    const response = await api.get('/bazi/records', { params });
    return response.data;
  },

  /**
   * 获取单条八字记录
   */
  getRecordById: async (id: string): Promise<ApiResponse<BaziRecord>> => {
    const response = await api.get(`/bazi/records/${id}`);
    return response.data;
  },

  /**
   * 删除八字记录
   */
  deleteRecord: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/bazi/records/${id}`);
    return response.data;
  },

  /**
   * 更新AI分析结果
   */
  updateAiAnalysis: async (id: string, aiAnalysis: string): Promise<ApiResponse<void>> => {
    const response = await api.put(`/bazi/records/${id}/analysis`, { aiAnalysis });
    return response.data;
  },

  /**
   * 更新验证反馈
   */
  updateVerification: async (
    id: string,
    data: {
      actualFeedback: string;
      accuracyRating: number;
      userNotes?: string;
    }
  ): Promise<ApiResponse<void>> => {
    const response = await api.put(`/bazi/records/${id}/verification`, data);
    return response.data;
  },

  /**
   * 工具：仅计算四柱（不保存）
   */
  calculatePillars: async (data: {
    gender: '男' | '女';
    birthDatetime: number;
    useTrueSolarTime?: boolean;
    birthLocation?: string;
  }): Promise<ApiResponse<CalculatePillarsResponse>> => {
    const response = await api.post('/bazi/tools/calculate-pillars', data);
    return response.data;
  }
};

/**
 * AI流式分析八字（使用SSE）
 *
 * @param data 分析请求数据
 * @param onChunk 接收数据块的回调函数
 * @param onError 错误处理回调函数
 * @param onComplete 完成回调函数
 */
export const analyzeBaziStream = async (
  data: AiAnalyzeRequest,
  onChunk: (content: string) => void,
  onError: (error: string) => void,
  onComplete?: () => void
): Promise<void> => {
  try {
    const token = localStorage.getItem('accessToken');
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/bazi/ai/analyze', {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`AI分析请求失败: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法读取响应流');
    }

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        onComplete?.();
        break;
      }

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6);

          // 检查是否完成
          if (dataStr === '[DONE]') {
            onComplete?.();
            return;
          }

          try {
            const parsed: SSEChunk = JSON.parse(dataStr);

            if (parsed.content) {
              onChunk(parsed.content);
            }

            if (parsed.error) {
              onError(parsed.error);
              return;
            }

            if (parsed.done) {
              onComplete?.();
              return;
            }
          } catch (e) {
            console.warn('解析SSE数据失败:', e, dataStr);
          }
        }
      }
    }
  } catch (error: any) {
    console.error('AI分析流式请求错误:', error);
    onError(error.message || 'AI分析失败');
  }
};

/**
 * AI非流式分析八字（备用，用于不支持SSE的场景）
 *
 * @param data 分析请求数据
 * @returns Promise返回完整的分析结果
 */
export const analyzeBaziSync = async (
  data: AiAnalyzeRequest
): Promise<ApiResponse<{ analysis: string; model: string }>> => {
  const response = await api.post('/bazi/ai/analyze-sync', data);
  return response.data;
};

export default baziApi;
