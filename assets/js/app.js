/* app.js — the Today screen, the tab router, and the bits that glue it
   together. */

window.AndiApp = (function (D, S, U, R, C, Set) {
  'use strict';

  var el = U.el;
  var current = 'today';
  var screens = {
    today: 'screen-today', morning: 'screen-morning', bag: 'screen-bag',
    evening: 'screen-evening', calm: 'screen-calm', settings: 'screen-settings'
  };

  /* ---------------- router ---------------- */

  function go(name, arg) {
    if (!screens[name]) name = 'today';
    current = name;
    Object.keys(screens).forEach(function (k) {
      document.getElementById(screens[k]).hidden = (k !== name);
    });
    Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (t) {
      if (t.dataset.go === name) t.setAttribute('aria-current', 'page');
      else t.removeAttribute('aria-current');
    });
    draw(name, arg);
    window.scrollTo(0, 0);
    try { history.replaceState(null, '', '#' + name); } catch (e) {}
  }

  function draw(name, arg) {
    if (name === 'today')    return renderToday(document.getElementById('todayBody'));
    if (name === 'morning')  return R.renderMorning(document.getElementById('morningBody'), go);
    if (name === 'bag')      return R.renderBag(document.getElementById('bagBody'), go);
    if (name === 'evening')  return R.renderEvening(document.getElementById('eveningBody'), go);
    if (name === 'calm')     return C.renderCalm(document.getElementById('calmBody'));
    if (name === 'settings') return Set.render(document.getElementById('settingsBody'), arg);
  }

  /* ---------------- Today ---------------- */

  function daysUntilFirstDay() {
    var fd = S.state.profile.firstDay;
    if (!fd) return null;
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var parts = fd.split('-');
    var target = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    if (isNaN(target.getTime())) return null;
    return Math.round((target - today) / 86400000);
  }

  /* What should be on screen right now, worked out from the clock. */
  function nextUp() {
    var now = U.nowMins();
    var wake = S.parseTime(S.state.settings.wakeTime);
    var leave = S.parseTime(S.leaveTime());
    var bed = S.parseTime(S.state.settings.bedTime);
    var key = S.dayKey();
    var schoolDay = R.isSchoolDay(new Date());

    if (schoolDay && wake !== null && now >= wake - 45 && (leave === null || now < leave + 20)) {
      var pending = S.state.routines.morning.filter(function (st) { return !S.isTicked('morning', st.id, key); });
      if (pending.length) {
        var step = pending[0];
        var t = S.stepTime(step);
        return {
          kicker: now < wake ? 'Alarm at ' + S.state.settings.wakeTime : 'Next',
          main: step.label,
          note: (t ? 'About ' + t + '. ' : '') + (step.note || ''),
          action: ['Open the morning list', function () { go('morning'); }]
        };
      }
      return {
        kicker: 'Morning', main: 'All done',
        note: 'Everything on the morning list is ticked. Out of the door at ' + (S.leaveTime() || '—') + '.',
        action: ['Check your bag', function () { R.setBagWhen('today'); go('bag'); }]
      };
    }

    if (schoolDay && leave !== null && now >= leave + 20 && now < 15 * 60) {
      return {
        kicker: 'At school', main: 'You are in it now',
        note: 'Nothing on this app needs doing until you get home. If it gets hard, the Calm button at the top is one tap.',
        action: ['I need to feel calmer', function () { C.panic(go); }]
      };
    }

    if (bed !== null && now >= bed - 90) {
      return {
        kicker: 'Winding down', main: 'Get tomorrow ready',
        note: 'Uniform out, bag packed, and then you are free.',
        action: ['Open the evening list', function () { go('evening'); }]
      };
    }

    if (now >= 15 * 60) {
      return {
        kicker: 'After school', main: 'Snack, then nothing for a bit',
        note: 'The 20 minutes of nothing is a real part of the list. It is not skiving.',
        action: ['Open the after-school list', function () { go('evening'); }]
      };
    }

    return {
      kicker: schoolDay ? 'Today' : 'No school today',
      main: schoolDay ? 'Nothing due right now' : 'A day off',
      note: 'Have a look at the lists whenever you want to.',
      action: ['Open the Calm tab', function () { go('calm'); }]
    };
  }

  function renderToday(root) {
    var kids = [];
    var key = S.dayKey();
    var until = daysUntilFirstDay();
    var todayIsFirst = R.isFirstDay(new Date());

    /* countdown / first day */
    if (todayIsFirst) {
      kids.push(U.card('Today is the first day', [
        el('p', { text: 'This is the one you have been thinking about. A few true things:' }),
        el('ul', { style: 'padding-left:20px;margin:10px 0 0' }, [
          el('li', { text: 'Everyone in your year is new today. Every single one of them.' }),
          el('li', { text: 'Nobody expects you to know where anything is.' }),
          el('li', { text: 'The staff in the SRB already know you are coming and already know you.' }),
          el('li', { text: 'You only have to get through today. Not the whole of high school.' })
        ]),
        el('div', { class: 'btn-row', style: 'margin-top:16px' }, [
          U.btn('Before-school breathing', { variant: 'calm', small: true, onClick: function () { C.openMeditation('morning'); } }),
          U.btn('What if…', { small: true, onClick: function () { go('calm'); } })
        ])
      ], { ico: '🌟' }));
    } else if (until !== null && until > 0 && until <= 60) {
      kids.push(U.card(until === 1 ? 'Big day tomorrow' : until + ' days until the first day', [
        el('p', { class: 'muted', text: until === 1
          ? 'Uniform out, bag packed, and an early night. That is all tonight needs to be.'
          : 'There is time. Nothing has to be sorted today.' })
      ], { ico: '📆' }));
    }

    /* next up */
    var n = nextUp();
    kids.push(el('div', { class: 'hero' }, [
      el('p', { class: 'hero-kicker', text: n.kicker }),
      el('p', { class: 'hero-main', text: n.main }),
      el('p', { class: 'hero-note', text: n.note }),
      n.action ? el('div', { style: 'margin-top:14px' }, [
        U.btn(n.action[0], { variant: 'primary', onClick: n.action[1] })
      ]) : null
    ]));

    /* today at a glance */
    var morning = S.state.routines.morning;
    var bagItems = R.bagListFor(new Date());
    var after = S.state.routines.afterSchool;
    var bed = S.state.routines.bedtime;

    kids.push(U.card('Where you are up to', [
      miniRow('☀️', 'Morning', S.countDone('morning', morning, key), morning.length, function () { go('morning'); }),
      miniRow('🎒', 'Bag', S.countDone('bag', bagItems, key), bagItems.length, function () { R.setBagWhen('today'); go('bag'); }),
      miniRow('🏠', 'After school', S.countDone('afterSchool', after, key), after.length, function () { go('evening'); }),
      miniRow('🌙', 'Bedtime', S.countDone('bedtime', bed, key), bed.length, function () { go('evening'); })
    ], { ico: '✅' }));

    /* today's note from the timetable */
    var day = S.state.timetable[S.weekdayKey(new Date())] || {};
    if (day.note || (day.extras && day.extras.length)) {
      kids.push(U.card('Just for today', [
        day.note ? el('p', { text: day.note }) : null,
        (day.extras && day.extras.length)
          ? el('p', { class: 'muted', text: 'Extra things to take: ' + day.extras.join(', ') + '.' })
          : null
      ], { ico: '📌' }));
    }

    /* feelings */
    kids.push(U.card('How are you doing?', [C.renderMoodCheck(null)], { ico: '💬' }));

    /* quick calm */
    kids.push(U.label('If you need it'));
    kids.push(el('div', { class: 'tiles' }, [
      tile('🫧', 'Breathe', 'One minute.', function () { C.openBreathing('square'); }),
      tile('📦', 'Worry box', 'Put it down.', function () { C.openWorryBox(function () { renderToday(root); }); }),
      tile('🖐️', '5, 4, 3, 2, 1', 'Back into the room.', C.openGrounding),
      tile('🧡', 'Hard day', 'For after a bad one.', function () { C.openMeditation('badday'); })
    ]));

    /* streak — gently */
    if (S.state.streak.count > 1) {
      kids.push(el('p', { class: 'small muted center', style: 'margin-top:18px', text:
        'Morning list finished ' + S.state.streak.count + ' days in a row. Breaking the run does not undo the days.' }));
    }

    U.mount(root, kids);
  }

  function miniRow(ico, name, done, total, onClick) {
    var complete = total > 0 && done === total;
    return el('button', {
      type: 'button', class: 'check', 'aria-pressed': 'false', onclick: onClick,
      style: 'cursor:pointer'
    }, [
      el('span', { class: 'check-box', 'aria-hidden': 'true', style: 'border:0;font-size:1.25em;color:inherit', text: ico }),
      el('span', { class: 'check-text' }, [
        el('span', { class: 'check-label', text: name })
      ]),
      el('span', { class: complete ? 'pill pill-done' : 'pill', text: done + ' / ' + total })
    ]);
  }

  function tile(ico, name, sub, onClick) {
    return el('button', { type: 'button', class: 'tile', onclick: onClick }, [
      el('span', { class: 'tile-ico', 'aria-hidden': 'true', text: ico }),
      el('span', { class: 'tile-name', text: name }),
      el('span', { class: 'tile-sub', text: sub })
    ]);
  }

  /* ---------------- app bar ---------------- */

  function refreshBar() {
    var h = new Date().getHours();
    var greet = h < 12 ? 'Morning' : (h < 17 ? 'Afternoon' : 'Evening');
    document.getElementById('barGreeting').textContent = greet + ', ' + (S.state.profile.name || 'Andi');
    document.getElementById('barDate').textContent = U.niceDate(new Date());
  }

  /* ---------------- start ---------------- */

  function start() {
    S.load();
    Set.applyDisplay();
    refreshBar();

    Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (t) {
      t.addEventListener('click', function () { go(t.dataset.go); });
    });

    document.getElementById('calmNowBtn').addEventListener('click', function () { C.panic(go); });
    document.getElementById('overlayClose').addEventListener('click', U.closeOverlay);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') U.closeOverlay();
    });

    // Ask for the device's voices straight away. They load asynchronously, and
    // asking late is what made the meditations play silently.
    C.loadVoices(function () {});

    var hash = (location.hash || '').replace('#', '');
    go(screens[hash] ? hash : 'today');

    // Keep the "next up" card honest as the morning moves on.
    setInterval(function () {
      refreshBar();
      if (current === 'today' && document.getElementById('overlay').hidden) {
        renderToday(document.getElementById('todayBody'));
      }
    }, 60000);

    // Redraw when she comes back to the app after a while (e.g. next morning).
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) { refreshBar(); draw(current); }
    });

    if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
      navigator.serviceWorker.register('sw.js').catch(function () { /* offline caching is a bonus, not a requirement */ });
    }
  }

  return { start: start, go: go, refreshBar: refreshBar };
})(window.AndiData, window.AndiStore, window.AndiUI, window.AndiRoutines, window.AndiCalm, window.AndiSettings);

document.addEventListener('DOMContentLoaded', window.AndiApp.start);
