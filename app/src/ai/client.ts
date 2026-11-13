// LLM client: POST /api/llm (Vite dev proxy adds the key server-side), tool-call loop, number guard.
// Falls back to offline templates when there is no key, no model id, no network or a non-OK response.

import type { Scenario } from '../engine';
import { collectNumbers, numbersInText, verifyNumbers } from './guard';
import type { GuardResult } from './guard';
import { offlineAnswer, offlineExplain } from './offline';
import type { OfflineOutput } from './offline';
import { buildExplainPrompt, buildSystemPrompt } from './prompts';
import type { Tone } from './prompts';
import { TOOLS, runTool } from './tools';

export type { Tone };

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface TutorReply {
  text: string;
  guard: GuardResult;
  toolCalls: { name: string; args: unknown }[];
  offline: boolean;
  /** Model OpenRouter reports having answered (LLM replies only). */
  model?: string;
}

// OpenAI-compatible wire types (OpenRouter chat completions).
interface WireToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}
type WireMessage =
  | { role: 'system' | 'user'; content: string }
  | { role: 'assistant'; content: string | null; tool_calls?: WireToolCall[] }
  | { role: 'tool'; tool_call_id: string; content: string };

const MAX_ROUNDS = 5;
const REQUEST_TIMEOUT_MS = 45_000;

const WIRE_TOOLS = TOOLS.map((t) => ({
  type: 'function' as const,
  function: { name: t.name, description: t.description, parameters: t.parameters },
}));

function llmEnabled(): boolean {
  const flag = typeof __LLM_ENABLED__ !== 'undefined' && __LLM_ENABLED__;
  return Boolean(flag && import.meta.env.VITE_OPENROUTER_MODEL);
}

interface CompletionResponse {
  model?: string;
  choices?: { message?: { content?: string | null; tool_calls?: WireToolCall[] } }[];
  error?: { message?: string };
}

let lastModel: string | undefined;

async function complete(messages: WireMessage[], toolChoice: 'auto' | 'none'): Promise<NonNullable<NonNullable<CompletionResponse['choices']>[number]['message']>> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch('/api/llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: import.meta.env.VITE_OPENROUTER_MODEL,
        // OpenRouter model fallbacks: first entry is tried first, the rest on error/rate limit.
        ...(import.meta.env.VITE_OPENROUTER_FALLBACK_MODEL
          ? { models: [import.meta.env.VITE_OPENROUTER_MODEL, import.meta.env.VITE_OPENROUTER_FALLBACK_MODEL] }
          : {}),
        messages,
        tools: WIRE_TOOLS,
        tool_choice: toolChoice,
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`LLM request failed: HTTP ${res.status}`);
    const data = (await res.json()) as CompletionResponse;
    if (data.error) throw new Error(data.error.message ?? 'LLM error');
    const msg = data.choices?.[0]?.message;
    if (!msg) throw new Error('LLM returned no message');
    lastModel = data.model;
    return msg;
  } finally {
    clearTimeout(timer);
  }
}

/** Numbers quoted inside engine `workings` strings (intermediate steps are engine-derived too). */
function workingNumbers(v: unknown, inWorkings = false, out: number[] = []): number[] {
  if (typeof v === 'string') {
    if (inWorkings) out.push(...numbersInText(v));
  } else if (Array.isArray(v)) {
    for (const x of v) workingNumbers(x, inWorkings, out);
  } else if (v !== null && typeof v === 'object') {
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) workingNumbers(x, inWorkings || k === 'workings', out);
  }
  return out;
}

function scenarioNumbers(s: Scenario): number[] {
  return collectNumbers([s.deal, s.a]);
}

/** Run the tool-calling loop. Throws on any transport failure (caller falls back to offline). */
async function runChat(
  messages: WireMessage[],
  scenario: Scenario,
): Promise<{ text: string; toolCalls: { name: string; args: unknown }[]; known: number[] }> {
  const toolCalls: { name: string; args: unknown }[] = [];
  const known: number[] = scenarioNumbers(scenario);

  for (let round = 0; round <= MAX_ROUNDS; round++) {
    // After MAX_ROUNDS of tool use, force a plain-text answer.
    const msg = await complete(messages, round < MAX_ROUNDS ? 'auto' : 'none');
    const calls = msg.tool_calls ?? [];
    if (calls.length === 0 || round === MAX_ROUNDS) {
      const text = (msg.content ?? '').trim();
      if (!text) throw new Error('LLM returned an empty reply');
      return { text, toolCalls, known };
    }
    messages.push({ role: 'assistant', content: msg.content ?? null, tool_calls: calls });
    for (const call of calls) {
      let args: unknown = {};
      let parseError: string | null = null;
      try {
        args = call.function.arguments ? JSON.parse(call.function.arguments) : {};
      } catch {
        parseError = `Could not parse arguments for ${call.function.name}: ${call.function.arguments}`;
      }
      toolCalls.push({ name: call.function.name, args });
      const out = parseError
        ? { result: { error: parseError }, numbers: [] as number[] }
        : runTool(call.function.name, args, scenario);
      known.push(...out.numbers, ...workingNumbers(out.result));
      messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(out.result) });
    }
  }
  throw new Error('unreachable');
}

function toReply(
  text: string,
  known: number[],
  toolCalls: { name: string; args: unknown }[],
  offline: boolean,
): TutorReply {
  return { text, guard: verifyNumbers(text, known), toolCalls, offline };
}

/**
 * Try the LLM with `messages`; on any failure (or when disabled) use the offline template.
 * `extraKnown` = numbers the caller supplies as engine-known (e.g. data shown on the card).
 */
export async function chatOrOffline(
  messages: WireMessage[],
  scenario: Scenario,
  extraKnown: number[],
  fallback: () => OfflineOutput,
): Promise<TutorReply> {
  if (llmEnabled()) {
    try {
      const run = await runChat(messages, scenario);
      const reply = toReply(run.text, [...run.known, ...extraKnown], run.toolCalls, false);
      if (lastModel) reply.model = lastModel;
      return reply;
    } catch {
      // fall through to offline
    }
  }
  const off = fallback();
  return toReply(off.text, [...off.known, ...extraKnown, ...scenarioNumbers(scenario)], [], true);
}

export async function askTutor(history: ChatMessage[], scenario: Scenario, tone: Tone): Promise<TutorReply> {
  const lastUser = [...history].reverse().find((m) => m.role === 'user')?.content ?? '';
  const messages: WireMessage[] = [
    { role: 'system', content: buildSystemPrompt(scenario, tone) },
    ...history.map((m): WireMessage => ({ role: m.role, content: m.content })),
  ];
  return chatOrOffline(messages, scenario, [], () => offlineAnswer(lastUser, scenario, tone));
}

export async function explain(topic: string, data: unknown, scenario: Scenario, tone: Tone): Promise<TutorReply> {
  const messages: WireMessage[] = [
    { role: 'system', content: buildSystemPrompt(scenario, tone) },
    { role: 'user', content: buildExplainPrompt(topic, data) },
  ];
  const dataNumbers = [...collectNumbers(data), ...workingNumbers(data)];
  return chatOrOffline(messages, scenario, dataNumbers, () => offlineExplain(topic, data, scenario, tone));
}

export type { WireMessage };
