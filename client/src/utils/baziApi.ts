import { supabase } from '../lib/supabase';
import { calculateBaziFromDateTime, calculateDaYun, decorateBazi } from '../domain/bazi/bazi';
import { normalizeLegacyData, normalizeLegacyText } from './textNormalize';
import type {
  AiAnalyzeRequest,
  ApiResponse,
  BaziRecord,
  CalculatePillarsResponse,
  CreateBaziRequest,
  CreateBaziResponse,
  Gender,
  GetRecordsRequest,
  GetRecordsResponse,
  SSEChunk,
} from '../types/bazi';

function normalizeApiResponse<T>(response: ApiResponse<T>): ApiResponse<T> {
  return {
    ...response,
    message: response.message ? normalizeLegacyText(response.message) : response.message,
    error: response.error ? normalizeLegacyText(response.error) : response.error,
    data: response.data === undefined ? undefined : normalizeLegacyData(response.data),
  };
}

async function getCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('未登录');
  }

  return user.id;
}

function toRecord(row: any): BaziRecord {
  return {
    id: row.id,
    userId: row.user_id,
    timestamp: Number(row.timestamp),
    name: row.name || undefined,
    gender: row.gender,
    birthDatetime: Number(row.birth_datetime),
    birthLocation: row.birth_location || undefined,
    useTrueSolarTime: Boolean(row.use_true_solar_time),
    yearPillar: row.year_pillar,
    monthPillar: row.month_pillar,
    dayPillar: row.day_pillar,
    hourPillar: row.hour_pillar,
    baziData: typeof row.bazi_data === 'string' ? JSON.parse(row.bazi_data) : row.bazi_data,
    dayunData: {
      steps: typeof row.dayun_data === 'string' ? JSON.parse(row.dayun_data || '[]') : row.dayun_data || [],
      qiyunAge: Number(row.qiyun_age || 0),
      shunPai: Boolean(row.shun_pai),
    },
    qiyunAge: Number(row.qiyun_age || 0),
    aiAnalysis: row.ai_analysis || undefined,
    aiModel: row.ai_model || undefined,
    aiAnalyzedAt: row.ai_analyzed_at ? Number(row.ai_analyzed_at) : undefined,
    isVerified: Boolean(row.is_verified),
    actualFeedback: row.actual_feedback || undefined,
    accuracyRating: row.accuracy_rating || undefined,
    verificationDate: row.verify_time ? Number(row.verify_time) : undefined,
  };
}

async function buildBazi(data: CreateBaziRequest) {
  const timestamp = typeof data.birthDatetime === 'string'
    ? new Date(data.birthDatetime).getTime()
    : Number(data.birthDatetime);

  const bazi = await calculateBaziFromDateTime(
    timestamp,
    data.gender as Gender,
    Boolean(data.useTrueSolarTime),
    data.birthLocation
  );
  const decorated = decorateBazi(bazi);
  const dayun = calculateDaYun(
    bazi.month.gan,
    bazi.month.zhi,
    bazi.year.gan,
    data.gender as Gender,
    timestamp,
    bazi.riGan
  );

  return { timestamp, bazi, decorated, dayun };
}

