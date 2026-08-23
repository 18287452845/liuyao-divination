import React, { useEffect, useState } from 'react';
import { fetchWithAutoRefresh } from '../utils/tokenRefresh';
import { useAuth } from '../contexts/AuthContext';

interface ApiKeyInfo {
  hasApiKey: boolean;
  apiKey: string | null;
  updatedAt: string | null;
  systemKeyConfigured?: boolean;
}

// 与服务端 validateApiKeyFormat 保持一致的客户端预校验
function validateKeyFormat(key: string): string | null {
  if (!key.startsWith('sk-')) return 'API Key 格式不正确，应以 sk- 开头';
  if (key.length < 20) return 'API Key 长度不正确，请检查是否完整复制';
  if (key.length > 255) return 'API Key 过长，请检查是否粘贴了错误的内容';
  if (/\s/.test(key)) return 'API Key 不能包含空格或换行';
  return null;
}

const ApiKeySettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [apiKeyInfo, setApiKeyInfo] = useState<ApiKeyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetchApiKeyInfo();
  }, []);

  const fetchApiKeyInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchWithAutoRefresh('/api/user/api-key');
      const data = await response.json();

      if (response.ok && data.success) {
        setApiKeyInfo(data.data);
      } else {
        setError(data.message || '获取 API Key 信息失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
      console.error('获取 API Key 错误:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKey = async () => {
    const key = newApiKey.trim();

    const formatError = validateKeyFormat(key);
    if (formatError) {
      setError(formatError);
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetchWithAutoRefresh('/api/user/api-key', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: key }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('API Key 已保存，仅对当前账号生效');
        setIsEditing(false);
        setNewApiKey('');
        setShowKey(false);
        await fetchApiKeyInfo();
      } else {
        setError(data.message || '保存失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
      console.error('保存 API Key 错误:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteApiKey = async () => {
    const fallbackHint = apiKeyInfo?.systemKeyConfigured
      ? '删除后将回退使用系统 Key 进行 AI 分析。'
      : '系统未配置 Key，删除后将无法使用 AI 分析功能。';

    if (!confirm(`确定要删除当前账号的 API Key 吗？\n\n${fallbackHint}`)) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetchWithAutoRefresh('/api/user/api-key', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('API Key 已删除');
        await fetchApiKeyInfo();
      } else {
        setError(data.message || '删除失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
      console.error('删除 API Key 错误:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleTestApiKey = async () => {
    const keyToTest = isEditing ? newApiKey.trim() : null;

    if (isEditing) {
      if (!keyToTest) {
        setError('请输入 API Key');
        return;
      }
      const formatError = validateKeyFormat(keyToTest);
      if (formatError) {
        setError(formatError);
        return;
      }
    }

    if (!isEditing && !apiKeyInfo?.hasApiKey) {
      setError('请先配置 API Key');
      return;
    }

    try {
      setTesting(true);
      setError(null);
      setSuccess(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      const response = await fetchWithAutoRefresh('/api/user/api-key/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(keyToTest ? { apiKey: keyToTest } : {}),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (data.success) {
        setSuccess(keyToTest ? 'API Key 验证成功，可以保存使用' : 'API Key 验证成功');
      } else {
        setError(data.message || 'API Key 验证失败');
        if (import.meta.env.DEV && data.debug) {
          console.error('API Key 测试调试信息:', data.debug);
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('请求超时，请检查网络连接后重试');
      } else {
        setError('网络错误，请稍后重试');
      }
      console.error('测试 API Key 错误:', err);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-yellow-50 flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-yellow-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">DeepSeek API Key 设置</h1>
          <p className="text-gray-600">配置个人 API Key 以使用 AI 解卦、八字批注和追问功能</p>
        </div>

        {/* 按账号隔离说明 */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-xl leading-none mt-0.5">🔐</span>
            <div>
              <p className="text-sm text-amber-900 font-medium mb-1">
                当前账号：{user?.username || '未知用户'}
              </p>
              <p className="text-sm text-amber-800 leading-relaxed">
                API Key 仅绑定当前账号，保存后只有本账号的 AI 分析（解卦、八字、追问）会使用它，
                对其他账号不可见、不生效；其他账号的 Key 也不会影响本账号。
              </p>
              {apiKeyInfo?.systemKeyConfigured !== undefined && (
                <p className="text-sm text-amber-700 mt-2">
                  {apiKeyInfo.hasApiKey
                    ? '已配置个人 Key 时始终优先使用个人 Key。'
                    : apiKeyInfo.systemKeyConfigured
                      ? '当前未配置个人 Key，AI 分析将使用系统 Key；配置个人 Key 后自动优先使用个人 Key。'
                      : '系统未配置 Key，必须配置个人 Key 后才能使用 AI 分析功能。'}
                </p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {apiKeyInfo?.hasApiKey ? '当前 API Key' : '配置 API Key'}
          </h2>

          {!isEditing ? (
            <div>
              {apiKeyInfo?.hasApiKey ? (
                <div>
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-600 mb-2">API Key（已脱敏，仅本账号可见）</p>
                    <p className="font-mono text-gray-800 break-all">{apiKeyInfo.apiKey}</p>
                    {apiKeyInfo.updatedAt && (
                      <p className="text-xs text-gray-500 mt-2">
                        最后更新: {new Date(apiKeyInfo.updatedAt).toLocaleString('zh-CN')}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      更新 API Key
                    </button>
                    <button
                      onClick={handleTestApiKey}
                      disabled={testing}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {testing ? '测试中...' : '测试连接'}
                    </button>
                    <button
                      onClick={handleDeleteApiKey}
                      disabled={saving}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      删除 API Key
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 mb-4">当前账号还没有配置个人 API Key</p>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    配置 API Key
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">新的 API Key</label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={newApiKey}
                    onChange={(e) => setNewApiKey(e.target.value)}
                    placeholder="sk-开头，请完整粘贴，首尾多余的空格会自动去除"
                    autoComplete="off"
                    className="w-full px-4 py-3 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700"
                  >
                    {showKey ? '隐藏' : '显示'}
                  </button>
                </div>
                {newApiKey.trim() && validateKeyFormat(newApiKey.trim()) && (
                  <p className="text-sm text-red-600 mt-2">{validateKeyFormat(newApiKey.trim())}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleSaveApiKey}
                  disabled={saving || !newApiKey.trim() || !!validateKeyFormat(newApiKey.trim())}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
                <button
                  onClick={handleTestApiKey}
                  disabled={testing || !newApiKey.trim() || !!validateKeyFormat(newApiKey.trim())}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {testing ? '测试中...' : '先测试再保存'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setNewApiKey('');
                    setShowKey(false);
                    setError(null);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">说明</h2>
          <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
            <li>Key 以 <code className="bg-gray-100 px-1 rounded">sk-</code> 开头，可在 DeepSeek 开放平台的管理控制台获取。</li>
            <li>保存前可点击「先测试再保存」验证 Key 的有效性，避免保存无效 Key。</li>
            <li>Key 存储在您自己的账号数据中，页面上仅脱敏显示，不会展示给其他用户或管理员。</li>
            <li>更新 Key 后立即生效，下一次 AI 分析（解卦、八字、追问）即使用新 Key。</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ApiKeySettingsPage;
