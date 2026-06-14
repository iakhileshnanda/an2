import { useCallback, useEffect, useRef, useState } from 'react';
import type { AboutMe } from '../../lib/parseAboutMe';
import {
  ADMIN_COMMAND_HELP,
  isParseError,
  parseAdminCommand,
} from '../../lib/adminCommands';

/**
 * MayaChat — the recruiter-facing AI chat widget ("Maya").
 *
 * - Recruiter mode (default): forwards messages to POST /api/recruiter-chat,
 *   which is backed by Claude with a system prompt built from about-me.md.
 * - Admin mode: unlocked when the operator types the secret passphrase. In this
 *   mode, typed commands are parsed (lib/adminCommands) and sent to
 *   POST /api/update, which mutates about-me.md. The passphrase doubles as the
 *   admin bearer token, so the backend's ADMIN_TOKEN must equal the passphrase.
 * - A /ws WebSocket pushes `about:update` events so the dashboard re-renders live.
 *
 * No visual styling is included — only structural markup with stable class hooks.
 */

type Sender = 'user' | 'maya' | 'system';

interface ChatMessage {
  id: string;
  sender: Sender;
  text: string;
}

export interface MayaChatProps {
  /** Base URL of the API, e.g. "https://akhileshnanda.maya-ai.dev". Default: same origin. */
  apiBase?: string;
  /** Secret passphrase that unlocks admin mode; also used as the admin bearer token. */
  passphrase?: string;
  /** Called whenever about-me.md changes (admin edit), so a parent dashboard can re-render. */
  onAboutUpdate?: (about: AboutMe) => void;
}

let idCounter = 0;
const nextId = () => `m${Date.now()}_${idCounter++}`;

function wsUrlFrom(apiBase: string): string {
  const base = apiBase || window.location.origin;
  const url = new URL(base);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = '/ws';
  url.search = '';
  return url.toString();
}

export default function MayaChat({
  apiBase = '',
  passphrase = 'OPEN SESAME',
  onAboutUpdate,
}: MayaChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: nextId(), sender: 'maya', text: "Hi — I'm Maya, Akhilesh's AI. Ask me about his work, projects, or experience." },
  ]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'recruiter' | 'admin'>('recruiter');
  const [busy, setBusy] = useState(false);
  const adminToken = useRef<string>('');

  const push = useCallback((sender: Sender, text: string) => {
    setMessages((prev) => [...prev, { id: nextId(), sender, text }]);
  }, []);

  // ── Live dashboard channel ────────────────────────────────────────────────
  useEffect(() => {
    let socket: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let closed = false;

    const connect = () => {
      try {
        socket = new WebSocket(wsUrlFrom(apiBase));
      } catch {
        return;
      }
      socket.onmessage = (ev) => {
        try {
          const event = JSON.parse(ev.data);
          if (event.type === 'about:update' && onAboutUpdate) {
            onAboutUpdate(event.data as AboutMe);
          }
        } catch {
          /* ignore malformed frames */
        }
      };
      socket.onclose = () => {
        if (!closed) retry = setTimeout(connect, 3000);
      };
      socket.onerror = () => socket?.close();
    };

    connect();
    return () => {
      closed = true;
      if (retry) clearTimeout(retry);
      socket?.close();
    };
  }, [apiBase, onAboutUpdate]);

  // ── Recruiter mode → Claude-backed chat ───────────────────────────────────
  async function sendToMaya(message: string) {
    const history = messages
      .filter((m) => m.sender === 'user' || m.sender === 'maya')
      .map((m) => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }));

    const res = await fetch(`${apiBase}/api/recruiter-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Something went wrong.' }));
      throw new Error(error || 'Maya is offline.');
    }
    const data = await res.json();
    return data.reply as string;
  }

  // ── Admin mode → mutate about-me.md ───────────────────────────────────────
  async function sendAdminUpdate(action: { type: string; payload: unknown }) {
    const res = await fetch(`${apiBase}/api/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken.current}`,
      },
      body: JSON.stringify(action),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Update failed.');
    return data;
  }

  async function handleSubmit(raw: string) {
    const text = raw.trim();
    if (!text || busy) return;

    // Passphrase unlocks admin mode (works from any mode).
    if (text === passphrase) {
      adminToken.current = text;
      setMode('admin');
      push('user', '••••••••');
      push('system', `Admin mode unlocked. Commands:\n${ADMIN_COMMAND_HELP}`);
      setInput('');
      return;
    }

    push('user', text);
    setInput('');

    if (mode === 'admin') {
      if (text.toLowerCase() === 'exit') {
        setMode('recruiter');
        adminToken.current = '';
        push('system', 'Back to recruiter mode.');
        return;
      }

      const parsed = parseAdminCommand(text);
      if (parsed === null) {
        push('system', `Not a recognized command.\n${ADMIN_COMMAND_HELP}`);
        return;
      }
      if (isParseError(parsed)) {
        push('system', parsed.error);
        return;
      }

      setBusy(true);
      try {
        await sendAdminUpdate(parsed);
        push('system', `✓ ${parsed.type} applied — dashboard updating live.`);
      } catch (err) {
        push('system', `✗ ${(err as Error).message}`);
      } finally {
        setBusy(false);
      }
      return;
    }

    // Recruiter mode
    setBusy(true);
    try {
      const reply = await sendToMaya(text);
      push('maya', reply);
    } catch (err) {
      push('maya', (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="maya-chat" data-mode={mode}>
      <div className="maya-chat__log" role="log" aria-live="polite">
        {messages.map((m) => (
          <div key={m.id} className="maya-chat__msg" data-sender={m.sender}>
            {m.text}
          </div>
        ))}
        {busy && (
          <div className="maya-chat__msg" data-sender="maya" data-pending="true">
            …
          </div>
        )}
      </div>

      <form
        className="maya-chat__form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(input);
        }}
      >
        <input
          className="maya-chat__input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === 'admin' ? 'admin command…' : 'Ask Maya about Akhilesh…'}
          disabled={busy}
          aria-label="Message Maya"
        />
        <button className="maya-chat__send" type="submit" disabled={busy || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
