import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { AiChatMessage } from '../types/ai';

interface AiChatPanelProps {
  messages: AiChatMessage[];
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
}

const AiChatPanel: React.FC<AiChatPanelProps> = ({
  messages,
  value,
  onValueChange,
  onSubmit,
  loading,
  error,
  disabled = false,
  placeholder = '继续追问，例如：这个应期怎么看？',
}) => {
  const canSubmit = value.trim().length > 0 && !loading && !disabled;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (canSubmit) {
      onSubmit();
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">继续追问</h2>
          <p className="text-sm text-gray-500 mt-1">基于当前排盘和 AI 分析临时对话，刷新后不保存。</p>
        </div>
        {loading && <span className="text-sm text-primary whitespace-nowrap">AI 回复中...</span>}
      </div>

      {messages.length > 0 && (
        <div className="space-y-4 mb-5 max-h-[520px] overflow-y-auto pr-1">
          {messages.map((message, index) => (
            <div
              key={index}
              className={
                message.role === 'user'
                  ? 'ml-auto max-w-[88%] rounded-lg bg-primary text-white px-4 py-3'
                  : 'mr-auto max-w-[92%] rounded-lg bg-gray-50 border border-gray-200 px-4 py-3'
              }
            >
              <div className={message.role === 'user' ? 'whitespace-pre-wrap text-sm leading-relaxed' : 'markdown-content prose prose-slate max-w-none text-sm'}>
                {message.role === 'user' ? (
                  message.content
                ) : message.content ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                ) : (
                  <span className="text-gray-500">正在整理回答...</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          disabled={loading || disabled}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none disabled:bg-gray-100"
          placeholder={placeholder}
        />
        <div className="flex justify-end">
          <button type="submit" disabled={!canSubmit} className="btn-primary px-6 py-2 disabled:bg-gray-400 disabled:cursor-not-allowed">
            发送追问
          </button>
        </div>
      </form>
    </div>
  );
};

export default AiChatPanel;

