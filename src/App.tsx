import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import Prism from 'prismjs';

// Prism languages (load order matters)
import 'prismjs/components/prism-markup'; // HTML
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-tsx';

import SettingsModal from './components/settingsModal';

/* ────────────────────────────────────────────────────────────
 * Types
 * ──────────────────────────────────────────────────────────── */

type Role = 'system' | 'user' | 'assistant';

interface Message {
  id: number;
  role: Role;
  content: string;
}

interface Segment {
  type: 'text' | 'code';
  content: string;
  lang?: string;
  key: string;
}

interface AuthUser {
  id?: number;
  email: string;
}

interface OllamaChunk {
  model: string;
  created_at: string;
  message?: {
    role: Role;
    content: string;
  };
  done: boolean;
}

/* ────────────────────────────────────────────────────────────
 * Constants
 * ──────────────────────────────────────────────────────────── */

const MODEL_NAME = 'llama3.2:3b';

const SYSTEM_PROMPT =
  'You are a helpful coding assistant. ' +
  'Odgovaraj na hrvatskom jeziku kad god je moguće. ' +
  'Kada daješ primjer koda, koristi jasno formatiranje i ukratko ga objasni. ' +
  'Kod piši unutar code-blockova (```jezik ...```), tako da ga je lako kopirati.';

/* ────────────────────────────────────────────────────────────
 * Helpers
 * ──────────────────────────────────────────────────────────── */

const resolveLanguage = (raw?: string) => {
  const lang = (raw || '').toLowerCase();

  if (lang === 'js' || lang === 'javascript') return 'javascript';
  if (lang === 'ts' || lang === 'typescript') return 'typescript';
  if (lang === 'tsx') return 'tsx';
  if (lang === 'jsx') return 'jsx';
  if (lang === 'html' || lang === 'markup') return 'markup';
  if (lang === 'css') return 'css';

  return 'javascript';
};

const parseMessageContent = (content: string, messageId: number): Segment[] => {
  const segments: Segment[] = [];
  const codeRegex = /```(\w+)?\s*\r?\n([\s\S]*?)```/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let blockIndex = 0;

  while ((match = codeRegex.exec(content)) !== null) {
    const [fullMatch, langRaw, codeRaw] = match;
    const matchStart = match.index;
    const matchEnd = matchStart + fullMatch.length;

    if (matchStart > lastIndex) {
      const textPart = content.slice(lastIndex, matchStart);
      const normalized = textPart.replace(/\n{3,}/g, '\n\n');
      if (normalized.trim().length > 0) {
        segments.push({
          type: 'text',
          content: normalized,
          key: `${messageId}-text-${blockIndex}`,
        });
      }
    }

    const lang = (langRaw || '').trim() || 'code';
    const code = codeRaw.replace(/\s+$/, '');

    segments.push({
      type: 'code',
      content: code,
      lang,
      key: `${messageId}-code-${blockIndex}`,
    });

    lastIndex = matchEnd;
    blockIndex += 1;
  }

  if (lastIndex < content.length) {
    const textPart = content.slice(lastIndex);
    const normalized = textPart.replace(/\n{3,}/g, '\n\n');
    if (normalized.trim().length > 0) {
      segments.push({
        type: 'text',
        content: normalized,
        key: `${messageId}-text-end`,
      });
    }
  }

  if (segments.length === 0) {
    segments.push({
      type: 'text',
      content: content,
      key: `${messageId}-text-only`,
    });
  }

  return segments;
};

/* ────────────────────────────────────────────────────────────
 * Subcomponents
 * ──────────────────────────────────────────────────────────── */

interface CodeBlockProps {
  segment: Segment;
  copiedBlockId: string | null;
  onCopy: (blockId: string, code: string) => void;
}

