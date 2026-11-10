// Shared by the Host and Client. Append atlases so saved sprite IDs never change meaning.
export const DOODLE_ATLASES = ['yuyu-doodles.png', 'yuyu-doodles-daily.png', 'yuyu-doodles-curious.png', 'yuyu-doodles-moments.png', 'yuyu-doodles-treats.png', 'yuyu-doodles-crafts.png', 'yuyu-doodles-outdoors.png', 'yuyu-doodles-play.png', 'yuyu-doodles-moods.png', 'yuyu-doodles-dreams.png'];
export const SPRITES_PER_ATLAS = 6;
export const DOODLE_COUNT = DOODLE_ATLASES.length * SPRITES_PER_ATLAS;
// Camera cell spans x=418..836 in the 1254px atlas. Adjacent drawings cross those
// equal-cell edges; its own character and accents fit safely inside x=434..812.
// Insets are fractions of the displayed cell: top, right, bottom, left.
export const DOODLE_SAFE_INSETS = { 19: [0, 24 / 418, 0, 16 / 418] };
export const DOODLE_LABELS = ['写日记', '用电脑', '抱鲸鱼', '打盹', '看清单', '喝茶', '吃米饭', '煮饭', '读书', '听音乐', '浇花', '裹毯子', '观察小虫', '转魔方', '搭积木', '整理卡片', '看星星', '折纸船', '撑伞', '拍照', '放风筝', '围巾与落叶', '庆祝小进展', '得意地点赞', '擀面团', '捏饭团', '翻煎饼', '吃西瓜', '草莓蛋糕', '倒花茶', '画水彩', '织围巾', '绣星星', '贴手账', '系礼物丝带', '折纸鹤', '骑小车', '提野餐篮', '看蝴蝶', '吹泡泡', '堆雪人', '捡贝壳', '玩手柄', '摇铃鼓', '戴纸王冠', '放纸飞机', '想棋局', '转小风车', '伸懒腰', '鼓脸颊', '拆惊喜信', '害羞捧花', '挽袖加油', '探头看你', '坐月亮', '抱海洋瓶', '钓玩具鱼', '坐游泳圈', '抛小星星', '看沙漏'];

function doodleRandom(key) {
  let seed = [...String(key)].reduce((n, c) => Math.imul(n ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261) || 1;
  return () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296; };
}
function shuffledDoodles(cycle) {
  const random = doodleRandom(`yuyu-doodles-v2:${cycle}`);
  const pool = Array.from({ length: DOODLE_COUNT }, (_, i) => i);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return pool;
}
export function doodleCell(sprite) {
  const id = Number.isInteger(sprite) && sprite >= 0 && sprite < DOODLE_COUNT ? sprite : 0;
  return { sprite: id, atlasIndex: Math.floor(id / SPRITES_PER_ATLAS), cell: id % SPRITES_PER_ATLAS };
}
export function doodlesFor(date) {
  const timestamp = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) ? Date.parse(`${date}T00:00:00Z`) : NaN;
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== date) throw new Error('涂鸦日期无效');
  const day = Math.floor(timestamp / 86400000), cycleDays = DOODLE_COUNT;
  const cycle = Math.floor(day / cycleDays), offset = day - cycle * cycleDays;
  const pool = shuffledDoodles(cycle), previousLast = shuffledDoodles(cycle - 1).at(-1);
  // Keep the final slot unchanged so the next cycle can avoid repeating it.
  if (pool[0] === previousLast) [pool[0], pool[1]] = [pool[1], pool[0]];
  const random = doodleRandom(`yuyu-layout:${date}`);
  return [{ sprite: pool[offset], rotation: Math.round(random() * 8 - 4) }];
}
export function diaryDoodle(date, saved) {
  const first = Array.isArray(saved) ? saved.find(d => Number.isInteger(d?.sprite) && d.sprite >= 0 && d.sprite < DOODLE_COUNT) : null;
  return first ? { sprite: first.sprite, rotation: first.rotation || 0 } : doodlesFor(date)[0];
}
