/** Shared bookmark identifiers and pure calendar helpers. */
export const BOOKMARK_COLORS = ['rose', 'amber', 'blue', 'sage'];
export const BOOKMARK_PALETTE = { rose: '#c88788', amber: '#ceab64', blue: '#7f9fb7', sage: '#84a58e' };
/** Use the Host's persisted start day and timezone, not browser storage or elapsed hours. */
export function initialDiaryView({ today, startedDate, entries }) {
  const latest = entries.map(entry => entry.date).filter(date => date <= today).sort().at(-1);
  const closed = !(startedDate < today);
  return { date: latest || today, closed, preface: closed };
}
export function nextBookmark(color) { return BOOKMARK_COLORS[(BOOKMARK_COLORS.indexOf(color) + 1) % (BOOKMARK_COLORS.length + 1)] ?? null; }
export function shiftMonth(month, offset) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || !Number.isInteger(offset)) throw new Error('无效月份');
  const date = new Date(`${month}-15T12:00:00Z`); date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 7);
}
export function calendarCells(month) {
  shiftMonth(month, 0);
  const first = new Date(`${month}-01T12:00:00Z`), offset = (first.getUTCDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(first); date.setUTCDate(index - offset + 1);
    const key = date.toISOString().slice(0, 10);
    return { date: key, day: date.getUTCDate(), inMonth: key.startsWith(month) };
  });
}

/** Dates are newest first; the reading order is cover, preface, then dated entries. */
export function diaryStep(dates, date, direction, closed, preface = false) {
  const index = dates.indexOf(date);
  if (index < 0 || (direction !== -1 && direction !== 1)) return null;
  if (closed) return direction > 0 ? { kind: 'open' } : null;
  if (preface) return direction < 0 ? { kind: 'cover' } : { kind: 'date', date: dates.at(-1) };
  if (direction < 0 && index === dates.length - 1) return { kind: 'preface' };
  const target = dates[index - direction];
  return target ? { kind: 'date', date: target } : null;
}

/** Apply only a confirmed preference, without replacing other rows or awaiting a poll. */
export function applySessionPolicy(snapshot, policy) {
  if (!snapshot || policy?.excluded !== true || typeof policy.sessionId !== 'string' || !policy.sessionId) return snapshot;
  const todayTasks = snapshot.todayTasks.filter(task => {
    if (typeof task.sessionId === 'string') return task.sessionId !== policy.sessionId;
    // Older Hosts encode the session before the final turn-number delimiter.
    const separator = typeof task.id === 'string' ? task.id.lastIndexOf(':') : -1;
    return separator < 0 || task.id.slice(0, separator) !== policy.sessionId;
  });
  return todayTasks.length === snapshot.todayTasks.length ? snapshot : { ...snapshot, todayTasks };
}

/** Use complete writing rows so a paragraph continues on the next page's grid. */
export function ruledHeight(available, line) {
  if (!(available > 0) || !(line > 0)) return 0;
  return available < line ? available : Math.floor(available / line) * line;
}

/** Reserve a full ruled line above the bookmarked right (or single) page. */
export function pageGeometry(width, available, gap, columns, line) {
  return { height: ruledHeight(Math.max(0, available - line), line), pitch: (width + gap) / columns, rightInset: line };
}

/** Follow the prose naturally; keep the single illustration within a paper page. */
export function diaryEndingLayout(height, line) {
  return { height: ruledHeight(Math.min(320, height), line), padding: 0, breakBefore: 'auto' };
}

/** Animate only the padding box (paper), leaving every hard-cover border outside it. */
export function paperTurnFrame(width, height, { left = 0, right = 0, top = 0, bottom = 0 } = {}) {
  if (![width, height, left, right, top, bottom].every(value => Number.isFinite(value) && value >= 0)) return null;
  const paperWidth = width - left - right, paperHeight = height - top - bottom;
  if (paperWidth <= 0 || paperHeight <= 0) return null;
  return { left, top, width: paperWidth, height: paperHeight };
}

export function pngPixelRatio(width, height) {
  if (!(width > 0 && height > 0)) throw new Error('无效图片尺寸');
  return Math.min(2, Math.sqrt(12000000 / (width * height)), 8192 / width, 8192 / height);
}
export function pngFilename(date, cover, spread, preface = false) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isInteger(spread) || spread < 0) throw new Error('无效日记页面');
  return cover ? '鱼鱼日记-封面.png' : preface ? `鱼鱼日记-扉页-${spread + 1}.png` : `鱼鱼日记-${date}-${spread + 1}.png`;
}

/** One wheel gesture turns one spread; ignore its inertial tail during motion. */
export function createWheelPager() {
  let lastAt = -Infinity, amount = 0, direction = 0, consumed = false;
  return ({ deltaX = 0, deltaY, deltaMode = 0, ctrlKey, metaKey, altKey, shiftKey, now, blocked = false, line = 32, height = 320 }) => {
    if (ctrlKey || metaKey || altKey || shiftKey || !Number.isFinite(deltaY) || !deltaY || Math.abs(deltaX) > Math.abs(deltaY)) return 0;
    const nextDirection = Math.sign(deltaY);
    if (now - lastAt > 180 || nextDirection !== direction) { amount = 0; consumed = false; }
    lastAt = now; direction = nextDirection;
    if (blocked) { amount = 0; consumed = true; return 0; }
    if (consumed) return 0;
    amount += deltaY * (deltaMode === 1 ? line : deltaMode === 2 ? height : 1);
    if (Math.abs(amount) < 48) return 0;
    amount = 0; consumed = true;
    return direction;
  };
}
