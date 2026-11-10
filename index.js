import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import Schema from '@deepseek-ai/schemastery';
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import { initialProjection, foldEvent, foldLog, projectionSchema, safeText } from './core.js';
import { DiaryStore } from './storage.js';
import { DiaryEngine } from './engine.js';
import { generateDiary } from './generation.js';
import { defaultDataDirectory, resolveDataDirectory, migrateLegacyData } from './data-location.js';
import { DOODLE_ATLASES } from './doodles.js';

export const name = 'yuyu-diary';
export const inject = ['sessionQuery', 'sessionProjections', 'sessions', 'llm', 'connection'];
export const Config = Schema.object({
  dataDir: Schema.string().default(defaultDataDirectory()).description('日记的独立保存目录；默认位于 DSH_HOME/data/dsh-yuyudiary，未设置 DSH_HOME 时使用用户目录下的 .dsh'),
  timezone: Schema.string().default('Asia/Shanghai').description('自然日使用的 IANA 时区'),
  pollSeconds: Schema.number().min(15).max(3600).default(60),
  midnightGraceMinutes: Schema.number().min(0).max(60).default(3),
  maxEntriesPerPass: Schema.number().min(1).max(31).step(1).default(7),
  provider: Schema.string().default('').description('留空时沿用最近一次对话的模型提供方'),
  model: Schema.string().default('').description('留空时沿用最近一次对话的模型'),
  startDate: Schema.string().default('').description('首次启用的起始日期 YYYY-MM-DD；默认从今天开始')
});

// Use the Host Gateway's documented source-mode Remote descriptors. No second /api interceptor.
const remoteInitializers = [];
class DiaryRemote extends TypertRemoteService {
  constructor(ctx, { operation }) {
    super(ctx, 'yuyuDiary'); this.operation = operation;
    for (const initialize of remoteInitializers) initialize.call(this);
  }
  owner() { const peer = this.ctx.invocation?.peer; if (peer && peer.principal.kind !== 'owner') throw new Error('只有日记主人可以打开这本日记'); }
  async list() { this.owner(); return this.operation('list'); }
  async read(date) { this.owner(); return this.operation('read', date); }
  async export(date) { this.owner(); return this.operation('export', date); }
  async retry() { this.owner(); return this.operation('retry'); }
  async doodle(atlas) { this.owner(); return this.operation('doodle', atlas); }
  async setBookmark(date, color) { this.owner(); return this.operation('bookmark', { date, color }); }
  async sessionPolicy(sessionId) { this.owner(); return this.operation('sessionPolicy', { sessionId }); }
  async setSessionExcluded(sessionId, excluded) {
    this.owner();
    if (this.ctx.invocation?.peer?.principal.kind !== 'owner') throw new Error('请由日记主人在会话菜单修改此设置');
    return this.operation('setSessionExcluded', { sessionId, excluded });
  }
}
for (const method of ['list', 'read', 'export', 'retry', 'doodle', 'sessionPolicy', 'setSessionExcluded', 'setBookmark']) Remote(DiaryRemote.prototype[method], {
  kind: 'method', name: method, static: false, private: false, addInitializer: fn => remoteInitializers.push(fn)
});