export const baziApi = {
  createBazi: async (data: CreateBaziRequest): Promise<ApiResponse<CreateBaziResponse>> => {
    try {
      const userId = await getCurrentUserId();
      const { timestamp, bazi, decorated, dayun } = await buildBazi(data);
      const id = crypto.randomUUID();
      const now = Date.now();

      const { error } = await supabase.from('bazi_records').insert({
        id,
        user_id: userId,
        timestamp: now,
        name: data.name || null,
        gender: data.gender,
        birth_datetime: timestamp,
        birth_location: data.birthLocation || null,
        use_true_solar_time: Boolean(data.useTrueSolarTime),
        year_pillar: bazi.year.ganZhi,
        month_pillar: bazi.month.ganZhi,
        day_pillar: bazi.day.ganZhi,
        hour_pillar: bazi.hour.ganZhi,
        bazi_data: JSON.stringify(decorated),
        dayun_data: JSON.stringify(dayun.steps),
        qiyun_age: dayun.qiyunAge,
        shun_pai: dayun.shunPai,
        is_verified: false,
      });

      if (error) throw error;

      return normalizeApiResponse({
        success: true,
        data: {
          id,
          bazi: decorated.bazi,
          shiShen: decorated.shiShen,
          wuXing: decorated.wuXing,
          relations: decorated.relations,
          dayun,
          qiyunAge: dayun.qiyunAge,
        },
      });
    } catch (error: any) {
      return { success: false, error: error.message || '创建八字记录失败' };
    }
  },

  getRecords: async (params?: GetRecordsRequest): Promise<ApiResponse<GetRecordsResponse>> => {
    try {
      const limit = params?.limit || 20;
      const offset = params?.offset || 0;
      let query = supabase
        .from('bazi_records')
        .select('*', { count: 'exact' })
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1);

      if (params?.search) {
        query = query.ilike('name', `%${params.search}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      return normalizeApiResponse({
        success: true,
        data: {
          records: (data || []).map(toRecord),
          total: count || 0,
          limit,
          offset,
        },
      });
    } catch (error: any) {
      return { success: false, error: error.message || '获取八字记录失败' };
    }
  },

  getRecordById: async (id: string): Promise<ApiResponse<BaziRecord>> => {
    const { data, error } = await supabase.from('bazi_records').select('*').eq('id', id).single();
    if (error) return { success: false, error: error.message };
    return normalizeApiResponse({ success: true, data: toRecord(data) });
  },

  deleteRecord: async (id: string): Promise<ApiResponse<void>> => {
    const { error } = await supabase.from('bazi_records').delete().eq('id', id);
    return error ? { success: false, error: error.message } : { success: true };
  },

  updateAiAnalysis: async (id: string, aiAnalysis: string): Promise<ApiResponse<void>> => {
    const { error } = await supabase
      .from('bazi_records')
      .update({ ai_analysis: aiAnalysis, ai_analyzed_at: Date.now(), ai_model: 'deepseek' })
      .eq('id', id);
    return error ? { success: false, error: error.message } : { success: true };
  },

  updateVerification: async (
    id: string,
    data: { actualFeedback: string; accuracyRating: number; userNotes?: string }
  ): Promise<ApiResponse<void>> => {
    const { error } = await supabase
      .from('bazi_records')
      .update({
        is_verified: true,
        actual_feedback: data.actualFeedback,
        accuracy_rating: data.accuracyRating,
        user_notes: data.userNotes || null,
        verify_time: Date.now(),
      })
      .eq('id', id);
    return error ? { success: false, error: error.message } : { success: true };
  },

  calculatePillars: async (data: {
    gender: Gender;
    birthDatetime: number;
    useTrueSolarTime?: boolean;
    birthLocation?: string;
  }): Promise<ApiResponse<CalculatePillarsResponse>> => {
    try {
      const { bazi, decorated, dayun } = await buildBazi(data);
      return normalizeApiResponse({
        success: true,
        data: {
          bazi,
          shiShen: decorated.shiShen,
          wuXing: decorated.wuXing,
          relations: decorated.relations,
          dayun,
          qiyunAge: dayun.qiyunAge,
        },
      });
    } catch (error: any) {
      return { success: false, error: error.message || '计算四柱失败' };
    }
  },
};

export const analyzeBaziStream = async (
  data: AiAnalyzeRequest,
  onChunk: (content: string) => void,
  onError: (error: string) => void,
  onComplete?: () => void
): Promise<void> => {
  let hasContent = false;

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('未登录');
    }

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ ...data, type: 'bazi' }),
    });

    if (!response.ok) {
      throw new Error(`AI分析请求失败 (${response.status})`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('无法读取流式响应');

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      for (const line of decoder.decode(value).split('\n').filter((item) => item.trim())) {
        if (!line.startsWith('data: ')) continue;
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
        } catch {
          // Ignore malformed SSE chunks.
        }
      }
    }

    if (hasContent) onComplete?.();
  } catch (error: any) {
    onError(normalizeLegacyText(error.message || 'AI分析失败'));
  }
};

export const analyzeBaziSync = async (
  data: AiAnalyzeRequest
): Promise<ApiResponse<{ analysis: string; model: string }>> => {
  let content = '';
  await analyzeBaziStream(
    data,
    (chunk) => {
      content += chunk;
    },
    (error) => {
      throw new Error(error);
    }
  );
  return { success: true, data: { analysis: content, model: 'deepseek' } };
};

export default baziApi;
