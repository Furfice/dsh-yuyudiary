/** Run with the installed DSH runtime on this package's node_modules search path. No real profile is touched. */
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Context } from '@deepseek-ai/cordis';
import SessionStore from '@deepseek-ai/dsh-session';
import Projections from '@deepseek-ai/dsh-session-projection';
import Typert from '@deepseek-ai/dsh-typert-registry';
import Gateway from '@deepseek-ai/dsh-api-gateway';
import { Peer } from '@deepseek-ai/dsh-client-connection';
import { createUserMessage } from '@deepseek-ai/dsh-llm';
import * as plugin from '../index.js';
import { DOODLE_ATLASES } from '../doodles.js';
import { defaultDataDirectory } from '../data-location.js';

const root = fileURLToPath(new URL('../../test-data/', import.meta.url)); await mkdir(root, { recursive: true });
const directory = await mkdtemp(join(root, 'host-'));
assert.equal(plugin.Config({}).dataDir, defaultDataDirectory(), 'default storage is independent of plugin installation');
assert.equal(plugin.Config({ dataDir: directory }).dataDir, directory, 'profile storage override remains authoritative');
await mkdir(join(directory, 'entries'));
await writeFile(join(directory, 'entries', '2000-01-01.json'), JSON.stringify({ version: 1, date: '2000-01-01', source: 'example', text: '这是独立测试目录里的示例日记，只用于验证书签操作，不会进入用户的数据目录。', tasks: [], taskCount: 0, doodles: [], writtenAt: '2000-01-02T00:00:00Z' }));
const ctx = new Context();
let activeInterceptors = 0;
let diaryTool;
let prepareModelCall = () => { throw new Error('Unexpected live model request'); };
try {
  await ctx.plugin(Typert); await ctx.plugin(SessionStore); await ctx.plugin(Projections);
  ctx.provide('remoteAccess', { decide: () => ({ kind: 'deny', reason: 'test-policy' }) });
  ctx.provide('connection', { rpc: { intercept() { activeInterceptors++; return () => { activeInterceptors--; }; } } });
  ctx.provide('sessionQuery', { listSessions: async () => [] });
  ctx.provide('llm', { prepareCall(...args) { return prepareModelCall(...args); } });
  ctx.provide('tools', { register(definition) { diaryTool = definition; } });
  await ctx.plugin(Gateway, {});
  const fiber = await ctx.plugin(plugin, { dataDir: directory, pollSeconds: 60 });
  assert.equal(activeInterceptors, 1, 'diary must share Gateway rather than hijack /api');
  assert.ok(ctx.yuyuDiary, 'diary Remote service should be active');
  assert.ok(diaryTool, 'diary agent tool should be active');
  const session = ctx.sessions.create('diary-integration-session');
  session.append('turn/start', { turn: 1 });
  session.append('user/message', createUserMessage({ content: [{ type: 'text', text: '测试鱼鱼日记能记录任务' }], source: { kind: 'user' } }), { surfaceOp: 'append' });
  const peer = new Peer(ctx, { principal: { kind: 'owner' } });
  const signal = new AbortController().signal;
  const call = (method, args = {}, p = peer) => ctx.typertGateway.dispatchRpc(`yuyuDiary/${method}`, { args }, signal, p);
  const first = await call('list'); assert.equal(first.ok, true, JSON.stringify(first));
  assert.ok(first.value.today); assert.equal(first.value.entries.length, 1);
  const marked = await call('setBookmark', { date: '2000-01-01', color: 'rose' }); assert.equal(marked.ok, true, JSON.stringify(marked));
  assert.equal((await call('list')).value.entries[0].bookmark, 'rose');
  const viaTool = await diaryTool.execute({ action: 'bookmark', date: '2000-01-01', color: 'blue' }, { signal });
  assert.deepEqual(viaTool, { date: '2000-01-01', color: 'blue' });
  assert.equal(JSON.parse(await readFile(join(directory, 'bookmarks.json'), 'utf8')).colors['2000-01-01'], 'blue');
  assert.equal((await call('setBookmark', { date: '2000-01-01', color: 'invalid' })).ok, false);
  assert.equal((await call('setBookmark', { date: first.value.today, color: 'rose' })).ok, false);
  assert.equal((await call('setBookmark', { date: '2000-01-01', color: null })).ok, true);
  assert.deepEqual(JSON.parse(await readFile(join(directory, 'bookmarks.json'), 'utf8')).colors, {});
  for (let n = 0; n < 40; n++) { const state = await call('list'); if (!['starting','collecting','writing'].includes(state.value.status)) break; await new Promise(r => setTimeout(r, 10)); }
  const retry = await call('retry'); assert.equal(retry.ok, true, JSON.stringify(retry));
  for (let n = 0; n < 40; n++) { const state = await call('list'); if (state.value.todayTasks.length) break; await new Promise(r => setTimeout(r, 10)); }
  const refreshed = await call('list'); assert.equal(refreshed.value.todayTasks.length, 1, JSON.stringify(refreshed));
  assert.equal(refreshed.value.todayTasks[0].sessionId, session.id);
  const read = await call('read', { date: refreshed.value.today }); assert.deepEqual(read.value, { entry: null });
  const invalid = await call('read', { date: '../state' }); assert.equal(invalid.ok, false);
  const missing = await call('export', { date: refreshed.value.today }); assert.equal(missing.ok, false);
  const preference = await call('sessionPolicy', { sessionId: session.id });
  assert.deepEqual(preference.value, { sessionId: session.id, excluded: false });
  const exclude = await call('setSessionExcluded', { sessionId: session.id, excluded: true });
  assert.equal(exclude.ok, true, JSON.stringify(exclude)); assert.equal(exclude.value.excluded, true);
  assert.equal((await call('list')).value.todayTasks.length, 0, 'successful exclusion must immediately remove its rows');
  for (let n = 0; n < 40; n++) { const state = await call('list'); if (!['collecting','writing'].includes(state.value.status)) break; await new Promise(r => setTimeout(r, 10)); }
  assert.equal((await call('list')).value.todayTasks.length, 0);
  const stateAfterExclude = JSON.parse(await readFile(join(directory, 'state.json'), 'utf8'));
  assert.deepEqual(stateAfterExclude.excludedSessions, [session.id]); assert.equal(stateAfterExclude.ledger[session.id], undefined);
  const restore = await call('setSessionExcluded', { sessionId: session.id, excluded: false });
  assert.equal(restore.ok, true, JSON.stringify(restore));
  for (let n = 0; n < 40; n++) { const state = await call('list'); if (state.value.todayTasks.length) break; await new Promise(r => setTimeout(r, 10)); }
  assert.equal((await call('list')).value.todayTasks.length, 1);
  assert.equal((await call('setSessionExcluded', { sessionId: session.id, excluded: 'true' })).ok, false);
  assert.equal((await call('sessionPolicy', { sessionId: '' })).ok, false);
  await assert.rejects(ctx.yuyuDiary.setSessionExcluded(session.id, true), /主人/);
  await assert.rejects(diaryTool.execute({ action: 'setSessionExcluded', sessionId: session.id, excluded: true }, { signal }), /主人/);
  assert.equal((await diaryTool.execute({ action: 'list' }, { signal })).todayTasks.length, 1);
  for (let atlas = 0; atlas < DOODLE_ATLASES.length; atlas++) {
    const art = await call('doodle', { atlas }); assert.equal(art.ok, true, art.error?.message);
    const actual = Buffer.from(art.value.uri.split(',')[1], 'base64');
    assert.deepEqual(actual, await readFile(new URL('../assets/' + DOODLE_ATLASES[atlas], import.meta.url)));
  }
  for (const atlas of [-1, DOODLE_ATLASES.length, '../state', 0.5]) assert.equal((await call('doodle', { atlas })).ok, false);
  await fiber.dispose(); assert.equal(ctx.yuyuDiary, undefined);
  const gone = await call('list'); assert.equal(gone.ok, false);
  // Exercise the actual Host plugin -> prepared model stream -> durable diary path.
  // Only the external model response is controlled; no real profile or provider is used.
  const state = JSON.parse(await readFile(join(directory, 'state.json'), 'utf8'));
  state.startedDate = '2000-01-01';
  state.ledger['stream-fixture'] = { sessionId: 'stream-fixture', route: { provider: 'fixture', model: 'fixture-model' }, routeTime: Date.now(), days: {
    '2000-01-02': { tasks: { 'stream-fixture:1': { id: 'stream-fixture:1', sessionId: 'stream-fixture', prompt: '帮主人整理笔记', response: '整理完成', status: 'completed', toolCount: 0, toolErrors: 0, firstTime: 946771200000, lastTime: 946771200000 } }, lastTime: 946771200000 }
  } };
  await writeFile(join(directory, 'state.json'), JSON.stringify(state));
  let modelCalls = 0, finishReason = { kind: 'error', failure: { code: 'RATE_LIMIT', status: 429, message: 'fixture busy', requestId: 'fixture-request' } };
  const generatedText = '今天我帮主人整理了笔记，把散落的小事慢慢归在一起。看着那些原本杂乱的句子变得清楚，我也轻轻松了一口气。事情不大，可是能帮上忙，心里还是有一点得意的。';
  prepareModelCall = async config => ({ config, async *stream(options) {
    modelCalls++; assert.equal(config.provider, 'fixture'); assert.equal(options.maxTokens, 4096);
    assert.deepEqual(options.tools, []);
    yield { type: 'text-delta', index: 0, text: generatedText };
    yield { type: 'block-end', index: 0, block: { type: 'text', text: generatedText } };
    yield { type: 'finish', reason: finishReason };
  } });
  const generatedFiber = await ctx.plugin(plugin, { dataDir: directory, pollSeconds: 60 });
  const settle = async () => {
    for (let n = 0; n < 100; n++) {
      const result = await call('list');
      if (result.ok && !['starting', 'collecting', 'writing'].includes(result.value.status)) return result.value;
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    throw new Error('Host diary operation did not settle');
  };
  const failed = await settle();
  assert.equal(modelCalls, 1); assert.equal(failed.entries.length, 1);
  assert.equal(failed.pending[0].diagnostics.kind, 'error');
  assert.equal(failed.pending[0].diagnostics.failure.requestId, 'fixture-request');
  assert.match(failed.pending[0].error, /RATE_LIMIT/);
  finishReason = { kind: 'stop' };
  assert.equal((await call('retry')).ok, true);
  const completed = await settle();
  assert.equal(modelCalls, 2); assert.equal(completed.entries.length, 2); assert.deepEqual(completed.pending, []);
  const stored = JSON.parse(await readFile(join(directory, 'entries/2000-01-02.json'), 'utf8'));
  const backup = JSON.parse(await readFile(join(directory, 'backups/entries/2000-01-02.json'), 'utf8'));
  assert.equal(stored.text, generatedText); assert.deepEqual(backup, stored);
  assert.equal((await call('retry')).ok, true); await settle(); assert.equal(modelCalls, 2);
  await generatedFiber.dispose();
  const previousHome = process.env.DSH_HOME;
  process.env.DSH_HOME = join(directory, 'blank-home');
  try {
    for (const dataDir of ['', ' \t ']) {
      const blankFiber = await ctx.plugin(plugin, { dataDir, pollSeconds: 60 });
      try {
        await settle();
        const defaultState = JSON.parse(await readFile(join(process.env.DSH_HOME, 'data/dsh-yuyudiary/state.json'), 'utf8'));
        assert.equal(defaultState.version, 1);
        assert.equal(modelCalls, 2, 'blank configuration must not cause historical model calls');
      } finally { await blankFiber.dispose(); }
    }
  } finally { if (previousHome === undefined) delete process.env.DSH_HOME; else process.env.DSH_HOME = previousHome; }
  console.log('PASS: empty and whitespace dataDir activate into the isolated DSH_HOME data directory.');
  console.log('PASS: DSH 0.2.1-rc.5 activation, real projection, Gateway actions, session policies, all atlases, disposal; Host model-stream failure diagnostics, object stop completion, primary/backup commit and no duplicate generation.');
} finally { await ctx.fiber.dispose(); await rm(directory, { recursive: true, force: true }); }