export async function apply(ctx, config) {
  const directory = resolveDataDirectory(config.dataDir);
  if (directory === defaultDataDirectory()) await migrateLegacyData(fileURLToPath(new URL('./data/', import.meta.url)), directory);
  const timezone = config.timezone || 'Asia/Shanghai';
  new Intl.DateTimeFormat('en', { timeZone: timezone }).format();
  const projectionKey = `yuyuDiary.v1.${timezone.replace(/[^A-Za-z0-9]/g, '_')}`;
  const registration = await ctx.sessionProjections.register({ key: projectionKey, stateVersion: 1, stateSchema: projectionSchema,
    init: initialProjection, apply: (state, event) => foldEvent(state, event, timezone) });
  const projection = session => typeof registration?.stateOf === 'function' ? registration.stateOf(session) : ctx.sessionProjections.stateOf(session, projectionKey);
  const capture = async ({ full, signal, excludedSessionIds }) => {
    const snapshots = [], live = new Map(ctx.sessions.list().map(s => [s.id, s]));
    if (full) {
      const sessions = await ctx.sessionQuery.listSessions(signal);
      for (const row of sessions) {
        signal.throwIfAborted();
        if (live.has(row.header.id) || excludedSessionIds.has(row.header.id)) continue;
        try { snapshots.push(foldLog(await ctx.sessionQuery.readSession(row.header.id), timezone)); }
        catch (e) { throw new Error(`有历史会话暂时无法读取，鱼鱼会稍后重试：${safeText(e.message, 120)}`); }
      }
    }
    for (const session of live.values()) { signal.throwIfAborted(); if (!excludedSessionIds.has(session.id)) snapshots.push(projection(session)); }
    return snapshots;
  };
  const generate = request => generateDiary(ctx.llm, request);
  const engine = new DiaryEngine({ store: new DiaryStore(directory), capture, generate, timezone,
    graceMinutes: config.midnightGraceMinutes, maxEntriesPerPass: config.maxEntriesPerPass,
    route: config.provider && config.model ? { provider: config.provider, model: config.model } : null, startDate: config.startDate });
  await engine.init();
  ctx.effect(() => () => engine.stop());
  const artworkCache = new Map();
  const operation = async (action, date) => {
    if (action === 'doodle') {
      const atlas = date;
      if (!Number.isInteger(atlas) || atlas < 0 || atlas >= DOODLE_ATLASES.length) throw new Error('无效涂鸦图集');
      if (artworkCache.has(atlas)) return artworkCache.get(atlas);
      const png = await readFile(new URL(`assets/${DOODLE_ATLASES[atlas]}`, import.meta.url));
      if (png.length > 8 * 1024 * 1024 || !png.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) throw new Error('涂鸦图片格式无效');
      const result = { uri: `data:image/png;base64,${png.toString('base64')}` };
      artworkCache.set(atlas, result);
      if (artworkCache.size > 3) artworkCache.delete(artworkCache.keys().next().value);
      return result;
    }
    if (action === 'list') return engine.snapshot();
    if (action === 'read') return { entry: engine.read(date) };
    if (action === 'export') return engine.export(date);
    if (action === 'retry') { void engine.tick({ force: true, retryFailed: true }); return { accepted: true }; }
    if (action === 'sessionPolicy') return engine.sessionPolicy(date.sessionId);
    if (action === 'setSessionExcluded') return engine.setSessionExcluded(date.sessionId, date.excluded);
    if (action === 'bookmark') return engine.setBookmark(date.date, date.color);
    throw new Error('不支持的日记操作');
  };
  ctx.plugin(DiaryRemote, { operation });
  // The same application operation is available to an agent when its tool registry is present.
  ctx.inject(['tools'], toolCtx => {
    toolCtx.tools.register({ name: 'yuyu_diary', description: '查看鱼鱼的每日任务日记、读取某一天、导出 Markdown、设置或取消日记书签，或重试尚未写成的日记。没有任务记录的日期跳过。',
      parameters: { type: 'object', properties: { action: { type: 'string', enum: ['list', 'read', 'export', 'retry', 'bookmark'] }, date: { type: 'string', description: 'YYYY-MM-DD，read/export/bookmark 必填' }, color: { type: ['string', 'null'], enum: ['rose', 'amber', 'blue', 'sage', null], description: 'bookmark 必填，null 取消书签' } }, required: ['action'], additionalProperties: false },
      output: { schema: { type: 'object', additionalProperties: true }, render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }] },
      execute: async (args, exec) => {
        exec.signal.throwIfAborted();
        if (!['list', 'read', 'export', 'retry', 'bookmark'].includes(args.action)) throw new Error('会话是否写入日记只能由主人在菜单中设置');
        return operation(args.action, args.action === 'bookmark' ? { date: args.date, color: args.color } : args.date);
      }
    });
  });
  ctx.effect(() => {
    const timer = setInterval(() => { void engine.tick(); }, config.pollSeconds * 1000); timer.unref?.();
    void engine.tick(); return () => clearInterval(timer);
  });
}
