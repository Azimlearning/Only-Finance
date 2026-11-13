import type { ReactNode } from 'react';
import { formatCorrected } from '../guard';
import type { GuardResult, Segment } from '../guard';

/** The UI shows plain text, so strip markdown the model may emit despite the prompt. */
function plain(t: string): string {
  let o = t.replace(/\*\*|__|`/g, '').replace(/^\s*#{1,6}\s*/gm, '');
  o = o.replace(/^[ \t]*\|?[ \t]*:?-{3,}[-:| \t]*(\r?\n)?/gm, '');
  if (o.includes('|')) o = o.replace(/^[ \t]*\|[ \t]*/gm, '').replace(/[ \t]*\|[ \t]*$/gm, '').replace(/[ \t]*\|[ \t]*/g, ' · ');
  return o;
}

type Piece = { kind: 'text'; text: string } | { kind: 'num'; seg: Extract<Segment, { kind: 'number' }> };

const WORDY = /[\p{L}\p{N}%]/u;

/**
 * Break the segment stream into lines. Text is cleaned of markdown per segment, then split on newlines.
 * Where the model glued a word to a number ("cost of**450 000**" becomes "cost of450 000" once the bold
 * markers go), a space is restored. The numbers themselves are never touched, so every one keeps its
 * verified / corrected / unverified status.
 */
function toLines(segments: Segment[]): Piece[][] {
  const lines: Piece[][] = [[]];
  const lastChar = (): string => {
    const line = lines[lines.length - 1];
    const p = line[line.length - 1];
    if (!p) return '';
    return p.kind === 'text' ? p.text.slice(-1) : p.seg.raw.slice(-1);
  };
  segments.forEach((seg) => {
    if (seg.kind === 'number') {
      const line = lines[lines.length - 1];
      if (lastChar() && WORDY.test(lastChar())) line.push({ kind: 'text', text: ' ' });
      line.push({ kind: 'num', seg });
      return;
    }
    const after = lines[lines.length - 1].at(-1);
    let text = plain(seg.text);
    if (after?.kind === 'num' && text && WORDY.test(text[0]) && /[\p{N}]$/u.test(after.seg.raw)) text = ` ${text}`;
    text.split('\n').forEach((part, i) => {
      if (i > 0) lines.push([]);
      if (part) lines[lines.length - 1].push({ kind: 'text', text: part });
    });
  });
  return lines;
}

function renderPiece(p: Piece, key: number): ReactNode {
  if (p.kind === 'text') return <span key={key}>{p.text}</span>;
  const seg = p.seg;
  if (seg.status === 'verified') {
    return (
      <span
        key={key}
        className="whitespace-nowrap underline decoration-primary/60 decoration-1 underline-offset-2"
        title="Verified against the engine"
      >
        {seg.raw}
        <span className="sr-only"> (verified)</span>
      </span>
    );
  }
  if (seg.status === 'corrected' && seg.correct !== undefined) {
    return (
      <span key={key} title="The model's number was wrong; replaced with the engine value">
        <del className="text-fg-subtle decoration-fg-subtle">{seg.raw}</del>{' '}
        <strong className="whitespace-nowrap font-semibold text-accent">{formatCorrected(seg.raw, seg.correct)}</strong>{' '}
        <span className="text-xs font-medium text-accent">corrected to the engine value</span>
      </span>
    );
  }
  return (
    <span key={key} className="whitespace-nowrap rounded bg-cost-tint px-0.5 text-cost-text" title="Could not be checked against the engine; treat with caution">
      {seg.raw}
      <sup className="font-semibold">?</sup>
      <span className="sr-only"> (unverified)</span>
    </span>
  );
}

const BULLET = /^\s*[-•*]\s+/;

/** Renders AI text with each number marked by its guard status. Paragraphs and "- " bullets become real blocks. */
export function GuardedText(props: { guard: GuardResult }) {
  const lines = toLines(props.guard.segments);
  const blocks: ReactNode[] = [];
  let items: ReactNode[] = [];
  const flush = (): void => {
    if (items.length) {
      blocks.push(
        <ul key={`ul${blocks.length}`} className="mt-2 list-disc space-y-1 pl-5 first:mt-0">
          {items}
        </ul>,
      );
      items = [];
    }
  };
  lines.forEach((line, i) => {
    if (line.length === 0) {
      flush();
      return;
    }
    const first = line[0];
    const isBullet = first.kind === 'text' && BULLET.test(first.text);
    const pieces = isBullet && first.kind === 'text' ? [{ kind: 'text', text: first.text.replace(BULLET, '') } as Piece, ...line.slice(1)] : line;
    const content = pieces.map((p, j) => renderPiece(p, j));
    if (isBullet) items.push(<li key={i}>{content}</li>);
    else {
      flush();
      blocks.push(
        <p key={i} className="mt-2 first:mt-0 [overflow-wrap:anywhere]">
          {content}
        </p>,
      );
    }
  });
  flush();
  return <div>{blocks}</div>;
}
