/* store.js — all state lives in localStorage on the device. Nothing is sent
   anywhere. No account, no server, no tracking. */

window.AndiStore = (function (D) {
  'use strict';

  var KEY = 'andi-day-v1';
  var state = null;
  var listeners = [];

  function defaults() {
    return {
      version: 1,
      profile: {
        name: 'Andi',
        firstDay: '2026-09-03',
        person: 'Mum',
        formTutor: 'JDU',
        formRoom: 'G15'
      },
      settings: {
        wakeTime: '06:45',
        leaveTime: '',          // blank = worked out from the morning routine
        bedTime: '21:00',
        weekOneStart: '2026-09-03',   // the school's Week 1 anchor; see weekNumberFor
        theme: 'auto',          // auto | light | dark
        fontScale: 1,
        dyslexicFont: false,
        motion: true,
        speech: true,           // read meditations aloud
        showTimes: true
      },
      routines: {
        morning: clone(D.morning),
        afterSchool: clone(D.afterSchool),
        bedtime: clone(D.bedtime)
      },
      bagBase: clone(D.bagBase),
      timetable: clone(D.timetable),
      progress: {},             // { 'YYYY-MM-DD': { morning: {id:true}, bag:{}, ... } }
      worries: [],
      moodLog: [],
      streak: { count: 0, lastDay: '' }
    };
  }

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  /* ---- dates ---- */

  function dayKey(d) {
    d = d || new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  function weekdayKey(d) {
    return D.DAY_KEYS[((d || new Date()).getDay() + 6) % 7];   // JS Sunday=0 -> our Monday=0
  }

  function addDays(d, n) {
    var out = new Date(d.getTime());
    out.setDate(out.getDate() + n);
    return out;
  }

  /* ---- load / save ---- */

  function load() {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { raw = null; }
    if (!raw) { state = defaults(); return state; }
    try {
      var saved = JSON.parse(raw);
      state = merge(defaults(), saved);
    } catch (e) {
      state = defaults();
    }
    migrateTimetable();
    prune();
    return state;
  }

  /* Earlier versions stored a single repeating week as { mon: {...}, ... }.
     The school runs a fortnight, so that shape moved under "every".

     Note the ordering trap this walked into once: merge() has already layered
     the saved data over the defaults by the time this runs, so the new every/
     w1/w2 keys always exist. Testing for them and returning early left the old
     top-level days stranded and silently ignored — losing a parent's real
     setup. So detect the stray day keys themselves, and let what she set beat
     anything shipped as a default. */
  function migrateTimetable() {
    var t = state.timetable;
    if (!t) { state.timetable = clone(defaults().timetable); return; }
    var base = defaults().timetable;
    if (!t.every) t.every = clone(base.every);
    if (!t.w1) t.w1 = clone(base.w1);
    if (!t.w2) t.w2 = clone(base.w2);
    D.DAY_KEYS.forEach(function (k) {
      if (t[k]) { t.every[k] = t[k]; delete t[k]; }
    });
  }

  /* Shallow-ish merge so a new field added in a later version still appears
     for someone who already has saved data. Arrays are taken from the save
     wholesale — those are the user's own edited lists. */
  function merge(base, saved) {
    Object.keys(saved).forEach(function (k) {
      var v = saved[k];
      if (Array.isArray(v) || v === null || typeof v !== 'object') {
        base[k] = v;
      } else {
        base[k] = merge(base[k] && typeof base[k] === 'object' ? base[k] : {}, v);
      }
    });
    return base;
  }

  /* Keep only the last 60 days of ticks so storage cannot creep upwards. */
  function prune() {
    var cutoff = dayKey(addDays(new Date(), -60));
    Object.keys(state.progress).forEach(function (k) {
      if (k < cutoff) delete state.progress[k];
    });
    if (state.moodLog.length > 200) state.moodLog = state.moodLog.slice(-200);
  }

  var saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try { localStorage.setItem(KEY, JSON.stringify(state)); }
      catch (e) { /* private mode or full — the app still works for this session */ }
    }, 120);
    listeners.forEach(function (fn) { fn(state); });
  }

  function onChange(fn) { listeners.push(fn); }

  /* ---- progress ---- */

  function dayProgress(key) {
    key = key || dayKey();
    if (!state.progress[key]) state.progress[key] = {};
    return state.progress[key];
  }

  function isTicked(listName, itemId, key) {
    var p = dayProgress(key)[listName];
    return !!(p && p[itemId]);
  }

  function toggle(listName, itemId, key) {
    var p = dayProgress(key);
    if (!p[listName]) p[listName] = {};
    if (p[listName][itemId]) delete p[listName][itemId];
    else p[listName][itemId] = true;
    save();
    return !!p[listName][itemId];
  }

  function setTicked(listName, itemId, on, key) {
    var p = dayProgress(key);
    if (!p[listName]) p[listName] = {};
    if (on) p[listName][itemId] = true; else delete p[listName][itemId];
    save();
  }

  function clearList(listName, key) {
    var p = dayProgress(key);
    p[listName] = {};
    save();
  }

  function countDone(listName, items, key) {
    var p = dayProgress(key)[listName] || {};
    var n = 0;
    items.forEach(function (it) { if (p[it.id]) n++; });
    return n;
  }

  /* ---- streak: a day counts once the morning list is finished ---- */

  function bumpStreak() {
    var today = dayKey();
    var s = state.streak;
    if (s.lastDay === today) return s.count;
    var yesterday = dayKey(addDays(new Date(), -1));
    s.count = (s.lastDay === yesterday) ? s.count + 1 : 1;
    s.lastDay = today;
    save();
    return s.count;
  }

  /* ---- worries ---- */

  function addWorry(text, size, share) {
    state.worries.unshift({
      id: 'w' + Date.now(),
      text: text,
      size: size || null,
      share: !!share,
      at: new Date().toISOString(),
      parked: true
    });
    if (state.worries.length > 100) state.worries.length = 100;
    save();
  }

  function removeWorry(id) {
    state.worries = state.worries.filter(function (w) { return w.id !== id; });
    save();
  }

  function logMood(moodId) {
    state.moodLog.push({ mood: moodId, at: new Date().toISOString() });
    prune();
    save();
  }

  /* ---- time helpers ---- */

  function parseTime(hhmm) {
    var bits = String(hhmm || '').split(':');
    var h = parseInt(bits[0], 10), m = parseInt(bits[1], 10);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  }

  function fmtTime(minsOfDay) {
    minsOfDay = ((minsOfDay % 1440) + 1440) % 1440;
    var h = Math.floor(minsOfDay / 60), m = minsOfDay % 60;
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  }

  /* Time of a morning step = wake time + its offset. */
  function stepTime(step) {
    var wake = parseTime(state.settings.wakeTime);
    if (wake === null || typeof step.mins !== 'number') return null;
    return fmtTime(wake + step.mins);
  }

  function leaveTime() {
    if (state.settings.leaveTime) return state.settings.leaveTime;
    var wake = parseTime(state.settings.wakeTime);
    if (wake === null) return null;
    var last = 0;
    state.routines.morning.forEach(function (s) {
      if (typeof s.mins === 'number' && s.mins > last) last = s.mins;
    });
    return fmtTime(wake + last);
  }

  /* Which school week a date falls in.

     School weeks are Monday-to-Friday blocks, so the week number is worked out
     from the Monday of each week rather than the raw date. Term starting on a
     Thursday means that Thursday and Friday are Week 1, and the Monday after
     is Week 2. Some schools count it the other way; the Set up screen has a
     one-tap swap for exactly that, because a fortnight that is out by one week
     is invisible until the morning she turns up without her PE kit. */
  function mondayOf(d) {
    var out = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    out.setDate(out.getDate() - ((out.getDay() + 6) % 7));
    return out;
  }

  function weekNumberFor(date) {
    var anchor = state.settings.weekOneStart;
    if (!anchor) return 1;
    var bits = String(anchor).split('-');
    var start = new Date(+bits[0], +bits[1] - 1, +bits[2]);
    if (isNaN(start.getTime())) return 1;
    var weeks = Math.round((mondayOf(date || new Date()) - mondayOf(start)) / 604800000);
    return (((weeks % 2) + 2) % 2) === 0 ? 1 : 2;
  }

  /* Swap which fortnight we are in, by moving the anchor a week. */
  function swapWeeks() {
    var bits = String(state.settings.weekOneStart || '').split('-');
    var start = new Date(+bits[0], +bits[1] - 1, +bits[2]);
    if (isNaN(start.getTime())) return;
    start.setDate(start.getDate() + 7);
    state.settings.weekOneStart = dayKey(start);
    save();
  }

  /* Everything a given date needs: the every-week layer plus this fortnight's. */
  function dayPlan(date) {
    date = date || new Date();
    var key = weekdayKey(date);
    var t = state.timetable || {};
    var every = (t.every && t.every[key]) || { school: false, note: '', extras: [] };
    // Term has not started yet: a weekday before the first day is not a school
    // day, whatever the weekly pattern says.
    var beforeTerm = !!(state.profile.firstDay && dayKey(date) < state.profile.firstDay);
    var wk = weekNumberFor(date);
    var wkDay = (t['w' + wk] && t['w' + wk][key]) || { note: '', extras: [] };
    var notes = [every.note, wkDay.note].filter(Boolean);
    return {
      week: wk,
      weekday: key,
      school: !!every.school && !beforeTerm,
      note: notes.join(' · '),
      everyExtras: every.extras || [],
      weekExtras: wkDay.extras || [],
      lessons: wkDay.lessons || [],
      extras: (every.extras || []).concat(wkDay.extras || [])
    };
  }

  function reset() {
    try { localStorage.removeItem(KEY); } catch (e) {}
    state = defaults();
    save();
  }

  return {
    get state() { return state; },
    load: load, save: save, onChange: onChange, reset: reset, defaults: defaults,
    dayKey: dayKey, weekdayKey: weekdayKey, addDays: addDays,
    dayProgress: dayProgress, isTicked: isTicked, toggle: toggle, setTicked: setTicked,
    clearList: clearList, countDone: countDone, bumpStreak: bumpStreak,
    addWorry: addWorry, removeWorry: removeWorry, logMood: logMood,
    parseTime: parseTime, fmtTime: fmtTime, stepTime: stepTime, leaveTime: leaveTime,
    weekNumberFor: weekNumberFor, swapWeeks: swapWeeks, dayPlan: dayPlan
  };
})(window.AndiData);
