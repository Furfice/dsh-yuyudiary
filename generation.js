import { safeText } from './core.js';

function cleanFailure(failure) {
  const result = {};
  for (const key of ['message', 'code', 'requestId']) {
    if (typeof failure?.[key] === 'string') result[key] = safeText(failure[key], key === 'message' ? 600 : 120);
  }
  for (const key of ['status', 'providerRetryAfterMs', 'offloadImages']) {
    if (Number.isFinite(failure?.[key])) result[key] = failure[key];
  }
  return result;
}

export function generationFailure(error) {
  return error?.diaryFailure ?? { kind: 'exception', failure: cleanFailure(error) };
}

function unfinished(reason) {
  const kind = typeof reason?.kind === 'string' ? safeText(reason.kind, 80) : reason == null ? 'missing-finish' : 'invalid-finish';
  const failure = cleanFailure(reason?.failure);
  const detail = [failure.code, failure.status === undefined ? '' : `HTTP ${failure.status}`, failure.message].filter(Boolean).join(' · ');
  const error = new Error(`模型未正常完成日记（${kind}）${detail ? '：' + detail : ''}`);
  error.diaryFailure = { kind, ...(Object.keys(failure).length ? { failure } : {}) };
  return error;
}

/** Consume the Host's StreamChunk protocol, including its object-valued FinishReason. */
export async function generateDiary(llm, { system, input, route, signal }) {
  const deadline = new AbortController(); const abort = () => deadline.abort(signal.reason);
  signal.addEventListener('abort', abort, { once: true });
  if (signal.aborted) abort();
  const timeout = setTimeout(() => deadline.abort(new Error('写日记超时（120 秒）')), 120000); timeout.unref?.();
  try {
    deadline.signal.throwIfAborted();
    const call = await llm.prepareCall({ ...route, maxTokens: 4096 }, deadline.signal);
    let finish = null; const blocks = new Map();
    for await (const chunk of call.stream({ ...call.config, system, messages: [{ role: 'user', content: [{ type: 'text', text: input }] }], tools: [], signal: deadline.signal })) {
      deadline.signal.throwIfAborted();
      if (chunk.type === 'text-delta') blocks.set(chunk.index, (blocks.get(chunk.index) ?? '') + chunk.text);
      if (chunk.type === 'block-end' && chunk.block?.type === 'text') blocks.set(chunk.index, chunk.block.text);
      if (chunk.type === 'finish') finish = chunk.reason;
    }
    deadline.signal.throwIfAborted();
    if (finish?.kind !== 'stop') throw unfinished(finish);
    return [...blocks.entries()].sort(([a], [b]) => a - b).map(([, text]) => text).join('\n');
  } finally { clearTimeout(timeout); signal.removeEventListener('abort', abort); }
}
