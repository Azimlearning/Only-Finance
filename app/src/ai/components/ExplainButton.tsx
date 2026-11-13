import { useEffect, useId, useRef, useState } from 'react';
import type { Scenario } from '../../engine';
import { explain } from '../client';
import type { Tone, TutorReply } from '../client';
import { Icon } from '../../ui/icons';
import { VerifiedMark } from '../../ui/kit';
import { GuardedText } from './GuardedText';

export function ExplainButton(props: { topic: string; data: unknown; scenario: Scenario; tone?: Tone }) {
  const { topic, data, scenario, tone = 'sme' } = props;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState<TutorReply | null>(null);
  const [failed, setFailed] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const popId = useId();
  const requestId = useRef(0);
  const dataRef = useRef(data);
  dataRef.current = data;

  // Drop the cached explanation when the inputs behind it change.
  const key = `${topic}|${tone}|${JSON.stringify(scenario)}`;
  useEffect(() => {
    requestId.current += 1;
    setReply(null);
    setFailed(false);
    setLoading(false);
  }, [key]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent): void => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Fetch on open when there is nothing cached.
  useEffect(() => {
    if (!open || reply || loading || failed) return;
    const id = ++requestId.current;
    setLoading(true);
    explain(topic, dataRef.current, scenario, tone)
      .then((r) => {
        if (requestId.current === id) setReply(r);
      })
      .catch(() => {
        if (requestId.current === id) setFailed(true);
      })
      .finally(() => {
        if (requestId.current === id) setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reply, loading, failed, key]);

  return (
    <span ref={rootRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={popId}
        className="control inline-flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1.5 text-xs font-medium text-fg-2 hover:bg-sunken hover:text-fg"
      >
        <Icon name="explain" size={16} className="text-fg-subtle" /> Explain
      </button>
      {open && (
        <div
          id={popId}
          role="region"
          aria-label="Explanation"
          className="pop-enter surface-overlay absolute right-0 z-40 mt-2 max-h-[min(70vh,34rem)] w-[28rem] max-w-[85vw] overflow-y-auto rounded-lg p-5 text-left text-[15px] leading-6 text-fg"
        >
          {loading && (
            <div className="flex items-center gap-2 text-fg-muted" role="status">
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-primary-solid border-t-transparent" />
              Explaining
            </div>
          )}
          {!loading && reply && (
            <>
              <GuardedText guard={reply.guard} />
              <div className="mt-4 border-t border-line-soft pt-3">
                <VerifiedMark verified={reply.guard.verified} total={reply.guard.total} offline={reply.offline} />
              </div>
            </>
          )}
          {!loading && !reply && <p className="text-fg-muted">No explanation available.</p>}
        </div>
      )}
    </span>
  );
}
