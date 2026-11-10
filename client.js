window.__ModuleLoader__.load({
  id: 'dsh-yuyudiary',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useState, useEffect, useLayoutEffect, useRef, useCallback } = React;
    // Shared by the Host and Client. Append atlases so saved sprite IDs never change meaning.
const DOODLE_ATLASES = ['yuyu-doodles.png', 'yuyu-doodles-daily.png', 'yuyu-doodles-curious.png', 'yuyu-doodles-moments.png', 'yuyu-doodles-treats.png', 'yuyu-doodles-crafts.png', 'yuyu-doodles-outdoors.png', 'yuyu-doodles-play.png', 'yuyu-doodles-moods.png', 'yuyu-doodles-dreams.png'];
const SPRITES_PER_ATLAS = 6;
const DOODLE_COUNT = DOODLE_ATLASES.length * SPRITES_PER_ATLAS;
// Camera cell spans x=418..836 in the 1254px atlas. Adjacent drawings cross those
// equal-cell edges; its own character and accents fit safely inside x=434..812.
// Insets are fractions of the displayed cell: top, right, bottom, left.
const DOODLE_SAFE_INSETS = { 19: [0, 24 / 418, 0, 16 / 418] };
const DOODLE_LABELS = ['写日记', '用电脑', '抱鲸鱼', '打盹', '看清单', '喝茶', '吃米饭', '煮饭', '读书', '听音乐', '浇花', '裹毯子', '观察小虫', '转魔方', '搭积木', '整理卡片', '看星星', '折纸船', '撑伞', '拍照', '放风筝', '围巾与落叶', '庆祝小进展', '得意地点赞', '擀面团', '捏饭团', '翻煎饼', '吃西瓜', '草莓蛋糕', '倒花茶', '画水彩', '织围巾', '绣星星', '贴手账', '系礼物丝带', '折纸鹤', '骑小车', '提野餐篮', '看蝴蝶', '吹泡泡', '堆雪人', '捡贝壳', '玩手柄', '摇铃鼓', '戴纸王冠', '放纸飞机', '想棋局', '转小风车', '伸懒腰', '鼓脸颊', '拆惊喜信', '害羞捧花', '挽袖加油', '探头看你', '坐月亮', '抱海洋瓶', '钓玩具鱼', '坐游泳圈', '抛小星星', '看沙漏'];

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
function doodleCell(sprite) {
  const id = Number.isInteger(sprite) && sprite >= 0 && sprite < DOODLE_COUNT ? sprite : 0;
  return { sprite: id, atlasIndex: Math.floor(id / SPRITES_PER_ATLAS), cell: id % SPRITES_PER_ATLAS };
}
function doodlesFor(date) {
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
function diaryDoodle(date, saved) {
  const first = Array.isArray(saved) ? saved.find(d => Number.isInteger(d?.sprite) && d.sprite >= 0 && d.sprite < DOODLE_COUNT) : null;
  return first ? { sprite: first.sprite, rotation: first.rotation || 0 } : doodlesFor(date)[0];
}

    /** Shared bookmark identifiers and pure calendar helpers. */
const BOOKMARK_COLORS = ['rose', 'amber', 'blue', 'sage'];
const BOOKMARK_PALETTE = { rose: '#c88788', amber: '#ceab64', blue: '#7f9fb7', sage: '#84a58e' };
/** Use the Host's persisted start day and timezone, not browser storage or elapsed hours. */
function initialDiaryView({ today, startedDate, entries }) {
  const latest = entries.map(entry => entry.date).filter(date => date <= today).sort().at(-1);
  const closed = !(startedDate < today);
  return { date: latest || today, closed, preface: closed };
}
function nextBookmark(color) { return BOOKMARK_COLORS[(BOOKMARK_COLORS.indexOf(color) + 1) % (BOOKMARK_COLORS.length + 1)] ?? null; }
function shiftMonth(month, offset) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || !Number.isInteger(offset)) throw new Error('无效月份');
  const date = new Date(`${month}-15T12:00:00Z`); date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 7);
}
function calendarCells(month) {
  shiftMonth(month, 0);
  const first = new Date(`${month}-01T12:00:00Z`), offset = (first.getUTCDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(first); date.setUTCDate(index - offset + 1);
    const key = date.toISOString().slice(0, 10);
    return { date: key, day: date.getUTCDate(), inMonth: key.startsWith(month) };
  });
}

/** Dates are newest first; the reading order is cover, preface, then dated entries. */
function diaryStep(dates, date, direction, closed, preface = false) {
  const index = dates.indexOf(date);
  if (index < 0 || (direction !== -1 && direction !== 1)) return null;
  if (closed) return direction > 0 ? { kind: 'open' } : null;
  if (preface) return direction < 0 ? { kind: 'cover' } : { kind: 'date', date: dates.at(-1) };
  if (direction < 0 && index === dates.length - 1) return { kind: 'preface' };
  const target = dates[index - direction];
  return target ? { kind: 'date', date: target } : null;
}

/** Apply only a confirmed preference, without replacing other rows or awaiting a poll. */
function applySessionPolicy(snapshot, policy) {
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
function ruledHeight(available, line) {
  if (!(available > 0) || !(line > 0)) return 0;
  return available < line ? available : Math.floor(available / line) * line;
}

/** Reserve a full ruled line above the bookmarked right (or single) page. */
function pageGeometry(width, available, gap, columns, line) {
  return { height: ruledHeight(Math.max(0, available - line), line), pitch: (width + gap) / columns, rightInset: line };
}

/** Follow the prose naturally; keep the single illustration within a paper page. */
function diaryEndingLayout(height, line) {
  return { height: ruledHeight(Math.min(320, height), line), padding: 0, breakBefore: 'auto' };
}

/** Animate only the padding box (paper), leaving every hard-cover border outside it. */
function paperTurnFrame(width, height, { left = 0, right = 0, top = 0, bottom = 0 } = {}) {
  if (![width, height, left, right, top, bottom].every(value => Number.isFinite(value) && value >= 0)) return null;
  const paperWidth = width - left - right, paperHeight = height - top - bottom;
  if (paperWidth <= 0 || paperHeight <= 0) return null;
  return { left, top, width: paperWidth, height: paperHeight };
}

function pngPixelRatio(width, height) {
  if (!(width > 0 && height > 0)) throw new Error('无效图片尺寸');
  return Math.min(2, Math.sqrt(12000000 / (width * height)), 8192 / width, 8192 / height);
}
function pngFilename(date, cover, spread, preface = false) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isInteger(spread) || spread < 0) throw new Error('无效日记页面');
  return cover ? '鱼鱼日记-封面.png' : preface ? `鱼鱼日记-扉页-${spread + 1}.png` : `鱼鱼日记-${date}-${spread + 1}.png`;
}

