import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { lstat, mkdir, mkdtemp, readdir, readFile, open, rename } from 'node:fs/promises';
import { DiaryStore, atomicJson } from './storage.js';

export function defaultDataDirectory(env = process.env, home = homedir()) {
  return join(resolve(env.DSH_HOME || join(home, '.dsh')), 'data', 'dsh-yuyudiary');
}
export function resolveDataDirectory(value) {
  return value?.trim() ? resolve(value) : defaultDataDirectory();
}
async function exists(path) {
  try { await lstat(path); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; }
}
async function filesIn(root, relative = '') {
  const files = [];
  if ((await lstat(join(root, relative))).isSymbolicLink()) throw new Error('旧日记目录包含链接，请先确认真实数据位置');
  for (const entry of await readdir(join(root, relative), { withFileTypes: true })) {
    if (entry.name === '.writer.lock') continue;
    const name = join(relative, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`旧日记包含链接，未迁移：${name}`);
    if (entry.isDirectory()) files.push(...await filesIn(root, name));
    else if (entry.isFile()) files.push(name);
    else throw new Error(`旧日记包含未知文件类型，未迁移：${name}`);
  }
  return files.sort();
}
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
async function fingerprint(root) {
  const hashes = {};
  for (const name of await filesIn(root)) hashes[name] = digest(await readFile(join(root, name)));
  return { hashes, digest: digest(JSON.stringify(hashes)) };
}

/** Copy a locked legacy tree, verify every byte, then publish the complete directory atomically. */
export async function migrateLegacyData(legacyDirectory, directory) {
  const source = resolve(legacyDirectory), target = resolve(directory);
  if (source === target || !await exists(source)) return { migrated: false };
  if (!await exists(join(source, 'state.json')) && !(await filesIn(source)).length) return { migrated: false };
  const oldStore = new DiaryStore(source);
  await oldStore.init();
  try {
    const before = await fingerprint(source);
    if (await exists(target)) {
      let receipt;
      try { receipt = JSON.parse(await readFile(join(target, '.legacy-import.json'), 'utf8')); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
      if (receipt?.version === 1 && receipt.sourceDigest === before.digest) return { migrated: false };
      throw new Error('新旧日记目录同时存在且无法确认已迁移，已保留两边数据；请先核对，避免覆盖');
    }
    await mkdir(dirname(target), { recursive: true });
    const stage = await mkdtemp(join(dirname(target), '.yuyu-import-'));
    // An interrupted staging directory is retained, never treated as the active diary.
    for (const name of Object.keys(before.hashes)) {
      const output = join(stage, name);
      await mkdir(dirname(output), { recursive: true });
      const handle = await open(output, 'wx');
      try { await handle.writeFile(await readFile(join(source, name))); await handle.sync(); }
      finally { await handle.close(); }
    }
    if ((await fingerprint(stage)).digest !== before.digest || (await fingerprint(source)).digest !== before.digest) {
      throw new Error(`迁移校验失败，原数据和临时副本均已保留：${stage}`);
    }
    await atomicJson(join(stage, '.legacy-import.json'), { version: 1, source, sourceDigest: before.digest, files: before.hashes });
    if (await exists(target)) throw new Error('迁移期间目标目录已出现，已保留原数据和临时副本');
    await rename(stage, target);
    return { migrated: true, files: Object.keys(before.hashes).length, source, target };
  } finally { await oldStore.close(); }
}
