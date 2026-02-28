/**
 * Chat.tsx — AI 对话页面
 * 参考 SiliconFlow Playground 风格，融合王梓钰Wiki紫色主题
 * 支持：流式输出、模型选择、对话历史、Markdown渲染、思考过程展示
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { API } from "../lib/api";

// ============================================================
// 类型定义
// ============================================================

interface Message {
  role: "user" | "assistant";
  content: string;
  reasoning?: string;       // 思考过程（DeepSeek-R1 等）
  isStreaming?: boolean;
}

// ============================================================
// 常量
// ============================================================

const DEFAULT_MODEL = "deepseek-ai/DeepSeek-V3";
const STORAGE_KEY_MESSAGES = "wzy_chat_messages";
const STORAGE_KEY_MODEL = "wzy_chat_model";
const STORAGE_KEY_SYSTEM = "wzy_chat_system";
const DEFAULT_SYSTEM = "你是一个了解艺人王梓钰的助手，可以回答关于她的音乐、演出、动态等问题，也可以进行普通对话。";

// 从 localStorage 安全读取 JSON
function loadStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

const SUGGESTED_PROMPTS = [
  "王梓钰有哪些代表作品？",
  "介绍一下王梓钰的音乐风格",
  "王梓钰参加过哪些综艺节目？",
  "帮我写一首关于王梓钰的打油诗",
];

// ============================================================
// 工具函数：简单 Markdown 渲染（不引入外部库）
// ============================================================
function renderMarkdown(text: string): string {
  return text
    // 代码块
    .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre style="background:rgba(120,80,200,0.07);border:1px solid rgba(120,80,200,0.15);border-radius:8px;padding:12px 14px;overflow-x:auto;font-size:0.85em;line-height:1.6;"><code>$2</code></pre>')
    // 行内代码
    .replace(/`([^`]+)`/g, '<code style="background:rgba(120,80,200,0.1);border-radius:4px;padding:1px 5px;font-size:0.88em;">$1</code>')
    // 粗体
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // 斜体
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // 标题 h3
    .replace(/^### (.+)$/gm, '<h3 style="font-size:1em;font-weight:700;margin:12px 0 4px;color:var(--yl-blue-dark);">$1</h3>')
    // 标题 h2
    .replace(/^## (.+)$/gm, '<h2 style="font-size:1.1em;font-weight:700;margin:14px 0 5px;color:var(--yl-blue-dark);">$1</h2>')
    // 标题 h1
    .replace(/^# (.+)$/gm, '<h1 style="font-size:1.2em;font-weight:700;margin:16px 0 6px;color:var(--yl-blue-dark);">$1</h1>')
    // 无序列表
    .replace(/^[-*] (.+)$/gm, '<li style="margin:2px 0;padding-left:4px;">$1</li>')
    // 有序列表
    .replace(/^\d+\. (.+)$/gm, '<li style="margin:2px 0;padding-left:4px;">$1</li>')
    // 换行
    .replace(/\n/g, '<br/>');
}

// ============================================================
// 子组件：消息气泡
// ============================================================
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  const [showReasoning, setShowReasoning] = useState(false);

  return (
    <div style={{
      display: "flex",
      flexDirection: isUser ? "row-reverse" : "row",
      alignItems: "flex-start",
      gap: 10,
      marginBottom: 18,
    }}>
      {/* 头像 */}
      <div style={{
        width: 34,
        height: 34,
        borderRadius: "50%",
        flexShrink: 0,
        background: isUser
          ? "linear-gradient(135deg, #9b7fd4, #7c5cbf)"
          : "linear-gradient(135deg, #c8b8e8, #a890d0)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.8rem",
        fontWeight: 700,
        color: "white",
        boxShadow: "0 2px 8px rgba(120,80,200,0.25)",
      }}>
        {isUser ? "我" : "AI"}
      </div>

      <div style={{ maxWidth: "75%", minWidth: 60 }}>
        {/* 思考过程折叠块 */}
        {msg.reasoning && (
          <div style={{ marginBottom: 6 }}>
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              style={{
                background: "rgba(120,80,200,0.08)",
                border: "1px solid rgba(120,80,200,0.2)",
                borderRadius: 6,
                padding: "3px 10px",
                fontSize: "0.75rem",
                color: "var(--yl-muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span>{showReasoning ? "▾" : "▸"}</span>
              <span>思考过程</span>
            </button>
            {showReasoning && (
              <div style={{
                marginTop: 4,
                padding: "8px 12px",
                background: "rgba(120,80,200,0.04)",
                border: "1px solid rgba(120,80,200,0.12)",
                borderRadius: 8,
                fontSize: "0.8rem",
                color: "var(--yl-muted)",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
              }}>
                {msg.reasoning}
              </div>
            )}
          </div>
        )}

        {/* 消息内容 */}
        <div style={{
          padding: "10px 14px",
          borderRadius: isUser ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
          background: isUser
            ? "linear-gradient(135deg, #9b7fd4, #7c5cbf)"
            : "rgba(255,255,255,0.92)",
          color: isUser ? "white" : "var(--yl-text)",
          fontSize: "0.92rem",
          lineHeight: 1.7,
          boxShadow: isUser
            ? "0 2px 12px rgba(120,80,200,0.3)"
            : "0 2px 10px rgba(120,80,200,0.1)",
          border: isUser ? "none" : "1px solid rgba(180,160,220,0.3)",
          wordBreak: "break-word",
        }}>
          {isUser ? (
            <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
          ) : (
            <span dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
          )}
          {msg.isStreaming && (
            <span style={{
              display: "inline-block",
              width: 8,
              height: 16,
              background: "var(--yl-blue)",
              marginLeft: 2,
              borderRadius: 2,
              animation: "blink 0.8s step-end infinite",
              verticalAlign: "middle",
            }} />
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 主页面组件
// ============================================================
export default function ChatPage() {
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(
    () => loadStorage(STORAGE_KEY_MODEL, DEFAULT_MODEL)
  );
  const [systemPrompt, setSystemPrompt] = useState<string>(
    () => loadStorage(STORAGE_KEY_SYSTEM, DEFAULT_SYSTEM)
  );
  const [messages, setMessages] = useState<Message[]>(
    () => loadStorage<Message[]>(STORAGE_KEY_MESSAGES, [])
  );
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // 加载模型列表
  useEffect(() => {
    fetch(`${API.BASE}/chat/models`)
      .then(r => r.json())
      .then(d => {
        if (d.data) setModels(d.data);
      })
      .catch(() => setModels([DEFAULT_MODEL]));
  }, []);

  // 持久化 messages 到 localStorage
  useEffect(() => {
    // 只保存非流式状态的消息，避免保存不完整内容
    const toSave = messages.filter(m => !m.isStreaming);
    try { localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(toSave)); } catch {}
  }, [messages]);

  // 持久化 selectedModel
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY_MODEL, JSON.stringify(selectedModel)); } catch {}
  }, [selectedModel]);

  // 持久化 systemPrompt
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY_SYSTEM, JSON.stringify(systemPrompt)); } catch {}
  }, [systemPrompt]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 自动调整 textarea 高度
  const adjustTextarea = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: content.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputValue("");
    setIsLoading(true);

    // 重置 textarea 高度
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    // 添加 AI 占位消息
    const assistantMsg: Message = { role: "assistant", content: "", isStreaming: true };
    setMessages(prev => [...prev, assistantMsg]);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const apiMessages = [
        ...(systemPrompt.trim() ? [{ role: "system", content: systemPrompt.trim() }] : []),
        ...newMessages.map(m => ({ role: m.role, content: m.content })),
      ];

      const resp = await fetch(`${API.BASE}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: selectedModel,
          messages: apiMessages,
          stream: true,
          max_tokens: 4096,
        }),
        signal: ctrl.signal,
      });

      if (!resp.ok || !resp.body) throw new Error(`HTTP ${resp.status}`);

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let fullReasoning = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n");

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const dataStr = trimmed.slice(5).trim();
          if (dataStr === "[DONE]") break;
          try {
            const chunk = JSON.parse(dataStr);
            const delta = chunk.choices?.[0]?.delta;
            if (!delta) continue;
            if (delta.content) fullContent += delta.content;
            if (delta.reasoning_content) fullReasoning += delta.reasoning_content;

            setMessages(prev => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last.role === "assistant") {
                updated[updated.length - 1] = {
                  ...last,
                  content: fullContent,
                  reasoning: fullReasoning || undefined,
                  isStreaming: true,
                };
              }
              return updated;
            });
          } catch {
            // 忽略解析错误
          }
        }
      }

      // 流式结束，移除 isStreaming 标记
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.role === "assistant") {
          updated[updated.length - 1] = { ...last, isStreaming: false };
        }
        return updated;
      });
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.role === "assistant") {
            updated[updated.length - 1] = {
              ...last,
              content: "⚠️ 请求失败，请稍后重试。",
              isStreaming: false,
            };
          }
          return updated;
        });
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [messages, isLoading, selectedModel, systemPrompt]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setIsLoading(false);
    setMessages(prev => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      if (last.role === "assistant") {
        updated[updated.length - 1] = { ...last, isStreaming: false };
      }
      return updated;
    });
  };

  const handleClear = () => {
    setMessages([]);
    try { localStorage.removeItem(STORAGE_KEY_MESSAGES); } catch {}
  };

  const isEmpty = messages.length === 0;

  return (
    <div style={{
      minHeight: "100vh",
      paddingTop: 64,
      display: "flex",
      flexDirection: "column",
    }}>
      {/* 光标闪烁动画 */}
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>

      {/* 顶部工具栏 */}
      <div style={{
        position: "sticky",
        top: 64,
        zIndex: 50,
        background: "rgba(252,250,255,0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(180,160,220,0.3)",
        padding: "8px 24px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      }}>
        {/* 模型选择 */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: "0.8rem", color: "var(--yl-muted)", whiteSpace: "nowrap" }}>模型</span>
          <select
            value={selectedModel}
            onChange={e => setSelectedModel(e.target.value)}
            style={{
              background: "rgba(255,255,255,0.9)",
              border: "1px solid rgba(180,160,220,0.5)",
              borderRadius: 8,
              padding: "4px 10px",
              fontSize: "0.82rem",
              color: "var(--yl-text)",
              cursor: "pointer",
              maxWidth: 280,
            }}
          >
            {(models.length > 0 ? models : [DEFAULT_MODEL]).map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* 设置按钮 */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          style={{
            background: showSettings ? "rgba(120,80,200,0.12)" : "rgba(255,255,255,0.8)",
            border: "1px solid rgba(180,160,220,0.4)",
            borderRadius: 8,
            padding: "4px 12px",
            fontSize: "0.8rem",
            color: "var(--yl-blue)",
            cursor: "pointer",
          }}
        >
          ⚙ 系统提示词
        </button>

        {/* 清空对话 */}
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            style={{
              background: "rgba(255,255,255,0.8)",
              border: "1px solid rgba(180,160,220,0.4)",
              borderRadius: 8,
              padding: "4px 12px",
              fontSize: "0.8rem",
              color: "var(--yl-muted)",
              cursor: "pointer",
            }}
          >
            🗑 清空对话
          </button>
        )}
      </div>

      {/* 系统提示词面板 */}
      {showSettings && (
        <div style={{
          padding: "12px 24px",
          background: "rgba(245,240,255,0.7)",
          borderBottom: "1px solid rgba(180,160,220,0.2)",
        }}>
          <div style={{ fontSize: "0.8rem", color: "var(--yl-muted)", marginBottom: 6 }}>System Prompt（系统提示词）</div>
          <textarea
            value={systemPrompt}
            onChange={e => setSystemPrompt(e.target.value)}
            rows={3}
            style={{
              width: "100%",
              maxWidth: 720,
              background: "rgba(255,255,255,0.9)",
              border: "1px solid rgba(180,160,220,0.4)",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: "0.85rem",
              color: "var(--yl-text)",
              resize: "vertical",
              lineHeight: 1.5,
              boxSizing: "border-box",
            }}
          />
        </div>
      )}

      {/* 对话区域 */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: isEmpty ? "0" : "24px 24px 8px",
        maxWidth: 860,
        width: "100%",
        margin: "0 auto",
        boxSizing: "border-box",
      }}>
        {isEmpty ? (
          /* 空状态：欢迎界面 */
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "50vh",
            gap: 20,
            padding: "40px 24px",
          }}>
            <div style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #c8b8e8, #9b7fd4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
              boxShadow: "0 4px 20px rgba(120,80,200,0.25)",
            }}>
              ✨
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{
                fontSize: "1.3rem",
                fontWeight: 700,
                color: "var(--yl-text)",
                fontFamily: "'Noto Serif SC', serif",
                marginBottom: 8,
              }}>
                梓钰 AI 助手
              </div>
              <div style={{ fontSize: "0.88rem", color: "var(--yl-muted)" }}>
                由 SiliconFlow 提供支持，可以回答关于王梓钰的一切问题
              </div>
            </div>
            {/* 建议问题 */}
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              justifyContent: "center",
              maxWidth: 600,
            }}>
              {SUGGESTED_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  style={{
                    background: "rgba(255,255,255,0.88)",
                    border: "1px solid rgba(180,160,220,0.5)",
                    borderRadius: 20,
                    padding: "8px 16px",
                    fontSize: "0.85rem",
                    color: "var(--yl-text)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    boxShadow: "0 2px 8px rgba(120,80,200,0.08)",
                  }}
                  onMouseEnter={e => {
                    (e.target as HTMLElement).style.background = "rgba(120,80,200,0.1)";
                    (e.target as HTMLElement).style.borderColor = "var(--yl-blue)";
                  }}
                  onMouseLeave={e => {
                    (e.target as HTMLElement).style.background = "rgba(255,255,255,0.88)";
                    (e.target as HTMLElement).style.borderColor = "rgba(180,160,220,0.5)";
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div style={{
        position: "sticky",
        bottom: 0,
        background: "rgba(252,250,255,0.95)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(180,160,220,0.25)",
        padding: "12px 24px 16px",
      }}>
        <div style={{
          maxWidth: 860,
          margin: "0 auto",
          display: "flex",
          gap: 10,
          alignItems: "flex-end",
        }}>
          <div style={{
            flex: 1,
            background: "rgba(255,255,255,0.92)",
            border: "1.5px solid rgba(180,160,220,0.5)",
            borderRadius: 14,
            padding: "10px 14px",
            boxShadow: "0 2px 12px rgba(120,80,200,0.1)",
            transition: "border-color 0.15s",
          }}
          onFocus={e => (e.currentTarget.style.borderColor = "var(--yl-blue)")}
          onBlur={e => (e.currentTarget.style.borderColor = "rgba(180,160,220,0.5)")}
          >
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={e => { setInputValue(e.target.value); adjustTextarea(); }}
              onKeyDown={handleKeyDown}
              placeholder="输入消息，按 Enter 发送，Shift+Enter 换行..."
              rows={1}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                outline: "none",
                resize: "none",
                fontSize: "0.92rem",
                color: "var(--yl-text)",
                lineHeight: 1.6,
                fontFamily: "inherit",
                overflow: "hidden",
              }}
            />
          </div>

          {isLoading ? (
            <button
              onClick={handleStop}
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "rgba(200,80,80,0.9)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1rem",
                color: "white",
                flexShrink: 0,
                boxShadow: "0 2px 8px rgba(200,80,80,0.3)",
              }}
              title="停止生成"
            >
              ■
            </button>
          ) : (
            <button
              onClick={() => sendMessage(inputValue)}
              disabled={!inputValue.trim()}
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: inputValue.trim()
                  ? "linear-gradient(135deg, #9b7fd4, #7c5cbf)"
                  : "rgba(180,160,220,0.4)",
                border: "none",
                cursor: inputValue.trim() ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.1rem",
                color: "white",
                flexShrink: 0,
                boxShadow: inputValue.trim() ? "0 2px 12px rgba(120,80,200,0.35)" : "none",
                transition: "all 0.15s",
              }}
              title="发送"
            >
              ↑
            </button>
          )}
        </div>
        <div style={{
          textAlign: "center",
          fontSize: "0.72rem",
          color: "var(--yl-muted)",
          marginTop: 8,
          opacity: 0.7,
        }}>
          内容由 AI 生成，仅供参考，请注意甄别
        </div>
      </div>
    </div>
  );
}
