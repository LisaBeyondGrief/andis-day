/* settings.js — the "Set up" screen. This is mostly for Lisa: it is where the
   real timetable, the real wake time and Andi's own wording get put in.
   Deliberately plain and boring — the pretty screens are the ones Andi uses. */

window.AndiSettings = (function (D, S, U) {
  'use strict';

  var el = U.el;

  function render(root, focusSection) {
    var kids = [];

    kids.push(el('p', { class: 'muted', style: 'margin-bottom:18px', text:
      'Change anything here and it saves straight away. Everything is stored on this device only.' }));

    /* ---- about Andi ---- */
    kids.push(U.card('About', [
      textField('Her name', S.state.profile.name, function (v) {
        S.state.profile.name = v || 'Andi'; S.save(); AndiApp.refreshBar();
      }),
      textField('Grown-up she tells things to', S.state.profile.person, function (v) {
        S.state.profile.person = v || 'Mum'; S.save();
      }),
      dateField('First day at the new school', S.state.profile.firstDay, function (v) {
        S.state.profile.firstDay = v; S.save();
      }, 'The app counts down to this, and adds the first-day extras to the bag list on the day.'),
      textField('Form tutor', S.state.profile.formTutor, function (v) {
        S.state.profile.formTutor = v; S.save();
      }),
      textField('Form room', S.state.profile.formRoom, function (v) {
        S.state.profile.formRoom = v; S.save();
      })
    ], { ico: '👤' }));

    /* ---- times ---- */
    kids.push(U.card('Times', [
      timeField('Wake up', S.state.settings.wakeTime, function (v) {
        S.state.settings.wakeTime = v; S.save(); U.toast('Morning times moved.');
      }, 'Every step in the morning list is timed from this, so changing it shifts the whole morning.'),
      timeField('Out of the door (leave blank to work it out)', S.state.settings.leaveTime, function (v) {
        S.state.settings.leaveTime = v; S.save();
      }),
      timeField('Lights out', S.state.settings.bedTime, function (v) {
        S.state.settings.bedTime = v; S.save();
      })
    ], { ico: '⏰' }));

    /* ---- the week ---- */
    kids.push(weekCard(root));

    /* ---- lists ---- */
    kids.push(U.card('Bag list', [
      listEditor(S.state.bagBase, 'g', root, false)
    ], { ico: '🎒', sub: 'The everyday things. Day-specific extras go in "The week" above.' }));

    kids.push(U.card('Morning routine', [
      listEditor(S.state.routines.morning, 'm', root, true)
    ], { ico: '☀️', sub: 'The number is minutes after waking up.' }));

    kids.push(U.card('After school', [
      listEditor(S.state.routines.afterSchool, 'a', root, false)
    ], { ico: '🏠' }));

    kids.push(U.card('Bedtime', [
      listEditor(S.state.routines.bedtime, 'b', root, false)
    ], { ico: '🌙' }));

    /* ---- how it looks ---- */
    kids.push(U.card('How it looks and feels', [
      switchRow('Show times on the morning list', 'Some children find times motivating and some find them stressful. Try it both ways.',
        S.state.settings.showTimes, function (on) { S.state.settings.showTimes = on; S.save(); }),
      switchRow('Read meditations out loud', 'Uses the voice built into the phone or tablet. There is no recorded audio to download.',
        S.state.settings.speech, function (on) { S.state.settings.speech = on; S.save(); }),
      voiceTester(),
      switchRow('Movement and animation', 'Turn off if the breathing circle is too much.',
        S.state.settings.motion, function (on) {
          S.state.settings.motion = on; S.save(); applyDisplay();
        }),
      switchRow('Rounder, easier-to-read font', 'Wider spacing, easier for tired eyes.',
        S.state.settings.dyslexicFont, function (on) {
          S.state.settings.dyslexicFont = on; S.save(); applyDisplay();
        }),
      el('div', { class: 'field', style: 'margin-top:16px' }, [
        el('label', { text: 'Text size' }),
        el('div', { class: 'chips' }, [
          sizeChip('Normal', 1), sizeChip('Bigger', 1.15), sizeChip('Biggest', 1.32)
        ])
      ]),
      el('div', { class: 'field' }, [
        el('label', { text: 'Colours' }),
        el('div', { class: 'chips' }, [
          themeChip('Follow the phone', 'auto'), themeChip('Light', 'light'), themeChip('Dark', 'dark')
        ])
      ])
    ], { ico: '🎨' }));

    /* ---- the paper card ---- */
    kids.push(U.card('Her pocket card', [
      el('p', { class: 'small muted', text:
        'Her phone is in a signal-blocking pouch all day, so none of this app is reachable between 08:30 and 15:00 — including the calm tools, which is exactly when she might want them. This prints a small card of her rooms and the steps she cannot look up, to live in her planner or blazer pocket.' }),
      el('div', { class: 'btn-row', style: 'margin-top:12px' }, [
        U.btn('Print her card', { small: true, variant: 'primary', onClick: showCard })
      ])
    ], { ico: '🪪' }));

    /* ---- worries, for the grown-up ---- */
    var flagged = S.state.worries.filter(function (w) { return w.share; });
    kids.push(U.card('Worries she has flagged', [
      flagged.length
        ? el('div', {}, flagged.slice(0, 15).map(function (w) {
            var when = '';
            try { when = new Date(w.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); } catch (e) {}
            return el('div', { class: 'worry' }, [
              el('p', { class: 'worry-text', text: w.text }),
              el('div', { class: 'worry-meta' }, [
                el('span', { text: when }),
                w.size ? el('span', { text: w.size + '/10' }) : null
              ])
            ]);
          }))
        : el('p', { class: 'muted small', text: 'Nothing flagged. She can tick "show this one to you" when she writes a worry down.' }),
      el('p', { class: 'small muted', style: 'margin-top:12px', text:
        'Worries she did not flag are private to her, and stay in the Calm tab. That privacy is part of why she will use it.' })
    ], { ico: '🧡' }));

    /* ---- backup ---- */
    kids.push(U.card('Backup', [
      el('p', { class: 'small muted', text:
        'Everything lives in this browser only. Clearing the browser data would wipe it, so take a copy after you have set the lists up properly.' }),
      el('div', { class: 'btn-row', style: 'margin-top:12px' }, [
        U.btn('Save a backup file', { small: true, onClick: exportData }),
        U.btn('Restore from a file', { small: true, onClick: importData })
      ])
    ], { ico: '💾' }));

    kids.push(U.card('Start over', [
      el('p', { class: 'small muted', text: 'Puts every list back to how it arrived and clears all the ticks, worries and check-ins.' }),
      el('div', { class: 'btn-row', style: 'margin-top:12px' }, [
        U.btn('Reset everything', { small: true, onClick: function () {
          if (window.confirm('Reset every list and wipe all the ticks and worries? This cannot be undone.')) {
            S.reset(); applyDisplay(); render(root); U.toast('Back to the start.');
          }
        }})
      ])
    ], { ico: '↩️' }));

    U.mount(root, kids);

    if (focusSection === 'bag') {
      var cards = root.querySelectorAll('.card');
      for (var i = 0; i < cards.length; i++) {
        if (cards[i].textContent.indexOf('Bag list') === 0) { cards[i].scrollIntoView({ block: 'start' }); break; }
      }
    }
  }

  /* Worth checking on the actual device before she relies on it at bedtime:
     not every phone has a voice installed, and a silent meditation is a
     horrible surprise at half nine at night. */
  function voiceTester() {
    var result = el('p', { class: 'small muted', style: 'margin-top:8px', text: '' });
    var btn = U.btn('Test the voice', { small: true, onClick: function () {
      result.textContent = 'Listening…';
      AndiCalm.testVoice(function (ok, message) {
        result.textContent = message;
      });
    }});
    return el('div', { style: 'padding:12px 0 4px' }, [btn, result]);
  }

  /* The paper version of the app, for the hours the phone is locked away.
     Both weeks, because she cannot check which one it is without the app. */
  function showCard() {
    var rooms = D.DAY_KEYS.slice(0, 5).map(function (k) {
      return el('tr', {}, [el('th', { text: D.DAY_NAMES[k].slice(0, 3) })].concat(
        ['w1', 'w2'].map(function (wk) {
          var day = S.state.timetable[wk][k] || { lessons: [] };
          var txt = (day.lessons || []).map(function (l) {
            return l ? (l.subject.slice(0, 4) + (l.room ? ' ' + l.room : ' ?')) : '—';
          }).join(' · ');
          return el('td', { text: txt || '—' });
        })
      ));
    });

    U.openOverlay('Her pocket card', [
      el('div', { class: 'print-card' }, [
        el('h3', { text: (S.state.profile.name || 'Andi') + ' — where to be' }),
        el('p', { class: 'small', text: 'Form: ' + (S.state.profile.formTutor || '') +
          ', room ' + (S.state.profile.formRoom || '') + '.  Line up 08:30. Break 10:40. Lunch 12:00. Home 15:00.' }),
        el('table', { class: 'card-table' }, [
          el('thead', {}, [el('tr', {}, [el('th', { text: '' }), el('th', { text: 'Week 1' }), el('th', { text: 'Week 2' })])]),
          el('tbody', {}, rooms)
        ]),
        el('p', { class: 'small', text: 'Lessons in order: 08:35, 09:40, 11:00, 12:30, 13:30.' }),

        el('h3', { style: 'margin-top:18px', text: 'When it is too much' }),
        el('ol', {}, [
          el('li', { text: 'Ear defenders on, or hood up. You are allowed.' }),
          el('li', { text: 'Show your card. Go to the agreed room.' }),
          el('li', { text: 'Breathe out slowly, longer than you breathe in. Ten times.' }),
          el('li', { text: 'Thumb to each fingertip. One, two, three, four. Other hand.' }),
          el('li', { text: '5 things you can see. 4 you can touch. 3 you can hear.' }),
          el('li', { text: 'Stay until your body slows down. There is no time limit.' })
        ]),

        el('h3', { style: 'margin-top:18px', text: 'Sentences that work' }),
        el('ul', {}, [
          el('li', { text: 'Lost: "Please can you point me to room ___?"' }),
          el('li', { text: 'Need to leave: "I need to go to the SRB room, please."' }),
          el('li', { text: 'Lunch scanner: "It is not scanning, please can you look me up?"' }),
          el('li', { text: 'Forgot something: "I have forgotten my ___, sorry."' }),
          el('li', { text: 'Plan changed: "What are we doing instead?"' })
        ]),
        el('p', { class: 'small', style: 'margin-top:14px', text:
          'You only have to get through today. Not the whole of high school.' })
      ]),
      el('div', { class: 'btn-row no-print', style: 'margin-top:18px' }, [
        U.btn('Print', { variant: 'primary', onClick: function () { window.print(); } })
      ]),
      el('p', { class: 'small muted no-print', style: 'margin-top:10px', text:
        'Print it, fold it, and put it where she will actually find it. Worth laminating — it will live in a blazer pocket.' })
    ]);
  }

  /* ---------- field builders ---------- */

  function textField(labelText, value, onSave, hint) {
    var input = el('input', { type: 'text', value: value || '' });
    input.addEventListener('change', function () { onSave(input.value.trim()); });
    return el('div', { class: 'field' }, [
      el('label', { text: labelText }),
      hint ? el('p', { class: 'hint', text: hint }) : null,
      input
    ]);
  }

  function timeField(labelText, value, onSave, hint) {
    var input = el('input', { type: 'time', value: value || '' });
    input.addEventListener('change', function () { onSave(input.value); });
    return el('div', { class: 'field' }, [
      el('label', { text: labelText }),
      hint ? el('p', { class: 'hint', text: hint }) : null,
      input
    ]);
  }

  function dateField(labelText, value, onSave, hint) {
    var input = el('input', { type: 'date', value: value || '' });
    input.addEventListener('change', function () { onSave(input.value); });
    return el('div', { class: 'field' }, [
      el('label', { text: labelText }),
      hint ? el('p', { class: 'hint', text: hint }) : null,
      input
    ]);
  }

  function switchRow(title, sub, on, onToggle) {
    var sw = el('button', { type: 'button', class: 'switch', role: 'switch', 'aria-checked': on ? 'true' : 'false' });
    sw.addEventListener('click', function () {
      var next = sw.getAttribute('aria-checked') !== 'true';
      sw.setAttribute('aria-checked', next ? 'true' : 'false');
      onToggle(next);
    });
    return el('div', { class: 'switch-row' }, [
      el('div', { class: 'switch-text' }, [el('span', { text: title }), sub ? el('small', { text: sub }) : null]),
      sw
    ]);
  }

  function sizeChip(name, scale) {
    var on = Math.abs((S.state.settings.fontScale || 1) - scale) < 0.01;
    return el('button', { type: 'button', class: 'chip', 'aria-pressed': on ? 'true' : 'false',
      onclick: function () {
        S.state.settings.fontScale = scale; S.save(); applyDisplay();
        render(document.getElementById('settingsBody'));
      }}, [name]);
  }

  function themeChip(name, value) {
    var on = (S.state.settings.theme || 'auto') === value;
    return el('button', { type: 'button', class: 'chip', 'aria-pressed': on ? 'true' : 'false',
      onclick: function () {
        S.state.settings.theme = value; S.save(); applyDisplay();
        render(document.getElementById('settingsBody'));
      }}, [name]);
  }

  /* ---------- list editor ---------- */

  function listEditor(list, prefix, root, withTimes) {
    var wrap = el('div', {});

    function draw() {
      U.clear(wrap);
      list.forEach(function (item, idx) {
        var text = el('input', { type: 'text', value: item.label, 'aria-label': 'Step name' });
        text.addEventListener('change', function () {
          item.label = text.value.trim() || item.label; S.save();
        });

        var row = [text];

        if (withTimes) {
          var mins = el('input', {
            type: 'number', min: '0', max: '240', value: String(item.mins || 0),
            'aria-label': 'Minutes after waking', style: 'width:88px;flex:none'
          });
          mins.addEventListener('change', function () {
            item.mins = Math.max(0, parseInt(mins.value, 10) || 0); S.save();
          });
          row.push(mins);
        }

        row.push(el('button', {
          type: 'button', class: 'icon-btn', 'aria-label': 'Move "' + item.label + '" up',
          onclick: function () {
            if (idx === 0) return;
            var tmp = list[idx - 1]; list[idx - 1] = list[idx]; list[idx] = tmp;
            S.save(); draw();
          }
        }, ['↑']));

        row.push(el('button', {
          type: 'button', class: 'icon-btn', 'aria-label': 'Delete "' + item.label + '"',
          onclick: function () {
            list.splice(idx, 1); S.save(); draw();
          }
        }, ['✕']));

        wrap.appendChild(el('div', { class: 'edit-row' }, row));
      });

      var newInput = el('input', { type: 'text', placeholder: 'Add something…', 'aria-label': 'New item' });
      function add() {
        var v = newInput.value.trim();
        if (!v) return;
        var item = { id: prefix + '-' + Date.now(), label: v, note: '' };
        if (withTimes) {
          var last = list.length ? (list[list.length - 1].mins || 0) : 0;
          item.mins = last + 5;
        }
        list.push(item);
        S.save();
        newInput.value = '';
        draw();
      }
      newInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); add(); } });

      wrap.appendChild(el('div', { class: 'edit-row', style: 'margin-top:12px' }, [
        newInput,
        el('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Add', onclick: add }, ['＋'])
      ]));
    }

    draw();
    return wrap;
  }

  /* ---------- the week ----------
     Two layers, because the school runs a fortnight but life does not:
     "Every week" for things like swimming, then Week 1 and Week 2 for the
     school timetable on top. */

  var weekTab = 'every';

  function weekCard(root) {
    var today = S.dayPlan(new Date());

    var tabs = el('div', { class: 'chips', style: 'margin-bottom:16px' }, [
      weekTab === 'every' ? null : null,
      tabChip('Every week', 'every', root),
      tabChip('Week 1', 'w1', root),
      tabChip('Week 2', 'w2', root)
    ]);

    var body = el('div', {}, D.DAY_KEYS.map(function (k) { return dayEditor(k, weekTab, root); }));

    var whichNow = el('div', { class: 'card', style: 'background:var(--bg-sunk);box-shadow:none' }, [
      el('p', { style: 'margin:0 0 6px;font-weight:650',
        text: 'Right now the app thinks this is Week ' + today.week + '.' }),
      el('p', { class: 'small muted', style: 'margin:0 0 12px', text:
        'Week 1 started on ' + (S.state.settings.weekOneStart || '—') + '. School weeks run Monday to Friday, so a term starting on a Thursday makes that Thursday and Friday Week 1, and the Monday after Week 2. Not every school counts it that way.' }),
      U.btn('No — this should be Week ' + (today.week === 1 ? 2 : 1), { small: true, onClick: function () {
        S.swapWeeks();
        U.toast('Swapped. This is now Week ' + S.dayPlan(new Date()).week + '.');
        render(root);
      }})
    ]);

    return U.card('The week', [
      el('p', { class: 'card-sub', text:
        'Put swimming, clubs and anything else weekly under "Every week". Put the school\'s two-week timetable under Week 1 and Week 2. A day shows both.' }),
      el('p', { class: 'card-sub', text:
        'Two kinds of kit: things for her school bag go in the first box, and things she sorts out at home afterwards — swimming, gym — go in the second, so they turn up on the after-school list instead of being carried around all day.' }),
      whichNow,
      tabs,
      body
    ], { ico: '📅' });
  }

  function tabChip(label, value, root) {
    return el('button', {
      type: 'button', class: 'chip', 'aria-pressed': weekTab === value ? 'true' : 'false',
      onclick: function () { weekTab = value; render(root); }
    }, [label]);
  }

  function dayEditor(key, layer, root) {
    var day = S.state.timetable[layer][key];
    var isEvery = layer === 'every';
    var rows = [];

    if (isEvery) {
      var schoolSw = el('button', { type: 'button', class: 'switch', role: 'switch',
        'aria-checked': day.school ? 'true' : 'false', 'aria-label': 'School on ' + D.DAY_NAMES[key] });
      schoolSw.addEventListener('click', function () {
        day.school = !day.school;
        schoolSw.setAttribute('aria-checked', day.school ? 'true' : 'false');
        S.save();
      });
      rows.push(el('div', { class: 'switch-row', style: 'border:0;padding:0 0 8px' }, [
        el('div', { class: 'switch-text' }, [
          el('span', { style: 'font-weight:650', text: D.DAY_NAMES[key] }),
          el('small', { text: 'A school day' })
        ]),
        schoolSw
      ]));
    } else {
      rows.push(el('p', { style: 'font-weight:650;margin:0 0 8px', text: D.DAY_NAMES[key] }));
    }

    var note = el('input', { type: 'text', value: day.note || '',
      placeholder: isEvery ? 'Note, e.g. Swimming after school' : 'Note, e.g. PE and Food tech',
      'aria-label': D.DAY_NAMES[key] + ' note' });
    note.addEventListener('change', function () { day.note = note.value.trim(); S.save(); });

    var extras = el('input', { type: 'text', value: (day.extras || []).join(', '),
      placeholder: 'Things to take, comma separated',
      'aria-label': D.DAY_NAMES[key] + ' extra things' });
    extras.addEventListener('change', function () {
      day.extras = extras.value.split(',').map(function (x) { return x.trim(); }).filter(Boolean);
      S.save();
    });

    var homeExtras = el('input', { type: 'text', value: (day.homeExtras || []).join(', '),
      placeholder: 'Kit for after school, comma separated',
      'aria-label': D.DAY_NAMES[key] + ' after-school kit' });
    homeExtras.addEventListener('change', function () {
      day.homeExtras = homeExtras.value.split(',').map(function (x) { return x.trim(); }).filter(Boolean);
      S.save();
    });

    rows.push(note, el('div', { style: 'height:8px' }), extras,
              el('div', { style: 'height:8px' }), homeExtras);

    if (!isEvery) {
      /* One lesson per line, "Subject, Room, Teacher". Which line it is on is
         which period it is, so a blank line is a free period. Easier to type on
         a phone than any grid, and it reads like the paper timetable. */
      var lessonBox = el('textarea', {
        style: 'margin-top:8px;min-height:96px',
        placeholder: 'Five lines, one per period: Subject, Room, Teacher. Leave a line blank for a period with nothing on it.',
        'aria-label': D.DAY_NAMES[key] + ' lessons'
      });
      lessonBox.value = (day.lessons || []).map(function (l) {
        return l ? [l.subject, l.room || (l.tbc ? '?' : ''), l.teacher].filter(Boolean).join(', ') : '';
      }).join('\n');
      lessonBox.addEventListener('change', function () {
        day.lessons = lessonBox.value.split('\n').slice(0, 5).map(function (line) {
          var bits = line.split(',').map(function (x) { return x.trim(); });
          if (!bits[0]) return null;
          var unknownRoom = bits[1] === '?';
          return { subject: bits[0], room: unknownRoom ? '' : (bits[1] || ''),
                   teacher: bits[2] || '', tbc: unknownRoom || undefined };
        });
        S.save();
      });
      rows.push(lessonBox);
    }

    return el('div', { style: 'padding:12px 0;border-bottom:1px solid var(--line)' }, rows);
  }

  /* ---------- display settings ---------- */

  function applyDisplay() {
    var s = S.state.settings;
    document.documentElement.style.setProperty('--font-scale', String(s.fontScale || 1));
    document.documentElement.setAttribute('data-theme', s.theme === 'auto' ? '' : s.theme);
    if (s.theme === 'auto') document.documentElement.removeAttribute('data-theme');
    document.body.setAttribute('data-dyslexic', s.dyslexicFont ? 'on' : 'off');
    document.body.setAttribute('data-motion', s.motion ? 'on' : 'off');
  }

  /* ---------- backup ---------- */

  function exportData() {
    try {
      var blob = new Blob([JSON.stringify(S.state, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = el('a', { href: url, download: 'andis-day-backup-' + S.dayKey() + '.json' });
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      U.toast('Backup saved to your downloads.');
    } catch (e) {
      U.toast('Could not save the file on this browser.');
    }
  }

  function importData() {
    var input = el('input', { type: 'file', accept: 'application/json,.json', style: 'display:none' });
    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var data = JSON.parse(String(reader.result));
          if (!data || !data.routines || !data.settings) throw new Error('not ours');
          localStorage.setItem('andi-day-v1', JSON.stringify(data));
          U.toast('Restored. Reloading…');
          setTimeout(function () { location.reload(); }, 900);
        } catch (e) {
          U.toast('That file did not look like a backup.');
        }
      };
      reader.readAsText(file);
    });
    document.body.appendChild(input);
    input.click();
    setTimeout(function () { if (input.parentNode) input.parentNode.removeChild(input); }, 60000);
  }

  return { render: render, applyDisplay: applyDisplay };
})(window.AndiData, window.AndiStore, window.AndiUI);
