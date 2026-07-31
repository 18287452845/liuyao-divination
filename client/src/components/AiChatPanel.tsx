import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { AiChatMessage } from '../types/ai';

interface AiChatPanelProps {
  messages: AiChatMessage[];
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: (question?: string) => void;
  loading: boolean;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  suggestions?: string[];
  maxLength?: number;
  onStop?: () => void;
  onClear?: () => void;
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
  suggestions = [],
  maxLength = 500,
  onStop,
  onClear,
}) => {
  const messagesRef = useRef<HTMLDivElement>(null);
  const canSubmit = value.trim().length > 0 && value.length <= maxLength && !loading && !disabled;

  useEffect(() => {
    const container = messagesRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: messages.length > 1 ? 'smooth' : 'auto',
    });
  }, [messages, loading]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (canSubmit) {
      onSubmit();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      if (canSubmit) {
        onSubmit();
      }
    }
  };

  return (
    <section className="card" aria-labelledby="ai-chat-heading" aria-busy={loading}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 id="ai-chat-heading" className="text-xl font-semibold text-gray-800">继续追问</h2>
          <p className="text-sm text-gray-500 mt-1">基于当前卦例连续对话，本标签页刷新后仍会保留。</p>
        </div>
        {messages.length > 0 && onClear && (
          <button
            type="button"
            onClick={onClear}
            disabled={loading}
            className="shrink-0 rounded-md px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            清空对话
          </button>
        )}
      </div>

      {messages.length === 0 ? (
        <div className="mb-5 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-5">
          <p className="text-sm font-medium text-gray-700">
            {suggestions.length > 0 ? '你可以从这些问题开始：' : '输入一个问题，继续深入分析当前排盘。'}
          </p>
          {suggestions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => onSubmit(suggestion)}
                  disabled={loading || disabled}
                  className="rounded-full border border-primary/30 bg-white px-3 py-2 text-sm text-primary transition-colors hover:border-primary hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div
          ref={messagesRef}
          className="mb-5 max-h-[560px] space-y-4 overflow-y-auto rounded-lg bg-gray-50/70 p-3 sm:p-4"
          aria-live="polite"
          aria-relevant="additions text"
        >
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
            >
              <div
                className={
                  message.role === 'user'
                    ? 'max-w-[88%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-white shadow-sm'
                    : 'max-w-[94%] rounded-2xl rounded-bl-md border border-gray-200 bg-white px-4 py-3 shadow-sm'
                }
              >
                <span className="sr-only">{message.role === 'user' ? '你的问题：' : 'AI 回答：'}</span>
                <div
                  className={
                    message.role === 'user'
                      ? 'whitespace-pre-wrap text-sm leading-relaxed'
                      : 'markdown-content prose prose-slate max-w-none text-sm'
                  }
                >
                  {message.role === 'user' ? (
                    message.content
                  ) : message.content ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-gray-500" role="status">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-primary" aria-hidden="true" />
                      正在整理回答...
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <label htmlFor="ai-chat-question" className="sr-only">输入追问</label>
        <textarea
          id="ai-chat-question"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading || disabled}
          maxLength={maxLength}
          rows={3}
          className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
          placeholder={placeholder}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            Enter 发送，Shift + Enter 换行 · {value.length}/{maxLength}
          </p>
          {loading && onStop ? (
            <button
              type="button"
              onClick={onStop}
              className="rounded-lg border border-gray-300 bg-white px-5 py-2 font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              停止生成
            </button>
          ) : (
            <button
              type="submit"
              disabled={!canSubmit}
              className="btn-primary px-6 py-2 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              发送追问
            </button>
          )}
        </div>
      </form>
    </section>
  );
};

export default AiChatPanel;
