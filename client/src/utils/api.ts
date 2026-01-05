import axios from 'axios';
import type { DivinationRecord, DivinationMethod, Gender, BaZi } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// 添加请求拦截器，自动添加认证令牌
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 添加响应拦截器，处理401错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token过期或无效，清除本地存储并跳转登录
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const divinationApi = {
  // 创建卦象
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

  // 模拟摇卦
  simulateShake: async () => {
    const response = await api.get('/divination/simulate');
    return response.data;
  },

  // 获取历史记录
  getRecords: async (params?: { search?: string; limit?: number; offset?: number }) => {
    const response = await api.get<DivinationRecord[]>('/records', { params });
    return response.data;
  },

  // 获取单条记录
  getRecordById: async (id: string) => {
    const response = await api.get<DivinationRecord>(`/records/${id}`);
    return response.data;
  },

  // 更新AI解析
  updateAiAnalysis: async (id: string, aiAnalysis: string) => {
    const response = await api.put(`/records/${id}/analysis`, { aiAnalysis });
    return response.data;
  },

  // 删除记录
  deleteRecord: async (id: string) => {
    const response = await api.delete(`/records/${id}`);
    return response.data;
  },

  // ========== 验证反馈相关 ==========

  // 更新验证信息
  updateVerification: async (id: string, data: {
    actual_result: string;
    accuracy_rating: number;
    user_notes?: string;
  }) => {
    const response = await api.put(`/records/${id}/verification`, data);
    return response.data;
  },

  // 取消验证
  cancelVerification: async (id: string) => {
    const response = await api.delete(`/records/${id}/verification`);
    return response.data;
  },

  // 获取已验证的记录
  getVerifiedRecords: async (params?: { limit?: number; offset?: number }) => {
    const response = await api.get<DivinationRecord[]>('/records/verified/list', { params });
    return response.data;
  },

  // 获取待验证的记录
  getUnverifiedRecords: async (params?: { limit?: number; offset?: number }) => {
    const response = await api.get<DivinationRecord[]>('/records/unverified/list', { params });
    return response.data;
  },

  // 获取统计信息
  getStatistics: async () => {
    const response = await api.get('/statistics');
    return response.data;
  }
};

// AI解卦（流式）
export const analyzeGuaStream = async (
  data: any,
  onChunk: (content: string) => void,
  onError: (error: string) => void,
  onComplete?: () => void
) => {
  let hasContent = false;

  try {
    const token = localStorage.getItem('accessToken');
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `解卦请求失败 (${response.status})`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('无法读取响应流');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            if (hasContent && onComplete) {
              onComplete();
            }
            return;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              hasContent = true;
              onChunk(parsed.content);
            } else if (parsed.error) {
              onError(parsed.error);
              return;
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }

    // 流结束但没有收到[DONE]信号
    if (hasContent && onComplete) {
      onComplete();
    }
  } catch (error: any) {
    onError(error.message || '解卦失败');
  }
};

export default api;
