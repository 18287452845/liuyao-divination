import type { BaZi, DivinationCategory, DivinationMethod, DivinationRecord, Gender, Gua } from '../types';
import { Lunar } from 'lunar-javascript';
import { supabase } from '../lib/supabase';
import { FIVE_ELEMENTS, KONG_WANG_MAP, LIU_CHONG, LIU_HE, SAN_HE, TRIGRAMS } from '../domain/liuyao/constants';
import {
  decorateGua,
  divinationByInput,
  divinationByManual,
  divinationByNumbers,
  divinationByTime,
  generateBianGua,
  normalizeGuaByMethod,
  simulateYaoGua,
} from '../domain/liuyao/liuyao';
import { analyzeLiuyaoJudgement } from '../domain/liuyao/liuyaoAnalysis';
import { normalizeLegacyText } from './textNormalize';

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

function parseJsonField<T>(value: unknown): T | undefined {
  if (value == null) {
    return undefined;
  }

  if (typeof value !== 'string') {
    return value as T;
  }

  return JSON.parse(value) as T;
}

function normalizeRecord(row: any): DivinationRecord {
  const timestamp = Number(row.timestamp);
  const date = new Date(timestamp);
  const benGua = normalizeGuaByMethod(parseJsonField<Gua>(row.ben_gua) || null, row.method);
  if (!benGua) {
    throw new Error('记录中的本卦数据无效');
  }

  const bianGua: Gua | null = benGua ? generateBianGua(benGua) : parseJsonField<Gua>(row.bian_gua) || null;
  const storedDecoration = parseJsonField<any>(row.decoration);
  const category = storedDecoration?.traditionalAnalysis?.category;
  const decoration = benGua ? decorateGua(benGua, date) : storedDecoration;

  if (benGua && decoration) {
    (decoration as any).traditionalAnalysis = analyzeLiuyaoJudgement({
      gua: benGua,
      decoration,
      question: row.question,
      gender: row.gender || undefined,
      category,
    });
  }

  return {
    id: row.id,
    timestamp,
    question: row.question,
    gender: row.gender || undefined,
    bazi: parseJsonField(row.bazi),
    method: row.method,
    benGua,
    bianGua,
    decoration: decoration as any,
    aiAnalysis: row.ai_analysis || undefined,
    isVerified: row.is_verified || false,
    actualResult: row.actual_result || undefined,
    verifyTime: row.verify_time ? Number(row.verify_time) : undefined,
    accuracyRating: row.accuracy_rating || undefined,
    userNotes: row.user_notes || undefined,
  };
}

async function getCurrentSupabaseUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('未登录');
  }

  return user.id;
}

function buildDivination(data: {
  method: DivinationMethod;
  category?: DivinationCategory;
  question: string;
  gender?: Gender;
  bazi?: BaZi;
  data?: any;
}) {
  const timestamp = Date.now();
  const date = new Date(timestamp);
  let benGua;

  if (data.method === 'time') {
    benGua = divinationByTime(date);
  } else if (data.method === 'number') {
    benGua = divinationByNumbers(data.data?.num1, data.data?.num2, data.data?.num3);
  } else if (data.method === 'manual') {
    benGua = divinationByManual(data.data?.yaoResults);
  } else if (data.method === 'input') {
    benGua = divinationByInput(data.data?.lines, data.data?.changes);
  } else {
    throw new Error('不支持的起卦方式');
  }

  const bianGua = generateBianGua(benGua);
  const decoration = decorateGua(benGua, date);
  (decoration as any).traditionalAnalysis = analyzeLiuyaoJudgement({
    gua: benGua,
    decoration,
    question: data.question,
    gender: data.gender,
    category: data.category,
  });

  return { timestamp, benGua, bianGua, decoration };
}

