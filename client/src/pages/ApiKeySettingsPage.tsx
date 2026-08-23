import React, { useEffect, useState } from 'react';
import { fetchWithAutoRefresh } from '../utils/tokenRefresh';

interface ApiKeyInfo {
  hasApiKey: boolean;
  apiKey: string | null;
  updatedAt: string | null;
}

const ApiKeySettingsPage: React.FC = () => {
  const [apiKeyInfo, setApiKeyInfo] = useState<ApiKeyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
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
    if (!newApiKey.trim()) {
      setError('请输入 API Key');
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
        body: JSON.stringify({ apiKey: newApiKey.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('API Key 保存成功');
        setIsEditing(false);
        setNewApiKey('');
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
    if (!confirm('确定要删除 API Key 吗？删除后将无法使用 AI 解卦功能。')) {
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

    if (isEditing && !keyToTest) {
      setError('请输入 API Key');
      return;
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
        setSuccess('API Key 验证成功');
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">API Key 设置</h1>
          <p className="text-gray-600">配置您的 DeepSeek API Key 以使用 AI 解卦功能</p>
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
          <h2 className="text-xl font-semibold text-gray-800 mb-4">当前 API Key</h2>

          {!isEditing ? (
            <div>
              {apiKeyInfo?.hasApiKey ? (
                <div>
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-600 mb-2">API Key (已脱敏)</p>
                    <p className="font-mono text-gray-800 break-all">{apiKeyInfo.apiKey}</p>
                    {apiKeyInfo.updatedAt && (
                      <p className="text-xs text-gray-500 mt-2">
                        最后更新: {new Date(apiKeyInfo.updatedAt).toLocaleString('zh-CN')}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3">
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
                  <p className="text-gray-600 mb-4">您还没有配置 API Key</p>
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
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">新的 API Key</label>
                <input
                  type="password"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  placeholder="请输入 DeepSeek API Key"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSaveApiKey}
                  disabled={saving || !newApiKey.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
                <button
                  onClick={handleTestApiKey}
                  disabled={testing || !newApiKey.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {testing ? '测试中...' : '测试 Key'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setNewApiKey('');
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
      </div>
    </div>
  );
};

export default ApiKeySettingsPage;