/** One wheel gesture turns one spread; ignore its inertial tail during motion. */
function createWheelPager() {
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

    const pngRenderer = (() => {
      // Locally bundled MIT-licensed html-to-image; no CDN or upload service.
      const exports = {}, module = { exports };
      /* html-to-image 1.11.13
MIT License

Copyright (c) 2017-2025 W.Y.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/
!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?e(exports):"function"==typeof define&&define.amd?define(["exports"],e):e((t="undefined"!=typeof globalThis?globalThis:t||self).htmlToImage={})}(this,(function(t){"use strict";function e(t,e,n,r){return new(n||(n=Promise))((function(i,o){function u(t){try{a(r.next(t))}catch(t){o(t)}}function c(t){try{a(r.throw(t))}catch(t){o(t)}}function a(t){var e;t.done?i(t.value):(e=t.value,e instanceof n?e:new n((function(t){t(e)}))).then(u,c)}a((r=r.apply(t,e||[])).next())}))}function n(t,e){var n,r,i,o,u={label:0,sent:function(){if(1&i[0])throw i[1];return i[1]},trys:[],ops:[]};return o={next:c(0),throw:c(1),return:c(2)},"function"==typeof Symbol&&(o[Symbol.iterator]=function(){return this}),o;function c(c){return function(a){return function(c){if(n)throw new TypeError("Generator is already executing.");for(;o&&(o=0,c[0]&&(u=0)),u;)try{if(n=1,r&&(i=2&c[0]?r.return:c[0]?r.throw||((i=r.return)&&i.call(r),0):r.next)&&!(i=i.call(r,c[1])).done)return i;switch(r=0,i&&(c=[2&c[0],i.value]),c[0]){case 0:case 1:i=c;break;case 4:return u.label++,{value:c[1],done:!1};case 5:u.label++,r=c[1],c=[0];continue;case 7:c=u.ops.pop(),u.trys.pop();continue;default:if(!(i=u.trys,(i=i.length>0&&i[i.length-1])||6!==c[0]&&2!==c[0])){u=0;continue}if(3===c[0]&&(!i||c[1]>i[0]&&c[1]<i[3])){u.label=c[1];break}if(6===c[0]&&u.label<i[1]){u.label=i[1],i=c;break}if(i&&u.label<i[2]){u.label=i[2],u.ops.push(c);break}i[2]&&u.ops.pop(),u.trys.pop();continue}c=e.call(t,u)}catch(t){c=[6,t],r=0}finally{n=i=0}if(5&c[0])throw c[1];return{value:c[0]?c[1]:void 0,done:!0}}([c,a])}}}var r,i=(r=0,function(){return r+=1,"u".concat("0000".concat((Math.random()*Math.pow(36,4)<<0).toString(36)).slice(-4)).concat(r)});function o(t){for(var e=[],n=0,r=t.length;n<r;n++)e.push(t[n]);return e}var u=null;function c(t){return void 0===t&&(t={}),u||(u=t.includeStyleProperties?t.includeStyleProperties:o(window.getComputedStyle(document.documentElement)))}function a(t,e){var n=(t.ownerDocument.defaultView||window).getComputedStyle(t).getPropertyValue(e);return n?parseFloat(n.replace("px","")):0}function s(t,e){void 0===e&&(e={});var n,r,i,o=e.width||(r=a(n=t,"border-left-width"),i=a(n,"border-right-width"),n.clientWidth+r+i),u=e.height||function(t){var e=a(t,"border-top-width"),n=a(t,"border-bottom-width");return t.clientHeight+e+n}(t);return{width:o,height:u}}var l=16384;function f(t,e){return void 0===e&&(e={}),t.toBlob?new Promise((function(n){t.toBlob(n,e.type?e.type:"image/png",e.quality?e.quality:1)})):new Promise((function(n){for(var r=window.atob(t.toDataURL(e.type?e.type:void 0,e.quality?e.quality:void 0).split(",")[1]),i=r.length,o=new Uint8Array(i),u=0;u<i;u+=1)o[u]=r.charCodeAt(u);n(new Blob([o],{type:e.type?e.type:"image/png"}))}))}function h(t){return new Promise((function(e,n){var r=new Image;r.onload=function(){r.decode().then((function(){requestAnimationFrame((function(){return e(r)}))}))},r.onerror=n,r.crossOrigin="anonymous",r.decoding="async",r.src=t}))}function d(t){return e(this,void 0,void 0,(function(){return n(this,(function(e){return[2,Promise.resolve().then((function(){return(new XMLSerializer).serializeToString(t)})).then(encodeURIComponent).then((function(t){return"data:image/svg+xml;charset=utf-8,".concat(t)}))]}))}))}function v(t,r,i){return e(this,void 0,void 0,(function(){var e,o,u;return n(this,(function(n){return e="http://www.w3.org/2000/svg",o=document.createElementNS(e,"svg"),u=document.createElementNS(e,"foreignObject"),o.setAttribute("width","".concat(r)),o.setAttribute("height","".concat(i)),o.setAttribute("viewBox","0 0 ".concat(r," ").concat(i)),u.setAttribute("width","100%"),u.setAttribute("height","100%"),u.setAttribute("x","0"),u.setAttribute("y","0"),u.setAttribute("externalResourcesRequired","true"),o.appendChild(u),u.appendChild(t),[2,d(o)]}))}))}var p=function(t,e){if(t instanceof e)return!0;var n=Object.getPrototypeOf(t);return null!==n&&(n.constructor.name===e.name||p(n,e))};function g(t,e,n,r){var i=".".concat(t,":").concat(e),o=n.cssText?function(t){var e=t.getPropertyValue("content");return"".concat(t.cssText," content: '").concat(e.replace(/'|"/g,""),"';")}(n):function(t,e){return c(e).map((function(e){var n=t.getPropertyValue(e),r=t.getPropertyPriority(e);return"".concat(e,": ").concat(n).concat(r?" !important":"",";")})).join(" ")}(n,r);return document.createTextNode("".concat(i,"{").concat(o,"}"))}function m(t,e,n,r){var o=window.getComputedStyle(t,n),u=o.getPropertyValue("content");if(""!==u&&"none"!==u){var c=i();try{e.className="".concat(e.className," ").concat(c)}catch(t){return}var a=document.createElement("style");a.appendChild(g(c,n,o,r)),e.appendChild(a)}}var w="application/font-woff",y="image/jpeg",b={woff:w,woff2:w,ttf:"application/font-truetype",eot:"application/vnd.ms-fontobject",png:"image/png",jpg:y,jpeg:y,gif:"image/gif",tiff:"image/tiff",svg:"image/svg+xml",webp:"image/webp"};function S(t){var e=function(t){var e=/\.([^./]*?)$/g.exec(t);return e?e[1]:""}(t).toLowerCase();return b[e]||""}function E(t){return-1!==t.search(/^(data:)/)}function x(t,e){return"data:".concat(e,";base64,").concat(t)}function C(t,r,i){return e(this,void 0,void 0,(function(){var e,o;return n(this,(function(n){switch(n.label){case 0:return[4,fetch(t,r)];case 1:if(404===(e=n.sent()).status)throw new Error('Resource "'.concat(e.url,'" not found'));return[4,e.blob()];case 2:return o=n.sent(),[2,new Promise((function(t,n){var r=new FileReader;r.onerror=n,r.onloadend=function(){try{t(i({res:e,result:r.result}))}catch(t){n(t)}},r.readAsDataURL(o)}))]}}))}))}var P={};function R(t,r,i){return e(this,void 0,void 0,(function(){var e,o,u,c,a;return n(this,(function(n){switch(n.label){case 0:if(e=function(t,e,n){var r=t.replace(/\?.*/,"");return n&&(r=t),/ttf|otf|eot|woff2?/i.test(r)&&(r=r.replace(/.*\//,"")),e?"[".concat(e,"]").concat(r):r}(t,r,i.includeQueryParams),null!=P[e])return[2,P[e]];i.cacheBust&&(t+=(/\?/.test(t)?"&":"?")+(new Date).getTime()),n.label=1;case 1:return n.trys.push([1,3,,4]),[4,C(t,i.fetchRequestInit,(function(t){var e=t.res,n=t.result;return r||(r=e.headers.get("Content-Type")||""),function(t){return t.split(/,/)[1]}(n)}))];case 2:return u=n.sent(),o=x(u,r),[3,4];case 3:return c=n.sent(),o=i.imagePlaceholder||"",a="Failed to fetch resource: ".concat(t),c&&(a="string"==typeof c?c:c.message),a&&console.warn(a),[3,4];case 4:return P[e]=o,[2,o]}}))}))}function T(t){return e(this,void 0,void 0,(function(){var e;return n(this,(function(n){return"data:,"===(e=t.toDataURL())?[2,t.cloneNode(!1)]:[2,h(e)]}))}))}function A(t,r){return e(this,void 0,void 0,(function(){var e,i,o,u;return n(this,(function(n){switch(n.label){case 0:return t.currentSrc?(e=document.createElement("canvas"),i=e.getContext("2d"),e.width=t.clientWidth,e.height=t.clientHeight,null==i||i.drawImage(t,0,0,e.width,e.height),[2,h(e.toDataURL())]):(o=t.poster,u=S(o),[4,R(o,u,r)]);case 1:return[2,h(n.sent())]}}))}))}function k(t,r){var i;return e(this,void 0,void 0,(function(){return n(this,(function(e){switch(e.label){case 0:return e.trys.push([0,3,,4]),(null===(i=null==t?void 0:t.contentDocument)||void 0===i?void 0:i.body)?[4,I(t.contentDocument.body,r,!0)]:[3,2];case 1:return[2,e.sent()];case 2:return[3,4];case 3:return e.sent(),[3,4];case 4:return[2,t.cloneNode(!1)]}}))}))}var L=function(t){return null!=t.tagName&&"SVG"===t.tagName.toUpperCase()};function N(t,e,n){return p(e,Element)&&(function(t,e,n){var r=e.style;if(r){var i=window.getComputedStyle(t);i.cssText?(r.cssText=i.cssText,r.transformOrigin=i.transformOrigin):c(n).forEach((function(n){var o=i.getPropertyValue(n);if("font-size"===n&&o.endsWith("px")){var u=Math.floor(parseFloat(o.substring(0,o.length-2)))-.1;o="".concat(u,"px")}p(t,HTMLIFrameElement)&&"display"===n&&"inline"===o&&(o="block"),"d"===n&&e.getAttribute("d")&&(o="path(".concat(e.getAttribute("d"),")")),r.setProperty(n,o,i.getPropertyPriority(n))}))}}(t,e,n),function(t,e,n){m(t,e,":before",n),m(t,e,":after",n)}(t,e,n),function(t,e){p(t,HTMLTextAreaElement)&&(e.innerHTML=t.value),p(t,HTMLInputElement)&&e.setAttribute("value",t.value)}(t,e),function(t,e){if(p(t,HTMLSelectElement)){var n=e,r=Array.from(n.children).find((function(e){return t.value===e.getAttribute("value")}));r&&r.setAttribute("selected","")}}(t,e)),e}function I(t,r,i){return e(this,void 0,void 0,(function(){return n(this,(function(u){return i||!r.filter||r.filter(t)?[2,Promise.resolve(t).then((function(t){return function(t,r){return e(this,void 0,void 0,(function(){return n(this,(function(e){return p(t,HTMLCanvasElement)?[2,T(t)]:p(t,HTMLVideoElement)?[2,A(t,r)]:p(t,HTMLIFrameElement)?[2,k(t,r)]:[2,t.cloneNode(L(t))]}))}))}(t,r)})).then((function(i){return function(t,r,i){var u,c;return e(this,void 0,void 0,(function(){var e;return n(this,(function(n){switch(n.label){case 0:return L(r)?[2,r]:(e=[],0===(e=null!=(a=t).tagName&&"SLOT"===a.tagName.toUpperCase()&&t.assignedNodes?o(t.assignedNodes()):p(t,HTMLIFrameElement)&&(null===(u=t.contentDocument)||void 0===u?void 0:u.body)?o(t.contentDocument.body.childNodes):o((null!==(c=t.shadowRoot)&&void 0!==c?c:t).childNodes)).length||p(t,HTMLVideoElement)?[2,r]:[4,e.reduce((function(t,e){return t.then((function(){return I(e,i)})).then((function(t){t&&r.appendChild(t)}))}),Promise.resolve())]);case 1:return n.sent(),[2,r]}var a}))}))}(t,i,r)})).then((function(e){return N(t,e,r)})).then((function(t){return function(t,r){return e(this,void 0,void 0,(function(){var e,i,o,u,c,a,s,l,f,h,d,v,p;return n(this,(function(n){switch(n.label){case 0:if(0===(e=t.querySelectorAll?t.querySelectorAll("use"):[]).length)return[2,t];i={},p=0,n.label=1;case 1:return p<e.length?(o=e[p],(u=o.getAttribute("xlink:href"))?(c=t.querySelector(u),a=document.querySelector(u),c||!a||i[u]?[3,3]:(s=i,l=u,[4,I(a,r,!0)])):[3,3]):[3,4];case 2:s[l]=n.sent(),n.label=3;case 3:return p++,[3,1];case 4:if((f=Object.values(i)).length){for(h="http://www.w3.org/1999/xhtml",(d=document.createElementNS(h,"svg")).setAttribute("xmlns",h),d.style.position="absolute",d.style.width="0",d.style.height="0",d.style.overflow="hidden",d.style.display="none",v=document.createElementNS(h,"defs"),d.appendChild(v),p=0;p<f.length;p++)v.appendChild(f[p]);t.appendChild(d)}return[2,t]}}))}))}(t,r)}))]:[2,null]}))}))}var D=/url\((['"]?)([^'"]+?)\1\)/g,H=/url\([^)]+\)\s*format\((["']?)([^"']+)\1\)/g,M=/src:\s*(?:url\([^)]+\)\s*format\([^)]+\)[,;]\s*)+/g;function F(t,r,i,o,u){return e(this,void 0,void 0,(function(){var e,c,a,s;return n(this,(function(n){switch(n.label){case 0:return n.trys.push([0,5,,6]),e=i?function(t,e){if(t.match(/^[a-z]+:\/\//i))return t;if(t.match(/^\/\//))return window.location.protocol+t;if(t.match(/^[a-z]+:/i))return t;var n=document.implementation.createHTMLDocument(),r=n.createElement("base"),i=n.createElement("a");return n.head.appendChild(r),n.body.appendChild(i),e&&(r.href=e),i.href=t,i.href}(r,i):r,c=S(r),a=void 0,u?[4,u(e)]:[3,2];case 1:return s=n.sent(),a=x(s,c),[3,4];case 2:return[4,R(e,c,o)];case 3:a=n.sent(),n.label=4;case 4:return[2,t.replace((l=r,f=l.replace(/([.*+?^${}()|\[\]\/\\])/g,"\\$1"),new RegExp("(url\\(['\"]?)(".concat(f,")(['\"]?\\))"),"g")),"$1".concat(a,"$3"))];case 5:return n.sent(),[3,6];case 6:return[2,t]}var l,f}))}))}function V(t){return-1!==t.search(D)}function q(t,r,i){return e(this,void 0,void 0,(function(){var e,o;return n(this,(function(n){return V(t)?(e=function(t,e){var n=e.preferredFontFormat;return n?t.replace(M,(function(t){for(;;){var e=H.exec(t)||[],r=e[0],i=e[2];if(!i)return"";if(i===n)return"src: ".concat(r,";")}})):t}(t,i),o=function(t){var e=[];return t.replace(D,(function(t,n,r){return e.push(r),t})),e.filter((function(t){return!E(t)}))}(e),[2,o.reduce((function(t,e){return t.then((function(t){return F(t,e,r,i)}))}),Promise.resolve(e))]):[2,t]}))}))}function U(t,r,i){var o;return e(this,void 0,void 0,(function(){var e,u;return n(this,(function(n){switch(n.label){case 0:return(e=null===(o=r.style)||void 0===o?void 0:o.getPropertyValue(t))?[4,q(e,null,i)]:[3,2];case 1:return u=n.sent(),r.style.setProperty(t,u,r.style.getPropertyPriority(t)),[2,!0];case 2:return[2,!1]}}))}))}function j(t,r){return e(this,void 0,void 0,(function(){var e,i;return n(this,(function(n){switch(n.label){case 0:return[4,U("background",t,r)];case 1:return n.sent()?[3,3]:[4,U("background-image",t,r)];case 2:n.sent(),n.label=3;case 3:return[4,U("mask",t,r)];case 4:return(i=n.sent())?[3,6]:[4,U("-webkit-mask",t,r)];case 5:i=n.sent(),n.label=6;case 6:return(e=i)?[3,8]:[4,U("mask-image",t,r)];case 7:e=n.sent(),n.label=8;case 8:return e?[3,10]:[4,U("-webkit-mask-image",t,r)];case 9:n.sent(),n.label=10;case 10:return[2]}}))}))}function O(t,r){return e(this,void 0,void 0,(function(){var e,i,o;return n(this,(function(n){switch(n.label){case 0:return(e=p(t,HTMLImageElement))&&!E(t.src)||p(t,SVGImageElement)&&!E(t.href.baseVal)?[4,R(i=e?t.src:t.href.baseVal,S(i),r)]:[2];case 1:return o=n.sent(),[4,new Promise((function(n,i){t.onload=n,t.onerror=r.onImageErrorHandler?function(){for(var t=[],e=0;e<arguments.length;e++)t[e]=arguments[e];try{n(r.onImageErrorHandler.apply(r,t))}catch(t){i(t)}}:i;var u=t;u.decode&&(u.decode=n),"lazy"===u.loading&&(u.loading="eager"),e?(t.srcset="",t.src=o):t.href.baseVal=o}))];case 2:return n.sent(),[2]}}))}))}function B(t,r){return e(this,void 0,void 0,(function(){var e,i;return n(this,(function(n){switch(n.label){case 0:return e=o(t.childNodes),i=e.map((function(t){return z(t,r)})),[4,Promise.all(i).then((function(){return t}))];case 1:return n.sent(),[2]}}))}))}function z(t,r){return e(this,void 0,void 0,(function(){return n(this,(function(e){switch(e.label){case 0:return p(t,Element)?[4,j(t,r)]:[3,4];case 1:return e.sent(),[4,O(t,r)];case 2:return e.sent(),[4,B(t,r)];case 3:e.sent(),e.label=4;case 4:return[2]}}))}))}var W={};function $(t){return e(this,void 0,void 0,(function(){var e,r;return n(this,(function(n){switch(n.label){case 0:return null!=(e=W[t])?[2,e]:[4,fetch(t)];case 1:return[4,n.sent().text()];case 2:return r=n.sent(),e={url:t,cssText:r},W[t]=e,[2,e]}}))}))}function G(t,r){return e(this,void 0,void 0,(function(){var i,o,u,c,a=this;return n(this,(function(s){return i=t.cssText,o=/url\(["']?([^"')]+)["']?\)/g,u=i.match(/url\([^)]+\)/g)||[],c=u.map((function(u){return e(a,void 0,void 0,(function(){var e;return n(this,(function(n){return(e=u.replace(o,"$1")).startsWith("https://")||(e=new URL(e,t.url).href),[2,C(e,r.fetchRequestInit,(function(t){var e=t.result;return i=i.replace(u,"url(".concat(e,")")),[u,e]}))]}))}))})),[2,Promise.all(c).then((function(){return i}))]}))}))}function _(t){if(null==t)return[];for(var e=[],n=t.replace(/(\/\*[\s\S]*?\*\/)/gi,""),r=new RegExp("((@.*?keyframes [\\s\\S]*?){([\\s\\S]*?}\\s*?)})","gi");;){if(null===(u=r.exec(n)))break;e.push(u[0])}n=n.replace(r,"");for(var i=/@import[\s\S]*?url\([^)]*\)[\s\S]*?;/gi,o=new RegExp("((\\s*?(?:\\/\\*[\\s\\S]*?\\*\\/)?\\s*?@media[\\s\\S]*?){([\\s\\S]*?)}\\s*?})|(([\\s\\S]*?){([\\s\\S]*?)})","gi");;){var u;if(null===(u=i.exec(n))){if(null===(u=o.exec(n)))break;i.lastIndex=o.lastIndex}else o.lastIndex=i.lastIndex;e.push(u[0])}return e}function J(t,r){return e(this,void 0,void 0,(function(){var e,i;return n(this,(function(n){return e=[],i=[],t.forEach((function(e){if("cssRules"in e)try{o(e.cssRules||[]).forEach((function(t,n){if(t.type===CSSRule.IMPORT_RULE){var o=n+1,u=$(t.href).then((function(t){return G(t,r)})).then((function(t){return _(t).forEach((function(t){try{e.insertRule(t,t.startsWith("@import")?o+=1:e.cssRules.length)}catch(e){console.error("Error inserting rule from remote css",{rule:t,error:e})}}))})).catch((function(t){console.error("Error loading remote css",t.toString())}));i.push(u)}}))}catch(o){var n=t.find((function(t){return null==t.href}))||document.styleSheets[0];null!=e.href&&i.push($(e.href).then((function(t){return G(t,r)})).then((function(t){return _(t).forEach((function(t){n.insertRule(t,n.cssRules.length)}))})).catch((function(t){console.error("Error loading remote stylesheet",t)}))),console.error("Error inlining remote css file",o)}})),[2,Promise.all(i).then((function(){return t.forEach((function(t){if("cssRules"in t)try{o(t.cssRules||[]).forEach((function(t){e.push(t)}))}catch(e){console.error("Error while reading CSS rules from ".concat(t.href),e)}})),e}))]}))}))}function Q(t){return t.filter((function(t){return t.type===CSSRule.FONT_FACE_RULE})).filter((function(t){return V(t.style.getPropertyValue("src"))}))}function X(t,r){return e(this,void 0,void 0,(function(){return n(this,(function(e){switch(e.label){case 0:if(null==t.ownerDocument)throw new Error("Provided element is not within a Document");return[4,J(o(t.ownerDocument.styleSheets),r)];case 1:return[2,Q(e.sent())]}}))}))}function K(t){return t.trim().replace(/["']/g,"")}function Y(t,r){return e(this,void 0,void 0,(function(){var e,i;return n(this,(function(n){switch(n.label){case 0:return[4,X(t,r)];case 1:return e=n.sent(),i=function(t){var e=new Set;return function t(n){(n.style.fontFamily||getComputedStyle(n).fontFamily).split(",").forEach((function(t){e.add(K(t))})),Array.from(n.children).forEach((function(e){e instanceof HTMLElement&&t(e)}))}(t),e}(t),[4,Promise.all(e.filter((function(t){return i.has(K(t.style.fontFamily))})).map((function(t){var e=t.parentStyleSheet?t.parentStyleSheet.href:null;return q(t.cssText,e,r)})))];case 2:return[2,n.sent().join("\n")]}}))}))}function Z(t,r){return e(this,void 0,void 0,(function(){var e,i,o,u,c;return n(this,(function(n){switch(n.label){case 0:return null==r.fontEmbedCSS?[3,1]:(i=r.fontEmbedCSS,[3,5]);case 1:return r.skipFonts?(o=null,[3,4]):[3,2];case 2:return[4,Y(t,r)];case 3:o=n.sent(),n.label=4;case 4:i=o,n.label=5;case 5:return(e=i)&&(u=document.createElement("style"),c=document.createTextNode(e),u.appendChild(c),t.firstChild?t.insertBefore(u,t.firstChild):t.appendChild(u)),[2]}}))}))}function tt(t,r){return void 0===r&&(r={}),e(this,void 0,void 0,(function(){var e,i,o,u;return n(this,(function(n){switch(n.label){case 0:return e=s(t,r),i=e.width,o=e.height,[4,I(t,r,!0)];case 1:return[4,Z(u=n.sent(),r)];case 2:return n.sent(),[4,z(u,r)];case 3:return n.sent(),function(t,e){var n=t.style;e.backgroundColor&&(n.backgroundColor=e.backgroundColor),e.width&&(n.width="".concat(e.width,"px")),e.height&&(n.height="".concat(e.height,"px"));var r=e.style;null!=r&&Object.keys(r).forEach((function(t){n[t]=r[t]}))}(u,r),[4,v(u,i,o)];case 4:return[2,n.sent()]}}))}))}function et(t,r){return void 0===r&&(r={}),e(this,void 0,void 0,(function(){var e,i,o,u,c,a,f,d,v;return n(this,(function(n){switch(n.label){case 0:return e=s(t,r),i=e.width,o=e.height,[4,tt(t,r)];case 1:return[4,h(n.sent())];case 2:return u=n.sent(),c=document.createElement("canvas"),a=c.getContext("2d"),f=r.pixelRatio||function(){var t,e;try{e=process}catch(t){}var n=e&&e.env?e.env.devicePixelRatio:null;return n&&(t=parseInt(n,10),Number.isNaN(t)&&(t=1)),t||window.devicePixelRatio||1}(),d=r.canvasWidth||i,v=r.canvasHeight||o,c.width=d*f,c.height=v*f,r.skipAutoScale||function(t){(t.width>l||t.height>l)&&(t.width>l&&t.height>l?t.width>t.height?(t.height*=l/t.width,t.width=l):(t.width*=l/t.height,t.height=l):t.width>l?(t.height*=l/t.width,t.width=l):(t.width*=l/t.height,t.height=l))}(c),c.style.width="".concat(d),c.style.height="".concat(v),r.backgroundColor&&(a.fillStyle=r.backgroundColor,a.fillRect(0,0,c.width,c.height)),a.drawImage(u,0,0,c.width,c.height),[2,c]}}))}))}t.getFontEmbedCSS=function(t,r){return void 0===r&&(r={}),e(this,void 0,void 0,(function(){return n(this,(function(e){return[2,Y(t,r)]}))}))},t.toBlob=function(t,r){return void 0===r&&(r={}),e(this,void 0,void 0,(function(){return n(this,(function(e){switch(e.label){case 0:return[4,et(t,r)];case 1:return[4,f(e.sent())];case 2:return[2,e.sent()]}}))}))},t.toCanvas=et,t.toJpeg=function(t,r){return void 0===r&&(r={}),e(this,void 0,void 0,(function(){return n(this,(function(e){switch(e.label){case 0:return[4,et(t,r)];case 1:return[2,e.sent().toDataURL("image/jpeg",r.quality||1)]}}))}))},t.toPixelData=function(t,r){return void 0===r&&(r={}),e(this,void 0,void 0,(function(){var e,i,o,u;return n(this,(function(n){switch(n.label){case 0:return e=s(t,r),i=e.width,o=e.height,[4,et(t,r)];case 1:return u=n.sent(),[2,u.getContext("2d").getImageData(0,0,i,o).data]}}))}))},t.toPng=function(t,r){return void 0===r&&(r={}),e(this,void 0,void 0,(function(){return n(this,(function(e){switch(e.label){case 0:return[4,et(t,r)];case 1:return[2,e.sent().toDataURL()]}}))}))},t.toSvg=tt}));


      return module.exports;
    })();
    const ATLASES = [{"aspect":0.6666666666666666},{"aspect":1},{"aspect":1},{"aspect":0.6666666666666666},{"aspect":0.6666666666666666},{"aspect":0.6666666666666666},{"aspect":0.6666666666666666},{"aspect":0.6666666666666666},{"aspect":0.6666666666666666},{"aspect":0.6666666666666666}];
    const CSS = `.yy-app{height:100%;width:100%;min-height:0;min-width:0;position:relative;display:flex;flex-direction:column;overflow:hidden;container:diary/size;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-1);font:13px/1.4 system-ui,'Microsoft YaHei',sans-serif}
.yy-app *{box-sizing:border-box}.yy-app button,.yy-app input{font:inherit}.yy-app button{cursor:pointer}.yy-app button:disabled{cursor:default;opacity:.38}.yy-app button:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}
.yy-toolbar{flex:none;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 18px;border-bottom:1px solid var(--dsw-alias-border-l2)}
.yy-brand{display:flex;align-items:center;gap:9px;min-width:0}.yy-brand-icon{display:flex;color:var(--dsw-alias-label-secondary)}.yy-brand h1{font-size:17px;line-height:24px;font-weight:600;margin:0}.yy-brand p{font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary);margin:0}
.yy-actions{display:flex;align-items:center;gap:6px;flex:none}.yy-button,.yy-icon-button{display:inline-flex;align-items:center;justify-content:center;gap:5px;border:1px solid var(--dsw-alias-border-l2);border-radius:7px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);min-height:32px;padding:5px 9px;white-space:nowrap;font-size:12px!important;line-height:20px}
.yy-icon-button{width:30px;padding:4px;border:0;background:transparent}.yy-button:hover:not(:disabled),.yy-icon-button:hover:not(:disabled),.yy-selected{background:var(--dsw-alias-interactive-bg-hover)}
.yy-workspace{position:relative;display:flex;flex:1;min-height:0;min-width:0;overflow:hidden}.yy-desk{flex:1;min-height:0;min-width:0;display:flex;flex-direction:column;padding:10px 20px 6px;background:var(--dsw-alias-bg-layer-2)}
.yy-book-wrap{flex:1;min-height:0;width:100%;max-width:1180px;align-self:center;container:paper/size;perspective:1800px}
.yy-book-stage{position:relative;width:100%;height:100%;transform:translateX(0);transform-style:preserve-3d;transition:transform .8s cubic-bezier(.4,.05,.2,1)}
.yy-is-closed .yy-book-stage{transform:translateX(-25%)}
.yy-book-stage>.yy-book{opacity:1;transition:opacity .2s .06s}
.yy-is-closed .yy-book-stage>.yy-book{opacity:0;pointer-events:none;transition:opacity .24s .16s}
.yy-cover{position:absolute;z-index:20;top:0;left:50%;width:50%;height:100%;padding:0;border:0;background:transparent;color:#e8dfbc;transform-origin:left center;transform-style:preserve-3d;transform:rotateY(-180deg);opacity:0;transition:transform .78s cubic-bezier(.4,.05,.2,1),opacity .12s .66s;pointer-events:none;border-radius:4px 12px 12px 4px}
.yy-is-closed .yy-cover{transform:rotateY(0deg);opacity:1;pointer-events:auto;transition:transform .78s cubic-bezier(.4,.05,.2,1),opacity 0s}
.yy-app .yy-cover:disabled{opacity:0}.yy-app .yy-is-closed .yy-cover:disabled{opacity:1}
.yy-cover-face{position:absolute;inset:0;display:flex;backface-visibility:hidden;border-radius:4px 12px 12px 4px;overflow:hidden}
.yy-cover-front{align-items:center;justify-content:center;background:repeating-linear-gradient(0deg,#ffffff05 0 1px,transparent 1px 3px),repeating-linear-gradient(90deg,#00000005 0 1px,transparent 1px 3px),linear-gradient(100deg,#4b626e,#6e8590 7%,#617b89 45%,#506977);border:1px solid #475f6b;box-shadow:inset 6px 0 6px #243e5640,inset -2px 0 3px #ffffff16,4px 3px 0 -1px #d5d0bf,7px 5px 0 -2px #bcb8a9,7px 10px 17px -9px #26354760;text-shadow:0 1px 1px #354b5b80}
.yy-cover-front:before{content:'';position:absolute;left:12px;top:0;bottom:0;width:3px;background:linear-gradient(90deg,#263e4930,#e9e4cf20,transparent)}
.yy-cover-border{position:absolute;inset:20px 19px 20px 29px;border:1px solid #e8dfbc66;border-radius:2px 8px 8px 2px;box-shadow:0 0 0 4px #dcd5b612;pointer-events:none}
.yy-cover-content{display:flex;flex-direction:column;align-items:center;gap:18px;width:100%;padding:35px 42px 48px 48px;position:relative}
.yy-cover-eyebrow{font:10px/1.5 Georgia,serif;letter-spacing:4px;opacity:.7}
.yy-cover-title{font:clamp(25px,4.4cqw,50px)/1.3 'KaiTi','STKaiti','FangSong',serif;letter-spacing:.16em;padding-left:.16em}
.yy-cover-whale{width:min(90%,300px);height:auto;max-height:38cqh;flex-shrink:1;opacity:.88}
.yy-cover-hint{position:absolute;bottom:34px;display:flex;align-items:center;justify-content:center;gap:5px;font:11px/20px system-ui,'Microsoft YaHei',sans-serif;letter-spacing:2px;opacity:.6}
.yy-cover-back{background:#617b89;border:6px solid #718591;transform:rotateY(180deg);box-shadow:inset -12px 0 18px -12px #263e4970}
.yy-cover-toggle{min-width:130px;background:transparent;border-color:transparent}.yy-cover-toggle small{font-size:10px;color:var(--dsw-alias-label-tertiary);font-weight:400;margin-left:2px}
.yy-turn-layer{position:absolute;inset:0;z-index:12;pointer-events:none}
.yy-turn-scene{position:absolute;perspective:1800px;transform-style:preserve-3d}
.yy-turn-still,.yy-turn-leaf{position:absolute;top:0;bottom:0;width:50%}
.yy-turn-still{left:0;overflow:hidden}.yy-turn-backward .yy-turn-still{left:50%}
.yy-turn-leaf{left:50%;transform-origin:left center;transform-style:preserve-3d;z-index:2;will-change:transform}
.yy-turn-backward .yy-turn-leaf{left:0;transform-origin:right center}
.yy-turn-face{position:absolute;inset:0;overflow:hidden;backface-visibility:hidden;background:#fffaf0;box-shadow:0 2px 16px #403d3426}
.yy-turn-front{transform:rotateY(0deg)}.yy-turn-back{transform:rotateY(180deg)}
.yy-book-copy{position:absolute!important;top:0;width:var(--yy-snapshot-width)!important;height:var(--yy-snapshot-height)!important;min-width:0!important;margin:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;opacity:1!important;transition:none!important;pointer-events:none!important}
.yy-turn-shade{position:absolute;inset:0;z-index:5;background:linear-gradient(90deg,#4c463642,transparent 55%,#4c463612);pointer-events:none;opacity:.12}
.yy-turn-backward .yy-turn-shade{background:linear-gradient(270deg,#4c463642,transparent 55%,#4c463612)}
.yy-turn-single .yy-turn-leaf{left:0;width:100%}
.yy-book{--yy-line:32px;--yy-type-size:18px;--yy-date-size:23px;position:relative;isolation:isolate;height:100%;min-height:0;display:flex;flex-direction:column;padding:26px 30px 8px;border:6px solid #718591;border-left-width:8px;border-radius:8px 12px 10px 8px;background:#fffaf0;color:#4b514e;box-shadow:0 3px 0 -1px #b9b3a1,0 6px 14px -8px #26354755}
.yy-paper{position:absolute;inset:0 auto 0 0;width:50%;pointer-events:none;background:repeating-linear-gradient(#b6b9a824 0 1px,transparent 1px var(--yy-line)),#fffaf0;background-position:0 var(--yy-rule-offset,49px)}
.yy-paper-left{box-shadow:inset -14px 0 22px -18px #8b7d60}.yy-paper-right{left:50%;box-shadow:inset 14px 0 22px -18px #8b7d60}.yy-spine{position:absolute;left:50%;top:0;bottom:0;width:18px;transform:translateX(-9px);background:linear-gradient(90deg,transparent,#95887520 32%,#7f735236 48%,#fff8e650 57%,transparent);pointer-events:none;z-index:1}
.yy-bookmark{position:absolute;z-index:4;right:22px;top:-6px;width:28px;height:46px;border:0;border-left:1px solid #ffffff38;border-right:1px solid #00000012;padding:0;background:linear-gradient(90deg,#ffffff20,transparent 50%,#00000010),var(--yy-bookmark-color);clip-path:polygon(0 0,100% 0,100% 100%,50% 81%,0 100%);transition:background-color .15s,height .15s}.yy-bookmark:hover:not(:disabled){height:50px}.yy-app .yy-bookmark:disabled{opacity:.6}
.yy-flow-window{flex:1;min-height:0;position:relative;z-index:2;overflow:hidden}.yy-flow,.yy-type-probe{font:var(--yy-type-size)/var(--yy-line) 'KaiTi','STKaiti','FangSong',serif;letter-spacing:.3px}.yy-flow{width:100%;height:100%;column-count:2;column-gap:56px;column-fill:auto;direction:ltr;writing-mode:horizontal-tb;overflow:visible;overflow-wrap:anywhere}
.yy-page-viewport{position:absolute;top:0;left:0;bottom:0;width:calc((100% - var(--yy-page-gap,56px))/2);overflow:hidden}.yy-page-right{top:var(--yy-line);left:calc((100% + var(--yy-page-gap,56px))/2)}
.yy-type-probe{position:absolute;left:0;top:0;visibility:hidden;pointer-events:none;white-space:nowrap}.yy-type-probe i{display:inline-block;width:0;height:0;vertical-align:baseline}
.yy-entry-head{break-inside:avoid;margin:0 0 var(--yy-line);padding-top:var(--yy-line);background:transparent}.yy-date-heading{line-height:var(--yy-line)}.yy-date-heading h2{display:inline;font:inherit;font-size:calc(var(--yy-date-size) - 1px);font-weight:500;line-height:0;margin:0;color:#59655e}.yy-date-heading>span{font-size:var(--yy-type-size);line-height:0;margin-left:14px;color:#7c8678}
.yy-flow p{margin:0 0 var(--yy-line)}.yy-diary-paragraph{text-indent:2em;white-space:pre-wrap;orphans:2;widows:2}.yy-unwritten{display:flow-root}.yy-unwritten h3{font:inherit;margin:0}
.yy-flow .yy-today-message{margin:0;text-indent:2em;color:#68766c;break-inside:avoid;orphans:2;widows:2}
.yy-preface-spacer{height:100%;break-after:column;break-inside:avoid}
.yy-preface-opening .yy-paper-left{background:#617b89;box-shadow:inset -14px 0 22px -18px #263e49}
.yy-preface-opening .yy-paper-left:after{content:'';position:absolute;inset:26px 22px;border:1px solid #e8dfbc30;border-radius:3px;pointer-events:none}
.yy-paper-button{border:1px solid #abbcb1;border-radius:6px;color:#687e77;background:#f2f3e8;padding:3px 12px;min-height:30px;font:13px/24px system-ui,sans-serif!important}.yy-pending-error{color:#a87969}
.yy-unwritten>.yy-paper-button{display:block;height:var(--yy-line);min-height:0;line-height:normal!important}
.yy-diary-ending{break-inside:avoid;break-before:var(--yy-ending-break,auto);display:flow-root;margin:0;padding-top:var(--yy-ending-pad,0px)}.yy-ending-doodle{height:var(--yy-doodle-height);width:100%;margin:0;display:grid;place-items:center;break-inside:avoid}.yy-sticker{width:min(100%,300px,calc((var(--yy-doodle-height) - 16px)*var(--yy-art-aspect)));background-size:300% 200%;background-repeat:no-repeat;filter:contrast(.94) saturate(.85)}.yy-doodle-loading{font:12px/20px system-ui,sans-serif;color:#9b9d91}
.yy-book-footline{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:28px;flex:none;padding-top:4px;color:#949b8c;font:10px/16px system-ui,sans-serif}.yy-book-note{min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.yy-spread-nav{display:flex;align-items:center;gap:6px;flex:none;margin-left:auto}.yy-spread-nav>span{min-width:44px;text-align:center;font:12px/20px Georgia,serif}.yy-paper-turn{display:inline-flex;justify-content:center;align-items:center;width:28px;height:24px;border:0;border-radius:5px;background:transparent;color:#707e75}.yy-paper-turn:hover:not(:disabled){background:#dae2d558}
.yy-pagination{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;max-width:1180px;align-self:center;flex:none;margin-top:8px;font-size:11px;color:var(--dsw-alias-label-tertiary)}.yy-pagination>span{text-align:center;min-width:0}.yy-page-turn{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-width:108px;min-height:44px;padding:9px 16px;font-size:13px!important;line-height:22px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);white-space:nowrap;touch-action:manipulation}.yy-page-turn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.yy-statusbar{flex:none;display:flex;justify-content:space-between;gap:12px;padding:3px 18px;border-top:1px solid var(--dsw-alias-border-l2);font-size:10px;line-height:16px;color:var(--dsw-alias-label-tertiary)}
.yy-archive{flex:none;width:246px;padding:12px 10px;border-right:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);min-height:0;overflow:hidden}.yy-archive-head{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:13px;line-height:22px}.yy-calendar{margin-top:6px}.yy-calendar-month{display:flex;align-items:center;justify-content:space-between;gap:8px;height:32px}.yy-calendar-month strong{font-size:13px;font-weight:500}.yy-calendar-week,.yy-calendar-days{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:2px}.yy-calendar-week{font-size:10px;color:var(--dsw-alias-label-tertiary);text-align:center;line-height:22px;margin-bottom:2px}.yy-calendar-day{min-width:0;height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:2px 0;border:1px solid transparent;border-radius:6px;background:transparent;color:var(--dsw-alias-label-primary);font:12px/17px system-ui,sans-serif!important}.yy-calendar-day:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}.yy-calendar-day.yy-current{border-color:var(--dsw-alias-border-l2);background:var(--dsw-alias-interactive-bg-hover);font-weight:600!important}.yy-app .yy-calendar-day:disabled{opacity:.28}.yy-app .yy-calendar-day.yy-other-month{opacity:.12}.yy-bookmark-dot{display:block;flex:none;width:5px;height:5px;border-radius:50%}
.yy-records-panel{position:absolute;right:18px;top:62px;bottom:68px;z-index:12;width:min(380px,calc(100% - 36px));display:flex;flex-direction:column;padding:12px;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-alias-bg-layer-1);box-shadow:0 8px 28px #0000001a}.yy-records-panel ul{list-style:none;overflow:auto;min-height:0;padding:0;margin:8px 0}.yy-records-panel li{padding:9px 0;border-bottom:1px solid var(--dsw-alias-border-l2);line-height:1.5}.yy-records-panel small{display:block;text-align:right;color:var(--dsw-alias-label-tertiary);font-size:10px}
.yy-alert{display:flex;align-items:center;gap:10px;flex:none;max-height:60px;padding:5px 16px;color:var(--dsw-alias-label-secondary);font-size:12px}.yy-alert>span{min-width:0;max-height:48px;overflow:auto;flex:1}.yy-generation-alert{color:#a87969;background:#a8796912;border-bottom:1px solid #a8796928}.yy-loading{display:flex;align-items:center;justify-content:center;gap:10px;flex:1;color:var(--dsw-alias-label-secondary)}
@container diary (max-width:1000px){.yy-archive{position:absolute;left:10px;top:8px;z-index:10;width:246px;max-height:calc(100% - 16px);border:1px solid var(--dsw-alias-border-l2);border-radius:9px;box-shadow:0 8px 24px #0000001a}.yy-desk{padding:8px 12px 5px}}
@container diary (max-width:640px){.yy-brand p{display:none}.yy-brand h1{font-size:15px}.yy-toolbar{padding:6px 10px;gap:8px}.yy-brand-icon{display:none}.yy-actions{gap:4px}.yy-button{padding:4px 7px;font-size:11px!important}.yy-records-toggle{max-width:76px;overflow:hidden}.yy-pagination{gap:6px}.yy-page-turn{min-width:96px;padding:9px 12px}.yy-statusbar{padding:3px 10px}}
@container diary (max-height:620px){.yy-brand p{display:none}.yy-toolbar{padding-top:5px;padding-bottom:5px}.yy-desk{padding-top:6px;padding-bottom:4px}.yy-pagination{margin-top:6px}.yy-statusbar{padding-top:2px;padding-bottom:2px}.yy-calendar-day{height:30px}.yy-records-panel{top:48px}}
@container diary (max-height:380px){.yy-statusbar{display:none}.yy-toolbar{padding-top:3px;padding-bottom:3px}.yy-brand h1{font-size:14px}.yy-archive{padding:6px}.yy-archive-head{line-height:18px}.yy-calendar{margin-top:0}.yy-calendar-day{height:24px}.yy-calendar-month{height:27px}.yy-calendar-week{line-height:18px}.yy-pagination{margin-top:4px}}
@container paper (max-width:680px){.yy-flow{column-count:1;column-gap:30px}.yy-page-left{width:100%;top:var(--yy-line)}.yy-page-right{display:none}.yy-paper-left{width:100%;box-shadow:none}.yy-paper-right,.yy-spine{display:none}.yy-book{padding-left:24px;padding-right:24px}.yy-bookmark{right:16px}}
@container paper (max-width:680px){.yy-preface-spacer{display:none}}
@container paper (max-height:480px){.yy-book{--yy-line:29px;--yy-type-size:17px;--yy-date-size:21px;padding-top:20px;padding-bottom:6px}}
@container paper (max-height:330px){.yy-book{--yy-line:26px;--yy-type-size:16px;--yy-date-size:19px;padding-top:13px;padding-bottom:3px}.yy-bookmark{height:34px;width:25px}.yy-bookmark:hover:not(:disabled){height:38px}.yy-book-footline{padding-top:2px;min-height:24px}.yy-book-note{font-size:9px}}
@container paper (max-height:330px){.yy-entry-head{padding-top:0}}
@container diary (max-width:640px){.yy-cover-toggle{min-width:88px;padding:9px 8px}.yy-cover-toggle small{display:none}.yy-pagination{gap:4px}}
@container diary (max-width:400px){.yy-page-turn{min-width:0;padding:8px;gap:4px}.yy-cover-toggle>svg{display:none}}
@container paper (max-width:680px){.yy-is-closed .yy-book-stage{transform:translateX(0)}.yy-cover{left:0;width:100%}.yy-cover-title{font-size:clamp(26px,7cqw,44px)}.yy-cover-whale{width:min(80%,300px)}}
@container paper (max-height:480px){.yy-cover-content{gap:12px;padding-top:20px;padding-bottom:38px}.yy-cover-title{font-size:32px}.yy-cover-hint{bottom:26px}.yy-cover-whale{max-height:34cqh}.yy-cover-border{inset:16px 16px 16px 26px}}
@container paper (max-height:330px){.yy-cover-content{gap:7px;padding:16px 30px 30px 36px}.yy-cover-title{font-size:26px}.yy-cover-eyebrow{font-size:8px;letter-spacing:3px}.yy-cover-hint{bottom:17px;font-size:10px}.yy-cover-whale{max-height:29cqh}.yy-cover-border{inset:12px 12px 12px 22px}}
@media(prefers-reduced-motion:reduce){.yy-app .yy-bookmark,.yy-app .yy-book-stage,.yy-app .yy-book-stage>.yy-book,.yy-app .yy-cover{transition:none}.yy-turn-layer{display:none}}
`;
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
