import { mkdir, open, readFile, rename, unlink, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { validDay } from './core.js';

export async function atomicJson(file, value) {
  const temp = `${file}.${randomUUID()}.tmp`;
  try { const h = await open(temp, 'wx'); try { await h.writeFile(JSON.stringify(value, null, 2), 'utf8'); await h.sync(); } finally { await h.close(); } await rename(temp, file); }
  finally { await unlink(temp).catch(e => { if (e.code !== 'ENOENT') throw e; }); }
}
async function readJson(file) { try { return JSON.parse(await readFile(file, 'utf8')); } catch (e) { if (e.code === 'ENOENT') return null; throw new Error(`无法读取日记数据，原文件已保留：${file}`, { cause: e }); } }
function checkEntry(entry, date) {
  if (!entry || entry.date !== date || typeof entry.text !== 'string' || !entry.text.trim() || !Array.isArray(entry.doodles)) throw new Error(`日记文件内容无效，原文件已保留：${date}`);
  return entry;
}
async function readStoredEntry(file, date) {
  try { return checkEntry(JSON.parse(await readFile(file, 'utf8')), date); }
  catch (error) {
    if (error.code === 'ENOENT') return null;
    throw new Error(`无法读取日记正文，原文件已保留：${file}`, { cause: error });
  }
}
async function entryNames(directory) {
  try { return (await readdir(directory)).filter(name => /^\d{4}-\d{2}-\d{2}\.json$/.test(name)); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
}
export class DiaryStore {
  constructor(directory) { this.directory = directory; this.lockToken = null; }
  async init() {
    await mkdir(join(this.directory, 'entries'), { recursive: true });
    const lockPath = join(this.directory, '.writer.lock');
    for (let n = 0; n < 2; n++) {
      try {
        const h = await open(lockPath, 'wx'); this.lockToken = randomUUID();
        try { await h.writeFile(JSON.stringify({ pid: process.pid, token: this.lockToken })); await h.sync(); } finally { await h.close(); }
        return;
      } catch (e) {
        if (e.code !== 'EEXIST') throw e;
        const owner = await readJson(lockPath);
        if (!owner || !Number.isInteger(owner.pid)) throw new Error('日记写入锁无法确认，请保留文件并检查 .writer.lock');
        let alive = true; try { process.kill(owner.pid, 0); } catch (err) { if (err.code === 'ESRCH') alive = false; }
        if (alive) throw new Error('另一份鱼鱼日记正在使用这个保存目录，请关闭重复实例');
        const current = await readJson(lockPath);
        if (current?.token === owner.token) await unlink(lockPath);
      }
    }
    throw new Error('无法取得日记写入锁');
  }
  async close() {
    if (!this.lockToken) return;
    const p = join(this.directory, '.writer.lock');
    const current = await readJson(p);
    if (current?.token === this.lockToken) await unlink(p);
    this.lockToken = null;
  }
  readState() { return readJson(join(this.directory, 'state.json')); }
  saveState(state) { return atomicJson(join(this.directory, 'state.json'), state); }
  readBookmarks() { return readJson(join(this.directory, 'bookmarks.json')); }
  saveBookmarks(colors) { return atomicJson(join(this.directory, 'bookmarks.json'), { version: 1, colors }); }
  entryPath(date) { if (!validDay(date)) throw new Error('无效的日记日期'); return join(this.directory, 'entries', `${date}.json`); }
  entryBackupPath(date) { this.entryPath(date); return join(this.directory, 'backups', 'entries', `${date}.json`); }
  async backupEntry(entry) {
    checkEntry(entry, entry.date);
    const path = this.entryBackupPath(entry.date);
    let invalid = false;
    try {
      const saved = await readStoredEntry(path, entry.date);
      if (saved) return;
    } catch { invalid = true; }
    await mkdir(join(this.directory, 'backups', 'entries'), { recursive: true });
    // Preserve the first complete saved entry. Never replace a valid backup with a later draft.
    if (invalid) await rename(path, `${path}.damaged-${randomUUID()}`);
    await atomicJson(path, entry);
  }
  readEntry(date) { return this.readEntryFile(date, this.entryPath(date)); }
  async readEntryFile(date, path) {
    let current, failure;
    try { current = await readStoredEntry(path, date); }
    catch (error) { failure = error; }
    if (current && !failure) {
      // Read-only inspection without the writer lock must not change disk contents.
      if (this.lockToken) await this.backupEntry(current);
      return current;
    }
    const backup = await readStoredEntry(this.entryBackupPath(date), date);
    if (backup) {
      checkEntry(backup, date);
      if (this.lockToken) {
        if (failure) await rename(path, `${path}.damaged-${randomUUID()}`);
        await atomicJson(path, backup);
      }
      return backup;
    }
    if (failure) throw failure;
    return null;
  }
  async saveEntry(entry) {
    checkEntry(entry, entry.date);
    const existing = await this.readEntry(entry.date);
    if (existing) { await this.backupEntry(existing); return existing; }
    // Both files are flushed and atomically committed; a failed primary write can recover from this copy.
    await this.backupEntry(entry);
    await atomicJson(this.entryPath(entry.date), entry); return entry;
  }
  async listEntries() {
    const names = [...new Set([
      ...await entryNames(join(this.directory, 'entries')),
      ...await entryNames(join(this.directory, 'backups', 'entries'))
    ])];
    const entries = [];
    for (const name of names.sort()) {
      const entry = await this.readEntry(name.slice(0, 10));
      entries.push(checkEntry(entry, name.slice(0, 10)));
    }
    return entries;
  }
}
