import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { Tone, TutorReply } from '../client';
import { generateQuestion, practiceFeedback, scoreAnswer } from '../practice';
import type { Direction, PracticeQuestion, PracticeScore } from '../practice';
import { Icon } from '../../ui/icons';
import { VerifiedMark } from '../../ui/kit';
import { GuardedText } from './GuardedText';

interface Outcome {
  direction: Direction;
  value: number;
  score: PracticeScore;
  feedback: TutorReply | null;
}

/** The prompt is one paragraph from practice.ts; show it as three short rows when its sentence markers are present. */
function promptRows(prompt: string): [string, string][] {
  const iChange = prompt.indexOf(' Before the change');
  const iCall = prompt.lastIndexOf(' Does the');
  if (iChange < 0 || iCall < iChange) return [['', prompt]];
  return [
    ['Starting point', prompt.slice(0, iChange).trim().replace(/^Starting point \(([^)]*)\):\s*/, '$1: ')],
    ['What changes', prompt.slice(iChange, iCall).trim()],
    ['Your call', prompt.slice(iCall).trim()],
  ];
}

export function PracticeTab(props: { tone?: Tone } = {}) {
  const tone: Tone = props.tone ?? 'sme';
  const [question, setQuestion] = useState<PracticeQuestion>(() => generateQuestion());
  const [direction, setDirection] = useState<Direction | null>(null);
  const [valueText, setValueText] = useState('');
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [loading, setLoading] = useState(false);
  const [earned, setEarned] = useState(0);
  const [attempted, setAttempted] = useState(0);
  const submitId = useRef(0);

  const parsed = Number(valueText.replace(/,/g, ''));
  const valueOk = valueText.trim() !== '' && Number.isFinite(parsed);
  const canSubmit = direction !== null && valueOk && !outcome && !loading;

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!canSubmit || direction === null) return;
    const score = scoreAnswer(question, direction, parsed);
    setEarned((n) => n + score.score);
    setAttempted((n) => n + 1);
    const id = ++submitId.current;
    setOutcome({ direction, value: parsed, score, feedback: null });
    setLoading(true);
    try {
      const feedback = await practiceFeedback(question, direction, parsed, score, tone);
      if (submitId.current === id) setOutcome({ direction, value: parsed, score, feedback });
    } catch {
      // keep the score; feedback simply stays empty
    } finally {
      if (submitId.current === id) setLoading(false);
    }
  }

  function next(): void {
    submitId.current += 1;
    setQuestion(generateQuestion());
    setDirection(null);
    setValueText('');
    setOutcome(null);
    setLoading(false);
  }

  const unitHint = question.unit === 'MYR' ? 'MYR amount, e.g. 450000' : 'MYR per 1 USD, e.g. 4.4500';

  const rows = promptRows(question.prompt);

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,40rem)_1fr]" aria-label="Practice question">
      <div className="space-y-4">
        <div className="flex items-baseline justify-between">
          <span className="label">Question {attempted + (outcome ? 0 : 1)}</span>
          <span className="num text-sm text-fg-muted" aria-live="polite">
            Score {earned} of {attempted}
          </span>
        </div>

        <form onSubmit={(e) => void onSubmit(e)} className="surface space-y-5 rounded-2xl p-6">
          <dl className="space-y-3">
            {rows.map(([k, v]) => (
              <div key={k || 'all'} className={k ? 'grid gap-1 sm:grid-cols-[8.5rem_1fr] sm:gap-4' : ''}>
                {k && <dt className="label pt-0.5">{k}</dt>}
                <dd className="num text-sm leading-relaxed text-fg">{v}</dd>
              </div>
            ))}
          </dl>

          <fieldset className="space-y-2" disabled={outcome !== null}>
            <legend className="label">Which way does it move?</legend>
            <div className="flex gap-2">
              {(
                [
                  ['up', 'Goes up'],
                  ['down', 'Goes down'],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-center text-sm focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus active:scale-[0.98] ${
                    direction === value
                      ? 'bg-primary-tint font-medium text-accent shadow-[0_0_0_1.5px_var(--primary-solid)]'
                      : 'bg-surface text-fg-2 shadow-[var(--shadow-control)] hover:bg-sunken'
                  }`}
                >
                  <input
                    type="radio"
                    name="direction"
                    value={value}
                    checked={direction === value}
                    onChange={() => setDirection(value)}
                    className="sr-only"
                  />
                  <Icon name={value} size={16} />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="space-y-1">
            <label htmlFor="practice-value" className="label block">
              Your estimate <span className="font-normal text-fg-muted">({unitHint})</span>
            </label>
            <input
              id="practice-value"
              inputMode="decimal"
              value={valueText}
              onChange={(e) => setValueText(e.target.value)}
              disabled={outcome !== null}
              className="field num w-full px-3 py-2 text-sm text-fg outline-none disabled:bg-sunken"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-lg bg-primary-solid px-4 py-2 text-sm font-semibold text-on-primary hover:bg-accent disabled:cursor-not-allowed disabled:bg-line-strong"
            >
              Check answer
            </button>
            <button
              type="button"
              onClick={next}
              className="control rounded-lg bg-surface px-4 py-2 text-sm font-medium text-fg-2 hover:bg-sunken"
            >
              {outcome ? 'Next question' : 'Skip'}
            </button>
          </div>
        </form>
      </div>

      <div className="lg:pt-8">
        {outcome ? (
          <div className="msg-enter surface space-y-3 rounded-2xl p-6" role="status">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span
                className={`rounded-md px-3 py-1 text-sm font-medium ${
                  outcome.score.correct
                    ? 'bg-primary-tint text-accent'
                    : outcome.score.directionCorrect
                      ? 'bg-cost-tint text-cost-text'
                      : 'bg-danger-tint text-danger'
                }`}
              >
                {outcome.score.correct
                  ? 'Correct: +1'
                  : outcome.score.directionCorrect
                    ? 'Right direction, value off: +0.5'
                    : 'Not quite: +0'}
              </span>
              <span className="text-xs text-fg-muted">
                <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="inline-flex items-center gap-1">
                    Direction <Icon name={outcome.score.directionCorrect ? 'verified' : 'close'} size={14} className={outcome.score.directionCorrect ? 'text-accent' : 'text-danger'} />
                    <span className="sr-only">{outcome.score.directionCorrect ? 'correct' : 'incorrect'}</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    Value within 1% <Icon name={outcome.score.valueCorrect ? 'verified' : 'close'} size={14} className={outcome.score.valueCorrect ? 'text-accent' : 'text-danger'} />
                    <span className="sr-only">{outcome.score.valueCorrect ? 'correct' : 'incorrect'}</span>
                  </span>
                </span>
              </span>
            </div>

            {loading && (
              <div className="flex items-center gap-2 text-sm text-fg-muted">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-primary-solid border-t-transparent" />
                Getting feedback
              </div>
            )}
            {outcome.feedback && (
              <div className="text-sm leading-relaxed text-fg">
                <GuardedText guard={outcome.feedback.guard} />
                <div className="mt-4 border-t border-line-soft pt-3">
                  <VerifiedMark verified={outcome.feedback.guard.verified} total={outcome.feedback.guard.total} offline={outcome.feedback.offline} />
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="hidden text-sm text-fg-muted lg:block">Your result and the engine's working will appear here.</p>
        )}
      </div>
    </section>
  );
}
