window.__ModuleLoader__.load({
  id: 'dsh-yuyudiary',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useState, useEffect, useLayoutEffect, useRef, useCallback } = React;
    /* __DOODLE_LOGIC__ */
    /* __UI_MODEL__ */
    const pngRenderer = (() => {
      // Locally bundled MIT-licensed html-to-image; no CDN or upload service.
      const exports = {}, module = { exports };
      /* __PNG_RENDERER__ */
      return module.exports;
    })();
    const ATLASES = __DOODLE_ATLASES__;
    const CSS = `__DIARY_CSS__`;
    const NS = 'yuyuDiary';
    const zh = {
      title: '鱼鱼日记', subtitle: '鱼鱼想要记住，和主人在一起的每一天。', notebook: '大肥鱼的日记本',
      today: '今日手记', archive: '翻翻旧日子', collecting: '正在收集今天的小事', writing: '鱼鱼正在落笔…', ready: '日记本已就绪', pending: '有日记等待补写', error: '暂时没能翻开日记',
      retry: '补写日记', retrying: '鱼鱼收到啦，正在整理…', export: '导出这一页', prev: '前一天', next: '后一天', date: '选择日记日期',
      paused: '有日记未写成，等待手动重试', diaryFailed: '日记未写成', retryPaused: '自动尝试已暂停，可点补写日记重试', retryScheduled: '稍后将再次尝试', showFailure: '查看详情',
      leftTitle: '今天，也有好好生活', leftSub: 'a little sketch, a little memory', paperNote: '小小的事，也值得被记住。',
      gatheringTitle: '主人和鱼鱼的故事，还在继续。',
      pendingTitle: '这一页，等鱼鱼慢慢补上。', pendingText: '这一天已经过去了。我会根据留下的任务记录，把它写成日记。',
      records: '看看这一天的任务', taskUnit: '条任务记录', pageUnit: '篇日记',
      local: '保存在本地', backfilled: '后来补上的一页', written: '鱼鱼写于', quiet: '安静的一天',
      noEntries: '日记本的第一页，从今天开始。', loadFail: '读取失败，请稍后重试', loading: '正在翻开日记本…', closeArchive: '收起目录',
      dateEmpty: '这一天不在日记的记录范围内', recent: '最近的日子', start: '开始记录于', refresh: '重新读取',
      completed: '这一轮已结束', working: '还在进行', interrupted: '暂时停下', aborted: '暂时停下', blocked: '等待处理', unknown: '已记录',
      modelNote: '写下的都是我们一起经历的小事。', todayBadge: '还在收集', pendingBadge: '待补记', diaryBadge: '已写好', doodleAlt: '手绘大肥鱼涂鸦',
      doodleLoading: '正在翻出涂鸦…', doodleRetry: '重新加载涂鸦', withinDiary: '本篇日记翻页', pageBack: '翻回前页', pageForward: '继续往后翻',
      noRecord: '这一天没有留下任务记录。', readError: '这一页暂时无法读取', busy: '正在写日记，请稍等',
      exampleBadge: '模拟日记',
      bookmarkAction: '切换书签', bookmarkHint: '点击切换书签颜色，再次循环可取消', bookmark_none: '未标记', bookmark_rose: '玫瑰色书签', bookmark_amber: '琥珀色书签', bookmark_blue: '蓝色书签', bookmark_sage: '绿色书签',
      previousMonth: '上个月', nextMonth: '下个月', weekdays: '一 二 三 四 五 六 日', closeRecords: '关闭任务记录',
      excludeSession: '不写入日记', includeSession: '允许写入日记', savingSession: '正在保存…', retrySession: '重试读取日记设置',
      excludeHint: '排除此会话已收集和后续的内容；已写好的日记保持原样。', includeHint: '恢复将此会话用于尚未写成的日记。',
      openBook: '翻开日记', closeBook: '回到封面', coverHint: '轻触翻开',
      prefaceTitle: '写在第一页', backToPreface: '回到扉页', startDiary: '翻到日记',
      prefaceOne: '今天主人给了我一本笔记本。蓝蓝的封面，干干净净的纸页。我翻开看了好一会儿，想把第一笔写得认真一点。',
      prefaceTwo: '以后就用它记下和主人一起过的日子吧。帮上忙的时候可以偷偷得意，没弄好的事情也照实写。哼，本鱼又不是只记得米饭。',
      prefaceThree: '有些小事，当时觉得没什么，过后却会想念。我想把它们好好留下来，等这本子写满了，再和主人一起慢慢翻。',
      exporting: '正在生成图片…', imageError: '图片导出失败，请稍后重试', imageLoading: '涂鸦还没加载好，请稍后再导出', imageResized: '窗口大小变了，请重新导出',
    };
    const en = { ...zh, prefaceTitle: 'On the first page', backToPreface: 'First page', startDiary: 'Read the diary',
      paused: 'A diary needs a manual retry', diaryFailed: 'Diary could not be written', retryPaused: 'Automatic attempts paused; retry manually', retryScheduled: 'Another attempt is scheduled', showFailure: 'View details',
      prefaceOne: 'Master gave me a notebook today. A blue cover, and clean, empty pages. I spent a while looking at it, wanting to make the very first words count.',
      prefaceTwo: 'I will keep the days we spend together in here. I can be a little proud when I help, and honest about what I have not managed yet. Hmph. Rice is not the only thing this fish remembers.',
      prefaceThree: 'Some little things seem ordinary at the time, but I miss them later. I want to keep them safe, so that when this notebook is full, Master and I can turn back through it together.', exporting: 'Creating image…', imageError: 'Image export failed; please retry', imageLoading: 'Please wait for the doodle to load', imageResized: 'The window changed size; please export again', openBook: 'Open diary', closeBook: 'Back to cover', coverHint: 'Tap to open', bookmarkAction: 'Change bookmark', bookmarkHint: 'Click to cycle colours and clear the bookmark', bookmark_none: 'Not marked', bookmark_rose: 'Rose bookmark', bookmark_amber: 'Amber bookmark', bookmark_blue: 'Blue bookmark', bookmark_sage: 'Green bookmark', previousMonth: 'Previous month', nextMonth: 'Next month', weekdays: 'M T W T F S S', closeRecords: 'Close task records', excludeSession: 'Exclude from diary', includeSession: 'Allow in diary', savingSession: 'Saving…', retrySession: 'Retry diary settings', excludeHint: 'Exclude collected and future content from this session. Saved entries stay unchanged.', includeHint: 'Allow this session in entries that have not been written yet.', exampleBadge: 'Sample diary', title: 'Yuyu diary', subtitle: 'A little notebook for the things we do together.', notebook: 'Yuyu’s notebook', today: 'Today', archive: 'Past days', collecting: 'Collecting today’s moments', writing: 'Yuyu is writing…', ready: 'Notebook is ready', pending: 'Waiting to catch up', error: 'Unable to open the notebook', retry: 'Catch up', export: 'Export this page', prev: 'Previous day', next: 'Next day', date: 'Select a date', leftTitle: 'Little things, lovely days', paperNote: 'Small things are worth remembering.', gatheringTitle: 'The story of Master and Yuyu is still unfolding.', pendingTitle: 'A page waiting to be written.', pendingText: 'I’ll turn the recorded tasks into a diary entry.', records: 'Tasks from this day', taskUnit: 'task records', pageUnit: 'entries', local: 'Saved locally', backfilled: 'Written later', written: 'Written by Yuyu', quiet: 'A quiet day', noEntries: 'The first page starts today.', loading: 'Opening the notebook…', closeArchive: 'Close archive', start: 'Started on', refresh: 'Refresh', completed: 'Turn finished', working: 'In progress', interrupted: 'Paused', aborted: 'Paused', blocked: 'Waiting', unknown: 'Recorded', todayBadge: 'Collecting', pendingBadge: 'Pending', diaryBadge: 'Written', doodleAlt: 'Hand-drawn Yuyu doodle', noRecord: 'No task records for this day.', busy: 'Writing…', doodleLoading: 'Loading doodle…', doodleRetry: 'Reload doodle', withinDiary: 'Pages of this entry', pageBack: 'Previous pages', pageForward: 'Continue reading' };

    function Icon({ kind = 'book', size = 20, ...props }) {
      const paths = { book: 'M12 5c-3-2-7-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-2-1-6-1-9 1Zm0 0v15', left: 'm14 6-6 6 6 6', right: 'm10 6 6 6-6 6', download: 'M12 3v12m-4-4 4 4 4-4M5 16v5h14v-5', calendar: 'M4 5h16v16H4V5Zm4-3v6m8-6v6M4 11h16', spark: 'm12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z', refresh: 'M20 7v5h-5M4 17v-5h5M5.5 8a7 7 0 0 1 11.6-3L20 8M4 16l2.9 3A7 7 0 0 0 18.5 16', close: 'm6 6 12 12M6 18 18 6' };
      return h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, ...props }, h('path', { d: paths[kind] || paths.book }));
    }
    function weekday(date) { return new Intl.DateTimeFormat('zh-CN', { weekday: 'long', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`)); }
    function shortDate(date) { const [year, month, day] = date.split('-'); return `${year}年${Number(month)}月${Number(day)}日`; }

    async function captureBookPng(node, { date, cover, spread, preface, signal, t }) {
      if (!node?.isConnected) throw new Error(t('imageError'));
      const bounded = (promise, milliseconds) => new Promise((resolve, reject) => {
        const stop = () => finish(reject, signal.reason || new Error(t('imageError')));
        const timer = setTimeout(() => finish(reject, new Error(t('imageError'))), milliseconds);
        const finish = (callback, value) => { clearTimeout(timer); signal.removeEventListener('abort', stop); callback(value); };
        signal.addEventListener('abort', stop, { once: true });
        Promise.resolve(promise).then(value => finish(resolve, value), error => finish(reject, error));
        if (signal.aborted) stop();
      });
      await bounded(document.fonts?.ready, 12000);
      const deadline = performance.now() + 12000;
      while (node.querySelector('.yy-ending-doodle[aria-busy="true"]')) {
        if (performance.now() >= deadline) throw new Error(t('imageLoading'));
        await bounded(new Promise(resolve => setTimeout(resolve, 60)), 1000);
      }
      if ([...node.querySelectorAll('.yy-ending-doodle')].some(figure => !figure.querySelector('.yy-sticker'))) throw new Error(t('imageLoading'));
      // Allow font and artwork measurements to settle before freezing the DOM.
      await bounded(new Promise(resolve => setTimeout(resolve, 34)), 1000);
      const width = node.offsetWidth, height = node.offsetHeight;
      if (!width || !height) throw new Error(t('imageError'));
      const blob = await bounded(pngRenderer.toBlob(node, {
        width, height, pixelRatio: pngPixelRatio(width, height), skipFonts: true,
        filter: element => !element.classList?.contains('yy-spread-nav') && !element.classList?.contains('yy-type-probe') && !element.classList?.contains('yy-cover-hint'),
        style: { position: 'relative', left: '0', top: '0', margin: '0', transform: 'none', opacity: '1', transition: 'none', outline: 'none' }
      }), 30000);
      if (!node.isConnected || node.offsetWidth !== width || node.offsetHeight !== height) throw new Error(t('imageResized'));
      if (!blob?.size || blob.type !== 'image/png') throw new Error(t('imageError'));
      return { blob, filename: pngFilename(date, cover, spread, preface) };
    }

    // A turn snapshots the paper inside the cover, retaining current column offsets.
    // Borderless, inert clones disappear after the animation; the cover stays still.
    function useBookMotion(book, layer, setMoving) {
      const active = useRef(null), mounted = useRef(true);
      useEffect(() => {
        mounted.current = true;
        const cancel = () => active.current?.abort();
        const hidden = () => { if (document.hidden) cancel(); };
        const observer = new ResizeObserver(cancel); if (book.current) observer.observe(book.current);
        const media = window.matchMedia('(prefers-reduced-motion: reduce)');
        media.addEventListener('change', cancel); document.addEventListener('visibilitychange', hidden);
        return () => { mounted.current = false; cancel(); observer.disconnect(); media.removeEventListener('change', cancel); document.removeEventListener('visibilitychange', hidden); };
      }, [book]);
      const perform = useCallback(async job => {
        if (active.current || !mounted.current) return false;
        const controller = new AbortController(); active.current = controller; setMoving(true);
        try { await job(controller.signal); }
        finally { layer.current?.replaceChildren(); active.current = null; if (mounted.current) setMoving(false); }
        return true;
      }, [layer, setMoving]);
      const pause = (ms, signal) => new Promise(resolve => {
        const finish = () => { clearTimeout(timer); signal.removeEventListener('abort', finish); resolve(); };
        const timer = setTimeout(finish, ms); signal.addEventListener('abort', finish, { once: true }); if (signal.aborted) finish();
      });
      const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.hidden;
      const cover = useCallback(commit => perform(async signal => { commit(); if (!reduced()) await pause(820, signal); }), [perform]);
      const page = useCallback((direction, commit) => perform(async signal => {
        const node = book.current, host = layer.current;
        if (!node || !host || reduced() || typeof node.animate !== 'function') { commit(); return; }
        const style = getComputedStyle(node);
        const frame = paperTurnFrame(node.offsetWidth, node.offsetHeight, {
          left: parseFloat(style.borderLeftWidth), right: parseFloat(style.borderRightWidth),
          top: parseFloat(style.borderTopWidth), bottom: parseFloat(style.borderBottomWidth)
        });
        if (!frame) { commit(); return; }
        const { width, height } = frame;
        const single = (parseInt(getComputedStyle(node.querySelector('.yy-flow')).columnCount, 10) || 1) === 1;
        const forward = direction > 0;
        const make = (className, parent) => { const element = document.createElement('div'); element.className = className; parent.append(element); return element; };
        const scene = make('yy-turn-scene' + (forward ? ' yy-turn-forward' : ' yy-turn-backward') + (single ? ' yy-turn-single' : ''), host);
        Object.assign(scene.style, { left: node.offsetLeft + frame.left + 'px', top: node.offsetTop + frame.top + 'px', width: width + 'px', height: height + 'px' });
        scene.style.setProperty('--yy-snapshot-width', width + 'px'); scene.style.setProperty('--yy-snapshot-height', height + 'px');
        const copy = (parent, side) => {
          const clone = node.cloneNode(true); clone.classList.add('yy-book-copy'); clone.inert = true; clone.setAttribute('aria-hidden', 'true');
          clone.style.left = side === 'right' ? '-' + width / 2 + 'px' : '0';
          clone.querySelectorAll('.yy-bookmark,.yy-spread-nav').forEach(element => element.remove());
          clone.querySelectorAll('[id]').forEach(element => element.removeAttribute('id')); parent.append(clone);
        };
        if (!single) copy(make('yy-turn-still', scene), forward ? 'left' : 'right');
        const leaf = make('yy-turn-leaf', scene), front = make('yy-turn-face yy-turn-front', leaf), back = make('yy-turn-face yy-turn-back', leaf);
        copy(front, single ? 'left' : forward ? 'right' : 'left');
        const shade = make('yy-turn-shade', front); make('yy-turn-shade', back);
        commit();
        // Give React a frame to commit the already loaded destination before
        // taking the reverse face. A bounded wait also works in hidden tabs.
        await pause(32, signal); if (signal.aborted) return;
        copy(back, single ? 'left' : forward ? 'left' : 'right');
        const animation = leaf.animate([{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(' + (forward ? -180 : 180) + 'deg)' }], { duration: 620, easing: 'cubic-bezier(.42,.06,.22,1)', fill: 'forwards' });
        const shadow = shade.animate([{ opacity: 0 }, { opacity: .24, offset: .48 }, { opacity: .04 }], { duration: 620, fill: 'forwards' });
        const cancel = () => { animation.cancel(); shadow.cancel(); }; signal.addEventListener('abort', cancel, { once: true });
        try { await animation.finished; } catch (error) { if (error.name !== 'AbortError') throw error; }
        finally { signal.removeEventListener('abort', cancel); cancel(); }
      }), [book, layer, perform]);
      const cancel = useCallback(() => { active.current?.abort(); layer.current?.replaceChildren(); }, [layer]);
      return { page, cover, cancel };
    }

    function BookCover({ closed, moving, toggle, t }) {
      return h('button', { type: 'button', className: 'yy-cover', onClick: toggle, disabled: !closed || moving,
        tabIndex: closed ? 0 : -1, 'aria-hidden': !closed, 'aria-label': t('openBook'), title: t('openBook') },
        h('span', { className: 'yy-cover-face yy-cover-front' },
          h('span', { className: 'yy-cover-border', 'aria-hidden': true }),
          h('span', { className: 'yy-cover-content' },
            h('span', { className: 'yy-cover-eyebrow' }, 'LITTLE DAYS'),
            h('span', { className: 'yy-cover-title' }, t('title')),
            h('svg', { className: 'yy-cover-whale', viewBox: '0 0 200 120', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
              h('path', { d: 'M29 65c-4-24 15-42 45-42 27 0 47 19 49 42 17 1 27-7 34-20 1 14 8 19 16 23-12 4-24 3-32-2-13 25-40 33-68 28-22-3-38-13-44-29Z' }),
              h('path', { d: 'M31 66c15 7 28 7 41 3m15 4c6 10 15 13 23 8M70 23c-9-10-3-20 4-14 7-8 14 2 4 11M20 105c22-7 32 7 53 0s31 7 52 0 31 7 51 0' }),
              h('circle', { cx: 49, cy: 52, r: 2, fill: 'currentColor', stroke: 'none' }),
              h('path', { d: 'm153 12 2 6 6 2-6 2-2 6-2-6-6-2 6-2Zm-134 20 1 4 4 1-4 1-1 4-1-4-4-1 4-1Z' }))),
          h('span', { className: 'yy-cover-hint' }, t('coverHint'), h(Icon, { kind: 'right', size: 14 }))),
        h('span', { className: 'yy-cover-face yy-cover-back', 'aria-hidden': true }));
    }

    function useDoodleArtwork(sprite, enabled, loadDoodle) {
      const address = doodleCell(sprite);
      const [uri, setUri] = useState(''), [failed, setFailed] = useState(false), [attempt, setAttempt] = useState(0);
      useEffect(() => {
        const controller = new AbortController(); setUri(''); setFailed(false);
        if (enabled) loadDoodle(address.atlasIndex, controller.signal).then(value => { if (!controller.signal.aborted) setUri(value); }).catch(() => { if (!controller.signal.aborted) setFailed(true); });
        return () => controller.abort();
      }, [address.atlasIndex, enabled, loadDoodle, attempt]);
      return { uri, failed, retry: () => setAttempt(n => n + 1) };
    }

    function Sticker({ sprite, rotation = 0, artwork, t }) {
      const address = doodleCell(sprite), atlas = ATLASES[address.atlasIndex], cell = address.cell;
      const insets = DOODLE_SAFE_INSETS[address.sprite];
      const { uri, failed, retry: retryArtwork } = artwork;
      return h('figure', { className: 'yy-ending-doodle', 'aria-busy': !uri && !failed },
        uri ? h('div', { className: 'yy-sticker', role: 'img', 'aria-label': t('doodleAlt') + ' · ' + DOODLE_LABELS[address.sprite],
          style: { '--yy-art-aspect': atlas.aspect, aspectRatio: atlas.aspect, transform: 'rotate(' + rotation + 'deg)', clipPath: insets ? 'inset(' + insets.map(value => (value * 100) + '%').join(' ') + ')' : undefined,
            backgroundImage: 'url("' + uri + '")', backgroundPosition: (cell % 3 * 50) + '% ' + (Math.floor(cell / 3) * 100) + '%' } }) :
          failed ? h('button', { className: 'yy-paper-button', onClick: retryArtwork }, t('doodleRetry')) : h('span', { className: 'yy-doodle-loading', role: 'status' }, t('doodleLoading')));
    }

    function PagedDiary({ date, entry, t, loading, entryError, isToday, pending, busy, retry, loadDoodle, bookmark, bookmarkBusy, changeBookmark, closed, setClosed, preface, setPreface, moving, setMoving, navigating, bookActions, toggleCover, stepDay }) {
      const flow = useRef(null), [spread, setSpread] = useState(0);
      const book = useRef(null), layer = useRef(null), motion = useBookMotion(book, layer, setMoving);
      const wrap = useRef(null), flowWindow = useRef(null), baseline = useRef(null), landing = useRef(null), wheelState = useRef(null);
      const focusAfterCover = useRef(false);
      useLayoutEffect(() => {
        if (book.current) book.current.inert = closed || moving || navigating;
        if (!moving && focusAfterCover.current) {
          focusAfterCover.current = false;
          const target = closed ? book.current?.parentElement.querySelector('.yy-cover') : book.current;
          target?.focus({ preventScroll: true });
        }
      }, [closed, moving, navigating]);
      useLayoutEffect(() => { if (landing.current === null) landing.current = 'start'; }, [date, preface]);
      useLayoutEffect(() => {
        const actions = {
          turn: (direction, commit, end = false) => {
            const change = () => { landing.current = end ? 'end' : 'start'; commit(); };
            return closed ? motion.cover(() => { change(); setClosed(false); }) : motion.page(direction, change);
          },
          toggle: () => motion.cover(() => {
            focusAfterCover.current = true;
            if (closed) { landing.current = 'start'; setSpread(0); setPreface(true); }
            setClosed(!closed);
          }), cancel: motion.cancel,
          exportImage: signal => captureBookPng(closed ? wrap.current?.querySelector('.yy-cover-front') : book.current, { date, cover: closed, spread, preface, signal, t })
        };
        bookActions.current = actions; return () => { if (bookActions.current === actions) bookActions.current = null; };
      }, [closed, preface, date, spread, t, motion.page, motion.cover, motion.cancel, setClosed, setPreface, bookActions]);
      const [metrics, setMetrics] = useState({ width: 0, height: 320, gap: 48, columns: 2, pages: 2 });
      const [endingLayout, setEndingLayout] = useState({ height: 160, padding: 0, breakBefore: 'auto' });
      const measure = useCallback(() => {
        const node = flow.current, area = flowWindow.current; if (!node || !area?.clientWidth || !area.clientHeight) return;
        const style = getComputedStyle(node), width = area.clientWidth;
        const line = parseFloat(style.lineHeight) || 32;
        const paper = book.current?.querySelector('.yy-paper');
        if (paper && baseline.current) {
          const offset = baseline.current.getBoundingClientRect().top - paper.getBoundingClientRect().top + 1;
          book.current.style.setProperty('--yy-rule-offset', offset + 'px');
        }
        const columns = Math.max(1, parseInt(style.columnCount, 10) || 1), gap = parseFloat(style.columnGap) || 0;
        const { pitch, height } = pageGeometry(width, area.clientHeight, gap, columns, line);
        const dimensionsReady = Math.abs(node.clientHeight - height) < 1 && Math.abs(node.clientWidth - width) < 1;
        const hasEnding = !!node.querySelector(':scope > .yy-diary-ending');
        let endingReady = dimensionsReady && !hasEnding;
        if (hasEnding && dimensionsReady) {
          const layout = diaryEndingLayout(height, line);
          setEndingLayout(old => old.height === layout.height && old.padding === layout.padding && old.breakBefore === layout.breakBefore ? old : layout);
          endingReady = book.current.style.getPropertyValue('--yy-doodle-height') === layout.height + 'px'
            && book.current.style.getPropertyValue('--yy-ending-pad') === layout.padding + 'px'
            && book.current.style.getPropertyValue('--yy-ending-break') === layout.breakBefore;
        }
        const pages = Math.max(columns, Math.ceil((node.scrollWidth + gap - 2) / pitch));
        setMetrics(old => old.width === width && old.height === height && old.gap === gap && old.columns === columns && old.pages === pages ? old : { width, height, gap, columns, pages });
        const destination = endingReady ? landing.current : null;
        if (destination !== null) landing.current = null;
        setSpread(old => destination === 'start' ? 0 : destination === 'end' ? Math.ceil(pages / columns) - 1 : Math.min(old, Math.ceil(pages / columns) - 1));
      }, []);
      useLayoutEffect(() => { measure(); }, [measure, date, entry, loading, entryError, isToday, preface, pending?.error, metrics.height, metrics.width, endingLayout.height, endingLayout.padding, endingLayout.breakBefore]);
      useEffect(() => {
        let active = true;
        const observer = new ResizeObserver(measure); if (flowWindow.current) observer.observe(flowWindow.current);
        document.fonts?.ready.then(() => { if (active) measure(); });
        return () => { active = false; observer.disconnect(); };
      }, [measure]);
      const totalSpreads = Math.ceil(metrics.pages / metrics.columns);
      useLayoutEffect(() => {
        wheelState.current = { blocked: moving || navigating || loading, height: metrics.height, run: direction => {
          if (closed) { if (direction > 0) void toggleCover(); return; }
          if (spread + direction >= 0 && spread + direction < totalSpreads) void motion.page(direction, () => setSpread(value => value + direction));
          else void stepDay(direction, direction < 0);
        } };
      });
      useEffect(() => {
        const element = wrap.current, accept = createWheelPager();
        const onWheel = event => {
          if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || !event.deltaY || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
          const state = wheelState.current; if (!state) return;
          event.preventDefault();
          const direction = accept({ deltaX: event.deltaX, deltaY: event.deltaY, deltaMode: event.deltaMode, now: performance.now(),
            blocked: state.blocked, line: parseFloat(getComputedStyle(flow.current).lineHeight) || 32, height: state.height });
          if (direction) state.run(direction);
        };
        element?.addEventListener('wheel', onWheel, { passive: false });
        return () => element?.removeEventListener('wheel', onWheel);
      }, []);
      const doodle = diaryDoodle(date, entry?.doodles);
      const artwork = useDoodleArtwork(doodle.sprite, !preface && !!entry && !loading && !entryError, loadDoodle);
      const renderFlow = right => h('div', { className: 'yy-page-viewport ' + (right ? 'yy-page-right' : 'yy-page-left'), 'aria-hidden': right || undefined },
        h('article', { ref: right ? undefined : flow, className: 'yy-flow', 'aria-label': preface ? t('prefaceTitle') : t('title') + ' ' + date,
          style: { width: metrics.width ? metrics.width + 'px' : '100%', height: metrics.height + 'px',
            transform: 'translateX(-' + (spread * (metrics.width + metrics.gap) + (right ? (metrics.width + metrics.gap) / metrics.columns : 0)) + 'px)' } },
          preface ? h(React.Fragment, null,
            h('div', { className: 'yy-preface-spacer', 'aria-hidden': true }),
            h('header', { className: 'yy-entry-head' }, h('div', { className: 'yy-date-heading' }, h('h2', null, t('prefaceTitle')))),
            ['prefaceOne', 'prefaceTwo', 'prefaceThree'].map(key => h('p', { key, className: 'yy-diary-paragraph' }, t(key)))) : h(React.Fragment, null,
          h('header', { className: 'yy-entry-head' },
            h('div', { className: 'yy-date-heading' }, h('h2', null, shortDate(date)), h('span', null, weekday(date)))),
          loading ? h('p', { role: 'status' }, t('loading')) : entryError ? h('p', { role: 'alert' }, entryError) : entry ?
            entry.text.split(/\n+/).map(paragraph => paragraph.trim()).filter(Boolean).map((paragraph, i) => h('p', { className: 'yy-diary-paragraph', key: i }, paragraph)) :
            isToday ? h('p', { className: 'yy-today-message' }, t('gatheringTitle')) :
            h('div', { className: 'yy-unwritten' }, h('h3', null, t('pendingTitle')), h('p', null, t('pendingText')),
              h('button', { type: 'button', className: 'yy-paper-button', onClick: retry, disabled: busy, tabIndex: right ? -1 : undefined }, busy ? t('busy') : t('retry')),
              pending?.error && h('p', { className: 'yy-pending-error', role: 'alert' }, pending.error),
              pending?.paused && !busy && h('p', { className: 'yy-pending-error' }, t('retryPaused'))),
          entry && !loading && !entryError && h('div', { className: 'yy-diary-ending' }, h(Sticker, { ...doodle, artwork, t })))));
      return h('div', { ref: wrap, className: 'yy-book-wrap' + (closed ? ' yy-is-closed' : ' yy-is-open') + (moving ? ' yy-is-moving' : ''), 'aria-busy': moving || navigating },
        h('div', { className: 'yy-book-stage' },
        h('div', { ref: book, className: 'yy-book' + (preface && spread === 0 && metrics.columns > 1 ? ' yy-preface-opening' : ''), tabIndex: -1, 'aria-label': t('notebook'), 'aria-hidden': closed,
          style: { '--yy-doodle-height': endingLayout.height + 'px', '--yy-ending-pad': endingLayout.padding + 'px', '--yy-ending-break': endingLayout.breakBefore } },
          h('div', { className: 'yy-paper yy-paper-left', 'aria-hidden': true }),
          h('div', { className: 'yy-paper yy-paper-right', 'aria-hidden': true }),
          h('div', { className: 'yy-spine', 'aria-hidden': true }),
          !preface && h('button', { type: 'button', className: 'yy-bookmark', style: { '--yy-bookmark-color': BOOKMARK_PALETTE[bookmark] || '#b8b8a7' },
            disabled: !entry || bookmarkBusy, onClick: changeBookmark, 'aria-pressed': !!bookmark,
            'aria-label': t('bookmarkAction') + ' · ' + t('bookmark_' + (bookmark || 'none')), title: t('bookmarkHint') }),
          h('div', { ref: flowWindow, className: 'yy-flow-window', style: { '--yy-page-gap': metrics.gap + 'px' } },
            h('div', { className: 'yy-type-probe', 'aria-hidden': true }, '鱼', h('i', { ref: baseline })),
            renderFlow(false), metrics.columns > 1 && renderFlow(true)),
          h('div', { className: 'yy-book-footline' },
            h('span', { className: 'yy-book-note' }, !preface && entry?.source === 'example' ? t('exampleBadge') : ''),
            h('nav', { className: 'yy-spread-nav', 'aria-label': t(preface ? 'prefaceTitle' : 'withinDiary') },
              h('button', { type: 'button', className: 'yy-paper-turn', disabled: moving || navigating || spread === 0, onClick: () => motion.page(-1, () => setSpread(n => n - 1)), 'aria-label': t('pageBack'), title: t('pageBack'), style: { visibility: totalSpreads > 1 ? 'visible' : 'hidden' } }, h(Icon, { kind: 'left', size: 16 })),
              h('button', { type: 'button', className: 'yy-paper-turn', disabled: moving || navigating || spread >= totalSpreads - 1, onClick: () => motion.page(1, () => setSpread(n => n + 1)), 'aria-label': t('pageForward'), title: t('pageForward'), style: { visibility: totalSpreads > 1 ? 'visible' : 'hidden' } }, h(Icon, { kind: 'right', size: 16 }))))),
        h('div', { ref: layer, className: 'yy-turn-layer', 'aria-hidden': true }),
        h(BookCover, { closed, moving: moving || navigating, toggle: toggleCover, t })));
    }

    function MonthCalendar({ date, snapshot, dates, selectDate, disabled, activeDate, t }) {
      const [month, setMonth] = useState(date.slice(0, 7));
      useEffect(() => { setMonth(date.slice(0, 7)); }, [date]);
      const available = new Set(dates), earliest = (snapshot.archiveStartDate || snapshot.startedDate).slice(0, 7);
      const marks = new Map(snapshot.entries.map(entry => [entry.date, entry.bookmark]));
      return h('div', { className: 'yy-calendar' },
        h('div', { className: 'yy-calendar-month' },
          h('button', { type: 'button', className: 'yy-icon-button', disabled: month <= earliest, onClick: () => setMonth(m => shiftMonth(m, -1)), 'aria-label': t('previousMonth') }, h(Icon, { kind: 'left', size: 16 })),
          h('strong', null, month.replace('-', ' / ')),
          h('button', { type: 'button', className: 'yy-icon-button', disabled: month >= snapshot.today.slice(0, 7), onClick: () => setMonth(m => shiftMonth(m, 1)), 'aria-label': t('nextMonth') }, h(Icon, { kind: 'right', size: 16 }))),
        h('div', { className: 'yy-calendar-week', 'aria-hidden': true }, t('weekdays').split(' ').map((day, index) => h('span', { key: index }, day))),
        h('div', { className: 'yy-calendar-days', 'aria-label': t('date') }, calendarCells(month).map(cell => {
          const mark = marks.get(cell.date), enabled = !disabled && cell.inMonth && available.has(cell.date);
          return h('button', { type: 'button', key: cell.date, disabled: !enabled, className: 'yy-calendar-day' + (cell.date === activeDate ? ' yy-current' : '') + (!cell.inMonth ? ' yy-other-month' : ''),
            onClick: () => selectDate(cell.date), 'aria-current': cell.date === activeDate ? 'date' : undefined,
            'aria-label': cell.date + (mark ? ' · ' + t('bookmark_' + mark) : '') },
            h('span', null, cell.day), h('i', { className: 'yy-bookmark-dot', 'aria-hidden': true, style: { background: BOOKMARK_PALETTE[mark] || 'transparent' } }));
        })));
    }


    const MENU_CSS = `.yy-session-diary{border-top:1px solid var(--dsw-alias-border-l3);margin-top:4px;padding-top:4px}.yy-session-diary-button{box-sizing:border-box;display:flex;align-items:center;gap:6px;width:100%;min-height:34px;padding:6px 8px;border:0;border-radius:var(--dsw-radius-md);background:transparent;color:var(--dsw-alias-label-primary);font-family:inherit;font-size:13px;font-weight:400;line-height:20px;text-align:left;cursor:pointer}.yy-session-diary-button:hover,.yy-session-diary-button:focus-visible{background:var(--dsw-alias-interactive-bg-hover)}.yy-session-diary-button:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:-2px}.yy-session-diary-button:disabled{opacity:.5;cursor:wait}.yy-session-diary-button svg{flex-shrink:0}.yy-session-diary-error{max-width:270px;margin:4px 12px;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:1.5}`;
    function SessionDiaryToggle({ sessionId, useMenuOpenState, ctx, t }) {
      const [open, setMenuOpen] = useMenuOpenState();
      const [policy, setPolicy] = useState(null), [error, setError] = useState(''), [saving, setSaving] = useState(false), [attempt, setAttempt] = useState(0);
      const active = useRef(false), savingRef = useRef(false);
      useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
      const request = useCallback(async (method, args, signal) => {
        const result = await ctx.connection.rpc.call('/api', `yuyuDiary/${method}`, { args }, signal);
        if (!result.ok) throw new Error(result.error?.message || t('loadFail'));
        if (result.value?.sessionId !== sessionId || typeof result.value.excluded !== 'boolean') throw new Error(t('loadFail'));
        if (method === 'setSessionExcluded' && result.value.excluded !== args.excluded) throw new Error(t('loadFail'));
        return result.value;
      }, [ctx, sessionId, t]);
      useEffect(() => {
        if (!open) return;
        const controller = new AbortController(); setPolicy(null); setError('');
        request('sessionPolicy', { sessionId }, controller.signal).then(value => { if (!controller.signal.aborted) setPolicy(value); })
          .catch(e => { if (!controller.signal.aborted) setError(e.message); });
        return () => controller.abort();
      }, [open, request, sessionId, attempt]);
      async function toggle(event) {
        // Keep the host menu open until the durable operation succeeds, so errors stay visible.
        event.stopPropagation();
        if (savingRef.current) return;
        if (!policy) { setAttempt(n => n + 1); return; }
        savingRef.current = true; setSaving(true); setError('');
        try {
          const value = await request('setSessionExcluded', { sessionId, excluded: !policy.excluded });
          ctx.emit('yuyu-diary/settings-changed', { sessionId: value.sessionId, excluded: value.excluded });
          if (active.current) { setPolicy(value); setMenuOpen(false); }
        } catch (e) { if (active.current) setError(e.message); }
        finally { savingRef.current = false; if (active.current) setSaving(false); }
      }
      return h('div', { className: 'yy-session-diary' }, h('style', null, MENU_CSS),
        h('button', { type: 'button', role: 'menuitem', className: 'yy-session-diary-button', disabled: saving || (!policy && !error), onClick: toggle,
          title: t(policy?.excluded ? 'includeHint' : 'excludeHint'), 'aria-busy': saving || (!policy && !error) },
          h(Icon, { size: 18 }), h('span', null, t(saving ? 'savingSession' : !policy && error ? 'retrySession' : policy?.excluded ? 'includeSession' : 'excludeSession'))),
        error && h('p', { className: 'yy-session-diary-error', role: 'alert' }, error));
    }

    function Notebook({ ctx, t }) {
      const [snapshot, setSnapshot] = useState(null), [date, setDate] = useState(''), [entry, setEntry] = useState(null);
      const [error, setError] = useState(''), [entryError, setEntryError] = useState(''), [archive, setArchive] = useState(false), [notice, setNotice] = useState(''), [loading, setLoading] = useState(false);
      const [recordsOpen, setRecordsOpen] = useState(false), [bookmarkBusy, setBookmarkBusy] = useState(false);
      const [closed, setClosed] = useState(true), [moving, setMoving] = useState(false), [navigating, setNavigating] = useState(false);
      const [preface, setPreface] = useState(true);
      const [exporting, setExporting] = useState(false), exportRequest = useRef(null);
      const bookActions = useRef(null), navigation = useRef(null), preparedEntry = useRef(null);
      useEffect(() => () => { navigation.current?.abort(); exportRequest.current?.abort(); }, []);
      const bookmarkLock = useRef(false), refreshSequence = useRef(0), initialized = useRef(false);
      const call = useCallback(async (action, payload = {}, signal) => {
        const result = await ctx.connection.rpc.call('/api', `yuyuDiary/${action}`, { args: payload }, signal);
        if (!result.ok) throw new Error(result.error?.message || t('loadFail'));
        return result.value;
      }, [ctx, t]);
      const artworkCache = useRef(new Map());
      const loadDoodle = useCallback(async (atlas, signal) => {
        if (artworkCache.current.has(atlas)) return artworkCache.current.get(atlas);
        const value = await call('doodle', { atlas }, signal);
        if (signal?.aborted) throw signal.reason;
        if (typeof value.uri !== 'string' || !value.uri.startsWith('data:image/png;base64,')) throw new Error(t('doodleRetry'));
        artworkCache.current.set(atlas, value.uri);
        if (artworkCache.current.size > 3) artworkCache.current.delete(artworkCache.current.keys().next().value);
        return value.uri;
      }, [call, t]);
      const refresh = useCallback(async signal => {
        const sequence = ++refreshSequence.current;
        try {
          const data = await call('list', {}, signal); if (signal?.aborted || sequence !== refreshSequence.current || exportRequest.current) return;
          const available = [data.today, ...data.entries.map(e => e.date), ...data.pending.map(e => e.date)];
          setSnapshot(data); setError('');
          if (!initialized.current) {
            const initial = initialDiaryView(data);
            initialized.current = true;
            setClosed(initial.closed); setPreface(initial.preface); setDate(initial.date);
          } else {
            // Polls/reconnects must not take the reader away from a chosen page or cover.
            setDate(previous => available.includes(previous) ? previous : initialDiaryView(data).date);
          }
        } catch (e) { if (!signal?.aborted && sequence === refreshSequence.current) setError(e.message || t('loadFail')); }
      }, [call, t]);
      useEffect(() => {
        const controller = new AbortController(); void refresh(controller.signal);
        const timer = setInterval(() => { if (!document.hidden) void refresh(controller.signal); }, 10000);
        const onVisible = () => { if (!document.hidden) void refresh(controller.signal); };
        document.addEventListener('visibilitychange', onVisible);
        const dispose = ctx.on('connection/reset', () => { void refresh(controller.signal); });
        const disposeSettings = ctx.on('yuyu-diary/settings-changed', policy => {
          // Reject reads started before the setting was saved, and remove the
          // exact session immediately. Other rows keep their content and IDs.
          refreshSequence.current++;
          bookActions.current?.cancel();
          exportRequest.current?.abort(new Error('会话日记设置已变更'));
          exportRequest.current = null; setExporting(false);
          setSnapshot(previous => applySessionPolicy(previous, policy));
          void refresh(controller.signal);
        });
        return () => { controller.abort(); clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); dispose(); disposeSettings(); };
      }, [refresh, ctx]);
      const isWritten = snapshot?.entries.some(e => e.date === date) || false;
      useEffect(() => {
        if (preparedEntry.current?.date === date) {
          setEntry(preparedEntry.current.entry); preparedEntry.current = null; setEntryError(''); setLoading(false); setRecordsOpen(false); return;
        }
        const controller = new AbortController(); setEntry(null); setEntryError(''); setLoading(isWritten); setRecordsOpen(false);
        if (isWritten && date) call('read', { date }, controller.signal).then(result => { if (!controller.signal.aborted) { setEntry(result.entry); setLoading(false); } }).catch(e => { if (!controller.signal.aborted) { setEntryError(e.message); setLoading(false); } });
        return () => controller.abort();
      }, [date, isWritten, call]);
      async function retry() {
        try { await call('retry'); setNotice(t('retrying')); await refresh(); } catch (e) { setError(e.message); }
      }
      async function download() {
        if (moving || navigation.current || exportRequest.current || !bookActions.current) return;
        const controller = new AbortController(); exportRequest.current = controller; setExporting(true);
        try {
          const data = await bookActions.current.exportImage(controller.signal);
          if (controller.signal.aborted) return;
          const url = URL.createObjectURL(data.blob), a = document.createElement('a');
          a.href = url; a.download = data.filename; a.style.display = 'none'; document.body.append(a);
          try { a.click(); } finally { a.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000); }
        } catch (e) { if (!controller.signal.aborted) setError(t('imageError') + '：' + (e.message || '')); }
        finally { if (exportRequest.current === controller) exportRequest.current = null; if (!controller.signal.aborted) setExporting(false); }
      }
      const dates = snapshot ? [...new Set([snapshot.today, ...snapshot.entries.map(e => e.date), ...snapshot.pending.map(e => e.date)])].sort().reverse() : [];
      const isToday = date === snapshot?.today;
      const pending = snapshot?.pending.find(e => e.date === date), bookmark = snapshot?.entries.find(e => e.date === date)?.bookmark ?? null;
      const shownEntry = entry?.date === date ? entry : null;
      const tasks = shownEntry?.tasks || [];
      const busy = snapshot?.status === 'collecting' || snapshot?.status === 'writing';
      const failedDay = snapshot?.pending.find(item => (item.error || item.paused) && item.date !== snapshot.writingDate);
      const statusText = t(snapshot?.status === 'starting' ? 'loading' : snapshot?.status === 'ready' && isToday ? 'collecting' : snapshot?.status || 'loading');
      const previousDay = diaryStep(dates, date, -1, closed, preface), nextDate = diaryStep(dates, date, 1, closed, preface);
      const previousLabel = t(previousDay?.kind === 'cover' ? 'closeBook' : previousDay?.kind === 'preface' ? 'backToPreface' : 'prev');
      async function stepDay(direction, end = false) {
        if (moving || navigation.current || exportRequest.current || !bookActions.current) return;
        const action = diaryStep(dates, date, direction, closed, preface);
        if (!action) return;
        if (action.kind === 'date') await selectDate(action.date, end);
        else if (action.kind === 'preface') {
          setRecordsOpen(false);
          try { await bookActions.current.turn(-1, () => setPreface(true), end); }
          catch (e) { setError(e.message || t('loadFail')); }
        }
        else await toggleCover();
      }
      async function selectDate(target, end = false) {
        if (moving || navigation.current || exportRequest.current || !dates.includes(target) || !bookActions.current) return;
        if (target === date && !closed && !preface) return;
        const controller = new AbortController(); navigation.current = controller; setNavigating(true); setRecordsOpen(false);
        try {
          // Keep the old spread visible while reading, so a slow disk/RPC never
          // turns the next page into a flash of loading text.
          const written = snapshot.entries.some(item => item.date === target);
          const destination = written ? (await call('read', { date: target }, controller.signal)).entry : null;
          if (controller.signal.aborted) return;
          if (written && destination?.date !== target) throw new Error(t('readError'));
          await bookActions.current?.turn(preface || target > date ? 1 : -1, () => {
            preparedEntry.current = target !== date ? { date: target, entry: destination } : null;
            setPreface(false); setDate(target); setEntry(destination); setLoading(false); setEntryError('');
          }, end);
        } catch (e) { if (!controller.signal.aborted) setError(e.message || t('loadFail')); }
        finally { if (navigation.current === controller) navigation.current = null; if (!controller.signal.aborted) setNavigating(false); }
      }
      async function toggleCover() {
        if (moving || navigation.current || exportRequest.current) return;
        setRecordsOpen(false);
        try { await bookActions.current?.toggle(); } catch (e) { setError(e.message || t('loadFail')); }
      }
      async function changeBookmark() {
        if (closed || preface || !shownEntry || bookmarkLock.current) return;
        bookmarkLock.current = true; setBookmarkBusy(true); refreshSequence.current++;
        try {
          const value = await call('setBookmark', { date, color: nextBookmark(bookmark) });
          setSnapshot(old => old && ({ ...old, entries: old.entries.map(e => e.date === value.date ? { ...e, bookmark: value.color } : e) }));
          await refresh();
        } catch (e) { setError(e.message); }
        finally { bookmarkLock.current = false; setBookmarkBusy(false); }
      }
      return h('section', { className: 'yy-app', 'aria-label': t('title') },
        h('style', null, CSS),
        h('header', { className: 'yy-toolbar' },
          h('div', { className: 'yy-brand' }, h('span', { className: 'yy-brand-icon' }, h(Icon, { size: 24 })), h('div', null, h('h1', null, t('title')), h('p', null, t('subtitle')))),
          h('div', { className: 'yy-actions' },
            h('button', { type: 'button', className: `yy-button ${archive ? 'yy-selected' : ''}`, disabled: exporting, onClick: () => setArchive(!archive), 'aria-expanded': archive, 'aria-controls': 'yy-archive' }, h(Icon, { kind: 'calendar', size: 16 }), t('archive')),
            !closed && !preface && shownEntry?.source !== 'example' && shownEntry && h('button', { type: 'button', className: 'yy-button yy-records-toggle', onClick: () => setRecordsOpen(!recordsOpen), 'aria-expanded': recordsOpen }, t('records')),
            h('button', { type: 'button', className: 'yy-button', onClick: download, disabled: !snapshot || (!closed && !preface && loading) || moving || navigating || exporting }, h(Icon, { kind: 'download', size: 16 }), t(exporting ? 'exporting' : 'export')))),
        (error || snapshot?.error) && h('div', { className: 'yy-alert', role: 'alert' }, h('span', null, error || snapshot.error), h('button', { type: 'button', className: 'yy-button', onClick: () => refresh() }, t('refresh'))),
        failedDay && !(error || snapshot?.error) && h('div', { className: 'yy-alert yy-generation-alert', role: 'alert' },
          h('span', null, failedDay.date + ' · ' + t('diaryFailed') + ' · ' + t(failedDay.paused ? 'retryPaused' : 'retryScheduled')),
          h('button', { type: 'button', className: 'yy-button', disabled: moving || navigating || exporting, onClick: () => selectDate(failedDay.date) }, t('showFailure'))),
        h('div', { className: 'yy-workspace' },
          archive && snapshot && date && h('aside', { className: 'yy-archive', id: 'yy-archive', 'aria-label': t('archive') },
            h('div', { className: 'yy-archive-head' }, h('strong', null, t('archive')), h('button', { type: 'button', className: 'yy-icon-button', onClick: () => setArchive(false), 'aria-label': t('closeArchive') }, h(Icon, { kind: 'close', size: 16 }))),
            h(MonthCalendar, { date, snapshot, dates, selectDate, activeDate: !closed && !preface ? date : null, disabled: moving || navigating || exporting, t })),
          h('main', { className: 'yy-desk' },
            !snapshot || !date ? h('div', { className: 'yy-loading', role: 'status' }, h(Icon, { size: 32 }), t('loading')) :
              h(PagedDiary, { date, entry: shownEntry, t, loading: !preface && loading, entryError, isToday, pending, busy, retry, loadDoodle, bookmark, bookmarkBusy, changeBookmark, closed, setClosed, preface, setPreface, moving, setMoving, navigating: navigating || exporting, bookActions, toggleCover, stepDay }),
            h('nav', { className: 'yy-pagination', 'aria-label': t('date') },
              h('button', { type: 'button', className: 'yy-page-turn', disabled: moving || navigating || exporting || !previousDay, onClick: () => stepDay(-1), title: previousLabel }, h(Icon, { kind: 'left', size: 18 }), previousLabel),
              h('button', { type: 'button', className: 'yy-page-turn yy-cover-toggle', disabled: !snapshot || moving || navigating || exporting, onClick: toggleCover, 'aria-expanded': !closed }, h(Icon, { size: 17 }), t(closed ? 'openBook' : 'closeBook'), h('small', null, snapshot ? `${snapshot.entries.length} ${t('pageUnit')}` : '')),
              h('button', { type: 'button', className: 'yy-page-turn', disabled: moving || navigating || exporting || !nextDate, onClick: () => stepDay(1) }, t(closed ? 'openBook' : preface ? 'startDiary' : 'next'), h(Icon, { kind: 'right', size: 18 }))))),
        !closed && !preface && recordsOpen && shownEntry && h('aside', { className: 'yy-records-panel', role: 'dialog', 'aria-label': t('records'), onKeyDown: e => { if (e.key === 'Escape') setRecordsOpen(false); } },
          h('div', { className: 'yy-archive-head' }, h('strong', null, t('records')), h('button', { type: 'button', className: 'yy-icon-button', onClick: () => setRecordsOpen(false), 'aria-label': t('closeRecords') }, h(Icon, { kind: 'close', size: 16 }))),
          h('ul', null, tasks.map(task => h('li', { key: task.id }, h('span', null, task.prompt), h('small', null, t(Object.hasOwn(zh, task.status) ? task.status : 'unknown')))))),
        h('footer', { className: 'yy-statusbar' }, h('span', { role: 'status' }, notice && busy ? notice : statusText), h('span', null, t('local'))));
    }

    return {
      inject: ['slots', 'locale', 'layout', 'connection'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh, en })); const t = ctx.locale.bind(NS);
        ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: 'yuyu-diary', locale: NS }, () => h(Notebook, { ctx, t })));
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id: 'yuyu-diary', order: 15, label: () => t('title'), locale: NS }, props => h(Icon, { size: props.size || 18 })));
        ctx.slots.inject('sidebar.workspaces.session.menu.item', () => ctx.slots.register({ name: 'sidebar.workspaces.session.menu.item', id: 'yuyu-diary-exclude', order: 500, locale: NS }, props => h(SessionDiaryToggle, { ...props, ctx, t })));
      }
    };
  }
});