const CodeBlock: React.FC<CodeBlockProps> = ({
  segment: seg,
  copiedBlockId,
  onCopy,
}) => {
  const lang = resolveLanguage(seg.lang);
  const highlighted = Prism.highlight(
    seg.content,
    // @ts-ignore
    Prism.languages[lang] || Prism.languages.javascript,
    lang,
  );

  return (
    <div className="code-block">
      <div className="code-header">
        <div className="code-title">
          <span className="code-dot red" />
          <span className="code-dot yellow" />
          <span className="code-dot green" />
          <span className="code-lang">
            {(seg.lang || 'code').toUpperCase()}
          </span>
        </div>
        <button
          type="button"
          className="code-copy-btn"
          onClick={() => onCopy(seg.key, seg.content)}
        >
          {copiedBlockId === seg.key ? '✓ Kopirano' : 'Kopiraj'}
        </button>
      </div>

      <div className="code-body">
        <pre className={`language-${lang}`}>
          <code
            className={`language-${lang}`}
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </pre>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────
 * Component
 * ──────────────────────────────────────────────────────────── */

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [user, setUser] = useState<AuthUser | null>({
    email: 'demo@user.com',
  });
  const [authToken, setAuthToken] = useState<string | null>(null);

  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const model = MODEL_NAME;
  const currentModelLabel = MODEL_NAME;
  const visibleMessages = messages;
  const lastMessageId = visibleMessages[visibleMessages.length - 1]?.id;

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('nexora_theme', next);
      return next;
    });
  }, []);

  const openSettings = () => setIsSettingsOpen(true);
  const closeSettings = () => setIsSettingsOpen(false);

  const handleLogout = () => {
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem('nexora_token');
    localStorage.removeItem('nexora_email');
    localStorage.removeItem('nexora_user_id');
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const stored = localStorage.getItem('nexora_theme');
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
    }
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setError(null);

    const userMsgId = Date.now();
    const assistantId = userMsgId + 1;

    const userMsg: Message = {
      id: userMsgId,
      role: 'user',
      content: trimmed,
    };

    const baseMessages = [...messages, userMsg];

    setMessages([
      ...baseMessages,
      { id: assistantId, role: 'assistant', content: '' },
    ]);

    setInput('');
    setIsLoading(true);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const payload = {
        model,
        stream: true,
        messages: [
          { role: 'system' as Role, content: SYSTEM_PROMPT },
          ...baseMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        ],
      };

      const res = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Greška na serveru: ${res.status} ${res.statusText}`);
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error('Browser ne podržava stream čitanje odgovora.');
      }

      const decoder = new TextDecoder();
      let doneStreaming = false;

      while (!doneStreaming) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk
          .split('\n')
          .filter((l) => l.trim().length > 0);

        for (const line of lines) {
          let data: OllamaChunk;
          try {
            data = JSON.parse(line);
          } catch {
            continue;
          }

          const token: string = data?.message?.content ?? '';
          const isDone: boolean = data?.done ?? false;

          if (token) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + token }
                  : m,
              ),
            );
          }

          if (isDone) {
            doneStreaming = true;
            break;
          }
        }
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        console.warn('Streaming prekinut od strane korisnika.');
      } else {
        console.error(err);
        setError(
          err?.message ??
            'Dogodila se greška pri spajanju na Ollama API. Je li Ollama pokrenut?',
        );
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  }, [input, isLoading, messages, model]);

  const handleStop = useCallback(() => {
    if (abortController) {
      abortController.abort();
    }
  }, [abortController]);

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopyBlock = useCallback(
    async (blockId: string, code: string) => {
      try {
        await navigator.clipboard.writeText(code);
        setCopiedBlockId(blockId);
        setTimeout(() => setCopiedBlockId(null), 1500);
      } catch (err) {
        console.error(err);
        setError('Ne mogu kopirati kod u međuspremnik (clipboard).');
      }
    },
    [],
  );

  return (
    <div
      className={`app-root ${
        theme === 'dark' ? 'theme-dark' : 'theme-light'
      }`}
    >
      <div className="chat-shell">
        <header className="topbar">
          <div className="topbar-main">
            <div className="topbar-title">NEXORA</div>
            <div className="topbar-subtitle">
              <span className="sub-label">Model</span>
              <span className="mono sub-model">{currentModelLabel}</span>
            </div>
          </div>

          <div className="topbar-right">
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label="Promijeni temu"
            />

            <button
              type="button"
              className="settings-btn"
              onClick={openSettings}
              aria-label="Otvori postavke"
            >
              {/* ikona postavki */}
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82-.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.57 0 1.11.24 1.51.67A2 2 0 1 1 19.4 15z"></path>
              </svg>
            </button>

            {user && (
              <button
                type="button"
                className="logout-btn"
                onClick={handleLogout}
                aria-label="Odjava"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                  <polyline points="10 17 15 12 10 7"></polyline>
                  <line x1="15" y1="12" x2="3" y2="12"></line>
                </svg>
              </button>
            )}
          </div>
        </header>

        <div className="chat-body">
          <main className="chat-main">
            <div className="messages">
              {visibleMessages.length === 0 && (
                <div className="empty-state">
                  <p>Spreman sam. Napiši pitanje ili zalijepi svoj kod.</p>
                  <ul>
                    <li>Napiši mi primjer HTML stranice za prodaju automobila.</li>
                    <li>Optimiziraj ovaj JavaScript kod.</li>
                    <li>Objasni mi ovaj TSX kod koji šaljem.</li>
                  </ul>
                </div>
              )}

              {visibleMessages.map((msg) => {
                const isUser = msg.role === 'user';
                const isAssistant = msg.role === 'assistant';
                const isLastAssistant =
                  isAssistant && msg.id === lastMessageId;

                const segments: Segment[] =
                  isAssistant
                    ? parseMessageContent(msg.content, msg.id)
                    : [
                        {
                          type: 'text',
                          content: msg.content,
                          key: `${msg.id}-user-text`,
                        },
                      ];

                const showInlineTyping =
                  isLastAssistant && isLoading && msg.content.length === 0;

                return (
                  <div
                    key={msg.id}
                    className={`message-row ${
                      isUser ? 'user-row' : 'assistant-row'
                    }`}
                  >
                    <div
                      className={`avatar ${
                        isUser ? 'avatar-user' : 'avatar-bot'
                      }`}
                    >
                      {isUser ? 'TY' : '</>'}
                    </div>

                    <div
                      className={`bubble ${
                        isUser ? 'bubble-user' : 'bubble-assistant'
                      }`}
                    >
                      <div className="bubble-header">
                        <span className="role-label">
                          {isUser ? 'Ti' : 'Nexora'}
                        </span>
                      </div>

                      <div className="bubble-content">
                        {showInlineTyping ? (
                          <div className="typing-inline">
                            <span className="typing-dot" />
                            <span className="typing-dot" />
                            <span className="typing-dot" />
                          </div>
                        ) : (
                          segments.map((seg) =>
                            seg.type === 'text' ? (
                              <div
                                className="segment-text"
                                key={seg.key}
                                style={{ whiteSpace: 'pre-wrap' }}
                              >
                                {seg.content}
                              </div>
                            ) : (
                              <CodeBlock
                                key={seg.key}
                                segment={seg}
                                copiedBlockId={copiedBlockId}
                                onCopy={handleCopyBlock}
                              />
                            ),
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>
          </main>
          <form
            className="input-row"
            onSubmit={(e) => {
              e.preventDefault();
              if (!isLoading) {
                handleSend();
              }
            }}
          >
            <div className="input-inner">
              {/* NOVO: wrap textarea + hint */}
              <div className="input-main">
                <textarea
                  className="chat-input"
                  placeholder="Napiši pitanje ili zalijepi svoj kod ovdje..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={2}
                />

                <div className="input-hint">
                  Enter = pošalji · Shift+Enter = novi red
                </div>
              </div>

              <button
                type="submit"
                className="send-btn"
                disabled={!input.trim() && !isLoading}
                onClick={(e) => {
                  if (isLoading) {
                    e.preventDefault();
                    handleStop();
                  }
                }}
              >
                {isLoading ? (
                  <>
                    <span className="send-spinner" aria-hidden="true" />
                    <span className="send-label">Zaustavi</span>
                  </>
                ) : (
                  <>
                    <span className="send-label">Pošalji</span>
                    <span className="send-icon" aria-hidden="true">
                      ➤
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={closeSettings}
          user={user}
        />

        {error && <div className="error-banner">{error}</div>}
      </div>
    </div>
  );
};

export default App;
