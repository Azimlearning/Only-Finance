import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { Scenario } from '../../engine';
import { askTutor } from '../client';
import type { ChatMessage, Tone, TutorReply } from '../client';
import { Icon } from '../../ui/icons';
import { SEG_WRAP, VerifiedMark, segBtn } from '../../ui/kit';
import { GuardedText } from './GuardedText';

interface Turn {
  role: 'user' | 'assistant';
  content: string;
  reply?: TutorReply;
}

const SUGGESTED = [
  'What happens to my cost if Malaysian inflation rises to 4%?',
  'Should I hedge with a forward or an option?',
  "Why is the forward cheaper than today's rate?",
];

export function TutorDrawer(props: {
  scenario: Scenario;
  open: boolean;
  onClose: () => void;
  /** Controlled tone (the header SME owner / Student switch). Falls back to local state when omitted. */
  tone?: Tone;
  onToneChange?: (tone: Tone) => void;
}) {
  const { scenario, open, onClose } = props;
  const [turns, setTurns] = useState<Turn[]>([]);
  const [localTone, setLocalTone] = useState<Tone>('sme');
  const tone = props.tone ?? localTone;
  const setTone = props.onToneChange ?? setLocalTone;
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  // Keep the drawer mounted briefly after close so it can slide out the way it came in.
  const [phase, setPhase] = useState<'closed' | 'enter' | 'open'>('closed');
  const visible = open || phase !== 'closed';
  const drawerState = open ? (phase === 'open' ? 'open' : 'enter') : 'exit';

  useEffect(() => {
    if (open) {
      setPhase('enter');
      let r2 = 0;
      const r1 = requestAnimationFrame(() => {
        r2 = requestAnimationFrame(() => setPhase('open'));
      });
      return () => {
        cancelAnimationFrame(r1);
        cancelAnimationFrame(r2);
      };
    }
    const t = setTimeout(() => setPhase('closed'), 220);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
  }, [turns, loading]);

  async function send(question: string): Promise<void> {
    const q = question.trim();
    if (!q || loading) return;
    const next: Turn[] = [...turns, { role: 'user', content: q }];
    setTurns(next);
    setInput('');
    setLoading(true);
    try {
      const history: ChatMessage[] = next.map((t) => ({ role: t.role, content: t.content }));
      const reply = await askTutor(history, scenario, tone);
      setTurns([...next, { role: 'assistant', content: reply.text, reply }]);
    } catch {
      setTurns([
        ...next,
        { role: 'assistant', content: 'The tutor could not answer. Try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent): void {
    e.preventDefault();
    void send(input);
  }

  if (!visible) return null;

  return (
    <div className="drawer fixed inset-0 z-50 flex justify-end" data-state={drawerState}>
      <div className="drawer-scrim absolute inset-0 bg-scrim-soft" onClick={onClose} aria-hidden="true" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="AI tutor"
        className="drawer-panel surface-overlay relative flex h-full w-full flex-col sm:w-[30rem]"
      >
        <header className="flex items-center justify-between border-b border-line-soft px-5 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-fg">
              <Icon name="tutor" size={20} className="text-accent" />
              AI tutor
            </h2>
            <p className="mt-0.5 text-[13px] text-fg-muted">Every number is checked against the engine.</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close tutor"
            className="grid h-8 w-8 place-items-center rounded-lg text-fg-subtle hover:bg-muted hover:text-fg"
          >
            <Icon name="close" size={18} />
          </button>
        </header>

        <div className="flex items-center gap-3 border-b border-line-soft px-5 py-3 text-sm">
          <span className="text-fg-muted" id="tone-label">
            Explain for
          </span>
          <div role="radiogroup" aria-labelledby="tone-label" className={`inline-flex ${SEG_WRAP}`}>
            {(
              [
                ['sme', 'SME owner'],
                ['student', 'Student'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={tone === value}
                onClick={() => setTone(value)}
                className={segBtn(tone === value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5" aria-live="polite">
          {turns.length === 0 && (
            <div>
              <p className="text-sm text-fg-muted">Ask about rates, inflation, the forward or hedging.</p>
              <ul className="mt-3 divide-y divide-line-soft border-y border-line-soft">
                {SUGGESTED.map((q) => (
                  <li key={q}>
                    <button
                      type="button"
                      onClick={() => void send(q)}
                      className="w-full py-3 text-left text-sm text-fg hover:text-accent"
                    >
                      {q}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {turns.map((t, i) =>
            t.role === 'user' ? (
              <div key={i} className="msg-enter flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary-solid px-4 py-2 text-sm leading-relaxed text-on-primary">
                  {t.content}
                </div>
              </div>
            ) : (
              <div key={i} className="msg-enter surface max-w-[95%] rounded-2xl rounded-bl-md px-4 py-2.5 text-sm leading-relaxed text-fg">
                {t.reply ? <GuardedText guard={t.reply.guard} /> : t.content}
                {t.reply && (
                  <div className="mt-3 space-y-2 border-t border-line-soft pt-3">
                    <VerifiedMark verified={t.reply.guard.verified} total={t.reply.guard.total} offline={t.reply.offline} />
                    {t.reply.toolCalls.length > 0 && (
                      <details className="text-xs text-fg-muted">
                        <summary className="cursor-pointer select-none font-medium text-fg-2 hover:text-fg">
                          Engine calls ({t.reply.toolCalls.length})
                        </summary>
                        <ul className="mt-1 space-y-1">
                          {t.reply.toolCalls.map((c, j) => (
                            <li key={j} className="rounded bg-sunken p-1.5 font-mono">
                              <span className="font-medium text-fg">{c.name}</span>
                              <span className="break-all"> {JSON.stringify(c.args)}</span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                )}
              </div>
            ),
          )}

          {loading && (
            <div className="flex items-center gap-2 text-sm text-fg-muted" role="status">
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-primary-solid border-t-transparent" />
              Checking numbers against the engine
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form onSubmit={onSubmit} className="border-t border-line-soft p-4">
          <div className="flex gap-2">
            <label htmlFor="tutor-input" className="sr-only">
              Your question
            </label>
            <input
              id="tutor-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your numbers"
              disabled={loading}
              className="field min-w-0 flex-1 px-3 py-2 text-sm text-fg outline-none placeholder:text-fg-subtle disabled:bg-sunken"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-lg bg-primary-solid px-4 py-2 text-sm font-semibold text-on-primary hover:bg-accent disabled:cursor-not-allowed disabled:bg-line-strong"
            >
              <span className="inline-flex items-center gap-1.5">
                Send
                <Icon name="send" size={16} />
              </span>
            </button>
          </div>
          <p className="mt-3 text-xs text-fg-muted">
            Educational tool. Illustrative rates, not market data. Not financial advice.
          </p>
        </form>
      </aside>
    </div>
  );
}
