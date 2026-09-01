/* routines.js — the Morning, Bag and Evening screens. */

window.AndiRoutines = (function (D, S, U) {
  'use strict';

  var el = U.el;

  /* Which bag day is on screen: 'today' or 'tomorrow'. Chosen for her by the
     clock the first time she opens it, but she can always switch. */
  var bagWhen = null;

  function defaultBagWhen() {
    // After 2pm the useful question is "what do I need tomorrow?"
    return U.nowMins() >= 14 * 60 ? 'tomorrow' : 'today';
  }

  function bagDate() {
    if (!bagWhen) bagWhen = defaultBagWhen();
    return bagWhen === 'tomorrow' ? S.addDays(new Date(), 1) : new Date();
  }

  function isFirstDay(date) {
    var fd = S.state.profile.firstDay;
    return !!fd && S.dayKey(date) === fd;
  }

  /* Full bag list for a given date: the everyday things, plus whatever that
     weekday needs, plus the first-day extras if it is the first day. */
  function bagListFor(date) {
    var items = S.state.bagBase.slice();
    var day = S.state.timetable[S.weekdayKey(date)] || { extras: [] };
    (day.extras || []).forEach(function (label, i) {
      items.push({ id: 'x-' + S.weekdayKey(date) + '-' + i, label: label, note: day.note || '' });
    });
    if (isFirstDay(date)) {
      D.firstDayExtras.forEach(function (it) { items.push(it); });
    }
    return items;
  }

  function isSchoolDay(date) {
    var day = S.state.timetable[S.weekdayKey(date)];
    return !!(day && day.school);
  }

  /* ---------------- Morning ---------------- */

  function renderMorning(root, go) {
    var items = S.state.routines.morning.map(function (step) {
      var copy = { id: step.id, label: step.label, note: step.note, link: step.link };
      if (S.state.settings.showTimes) copy.time = S.stepTime(step);
      return copy;
    });

    var key = S.dayKey();
    var done = S.countDone('morning', items, key);
    var leave = S.leaveTime();
    var kids = [];

    if (!isSchoolDay(new Date())) {
      kids.push(U.card('No school today', [
        el('p', { class: 'muted', text: 'It is ' + D.DAY_NAMES[S.weekdayKey(new Date())] + '. The morning list is here anyway if you want it, but nothing on it is urgent.' })
      ], { ico: '🛌' }));
    }

    kids.push(el('div', { class: 'hero' }, [
      el('p', { class: 'hero-kicker', text: 'Out of the door by' }),
      el('p', { class: 'hero-main', text: leave || '—' }),
      el('p', { class: 'hero-note', text: 'Wake up at ' + S.state.settings.wakeTime + '. Every time on this list moves if you change your wake-up time in Set up.' })
    ]));

    kids.push(U.progressBar(done, items.length, 'Morning routine'));

    kids.push(U.checklist(items, {
      isDone: function (it) { return S.isTicked('morning', it.id, key); },
      onToggle: function (it, nowDone) {
        S.setTicked('morning', it.id, nowDone, key);
        var n = S.countDone('morning', items, key);
        refreshProgress(root, n, items.length);
        if (nowDone && n === items.length) {
          var streak = S.bumpStreak();
          U.toast('Morning done. ' + (streak > 1 ? streak + ' days in a row.' : 'Nice one.'));
        }
      },
      onLink: function (it) { followLink(it.link, go); }
    }));

    kids.push(el('div', { class: 'btn-row', style: 'margin-top:16px' }, [
      U.btn('Start again', { small: true, onClick: function () {
        S.clearList('morning', key);
        renderMorning(root, go);
        U.toast('Morning list cleared.');
      }}),
      U.btn('One minute of breathing', { small: true, variant: 'calm', onClick: function () {
        AndiCalm.openBreathing('square');
      }})
    ]));

    U.mount(root, kids);
  }

  function refreshProgress(root, done, total) {
    var fill = root.querySelector('.progress-fill');
    var text = root.querySelector('.progress-text');
    var track = root.querySelector('.progress-track');
    if (fill) fill.style.width = (total ? Math.round(done / total * 100) : 0) + '%';
    if (text) text.textContent = done + ' of ' + total + ' done';
    if (track) track.setAttribute('aria-valuenow', String(done));
  }

  function followLink(link, go) {
    if (!link) return;
    if (link === 'bag') return go('bag');
    if (link === 'breathing') return AndiCalm.openBreathing('square');
    if (link.slice(0, 4) === 'med:') return AndiCalm.openMeditation(link.slice(4));
    go('calm');
  }

  /* ---------------- Bag ---------------- */

  function renderBag(root, go) {
    if (!bagWhen) bagWhen = defaultBagWhen();
    var date = bagDate();
    var key = S.dayKey(date);
    var items = bagListFor(date);
    var day = S.state.timetable[S.weekdayKey(date)] || {};
    var done = S.countDone('bag', items, key);

    var kids = [];

    kids.push(el('div', { class: 'chips', style: 'margin-bottom:14px' }, [
      chip('For today', bagWhen === 'today', function () { bagWhen = 'today'; renderBag(root, go); }),
      chip('For tomorrow', bagWhen === 'tomorrow', function () { bagWhen = 'tomorrow'; renderBag(root, go); })
    ]));

    kids.push(el('div', { class: 'hero' }, [
      el('p', { class: 'hero-kicker', text: bagWhen === 'tomorrow' ? 'Packing for' : 'Today is' }),
      el('p', { class: 'hero-main', text: U.niceDate(date) }),
      el('p', { class: 'hero-note', text: isFirstDay(date)
        ? 'First day. There are a few extra things on the list today.'
        : (day.note ? day.note : (isSchoolDay(date) ? 'Normal school day.' : 'Not a school day — pack only if you want to.')) })
    ]));

    kids.push(U.progressBar(done, items.length, 'Bag packing'));

    kids.push(U.checklist(items, {
      isDone: function (it) { return S.isTicked('bag', it.id, key); },
      onToggle: function (it, nowDone) {
        S.setTicked('bag', it.id, nowDone, key);
        var n = S.countDone('bag', items, key);
        refreshProgress(root, n, items.length);
        if (nowDone && n === items.length) {
          U.toast(bagWhen === 'tomorrow' ? 'Bag packed. Tomorrow is sorted.' : 'Bag packed. You have got everything.');
        }
      }
    }));

    kids.push(el('div', { class: 'btn-row', style: 'margin-top:16px' }, [
      U.btn('Start again', { small: true, onClick: function () {
        S.clearList('bag', key);
        renderBag(root, go);
      }}),
      U.btn('Edit the list', { small: true, onClick: function () { go('settings', 'bag'); } })
    ]));

    if (bagWhen === 'tomorrow') {
      kids.push(el('p', { class: 'small muted', style: 'margin-top:14px', text:
        'Anything you tick here stays ticked for tomorrow morning, so you can see in the morning that it is already done.' }));
    }

    U.mount(root, kids);
  }

  function chip(text, on, onClick) {
    return el('button', {
      type: 'button', class: 'chip', 'aria-pressed': on ? 'true' : 'false', onclick: onClick
    }, [text]);
  }

  /* ---------------- Evening ---------------- */

  function renderEvening(root, go) {
    var key = S.dayKey();
    var after = S.state.routines.afterSchool;
    var bed = S.state.routines.bedtime;
    var kids = [];

    kids.push(el('div', { class: 'hero' }, [
      el('p', { class: 'hero-kicker', text: 'Lights out around' }),
      el('p', { class: 'hero-main', text: S.state.settings.bedTime || '—' }),
      el('p', { class: 'hero-note', text: 'Get through these in any order you like. The only one that really matters is packing your bag.' })
    ]));

    kids.push(U.label('After school'));
    kids.push(U.progressBar(S.countDone('afterSchool', after, key), after.length, 'After school routine'));
    kids.push(U.checklist(after, {
      isDone: function (it) { return S.isTicked('afterSchool', it.id, key); },
      onToggle: function (it, nowDone) {
        S.setTicked('afterSchool', it.id, nowDone, key);
        var fills = root.querySelectorAll('.progress-fill');
        var texts = root.querySelectorAll('.progress-text');
        var n = S.countDone('afterSchool', after, key);
        if (fills[0]) fills[0].style.width = Math.round(n / after.length * 100) + '%';
        if (texts[0]) texts[0].textContent = n + ' of ' + after.length + ' done';
      },
      onLink: function (it) { followLink(it.link, go); }
    }));

    kids.push(U.label('Bedtime'));
    kids.push(U.progressBar(S.countDone('bedtime', bed, key), bed.length, 'Bedtime routine'));
    kids.push(U.checklist(bed, {
      isDone: function (it) { return S.isTicked('bedtime', it.id, key); },
      onToggle: function (it, nowDone) {
        S.setTicked('bedtime', it.id, nowDone, key);
        var fills = root.querySelectorAll('.progress-fill');
        var texts = root.querySelectorAll('.progress-text');
        var n = S.countDone('bedtime', bed, key);
        if (fills[1]) fills[1].style.width = Math.round(n / bed.length * 100) + '%';
        if (texts[1]) texts[1].textContent = n + ' of ' + bed.length + ' done';
      },
      onLink: function (it) { followLink(it.link, go); }
    }));

    kids.push(el('div', { class: 'btn-row', style: 'margin-top:18px' }, [
      U.btn('Sleepy body scan', { small: true, variant: 'calm', onClick: function () { AndiCalm.openMeditation('sleep'); } }),
      U.btn('Start again', { small: true, onClick: function () {
        S.clearList('afterSchool', key);
        S.clearList('bedtime', key);
        renderEvening(root, go);
      }})
    ]));

    U.mount(root, kids);
  }

  return {
    renderMorning: renderMorning,
    renderBag: renderBag,
    renderEvening: renderEvening,
    bagListFor: bagListFor,
    isSchoolDay: isSchoolDay,
    isFirstDay: isFirstDay,
    followLink: followLink,
    setBagWhen: function (w) { bagWhen = w; }
  };
})(window.AndiData, window.AndiStore, window.AndiUI);
