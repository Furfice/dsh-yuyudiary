import { dayKey, activityDates, tasksForDate, chooseRoute, doodlesFor, makePrompt, diaryDraft, validDay, toMarkdown, safeText } from './core.js';
import { BOOKMARK_COLORS } from './ui-model.js';
import { generationFailure } from './generation.js';

export const MAX_AUTOMATIC_ATTEMPTS = 3;
const retryPaused = pending => pending?.paused || pending?.attempts >= MAX_AUTOMATIC_ATTEMPTS;

function checkSessionId(id) {
  if (typeof id !== 'string' || !id.trim() || id.length > 256 || /[\u0000-\u001f\u007f]/.test(id)) throw new Error('无效会话 ID');
}

/** One serialized writer owns capture, retries and daily commits. The UI never runs the scheduler. */
export class DiaryEngine {
  constructor({ store, capture, generate, timezone = 'Asia/Shanghai', clock = Date.now, graceMinutes = 3, maxEntriesPerPass = 7, route = null, startDate = '' }) {
    Object.assign(this, { store, capture, generate, timezone, clock, graceMinutes, maxEntriesPerPass, route, startDate });
    this.state = null; this.entries = new Map(); this.busy = null; this.controller = new AbortController(); this.status = 'starting'; this.error = ''; this.lastFullScan = ''; this.writingDate = null;
    this.policyQueue = Promise.resolve(); this.policyChanges = 0; this.passController = null;
    this.bookmarks = {}; this.bookmarkQueue = Promise.resolve();
  }
  async init() {
    await this.store.init();
    try {
      const saved = await this.store.readState(); const today = dayKey(this.clock(), this.timezone);
      if (saved && (saved.version !== 1 || !validDay(saved.startedDate) || !saved.ledger || !saved.pending)) throw new Error('日记数据版本或结构不正确，已停止写入以保留原文件');
      if (saved?.timezone && saved.timezone !== this.timezone) throw new Error(`日记已按 ${saved.timezone} 归档；请恢复该时区，避免日期错位`);
      this.state = saved ?? { version: 1, retryPolicyVersion: 1, timezone: this.timezone, startedDate: validDay(this.startDate) && this.startDate <= today ? this.startDate : today, ledger: {}, pending: {}, lastCapturedAt: null };
      // Give existing failures one bounded retry cycle after the finish-protocol fix, only once.
      if (this.state.retryPolicyVersion === undefined) {
        this.state.pending = Object.fromEntries(Object.entries(this.state.pending).map(([date, pending]) => [date,
          { ...pending, previousAttempts: pending.attempts ?? 0, attempts: 0, retryAt: 0, paused: false }]));
        this.state.retryPolicyVersion = 1;
      }
      if (this.state.excludedSessions === undefined) this.state.excludedSessions = [];
      if (!Array.isArray(this.state.excludedSessions)) throw new Error('会话日记设置无效，原文件已保留');
      this.state.excludedSessions.forEach(checkSessionId);
      this.state.excludedSessions = [...new Set(this.state.excludedSessions)];
      for (const id of this.state.excludedSessions) delete this.state.ledger[id];
      for (const entry of await this.store.listEntries()) this.entries.set(entry.date, entry);
      const bookmarks = await this.store.readBookmarks();
      if (bookmarks && (bookmarks.version !== 1 || !bookmarks.colors || typeof bookmarks.colors !== 'object' || Array.isArray(bookmarks.colors)
        || Object.entries(bookmarks.colors).some(([date, color]) => !validDay(date) || !BOOKMARK_COLORS.includes(color)))) throw new Error('书签数据无效，原文件已保留');
      this.bookmarks = bookmarks?.colors ?? {};
      // A crash can happen after the entry is committed but before pending state is cleared.
      for (const date of this.entries.keys()) delete this.state.pending[date];
      await this.store.saveState(this.state); this.settledStatus();
    } catch (e) { await this.store.close(); throw e; }
  }
  settledStatus() {
    const pending = Object.values(this.state.pending);
    this.status = pending.some(retryPaused) ? 'paused' : pending.length ? 'pending' : 'ready';
  }
  tick({ force = false, retryFailed = false } = {}) {
    if (this.controller.signal.aborted) return Promise.resolve();
    if (this.policyChanges) return this.policyQueue;
    if (this.busy) return this.busy;
    const pass = new AbortController(); this.passController = pass;
    const abort = () => pass.abort(this.controller.signal.reason);
    this.controller.signal.addEventListener('abort', abort, { once: true });
    this.busy = this.run(force, retryFailed, pass.signal).catch(e => {
      if (!this.controller.signal.aborted) {
        this.status = pass.signal.aborted ? 'ready' : 'error'; this.error = pass.signal.aborted ? '' : safeText(e.message, 240);
      }
    }).finally(() => { this.controller.signal.removeEventListener('abort', abort); this.passController = null; this.busy = null; this.writingDate = null; });
    return this.busy;
  }
  async run(force, retryFailed, signal) {
    const now = this.clock(), today = dayKey(now, this.timezone);
    this.status = 'collecting'; this.error = '';
    const resumed = this.lastFullScan === '';
    const full = this.lastFullScan !== today || force;
    const excluded = new Set(this.state.excludedSessions);
    const captured = await this.capture({ full, signal, startedDate: this.state.startedDate, excludedSessionIds: excluded });
    signal.throwIfAborted();
    for (const item of captured) {
      if (excluded.has(item.sessionId)) continue;
      // Keep only the diary's coverage period. Older logs are never turned into surprise diaries.
      const days = Object.fromEntries(Object.entries(item.days).filter(([date]) => date >= this.state.startedDate));
      this.state.ledger[item.sessionId] = { ...item, days };
    }
    this.state.lastCapturedAt = new Date(now).toISOString();
    const activeDates = activityDates(this.state.ledger).filter(date => date >= this.state.startedDate);
    this.state.pending = Object.fromEntries(Object.entries(this.state.pending).filter(([date]) => activeDates.includes(date) && !this.entries.has(date)));
    await this.store.saveState(this.state);
    if (full) this.lastFullScan = today;
    const eligibleToday = dayKey(now - this.graceMinutes * 60000, this.timezone);
    const due = activeDates.filter(date => date < eligibleToday && !this.entries.has(date));
    let count = 0;
    for (const date of due) {
      signal.throwIfAborted();
      const pending = this.state.pending[date];
      if (!retryFailed && (retryPaused(pending) || pending?.retryAt > this.clock())) continue;
      if (count++ >= this.maxEntriesPerPass) break;
      const tasks = tasksForDate(this.state.ledger, date);
      this.status = 'writing'; this.writingDate = date;
      const attempts = (pending?.attempts ?? 0) + 1;
      const paused = attempts >= MAX_AUTOMATIC_ATTEMPTS;
      const delay = 60000 * 2 ** Math.min(attempts - 1, 6);
      // Reserve the attempt before dispatch: closing/restarting cannot bypass the budget.
      this.state.pending[date] = { ...pending, attempts, paused, retryAt: paused ? null : this.clock() + delay, lastAttemptAt: new Date(this.clock()).toISOString() };
      await this.store.saveState(this.state);
      try {
        const route = chooseRoute(this.state.ledger, this.route);
        if (!route) throw new Error('尚未找到可用的对话模型。请先在 DSH 完成一次对话，再点补写日记。');
        const output = await this.generate({ ...makePrompt(date, tasks), route, signal });
        signal.throwIfAborted();
        const draft = diaryDraft(output);
        const text = draft.text, source = 'model';
        const entry = { version: 1, date, text, source, taskCount: tasks.length, sessionCount: new Set(tasks.map(t => t.sessionId)).size,
          tasks: tasks.map(({ id, prompt, status, toolCount, toolErrors }) => ({ id, prompt, status, toolCount, toolErrors })),
          doodles: doodlesFor(date), writtenAt: new Date(this.clock()).toISOString(), backfilled: dayKey(this.clock() - 86400000, this.timezone) > date || resumed,
          timezone: this.timezone };
        const committed = await this.store.saveEntry(entry); this.entries.set(date, committed);
        delete this.state.pending[date]; await this.store.saveState(this.state);
      } catch (e) {
        signal.throwIfAborted();
        const diagnostics = generationFailure(e);
        const wait = Math.max(delay, diagnostics.failure?.providerRetryAfterMs ?? 0);
        this.state.pending[date] = { ...this.state.pending[date], retryAt: paused ? null : this.clock() + wait,
          error: safeText(e.message, 400), diagnostics };
        await this.store.saveState(this.state);
      }
    }
    this.writingDate = null; this.settledStatus();
  }
  sessionPolicy(sessionId) {
    checkSessionId(sessionId);
    return { sessionId, excluded: this.state.excludedSessions.includes(sessionId) };
  }
  setSessionExcluded(sessionId, excluded) {
    checkSessionId(sessionId);
    if (typeof excluded !== 'boolean') throw new Error('是否写入日记必须是布尔值');
    this.controller.signal.throwIfAborted();
    // Stop an in-flight draft before serializing the preference with the sole state writer.
    this.policyChanges++;
    const interruptedDate = this.writingDate;
    this.passController?.abort(new Error('会话日记设置已变更，正在重新整理'));
    const change = this.policyQueue.then(async () => {
      await this.busy; this.controller.signal.throwIfAborted();
      const ids = new Set(this.state.excludedSessions);
      if (excluded) ids.add(sessionId); else ids.delete(sessionId);
      const next = { ...this.state, excludedSessions: [...ids],
        ledger: Object.fromEntries(Object.entries(this.state.ledger).filter(([id]) => !ids.has(id))) };
      // Changed source facts may be retried immediately, but never renew an exhausted attempt budget.
      if (interruptedDate && next.pending[interruptedDate] && !retryPaused(next.pending[interruptedDate])) {
        next.pending = { ...next.pending, [interruptedDate]: { ...next.pending[interruptedDate], retryAt: 0 } };
      }
      await this.store.saveState(next);
      this.state = next; this.lastFullScan = '';
      return this.sessionPolicy(sessionId);
    }).finally(() => {
      this.policyChanges--;
      if (!this.policyChanges) void this.tick({ force: true });
    });
    this.policyQueue = change.catch(() => {});
    return change;
  }
  snapshot() {
    const today = dayKey(this.clock(), this.timezone);
    const excluded = new Set(this.state.excludedSessions);
    const entries = [...this.entries.values()].sort((a, b) => b.date.localeCompare(a.date));
    // An imported preview/older entry must remain browsable without backdating capture.
    const archiveStartDate = [this.state.startedDate, ...entries.map(e => e.date)].sort()[0];
    const pending = activityDates(this.state.ledger).filter(date => date >= this.state.startedDate && date < today && !this.entries.has(date)).map(date => ({ date, ...(this.state.pending[date] ?? {}) }));
    return { today, startedDate: this.state.startedDate, archiveStartDate, timezone: this.timezone, status: this.status, error: this.error, writingDate: this.writingDate, lastCapturedAt: this.state.lastCapturedAt,
      todayTasks: tasksForDate(this.state.ledger, today).filter(task => !excluded.has(task.sessionId))
        .map(({ id, sessionId, prompt, status }) => ({ id, sessionId, prompt, status })), pending,
      entries: entries.map(({ date, text, taskCount, source, backfilled }) => ({ date, excerpt: text.slice(0, 65), taskCount, source, backfilled, bookmark: this.bookmarks[date] ?? null })) };
  }
  setBookmark(date, color) {
    if (!validDay(date) || !this.entries.has(date)) throw new Error('只能为已经写好的日记设置书签');
    if (color !== null && !BOOKMARK_COLORS.includes(color)) throw new Error('无效书签颜色');
    this.controller.signal.throwIfAborted();
    const change = this.bookmarkQueue.then(async () => {
      this.controller.signal.throwIfAborted();
      const next = { ...this.bookmarks };
      if (color === null) delete next[date]; else next[date] = color;
      await this.store.saveBookmarks(next); this.bookmarks = next;
      return { date, color };
    });
    this.bookmarkQueue = change.catch(() => {});
    return change;
  }
  read(date) { if (!validDay(date)) throw new Error('无效日期'); return this.entries.get(date) ?? null; }
  export(date) { const entry = this.read(date); if (!entry) throw new Error('这一天还没有日记'); return { filename: `鱼鱼日记-${date}.md`, text: toMarkdown(entry) }; }
  async stop() { this.controller.abort(new Error('鱼鱼日记已关闭')); await this.busy; await this.policyQueue; await this.bookmarkQueue; await this.store.close(); }
}