export const divinationApi = {
  createDivination: async (data: {
    method: DivinationMethod;
    category?: DivinationCategory;
    question: string;
    gender?: Gender;
    bazi?: BaZi;
    data?: any;
  }) => {
    const userId = await getCurrentSupabaseUserId();
    const { timestamp, benGua, bianGua, decoration } = buildDivination(data);
    const id = crypto.randomUUID();

    const { error } = await supabase.from('divination_records').insert({
      id,
      timestamp,
      question: data.question,
      gender: data.gender || null,
      bazi: data.bazi ? JSON.stringify(data.bazi) : null,
      method: data.method,
      ben_gua: JSON.stringify(benGua),
      bian_gua: bianGua ? JSON.stringify(bianGua) : null,
      decoration: JSON.stringify(decoration),
      user_id: userId,
    });

    if (error) {
      throw new Error(error.message || '创建占卜失败');
    }

    return {
      id,
      timestamp,
      question: data.question,
      gender: data.gender || undefined,
      bazi: data.bazi || undefined,
      method: data.method,
      benGua,
      bianGua,
      decoration,
    };
  },

  simulateShake: async () => {
    return { result: simulateYaoGua() };
  },

  getRecords: async (params?: { search?: string; limit?: number; offset?: number }) => {
    let query = supabase
      .from('divination_records')
      .select('*')
      .order('timestamp', { ascending: false })
      .range(params?.offset || 0, (params?.offset || 0) + (params?.limit || 20) - 1);

    if (params?.search) {
      query = query.ilike('question', `%${params.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message || '获取历史记录失败');
    }

    return (data || []).map(normalizeRecord);
  },

  getRecordById: async (id: string) => {
    const { data, error } = await supabase
      .from('divination_records')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(error.message || '获取记录失败');
    }

    return normalizeRecord(data);
  },

  updateAiAnalysis: async (id: string, aiAnalysis: string) => {
    const { error } = await supabase
      .from('divination_records')
      .update({ ai_analysis: aiAnalysis })
      .eq('id', id);

    if (error) {
      throw new Error(error.message || '保存 AI 分析失败');
    }

    return { success: true };
  },

  deleteRecord: async (id: string) => {
    const { error } = await supabase.from('divination_records').delete().eq('id', id);

    if (error) {
      throw new Error(error.message || '删除记录失败');
    }

    return { success: true };
  },

  updateVerification: async (
    id: string,
    data: {
      actual_result: string;
      accuracy_rating: number;
      user_notes?: string;
    }
  ) => {
    const { error } = await supabase
      .from('divination_records')
      .update({
        is_verified: true,
        actual_result: data.actual_result,
        accuracy_rating: data.accuracy_rating,
        user_notes: data.user_notes || null,
        verify_time: Date.now(),
      })
      .eq('id', id);

    if (error) {
      throw new Error(error.message || '更新验证反馈失败');
    }

    return { success: true };
  },

  cancelVerification: async (id: string) => {
    const { error } = await supabase
      .from('divination_records')
      .update({
        is_verified: false,
        actual_result: null,
        accuracy_rating: null,
        user_notes: null,
        verify_time: null,
      })
      .eq('id', id);

    if (error) {
      throw new Error(error.message || '取消验证反馈失败');
    }

    return { success: true };
  },

  getVerifiedRecords: async (params?: { limit?: number; offset?: number }) => {
    const { data, error } = await supabase
      .from('divination_records')
      .select('*')
      .eq('is_verified', true)
      .order('timestamp', { ascending: false })
      .range(params?.offset || 0, (params?.offset || 0) + (params?.limit || 20) - 1);

    if (error) {
      throw new Error(error.message || '获取已验证记录失败');
    }

    return (data || []).map(normalizeRecord);
  },

  getUnverifiedRecords: async (params?: { limit?: number; offset?: number }) => {
    const { data, error } = await supabase
      .from('divination_records')
      .select('*')
      .or('is_verified.eq.false,is_verified.is.null')
      .order('timestamp', { ascending: false })
      .range(params?.offset || 0, (params?.offset || 0) + (params?.limit || 20) - 1);

    if (error) {
      throw new Error(error.message || '获取未验证记录失败');
    }

    return (data || []).map(normalizeRecord);
  },

  getStatistics: async () => {
    const { count: total, error: totalError } = await supabase
      .from('divination_records')
      .select('id', { count: 'exact', head: true });
    const { count: verified, error: verifiedError } = await supabase
      .from('divination_records')
      .select('id', { count: 'exact', head: true })
      .eq('is_verified', true);

    if (totalError || verifiedError) {
      throw new Error(totalError?.message || verifiedError?.message || '获取统计失败');
    }

    return {
      total: total || 0,
      verified: verified || 0,
      unverified: (total || 0) - (verified || 0),
    };
  },
};

export const analyzeGuaStream = async (
  data: any,
  onChunk: (content: string) => void,
  onError: (error: string) => void,
  onComplete?: () => void
) => {
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
      body: JSON.stringify({ type: 'gua', data, requestTimestamp: Date.now() }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(getResponseErrorMessage(errorText, `解卦请求失败 (${response.status})`));
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
      const lines = chunk.split('\n').filter((line) => line.trim() !== '');

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

function calculateKongWang(dayGanZhi: string): [string, string] {
  for (const [xunStart, kongWang] of Object.entries(KONG_WANG_MAP)) {
    const startStem = xunStart.charAt(0);
    const startIndex = '甲乙丙丁戊己庚辛壬癸'.indexOf(startStem);
    const dayStem = dayGanZhi.charAt(0);
    const dayIndex = '甲乙丙丁戊己庚辛壬癸'.indexOf(dayStem);

    if (startIndex >= 0 && dayIndex >= 0) {
      const diff = (dayIndex - startIndex + 10) % 10;
      if (diff >= 0 && diff < 10) {
        return kongWang;
      }
    }
  }

  return Object.values(KONG_WANG_MAP)[0] || ['', ''];
}

function getSanHe(branch: string): { name: string; branches: string[] } | null {
  for (const [name, sanheData] of Object.entries(SAN_HE as any)) {
    if ((sanheData as any).branches?.includes(branch)) {
      return { name, branches: (sanheData as any).branches };
    }
  }
  return null;
}

function getBranchDescription(branch: string): string {
  return `${branch}：五行属${FIVE_ELEMENTS[branch] || '未知'}。`;
}

async function handleToolGet(url: string, params?: any) {
  if (url === '/tools/calendar/solar-to-lunar') {
    const date = new Date(Number(params.year), Number(params.month) - 1, Number(params.day));
    const lunar = Lunar.fromDate(date);
    const dayGanZhi = lunar.getDayInGanZhi();
    const kongWang = calculateKongWang(dayGanZhi);
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

    return {
      data: {
        solar: {
          year: Number(params.year),
          month: Number(params.month),
          day: Number(params.day),
          weekDay: weekDays[date.getDay()],
        },
        lunar: {
          year: lunar.getYear(),
          month: lunar.getMonth(),
          day: lunar.getDay(),
          yearGanZhi: lunar.getYearInGanZhi(),
          monthGanZhi: lunar.getMonthInGanZhi(),
          dayGanZhi,
          yearZodiac: `${lunar.getYearInGanZhi()}年`,
          monthName: `${lunar.getMonth()}月`,
          dayName: `${lunar.getDay()}日`,
        },
        jieQi: {
          current: (lunar as any).getPrevJie?.()?.getName?.() || '',
          nextJie: (lunar as any).getNextJie?.()?.getName?.() || '',
          nextJieDate: (lunar as any).getNextJie?.()?.getSolar?.()?.toYmd?.() || '',
          nextQi: (lunar as any).getNextQi?.()?.getName?.() || '',
          nextQiDate: (lunar as any).getNextQi?.()?.getSolar?.()?.toYmd?.() || '',
        },
        kongWang: {
          branches: kongWang,
          description: `${kongWang[0]}${kongWang[1]}空`,
        },
      },
    };
  }

  if (url === '/tools/branch/relations') {
    const branch = params.branch;
    const hePartner = Object.entries(LIU_HE).find(([k, v]) => k === branch || v === branch);
    const chongPartner = Object.entries(LIU_CHONG).find(([k, v]) => k === branch || v === branch);

    return {
      data: {
        branch,
        element: FIVE_ELEMENTS[branch] || '未知',
        he: hePartner ? (hePartner[0] === branch ? hePartner[1] : hePartner[0]) : null,
        chong: chongPartner ? (chongPartner[0] === branch ? chongPartner[1] : chongPartner[0]) : null,
        sanhe: getSanHe(branch),
        description: getBranchDescription(branch),
      },
    };
  }

  if (url === '/tools/yongshen/categories') {
    return {
      data: [
        { id: 'wealth', name: '求财', icon: '财' },
        { id: 'career', name: '事业', icon: '官' },
        { id: 'relationship', name: '感情', icon: '情' },
        { id: 'health', name: '健康', icon: '康' },
        { id: 'exam', name: '考试', icon: '考' },
        { id: 'lawsuit', name: '官司', icon: '讼' },
      ],
    };
  }

  if (url === '/tools/yongshen/helper') {
    const mapping: Record<string, any> = {
      wealth: { yongShen: '妻财', yuanShen: '子孙', jiShen: '兄弟', chouShen: '父母', description: '求财以妻财为用神，子孙为原神，兄弟为忌神。' },
      career: { yongShen: '官鬼', yuanShen: '父母', jiShen: '子孙', chouShen: '兄弟', description: '事业功名以官鬼为用神，父母为原神。' },
      relationship: { yongShen: '妻财/官鬼', yuanShen: '子孙/父母', jiShen: '兄弟', chouShen: '子孙', description: '感情按性别取妻财或官鬼，并结合世应旺衰。' },
      health: { yongShen: '官鬼', yuanShen: '父母', jiShen: '子孙', chouShen: '兄弟', description: '疾病以官鬼为病，子孙为医药。' },
      exam: { yongShen: '官鬼', yuanShen: '父母', jiShen: '兄弟', chouShen: '子孙', description: '考试以官鬼为名次，父母为文书。' },
      lawsuit: { yongShen: '世爻', yuanShen: '子孙', jiShen: '应爻', chouShen: '官鬼', description: '官司重世应强弱，并看官鬼对子孙的制化。' },
    };
    return { data: mapping[params.category] || mapping.wealth };
  }

  if (url === '/tools/gua/list') {
    const { data, error } = await supabase
      .from('gua_data')
      .select('number, name, upper_trigram, lower_trigram, gua_ci')
      .order('number', { ascending: true });

    if (error) throw error;

    return {
      data: (data || []).map((gua: any) => ({
        number: gua.number,
        name: gua.name,
        upperTrigram: gua.upper_trigram,
        lowerTrigram: gua.lower_trigram,
        upperSymbol: TRIGRAMS[gua.upper_trigram]?.symbol || '',
        lowerSymbol: TRIGRAMS[gua.lower_trigram]?.symbol || '',
        guaCi: gua.gua_ci,
      })),
    };
  }

  if (url.startsWith('/tools/gua/')) {
    const number = Number(url.split('/').pop());
    const { data, error } = await supabase
      .from('gua_data')
      .select('*')
      .eq('number', number)
      .single();

    if (error) throw error;

    return {
      data: {
        number: data.number,
        name: data.name,
        upperTrigram: data.upper_trigram,
        lowerTrigram: data.lower_trigram,
        upperSymbol: TRIGRAMS[data.upper_trigram]?.symbol || '',
        lowerSymbol: TRIGRAMS[data.lower_trigram]?.symbol || '',
        upperElement: TRIGRAMS[data.upper_trigram]?.element || '',
        lowerElement: TRIGRAMS[data.lower_trigram]?.element || '',
        guaCi: data.gua_ci,
        yaoCi: parseJsonField<string[]>(data.yao_ci) || String(data.yao_ci || '').split('\n').filter(Boolean),
      },
    };
  }

  throw new Error(`未迁移的工具接口: ${url}`);
}

function roleToOption(role: any) {
  return {
    id: role.id,
    roleName: role.role_name,
    roleCode: role.role_code,
    role_name: role.role_name,
    role_code: role.role_code,
    description: role.description,
    status: role.status,
  };
}

function userToAdminRow(user: any, roles: any[] = []) {
  return {
    id: user.id,
    username: user.username,
    email: user.email || undefined,
    realName: user.real_name || undefined,
    avatar: user.avatar || undefined,
    status: user.status,
    roles: roles.map((role) => role.role_name).join(', '),
    roleCodes: roles.map((role) => role.role_code).join(','),
    lastLoginAt: user.last_login_at || undefined,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

function roleToAdminRow(role: any, userCount = 0, permissionCount = 0) {
  return {
    id: role.id,
    roleName: role.role_name,
    roleCode: role.role_code,
    description: role.description,
    status: role.status,
    userCount,
    permissionCount,
    createdAt: role.created_at,
  };
}

function permissionToAdminRow(permission: any) {
  return {
    id: permission.id,
    permissionName: permission.permission_name,
    permissionCode: permission.permission_code,
    permission_name: permission.permission_name,
    permission_code: permission.permission_code,
    module: permission.module,
    description: permission.description,
    status: permission.status,
  };
}

function inviteToAdminRow(code: any) {
  return {
    id: code.id,
    code: code.code,
    name: code.name,
    description: code.description,
    maxUses: code.max_uses,
    usedCount: code.used_count,
    expiresAt: code.expires_at,
    status: code.status,
    createdAt: code.created_at,
  };
}

async function getCurrentSessionToken() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('未登录');
  return session.access_token;
}

async function callAdminApi(payload: Record<string, any>) {
  const token = await getCurrentSessionToken();
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.success) {
    throw new Error(data?.message || '管理员操作失败');
  }
  return { data };
}

async function replaceRolePermissions(roleId: string, permissionIds: string[]) {
  const { error: deleteError } = await supabase.from('role_permissions').delete().eq('role_id', roleId);
  if (deleteError) throw deleteError;
  if (permissionIds.length === 0) return;
  const { error } = await supabase.from('role_permissions').insert(
    permissionIds.map((permissionId) => ({
      id: crypto.randomUUID(),
      role_id: roleId,
      permission_id: permissionId,
    }))
  );
  if (error) throw error;
}

async function replaceUserRoles(userId: string, roleIds: string[]) {
  const { error: deleteError } = await supabase.from('user_roles').delete().eq('user_id', userId);
  if (deleteError) throw deleteError;
  if (roleIds.length === 0) return;
  const { error } = await supabase.from('user_roles').insert(
    roleIds.map((roleId) => ({
      id: crypto.randomUUID(),
      user_id: userId,
      role_id: roleId,
    }))
  );
  if (error) throw error;
}

function makeCsv(rows: any[]) {
  const headers = ['id', 'username', 'ipAddress', 'loginStatus', 'loginTime', 'failReason'];
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((key) => JSON.stringify(row[key] ?? '')).join(','));
  }
  return new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
}

async function handleAdminGet(url: string, params?: any) {
  if (url === '/roles/all') {
    const { data, error } = await supabase.from('roles').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    return { data: (data || []).map(roleToOption) };
  }

  if (url === '/permissions') {
    const { data, error } = await supabase.from('permissions').select('*').order('module', { ascending: true });
    if (error) throw error;
    const permissions = (data || []).map(permissionToAdminRow);
    const grouped = permissions.reduce((acc: Record<string, any[]>, permission) => {
      const module = permission.module || 'other';
      acc[module] = acc[module] || [];
      acc[module].push(permission);
      return acc;
    }, {});
    return { data: { success: true, data: { list: permissions, grouped } } };
  }

  if (url === '/statistics') {
    return { data: await divinationApi.getStatistics() };
  }

  if (url === '/users') {
    let query = supabase.from('users').select('*', { count: 'exact' }).order('created_at', { ascending: false });
    if (params?.search) {
      query = query.or(`username.ilike.%${params.search}%,email.ilike.%${params.search}%`);
    }
    const page = Number(params?.page || 1);
    const pageSize = Number(params?.pageSize || 20);
    const from = (page - 1) * pageSize;
    const { data, error, count } = await query.range(from, from + pageSize - 1);
    if (error) throw error;
    const userIds = (data || []).map((user: any) => user.id);
    const { data: roleRows, error: rolesError } = userIds.length
      ? await supabase.from('user_roles').select('user_id, roles(role_name, role_code)').in('user_id', userIds)
      : { data: [], error: null } as any;
    if (rolesError) throw rolesError;
    const rolesByUser = new Map<string, any[]>();
    for (const row of roleRows || []) {
      rolesByUser.set(row.user_id, [...(rolesByUser.get(row.user_id) || []), row.roles]);
    }
    return {
      data: {
        success: true,
        data: {
          list: (data || []).map((user: any) => userToAdminRow(user, rolesByUser.get(user.id) || [])),
          total: count || 0,
          page,
          pageSize,
        },
      },
    };
  }

  if (url === '/roles') {
    const page = Number(params?.page || 1);
    const pageSize = Number(params?.pageSize || 20);
    const from = (page - 1) * pageSize;
    let query = supabase.from('roles').select('*', { count: 'exact' }).order('created_at', { ascending: false });
    if (params?.search) query = query.ilike('role_name', `%${params.search}%`);
    const { data, error, count } = await query.range(from, from + pageSize - 1);
    if (error) throw error;
    const roleIds = (data || []).map((role: any) => role.id);
    const [{ data: userRoles }, { data: rolePerms }] = await Promise.all([
      roleIds.length ? supabase.from('user_roles').select('role_id').in('role_id', roleIds) : Promise.resolve({ data: [] }),
      roleIds.length ? supabase.from('role_permissions').select('role_id').in('role_id', roleIds) : Promise.resolve({ data: [] }),
    ]);
    const countBy = (rows: any[]) => rows.reduce((acc, row) => ({ ...acc, [row.role_id]: (acc[row.role_id] || 0) + 1 }), {} as Record<string, number>);
    const usersByRole = countBy(userRoles || []);
    const permsByRole = countBy(rolePerms || []);
    return {
      data: {
        success: true,
        data: {
          list: (data || []).map((role: any) => roleToAdminRow(role, usersByRole[role.id] || 0, permsByRole[role.id] || 0)),
          total: count || 0,
          page,
          pageSize,
        },
      },
    };
  }

  if (url.startsWith('/roles/')) {
    const roleId = url.split('/').pop()!;
    const { data: role, error } = await supabase.from('roles').select('*').eq('id', roleId).single();
    if (error) throw error;
    const { data: permissionRows, error: permissionError } = await supabase
      .from('role_permissions')
      .select('permissions(*)')
      .eq('role_id', roleId);
    if (permissionError) throw permissionError;
    return {
      data: {
        success: true,
        data: {
          ...roleToAdminRow(role),
          permissions: (permissionRows || []).map((row: any) => permissionToAdminRow(row.permissions)),
        },
      },
    };
  }

  if (url === '/invite-codes') {
    const page = Number(params?.page || 1);
    const pageSize = Number(params?.pageSize || 20);
    const from = (page - 1) * pageSize;
    let query = supabase.from('invite_codes').select('*', { count: 'exact' }).order('created_at', { ascending: false });
    if (params?.search) query = query.or(`code.ilike.%${params.search}%,name.ilike.%${params.search}%,description.ilike.%${params.search}%`);
    const { data, error, count } = await query.range(from, from + pageSize - 1);
    if (error) throw error;
    return { data: { success: true, data: { list: (data || []).map(inviteToAdminRow), total: count || 0, page, pageSize } } };
  }

  if (url === '/invite-codes/generate/random') {
    return { data: { success: true, data: { code: Math.random().toString(36).slice(2, 10).toUpperCase() } } };
  }

  if (url === '/logs/login' || url === '/logs/login/export') {
    const page = Number(params?.page || 1);
    const pageSize = Number(params?.pageSize || 20);
    const from = (page - 1) * pageSize;
    let query = supabase.from('login_logs').select('*', { count: 'exact' }).order('login_time', { ascending: false });
    if (params?.search) query = query.ilike('username', `%${params.search}%`);
    if (params?.status !== undefined && params?.status !== '') query = query.eq('login_status', Number(params.status));
    const { data, error, count } = await query.range(from, from + pageSize - 1);
    if (error) throw error;
    const list = (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      username: row.username,
      ipAddress: row.ip_address,
      loginStatus: row.login_status,
      statusText: row.login_status === 1 ? '成功' : '失败',
      loginTime: row.login_time,
      failReason: row.failure_reason,
    }));
    return url.endsWith('/export')
      ? { data: makeCsv(list) }
      : { data: { success: true, data: { list, total: count || 0, page, pageSize } } };
  }

  if (url === '/sessions/statistics') {
    const { count } = await supabase.from('user_sessions').select('id', { count: 'exact', head: true }).eq('is_active', true);
    return { data: { success: true, data: { total: count || 0, active: count || 0 } } };
  }

  if (url === '/sessions') {
    const page = Number(params?.page || 1);
    const pageSize = Number(params?.pageSize || 20);
    const from = (page - 1) * pageSize;
    let query = supabase
      .from('user_sessions')
      .select('*, users(username, real_name)', { count: 'exact' })
      .order('last_activity', { ascending: false })
      .eq('is_active', true);
    if (params?.search) {
      query = query.or(`ip_address.ilike.%${params.search}%,user_agent.ilike.%${params.search}%`);
    }
    const { data, error, count } = await query.range(from, from + pageSize - 1);
    if (error) throw error;
    const list = (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      username: row.users?.username || '-',
      realName: row.users?.real_name || '',
      sessionToken: row.session_token,
      ipAddress: row.ip_address || '-',
      userAgent: row.user_agent || '',
      lastActivity: row.last_activity,
      createdAt: row.created_at,
    }));
    return { data: { success: true, data: { list, total: count || 0, page, pageSize } } };
  }

  throw new Error(`未迁移的管理接口: ${url}`);
}

const supabaseBackedApi = {
  get: async (url: string, config?: any) => {
    if (url.startsWith('/tools/')) {
      return handleToolGet(url, config?.params || {});
    }

    return handleAdminGet(url, config?.params || {});
  },
  post: async (url: string, data?: any): Promise<{ data: any }> => {
    if (url === '/users') {
      return callAdminApi({ action: 'create-user', ...data });
    }
    if (url.endsWith('/reset-password')) {
      return callAdminApi({ action: 'reset-password', userId: url.split('/')[2] });
    }
    if (url === '/roles') {
      const id = crypto.randomUUID();
      const { error } = await supabase.from('roles').insert({
        id,
        role_name: data.roleName,
        role_code: data.roleCode,
        description: data.description || null,
        status: 1,
      });
      if (error) throw error;
      await replaceRolePermissions(id, data.permissionIds || []);
      return { data: { success: true, data: { id } } };
    }
    if (url.match(/^\/roles\/[^/]+\/permissions$/)) {
      await replaceRolePermissions(url.split('/')[2], data?.permissionIds || []);
      return { data: { success: true } };
    }
    if (url === '/invite-codes') {
      const { error } = await supabase.from('invite_codes').insert({
        id: crypto.randomUUID(),
        code: data.code,
        name: data.name || null,
        description: data.description || null,
        max_uses: Number(data.maxUses || 1),
        used_count: 0,
        expires_at: data.expiresAt || null,
        status: 1,
      });
      if (error) throw error;
      return { data: { success: true } };
    }
    throw new Error(`未迁移的 POST 接口: ${url}`);
  },
  put: async (url: string, data?: any): Promise<{ data: any }> => {
    if (url.startsWith('/users/')) {
      const userId = url.split('/')[2];
      const { error } = await supabase
        .from('users')
        .update({
          email: data.email || null,
          real_name: data.realName || null,
          avatar: data.avatar || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
      if (error) throw error;
      if (Array.isArray(data.roleIds) && data.roleIds.length > 0) await replaceUserRoles(userId, data.roleIds);
      return { data: { success: true } };
    }
    if (url.startsWith('/roles/')) {
      const roleId = url.split('/')[2];
      const { error } = await supabase
        .from('roles')
        .update({
          role_name: data.roleName,
          description: data.description || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', roleId);
      if (error) throw error;
      if (Array.isArray(data.permissionIds) && data.permissionIds.length > 0) await replaceRolePermissions(roleId, data.permissionIds);
      return { data: { success: true } };
    }
    throw new Error(`未迁移的 PUT 接口: ${url}`);
  },
  patch: async (url: string, data?: any): Promise<{ data: any }> => {
    if (url.match(/^\/users\/[^/]+\/status$/)) {
      const { error } = await supabase.from('users').update({ status: data.status }).eq('id', url.split('/')[2]);
      if (error) throw error;
      return { data: { success: true } };
    }
    if (url.match(/^\/roles\/[^/]+\/status$/)) {
      const { error } = await supabase.from('roles').update({ status: data.status }).eq('id', url.split('/')[2]);
      if (error) throw error;
      return { data: { success: true } };
    }
    if (url.match(/^\/invite-codes\/[^/]+\/status$/)) {
      const { error } = await supabase.from('invite_codes').update({ status: data.status }).eq('id', url.split('/')[2]);
      if (error) throw error;
      return { data: { success: true } };
    }
    throw new Error(`未迁移的 PATCH 接口: ${url}`);
  },
  delete: async (url: string): Promise<{ data: any }> => {
    if (url.startsWith('/users/')) {
      return callAdminApi({ action: 'delete-user', userId: url.split('/')[2] });
    }
    if (url.startsWith('/roles/')) {
      const { error } = await supabase.from('roles').delete().eq('id', url.split('/')[2]);
      if (error) throw error;
      return { data: { success: true } };
    }
    if (url.startsWith('/invite-codes/')) {
      const { error } = await supabase.from('invite_codes').delete().eq('id', url.split('/')[2]);
      if (error) throw error;
      return { data: { success: true } };
    }
    if (url.startsWith('/sessions/user/')) {
      const { error } = await supabase.from('user_sessions').update({ is_active: false }).eq('user_id', url.split('/')[3]);
      if (error) throw error;
      return { data: { success: true } };
    }
    if (url.startsWith('/sessions/')) {
      const { error } = await supabase.from('user_sessions').update({ is_active: false }).eq('id', url.split('/')[2]);
      if (error) throw error;
      return { data: { success: true } };
    }
    throw new Error(`未迁移的 DELETE 接口: ${url}`);
  },
};

export default supabaseBackedApi;
