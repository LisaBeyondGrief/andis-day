/* calm.js — breathing, grounding, meditations, the worry box, feelings
   check-in and the "what if" plans.

   Two rules run through all of it: nothing here can fail, and nothing here
   times her. Every screen has a way out that is as big as the way in. */

window.AndiCalm = (function (D, S, U) {
  'use strict';

  var el = U.el;
  var timers = [];

  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
  function stopTimers() { timers.forEach(clearTimeout); timers = []; }

  var keepAlive = null;

  function stopSpeech() {
    clearInterval(keepAlive); keepAlive = null;
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
  }

  function stopEverything() { stopTimers(); stopSpeech(); }

  /* ---- the phone's own voice ----
     There is no recorded audio anywhere in this app: the meditations are read
     by whatever text-to-speech the device already has. That is free, works
     offline and means the words can be edited without re-recording anything,
     but it has three sharp edges, all handled below:

       1. Chrome and Android fill in the voice list asynchronously. Calling
          speak() before that happens fails with "synthesis-failed" and no
          sound. This was the bug: press Start quickly and you got silence.
       2. iOS will only start speech from inside a real tap, so the first
          call has to happen synchronously in the button handler.
       3. Chrome cuts speech off after roughly fifteen seconds unless it is
          nudged with resume().

     And when none of it works, the app has to say so rather than just going
     quiet, which is what happened the first time. */

  var voices = [], voice = null, voicesAsked = false, unlocked = false;

  function supported() {
    return !!(window.speechSynthesis && window.SpeechSynthesisUtterance);
  }

  function pickVoice(list) {
    function first(test) {
      for (var i = 0; i < list.length; i++) if (test(list[i])) return list[i];
      return null;
    }
    // Prefer a British voice, and an on-device one over a network one so it
    // still works on the bus with no signal.
    return first(function (v) { return /^en[-_]GB/i.test(v.lang) && v.localService; })
        || first(function (v) { return /^en[-_]GB/i.test(v.lang); })
        || first(function (v) { return /^en([-_]|$)/i.test(v.lang); })
        || first(function (v) { return v.default; })
        || list[0] || null;
  }

  /* Ask the browser for its voices, and keep asking briefly, because on some
     devices the list is empty for the first second or so. */
  function loadVoices(cb) {
    if (!supported()) { if (cb) cb(false); return; }
    var got = window.speechSynthesis.getVoices();
    if (got && got.length) {
      voices = got; voice = pickVoice(got);
      if (cb) cb(true);
      return;
    }
    var done = false, tries = 0;
    function settle() {
      if (done) return;
      var list = window.speechSynthesis.getVoices();
      if (list && list.length) {
        done = true;
        voices = list; voice = pickVoice(list);
        if (cb) cb(true);
        return;
      }
      if (++tries > 12) { done = true; if (cb) cb(false); return; }
      setTimeout(settle, 150);
    }
    try { window.speechSynthesis.onvoiceschanged = settle; } catch (e) {}
    settle();
  }

  /* iOS only unlocks speech from inside a genuine tap, so this must be called
     straight from a click handler, not from a timer. */
  function unlockSpeech() {
    if (unlocked || !supported()) return;
    unlocked = true;
    try {
      var u = new SpeechSynthesisUtterance('.');
      u.volume = 0;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }

  /* onDone(spoke) — spoke is false if the device could not actually say it,
     so the caller can fall back to plain timed text. */
  function speak(text, onDone) {
    if (!S.state.settings.speech || !supported()) { if (onDone) onDone(false); return; }

    function attempt(retry) {
      var started = false, finished = false;
      function done(ok) {
        if (finished) return;
        finished = true;
        clearInterval(keepAlive); keepAlive = null;
        if (onDone) onDone(ok);
      }
      try {
        var u = new SpeechSynthesisUtterance(text);
        u.rate = 0.82;
        u.pitch = 1;
        if (voice) u.voice = voice;
        u.lang = (voice && voice.lang) || 'en-GB';
        u.onstart = function () { started = true; };
        u.onend = function () { done(true); };
        u.onerror = function (e) {
          var err = (e && e.error) || '';
          if (err === 'interrupted' || err === 'canceled') { done(false); return; }
          // A cold start can fail once before the engine is ready.
          if (retry) { setTimeout(function () { attempt(false); }, 350); return; }
          done(false);
        };
        window.speechSynthesis.speak(u);

        // Chrome stops long utterances dead unless nudged.
        clearInterval(keepAlive);
        keepAlive = setInterval(function () {
          try {
            if (window.speechSynthesis.speaking) window.speechSynthesis.resume();
            else { clearInterval(keepAlive); keepAlive = null; }
          } catch (e) {}
        }, 8000);

        // Nothing started and nothing errored: treat it as a silent failure.
        setTimeout(function () {
          if (finished || started) return;
          if (window.speechSynthesis.speaking || window.speechSynthesis.pending) return;
          if (retry) { attempt(false); return; }
          done(false);
        }, 1400);
      } catch (e) {
        done(false);
      }
    }

    if (!voicesAsked) {
      voicesAsked = true;
      loadVoices(function () { attempt(true); });
    } else {
      attempt(true);
    }
  }

  /* Speaks a test sentence and reports honestly whether it worked. */
  function testVoice(cb) {
    if (!supported()) { cb(false, 'This browser has no built-in voice at all.'); return; }
    unlockSpeech();
    loadVoices(function (haveVoices) {
      if (!haveVoices) {
        cb(false, 'This device has no voices installed, so it cannot read anything out loud.');
        return;
      }
      var was = S.state.settings.speech;
      S.state.settings.speech = true;
      speak('Hello. This is the voice that will read the meditations.', function (ok) {
        S.state.settings.speech = was;
        cb(ok, ok
          ? 'That worked. The voice is ' + ((voice && voice.name) || 'the device default') + '.'
          : 'The voice did not play. Check the volume, and that the phone is not on silent.');
      });
    });
  }

  function voiceAvailable() { return supported() && voices.length > 0; }

  /* ================= breathing ================= */

  function openBreathing(patternId) {
    var pattern = D.breathing.filter(function (p) { return p.id === patternId; })[0] || D.breathing[0];

    var circle = el('div', { class: 'breath-circle' }, [
      el('div', {}, [
        el('div', { class: 'breath-word', id: 'breathWord', text: 'Ready?' }),
        el('div', { class: 'breath-count', id: 'breathCount', text: '' })
      ])
    ]);

    var meta = el('p', { class: 'breath-meta', id: 'breathMeta', text: pattern.sub });
    var stage = el('div', { class: 'breath-stage' }, [circle]);

    var startBtn = U.btn('Start', { variant: 'calm', block: true, onClick: function () { run(); } });
    var stopBtn = U.btn('Stop', { block: true, extra: 'btn-quiet', onClick: function () { halt(); } });
    stopBtn.hidden = true;

    var picker = el('div', { class: 'chips', style: 'margin-top:18px' },
      D.breathing.map(function (p) {
        return el('button', {
          type: 'button', class: 'chip', 'aria-pressed': p.id === pattern.id ? 'true' : 'false',
          onclick: function () { stopEverything(); U.closeOverlay(); openBreathing(p.id); }
        }, [p.name]);
      })
    );

    var running = false;

    function halt() {
      running = false;
      stopTimers();
      document.getElementById('breathWord').textContent = 'Stopped';
      document.getElementById('breathCount').textContent = '';
      document.getElementById('breathMeta').textContent = 'Stopping early is fine. Any breathing counts.';
      circle.style.transitionDuration = '600ms';
      circle.style.transform = 'scale(0.8)';
      startBtn.hidden = false; stopBtn.hidden = true;
      startBtn.textContent = 'Go again';
    }

    function run() {
      running = true;
      startBtn.hidden = true; stopBtn.hidden = false;
      var round = 0, idx = 0;

      function step() {
        if (!running) return;
        if (idx >= pattern.steps.length) {
          idx = 0; round++;
          if (round >= pattern.rounds) return finish();
        }
        var word = pattern.steps[idx][0];
        var secs = pattern.steps[idx][1];

        document.getElementById('breathWord').textContent = word;
        document.getElementById('breathMeta').textContent = 'Round ' + (round + 1) + ' of ' + pattern.rounds;

        if (word === 'In') {
          circle.style.transitionDuration = secs + 's';
          circle.style.transform = 'scale(1)';
        } else if (word === 'Out') {
          circle.style.transitionDuration = secs + 's';
          circle.style.transform = 'scale(0.62)';
        }

        var left = secs;
        document.getElementById('breathCount').textContent = String(left);
        (function tick() {
          later(function () {
            if (!running) return;
            left--;
            if (left > 0) {
              document.getElementById('breathCount').textContent = String(left);
              tick();
            } else {
              document.getElementById('breathCount').textContent = '';
              idx++;
              step();
            }
          }, 1000);
        })();
      }

      function finish() {
        running = false;
        document.getElementById('breathWord').textContent = 'Done';
        document.getElementById('breathCount').textContent = '';
        document.getElementById('breathMeta').textContent = 'That is your body slowing down. Nothing else needed.';
        circle.style.transitionDuration = '1.2s';
        circle.style.transform = 'scale(0.85)';
        startBtn.hidden = false; stopBtn.hidden = true;
        startBtn.textContent = 'Go again';
      }

      step();
    }

    U.openOverlay(pattern.name, [
      stage,
      meta,
      el('div', { class: 'stack' }, [startBtn, stopBtn]),
      U.label('Try a different one'),
      picker,
      el('p', { class: 'small muted', style: 'margin-top:16px', text:
        'If counting makes it worse, ignore the numbers and just watch the circle get bigger and smaller.' })
    ], stopEverything);
  }

  /* ================= grounding (5-4-3-2-1) ================= */

  function openGrounding() {
    var i = 0;
    var stepEl = el('div', { class: 'step-card' }, []);
    var backBtn = U.btn('Back', { onClick: function () { if (i > 0) { i--; draw(); } } });
    var nextBtn = U.btn('Next', { variant: 'calm', onClick: function () {
      if (i < D.grounding.length - 1) { i++; draw(); }
      else { U.closeOverlay(); U.toast('You did the whole thing.'); }
    }});

    function draw() {
      var s = D.grounding[i];
      U.mount(stepEl, [
        el('p', { class: 'step-count', text: 'Step ' + (i + 1) + ' of ' + D.grounding.length }),
        el('p', { class: 'step-text', text: s.prompt }),
        el('p', { class: 'muted', style: 'margin-top:10px', text: s.hint })
      ]);
      backBtn.disabled = i === 0;
      backBtn.style.opacity = i === 0 ? '.45' : '1';
      nextBtn.textContent = i === D.grounding.length - 1 ? 'Finished' : 'Next';
    }
    draw();

    U.openOverlay('5, 4, 3, 2, 1', [
      el('p', { class: 'muted', style: 'margin-bottom:14px', text:
        'This pulls your brain out of the worry and back into the room. Take as long as you like on each one.' }),
      stepEl,
      el('div', { class: 'btn-row' }, [backBtn, nextBtn])
    ], stopEverything);
  }

  /* ================= meditations ================= */

  function openMeditation(id) {
    var med = D.meditations.filter(function (m) { return m.id === id; })[0];
    if (!med) return;

    var i = 0, playing = false;

    var stepEl = el('div', { class: 'step-card' }, []);
    var playBtn = U.btn('Start', { variant: 'calm', block: true, onClick: toggle });
    var backBtn = U.btn('Back', { small: true, onClick: function () { if (i > 0) { pause(); i--; draw(); } } });
    var fwdBtn = U.btn('Skip', { small: true, onClick: function () { if (i < med.lines.length - 1) { pause(); i++; draw(); } } });
    var speechBtn = U.btn(S.state.settings.speech ? 'Voice: on' : 'Voice: off', { small: true, onClick: function () {
      S.state.settings.speech = !S.state.settings.speech;
      S.save();
      speechBtn.textContent = S.state.settings.speech ? 'Voice: on' : 'Voice: off';
      if (S.state.settings.speech) { unlockSpeech(); voiceNote.hidden = true; }
      else { stopSpeech(); voiceNote.hidden = true; }
    }});

    /* Shown only if the device turns out not to be able to read it aloud.
       Going quiet with no explanation is worse than saying so. */
    var voiceNote = el('p', {
      class: 'small muted', hidden: true, style: 'margin-top:12px',
      text: 'This device is not reading it out loud. The words are still here to read at your own speed.'
    });

    function draw() {
      U.mount(stepEl, [
        el('p', { class: 'step-count', text: (i + 1) + ' of ' + med.lines.length }),
        el('p', { class: 'step-text', text: med.lines[i][0] })
      ]);
    }

    function pause() {
      playing = false;
      stopTimers();
      stopSpeech();
      playBtn.textContent = i === 0 ? 'Start' : 'Carry on';
    }

    function toggle() {
      if (playing) { pause(); return; }
      unlockSpeech();          // must happen in the tap itself, for iOS
      playing = true;
      playBtn.textContent = 'Pause';
      advance(true);
    }

    function advance(sameLine) {
      if (!playing) return;
      if (!sameLine) i++;
      if (i >= med.lines.length) return finish();
      draw();

      var holdMs = med.lines[i][1] * 1000;
      var spoke = false;

      speak(med.lines[i][0], function (didSpeak) {
        spoke = didSpeak;
        if (didSpeak) voiceNote.hidden = true;
        else if (S.state.settings.speech) voiceNote.hidden = false;
        if (!playing) return;
        if (didSpeak) later(function () { advance(false); }, Math.max(1200, holdMs * 0.45));
      });

      // If speech is off or unavailable, pace it on the timer instead.
      later(function () {
        if (!playing || spoke) return;
        if (S.state.settings.speech && window.speechSynthesis && window.speechSynthesis.speaking) return;
        advance(false);
      }, holdMs);
    }

    function finish() {
      playing = false;
      stopTimers();
      U.mount(stepEl, [
        el('p', { class: 'step-count', text: 'Finished' }),
        el('p', { class: 'step-text', text: 'That is it. Sit for a moment before you get up.' })
      ]);
      playBtn.textContent = 'Play it again';
      i = 0;
    }

    draw();

    U.openOverlay(med.name, [
      el('p', { class: 'muted', style: 'margin-bottom:6px', text: med.sub }),
      el('p', { class: 'small muted', style: 'margin-bottom:14px', text:
        'About ' + med.mins + ' minutes. You can stop whenever you want — stopping early still counts.' }),
      stepEl,
      playBtn,
      el('div', { class: 'btn-row', style: 'margin-top:12px' }, [backBtn, fwdBtn, speechBtn]),
      voiceNote
    ], function () { playing = false; stopEverything(); });
  }

  /* ================= worry box ================= */

  function openWorryBox(onSaved) {
    var text = el('textarea', { id: 'worryText', placeholder: 'What is the worry? It can be one word.' });
    var size = el('input', { type: 'range', min: '1', max: '10', value: '5', id: 'worrySize', style: 'width:100%' });
    var sizeOut = el('p', { class: 'small muted', text: 'Right now it feels: 5 out of 10' });
    size.addEventListener('input', function () {
      sizeOut.textContent = 'Right now it feels: ' + size.value + ' out of 10';
    });

    var share = el('button', { type: 'button', class: 'switch', role: 'switch', 'aria-checked': 'false' });
    share.addEventListener('click', function () {
      share.setAttribute('aria-checked', share.getAttribute('aria-checked') === 'true' ? 'false' : 'true');
    });

    U.openOverlay('Worry box', [
      el('p', { class: 'muted', style: 'margin-bottom:16px', text:
        'Write it down and the app will hold it, so your head does not have to. Nothing here leaves this device.' }),
      el('div', { class: 'field' }, [text]),
      el('div', { class: 'field' }, [
        el('label', { for: 'worrySize', text: 'How big does it feel?' }),
        size, sizeOut
      ]),
      el('div', { class: 'switch-row' }, [
        el('div', { class: 'switch-text' }, [
          el('span', { text: 'Show this one to ' + (S.state.profile.person || 'Mum') }),
          el('small', { text: 'It gets a little flag so it is easy to find together later.' })
        ]),
        share
      ]),
      U.btn('Put it in the box', { variant: 'calm', block: true, extra: 'stack', onClick: function () {
        var v = text.value.trim();
        if (!v) { U.toast('Write something first, even one word.'); text.focus(); return; }
        S.addWorry(v, parseInt(size.value, 10), share.getAttribute('aria-checked') === 'true');
        U.closeOverlay();
        U.toast('In the box. You can stop carrying it now.');
        if (onSaved) onSaved();
      }}),
      el('p', { class: 'small muted', style: 'margin-top:16px', text:
        'Worries in the box do not have to be solved. Most of them get smaller on their own.' })
    ], stopEverything);
  }

  function renderWorryList(onChange) {
    var ws = S.state.worries;
    if (!ws.length) {
      return el('p', { class: 'muted small', text: 'The box is empty at the moment.' });
    }
    return el('div', {}, ws.slice(0, 20).map(function (w) {
      var when = '';
      try { when = new Date(w.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); } catch (e) {}
      return el('div', { class: 'worry' }, [
        el('p', { class: 'worry-text', text: w.text }),
        el('div', { class: 'worry-meta' }, [
          el('span', { text: when }),
          w.size ? el('span', { text: 'felt like ' + w.size + '/10' }) : null,
          w.share ? el('span', { class: 'pill', text: 'for ' + (S.state.profile.person || 'Mum') }) : null,
          el('button', {
            type: 'button', class: 'btn btn-small btn-quiet',
            onclick: function () { S.removeWorry(w.id); if (onChange) onChange(); }
          }, ['Let it go'])
        ])
      ]);
    }));
  }

  /* ================= feelings check-in ================= */

  function renderMoodCheck(onPick) {
    var out = el('p', { class: 'small muted', style: 'margin-top:12px', text: 'Tap the one that fits. There is no wrong answer.' });
    var row = el('div', { class: 'moods' }, D.moods.map(function (m) {
      var b = el('button', { type: 'button', class: 'mood', 'aria-pressed': 'false' }, [
        el('span', { class: 'mood-face', 'aria-hidden': 'true', text: m.face }),
        el('span', { class: 'mood-name', text: m.name })
      ]);
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(row.children, function (c) { c.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        S.logMood(m.id);
        out.textContent = m.tip;
        if (onPick) onPick(m);
      });
      return b;
    }));
    return el('div', {}, [row, out]);
  }

  /* ================= what-if plans ================= */

  function renderPlans() {
    return el('div', {}, D.plans.map(function (p) {
      var body = el('div', { class: 'plan-a', hidden: true }, [
        el('ol', {}, p.steps.map(function (s) { return el('li', { text: s }); }))
      ]);
      var q = el('button', { type: 'button', class: 'plan-q', 'aria-expanded': 'false' }, [
        el('span', { 'aria-hidden': 'true', text: p.ico }),
        el('span', { text: p.q })
      ]);
      q.addEventListener('click', function () {
        var open = q.getAttribute('aria-expanded') === 'true';
        q.setAttribute('aria-expanded', open ? 'false' : 'true');
        body.hidden = open;
      });
      return el('div', { class: 'plan' }, [q, body]);
    }));
  }

  /* ================= the Calm screen ================= */

  function renderCalm(root) {
    var kids = [];

    kids.push(U.card('How are you doing?', [renderMoodCheck(null)], { ico: '💬' }));

    kids.push(U.label('Right now'));
    kids.push(el('div', { class: 'tiles' }, [
      tile('🫧', 'Breathe', 'A circle to breathe along with.', function () { openBreathing('square'); }),
      tile('🖐️', '5, 4, 3, 2, 1', 'Get back into the room.', openGrounding),
      tile('📦', 'Worry box', 'Put it down for a bit.', function () { openWorryBox(function () { renderCalm(root); }); }),
      tile('🎧', 'Too loud', 'Two minutes for overload.', function () { openMeditation('loud'); })
    ]));

    kids.push(U.label('Meditations'));
    kids.push(el('div', { class: 'tiles' }, D.meditations.map(function (m) {
      return tile(m.ico, m.name, m.mins + ' min · ' + m.sub, function () { openMeditation(m.id); });
    })));

    kids.push(U.label('What if…'));
    kids.push(el('p', { class: 'small muted', style: 'margin:-4px 4px 12px', text:
      'Already worked out, so you do not have to work it out while you are panicking.' }));
    kids.push(renderPlans());

    kids.push(U.label('In the worry box'));
    kids.push(el('div', { class: 'card' }, [renderWorryList(function () { renderCalm(root); })]));

    U.mount(root, kids);
  }

  function tile(ico, name, sub, onClick) {
    return el('button', { type: 'button', class: 'tile', onclick: onClick }, [
      el('span', { class: 'tile-ico', 'aria-hidden': 'true', text: ico }),
      el('span', { class: 'tile-name', text: name }),
      el('span', { class: 'tile-sub', text: sub })
    ]);
  }

  /* The header "Calm" button: one tap to breathing, because a panicking brain
     should not be handed a menu. Everything else is one more tap away. */
  function panic(go) {
    openBreathing('long');
    var body = document.getElementById('overlayBody');
    if (body) {
      body.appendChild(el('div', { class: 'btn-row', style: 'margin-top:20px' }, [
        U.btn('I want something else', { small: true, onClick: function () {
          stopEverything(); U.closeOverlay(); go('calm');
        }})
      ]));
    }
  }

  return {
    renderCalm: renderCalm,
    openBreathing: openBreathing,
    openGrounding: openGrounding,
    openMeditation: openMeditation,
    openWorryBox: openWorryBox,
    renderMoodCheck: renderMoodCheck,
    renderWorryList: renderWorryList,
    panic: panic,
    testVoice: testVoice,
    loadVoices: loadVoices,
    voiceAvailable: voiceAvailable,
    unlockSpeech: unlockSpeech,
    stopEverything: stopEverything
  };
})(window.AndiData, window.AndiStore, window.AndiUI);
