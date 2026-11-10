import { DIARY_SYSTEM_PROMPT, DIARY_LENGTH } from './persona.js';
export { doodlesFor } from './doodles.js';
/** Pure log projection and calendar rules. No IO, model calls, or wall clock in the fold. */
const formatters = new Map();
export function dayKey(time, timezone = 'Asia/Shanghai') {
  let f = formatters.get(timezone);
  if (!f) { f = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }); formatters.set(timezone, f); }
  const parts = Object.fromEntries(f.formatToParts(new Date(time)).map(p => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
export function validDay(day) {
  return typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isFinite(Date.parse(`${day}T00:00:00Z`)) && new Date(`${day}T00:00:00Z`).toISOString().slice(0, 10) === day;
}
export function nextDay(day) {
  if (!validDay(day)) throw new Error('日期格式错误');
  const d = new Date(`${day}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10);
}
export function daysBefore(start, today) {
  if (!validDay(start) || !validDay(today)) throw new Error('日记日期无效');
  const dates = []; for (let d = start; d < today; d = nextDay(d)) { dates.push(d); if (dates.length > 36600) throw new Error('日记日期跨度异常'); } return dates;
}
export function safeText(value, max = 700) {
  return String(value ?? '')
    .replace(/```[\s\S]*?```/g, ' [代码片段] ')
    .replace(/<[^>]{1,160}>[\s\S]*?<\/[^>]{1,160}>/g, ' ')
    .replace(/\b(?:sk|sk-proj|ghp|github_pat)-?[A-Za-z0-9_-]{20,}\b/g, '[已隐藏密钥]')
    .replace(/((?:api[_ -]?key|authorization|password|token|密码|密钥)\s*[:=：]\s*)(?:Bearer\s+)?[^\s,;"'，；]+/gi, '$1[已隐藏]')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
}
function contentText(content) {
  return typeof content === 'string' ? content : Array.isArray(content) ? content.filter(b => b?.type === 'text').map(b => b.text).join('\n') : '';
}
export function initialProjection(header, inherited = 0) {
  return { sessionId: header.id, inherited, parent: header.parentSessionId ?? null, title: '', route: null, routeTime: 0, turn: null, prompt: '', days: {} };
}
export function foldEvent(state, event, timezone = 'Asia/Shanghai') {
  if (event.seq < state.inherited) return state;
  const data = event.data ?? {};
  if (event.type === 'request/header') {
    const c = data.header?.config;
    return c?.provider && c?.model ? { ...state, route: { provider: c.provider, model: c.model }, routeTime: event.time } : state;
  }
  if (event.type === 'session/title') return { ...state, title: safeText(data.title, 100) };
  if (event.type === 'turn/start') return { ...state, turn: data.turn };
  const isUser = event.type === 'user/message' && data.source?.kind === 'user';
  const isReply = event.type === 'assistant/message';
  const isTool = event.type === 'tool/result';
  const isEnd = event.type === 'turn/end';
  if (!isUser && !isReply && !isTool && !isEnd) return state;
  const prompt = isUser ? safeText(contentText(data.content), 520) : state.prompt;
  // Injected skill/system context is never a task. A task begins with a real user message.
  if (!prompt || !Number.isFinite(event.time)) return state;
  const date = dayKey(event.time, timezone);
  const turn = data.turn ?? state.turn ?? event.seq;
  const id = `${state.sessionId}:${turn}`;
  const day = state.days[date] ?? { tasks: {}, lastTime: 0 };
  const old = day.tasks[id] ?? { id, sessionId: state.sessionId, prompt, response: '', status: 'working', toolCount: 0, toolErrors: 0, firstTime: event.time, lastTime: event.time };
  const task = { ...old, lastTime: event.time };
  if (isUser) task.prompt = prompt;
  if (isReply) { const text = safeText(contentText(data.message?.content), 950); if (text) task.response = text; if (data.interrupted) task.status = 'interrupted'; }
  if (isTool) { task.toolCount++; if (data.message?.isError) task.toolErrors++; }
  if (isEnd) task.status = data.reason?.kind ?? 'unknown';
  return { ...state, prompt, days: { ...state.days, [date]: { tasks: { ...day.tasks, [id]: task }, lastTime: event.time } } };
}
export function foldLog(snapshot, timezone) {
  return snapshot.events.reduce((s, e) => foldEvent(s, e, timezone), initialProjection(snapshot.session, snapshot.inheritedEventCount));
}
export const projectionSchema = { parse(value) {
  if (!value || typeof value.sessionId !== 'string' || !Number.isInteger(value.inherited) || !value.days || typeof value.days !== 'object' || typeof value.prompt !== 'string') throw new Error('鱼鱼日记缓存格式无效');
  for (const [date, day] of Object.entries(value.days)) {
    if (!validDay(date) || !day.tasks || typeof day.tasks !== 'object') throw new Error('鱼鱼日记任务缓存无效');
  }
  return value;
} };
export function tasksForDate(ledger, date) {
  return Object.values(ledger).flatMap(s => Object.values(s.days?.[date]?.tasks ?? {}).map(t => ({ ...t, title: s.title || '' }))).sort((a, b) => a.firstTime - b.firstTime || a.id.localeCompare(b.id));
}
export function activityDates(ledger) {
  return [...new Set(Object.values(ledger).flatMap(session => Object.entries(session.days ?? {})
    .filter(([date, day]) => validDay(date) && Object.keys(day.tasks ?? {}).length > 0).map(([date]) => date)))].sort();
}
export function chooseRoute(ledger, configured) {
  if (configured?.provider && configured?.model) return configured;
  return Object.values(ledger).filter(s => s.route).sort((a, b) => b.routeTime - a.routeTime)[0]?.route ?? null;
}
export function diaryDraft(text) {
  if (typeof text !== 'string' || text.trim().length < 30 || text.length > DIARY_LENGTH.maxOutputLength) throw new Error('模型没有返回完整日记，已保留任务记录等待重试');
  const paragraphs = text.split(/\n+/).map(paragraph => paragraph.trim()).filter(Boolean);
  const normalized = paragraphs.join('\n\n');
  const characters = [...normalized.replace(/\s/gu, '')].length;
  return { text: normalized, characters, paragraphs: paragraphs.length };
}
export function makePrompt(date, tasks) {
  // Allocate a bounded amount to every task, rather than silently dropping busy-day tail tasks.
  const budget = Math.max(70, Math.min(1350, Math.floor(25000 / Math.max(1, tasks.length))));
  const facts = tasks.map(t => ({ task: safeText(t.prompt, Math.floor(budget * .43)), result: safeText(t.response, Math.floor(budget * .57)), status: t.status, toolErrors: t.toolErrors }));
  return {
    system: DIARY_SYSTEM_PROMPT,
    input: JSON.stringify({ diaryDate: date, records: facts })
  };
}
export function toMarkdown(entry) {
  const text = entry.text.split(/\n+/).map(paragraph => paragraph.trim()).filter(Boolean).map(paragraph => '\u3000\u3000' + paragraph).join('\n\n');
  if (entry.source === 'example') return `# 鱼鱼日记 · ${entry.date}\n\n> 模拟日记 · 用于检查文风和排版，不是恢复的历史记录。\n\n${text}\n\n---\n\n样稿创建时间：${entry.writtenAt}\n`;
  return `# 鱼鱼日记 · ${entry.date}\n\n${text}\n\n---\n\n${entry.taskCount} 条任务记录 · ${entry.source === 'model' ? '鱼鱼写下' : '无任务记录'}${entry.backfilled ? ' · 启动后补记' : ''}\n\n落笔时间：${entry.writtenAt}\n`;
}
