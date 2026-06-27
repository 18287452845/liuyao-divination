import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function authEmail(username: string) {
  const normalized = username.trim().toLowerCase();
  return normalized.includes('@') ? normalized : `${normalized}@auth.liuyao.app`;
}

function randomPassword() {
  return `Liuyao-${crypto.randomUUID().slice(0, 8)}!`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ success: false, message: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('Authorization') || '';
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_ANON_KEY') || '',
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: isAdmin, error: adminCheckError } = await userClient.rpc('is_app_admin');
  if (adminCheckError || !isAdmin) {
    return json({ success: false, message: '权限不足' }, 403);
  }

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!serviceKey) {
    return json({ success: false, message: '缺少 SUPABASE_SERVICE_ROLE_KEY' }, 500);
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL') || '', serviceKey);
  const body = await req.json().catch(() => ({}));
  const action = body.action as string;

  try {
    if (action === 'create-user') {
      const username = String(body.username || '').trim();
      const password = String(body.password || '').trim();
      if (!username || !password) return json({ success: false, message: '用户名和密码不能为空' }, 400);

      const email = body.email || authEmail(username);
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { username, real_name: body.realName || null },
      });
      if (createError || !created.user) throw createError || new Error('创建 Auth 用户失败');

      const userId = created.user.id;
      const { error: profileError } = await admin.from('users').insert({
        id: userId,
        username,
        password: '',
        email,
        real_name: body.realName || null,
        status: 1,
        email_verified: true,
        last_password_change: new Date().toISOString(),
      });
      if (profileError) throw profileError;

      const roleIds = Array.isArray(body.roleIds) ? body.roleIds : [];
      if (roleIds.length > 0) {
        const { error: roleError } = await admin.from('user_roles').insert(
          roleIds.map((roleId: string) => ({
            id: crypto.randomUUID(),
            user_id: userId,
            role_id: roleId,
          })),
        );
        if (roleError) throw roleError;
      }

      return json({ success: true, data: { id: userId } });
    }

    if (action === 'delete-user') {
      const userId = String(body.userId || '');
      if (!userId) return json({ success: false, message: '缺少用户ID' }, 400);
      await admin.from('users').delete().eq('id', userId);
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) throw error;
      return json({ success: true });
    }

    if (action === 'reset-password') {
      const userId = String(body.userId || '');
      if (!userId) return json({ success: false, message: '缺少用户ID' }, 400);
      const newPassword = randomPassword();
      const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword });
      if (error) throw error;
      await admin.from('users').update({ last_password_change: new Date().toISOString() }).eq('id', userId);
      return json({ success: true, data: { newPassword } });
    }

    return json({ success: false, message: `未知操作: ${action}` }, 400);
  } catch (error) {
    return json({ success: false, message: error instanceof Error ? error.message : String(error) }, 500);
  }
});
