/* data.js — the default content Andi starts with.
   Everything here can be edited in Settings; these are only the seeds.
   Times in routines are stored as "minutes after wake-up" so that changing
   the wake time in Settings shifts the whole morning automatically. */

window.AndiData = (function () {
  'use strict';

  var DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  var DAY_NAMES = {
    mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
    fri: 'Friday', sat: 'Saturday', sun: 'Sunday'
  };

  /* ---------- routines ---------- */

  /* Uniform goes on after breakfast and teeth, so it does not collect cereal
     or toothpaste on the way out. */
  var morning = [
    { id: 'm-wake',    mins: 0,  label: 'Alarm off, sit up',        note: 'Feet on the floor. That is the whole job for now.' },
    { id: 'm-loo',     mins: 5,  label: 'Loo and wash your face',   note: '' },
    { id: 'm-break',   mins: 12, label: 'Breakfast and a drink',    note: 'Still in your pyjamas — uniform goes on after.' },
    { id: 'm-meds',    mins: 25, label: 'Vitamin',                  note: '' },
    { id: 'm-teeth',   mins: 28, label: 'Teeth',                    note: '' },
    { id: 'm-dress',   mins: 32, label: 'Get dressed',              note: 'Uniform is already out from last night.' },
    { id: 'm-hair',    mins: 44, label: 'Hair',                     note: '' },
    { id: 'm-bag',     mins: 48, label: 'Check your bag',           note: 'Tap here to see today’s list.', link: 'bag' },
    { id: 'm-calm',    mins: 53, label: 'One minute of breathing',  note: 'Before the front door, not after.', link: 'breathing' },
    { id: 'm-shoes',   mins: 56, label: 'Shoes and coat',           note: '' },
    { id: 'm-go',      mins: 60, label: 'Out of the door',          note: 'Lined up at school for 08:30. You have got everything — it is done.' }
  ];

  var afterSchool = [
    { id: 'a-in',      label: 'Shoes off, bag down',        note: 'You are home. Nothing else is needed yet.' },
    { id: 'a-snack',   label: 'Snack and a drink',          note: '' },
    { id: 'a-quiet',   label: '20 minutes of nothing',      note: 'No questions, no jobs. This one is compulsory.' },
    { id: 'a-lunch',   label: 'Lunchbox into the kitchen',  note: '' },
    { id: 'a-planner', label: 'Check your planner',         note: 'Any homework? Any letters for Mum?' },
    { id: 'a-hw',      label: 'Homework',                   note: 'Set a timer. Stop when it goes off.' },
    { id: 'a-pack',    label: 'Pack tomorrow’s bag',   note: 'Tap for tomorrow’s list.', link: 'bag' },
    { id: 'a-tell',    label: 'Tell Mum one thing',         note: 'Good or bad or boring. Any one thing.' }
  ];

  var bedtime = [
    { id: 'b-uniform', label: 'Uniform out for tomorrow',   note: 'Blazer or jumper, white shirt, tie, black trousers or skirt, black shoes, socks, phone pouch.' },
    { id: 'b-bagdoor', label: 'Bag by the door',            note: '' },
    { id: 'b-shower',  label: 'Shower or bath',             note: '' },
    { id: 'b-teeth',   label: 'Teeth',                      note: '' },
    { id: 'b-charge',  label: 'Phone on charge',            note: '' },
    { id: 'b-screens', label: 'Screens down',               note: 'Brain needs a bit of boring before sleep.' },
    { id: 'b-calm',    label: 'Body scan or a story',       note: 'Tap for the sleepy body scan.', link: 'med:sleep' },
    { id: 'b-light',   label: 'Light off',                  note: 'Tomorrow is already sorted. You did that.' }
  ];

  /* ---------- bag ---------- */

  var bagBase = [
    { id: 'g-planner',  label: 'Planner' },
    { id: 'g-pencil',   label: 'Pencil case' },
    { id: 'g-book',     label: 'Reading book' },
    { id: 'g-tt',       label: 'Paper timetable and calm card' },
    { id: 'g-water',    label: 'Water bottle' },
    { id: 'g-phone',    label: 'Phone (charged)' },
    { id: 'g-pouch',    label: 'Phone pouch' },
    { id: 'g-ear',      label: 'Ear defenders or earbuds' },
    { id: 'g-fidget',   label: 'Fidget' },
    { id: 'g-card',     label: 'Time-out card' },
    { id: 'g-coat',     label: 'Coat' }
  ];

  var firstDayExtras = [
    { id: 'f-map',    label: 'Map of the school' },
    { id: 'f-name',   label: 'Name of your form tutor written down' },
    { id: 'f-snack',  label: 'An extra snack' },
    { id: 'f-comfort',label: 'Something small from home in your pocket' }
  ];

  /* The school runs a rolling two-week timetable, so a single repeating week
     cannot describe it. Each weekday therefore has two layers:

       every  — things that happen every week whatever the school week is
                (swimming, clubs, whether it is a school day at all)
       w1/w2  — the school's Week 1 and Week 2 timetable on top of that

     A day's list is "every" plus whichever of w1/w2 today falls in. Weekly
     things go in once, not twice, and the fortnightly timetable sits over it. */

  function blankWeek() {
    var w = {};
    DAY_KEYS.forEach(function (k) { w[k] = { note: '', extras: [], homeExtras: [], lessons: [] }; });
    return w;
  }

  /* The shape of every school day at Open Academy. Lessons slot into the five
     periods; everything else is the same every day. Breaks are in here because
     knowing exactly when the day lets up is worth as much to an anxious child
     as knowing what the lessons are. */
  var DAY_SHAPE = [
    { time: '08:30', kind: 'fixed',  label: 'Line up and tutor check-in' },
    { time: '08:35', kind: 'lesson', period: 1 },
    { time: '09:40', kind: 'lesson', period: 2 },
    { time: '10:40', kind: 'break',  label: 'Break' },
    { time: '11:00', kind: 'lesson', period: 3 },
    { time: '12:00', kind: 'break',  label: 'Lunch' },
    { time: '12:30', kind: 'lesson', period: 4 },
    { time: '13:30', kind: 'lesson', period: 5 },
    { time: '14:30', kind: 'fixed',  label: 'Collective worship' },
    { time: '14:40', kind: 'fixed',  label: 'Form time' },
    { time: '15:00', kind: 'end',    label: 'End of the school day' },
    { time: '15:00', kind: 'option', label: 'Hubs and clubs, if you are going' }
  ];

  /* Lessons are stored by period: position in the array is the period number,
     so an empty slot is a period with nothing timetabled. Rooms are in here
     because "what if I get lost" is one of her real worries, and a room code
     in her pocket answers it faster than asking a stranger in a corridor. */
  function lesson(subject, room, teacher) {
    return { subject: subject, room: room || '', teacher: teacher || '' };
  }

  /* A lesson we know is happening but whose room and teacher are not settled —
     Maths, until she is put into a set. Shown as known-but-unconfirmed rather
     than as a blank, so she does not think she has a free period, and not as a
     normal lesson either, so an unknown room does not read as a promise. */
  function tbc(subject, why) {
    return { subject: subject, room: '', teacher: why || '', tbc: true };
  }

  var MATHS = function () { return tbc('Maths', 'Set not confirmed yet'); };
  var free = null;

  /* Spelled out rather than "PE kit": one tick against an unopened bag is how
     half of it gets left at home. */
  var PE_KIT = [
    'Black skort, leggings or tracksuit bottoms',
    'Black PE t-shirt',
    'PE tracksuit top',
    'Trainers',
    'Clean black socks for afterwards'
  ];

  var SWIM_KIT = [
    'Swim bag — costume, goggles, hat, towel, clean underwear',
    'Kit bag — fins, float, kick-board',
    'Water bottle, freshly made'
  ];

  /* The school runs a rolling two-week timetable, so a single repeating week
     cannot describe it. Each weekday therefore has two layers:

       every  — things that happen every week whatever the school week is
                (swimming, gym, whether it is a school day at all)
       w1/w2  — the school's Week 1 and Week 2 timetable on top of that

     A day's list is "every" plus whichever of w1/w2 today falls in. Weekly
     things go in once, not twice, and the fortnightly timetable sits over it.

     Week 1 and Week 2 are read off the school app's export for 3-25 September,
     confirmed by the fortnight repeating exactly: Thursday the 3rd matches the
     17th, Friday the 4th the 18th, Monday the 7th the 21st. */

  var timetable = {
    every: {
      mon: { school: true,  note: 'Gym at 7pm — strength and conditioning (Purple)',
             extras: [], homeExtras: ['Gym kit and trainers', 'Water bottle, freshly made'] },
      tue: { school: true,  note: 'Swimming at 7pm · three of the four pool sessions is plenty',
             extras: [], homeExtras: SWIM_KIT.slice() },
      wed: { school: true,  note: '', extras: [], homeExtras: [] },
      thu: { school: true,  note: '', extras: [], homeExtras: [] },
      fri: { school: true,  note: 'Swimming at 6.30pm · three of the four pool sessions is plenty',
             extras: [], homeExtras: SWIM_KIT.slice() },
      sat: { school: false, note: 'Swimming at 12pm · three of the four pool sessions is plenty',
             extras: [], homeExtras: SWIM_KIT.slice() },
      sun: { school: false, note: 'Swimming at 2pm · three of the four is plenty. Pack for Monday.',
             extras: [], homeExtras: SWIM_KIT.slice() }
    },

    w1: (function () {
      var w = blankWeek();
      w.mon.lessons = [
        lesson('Geography', 'S40', 'Mr Mundy'),
        lesson('Spanish', 'F27', 'Mrs Mcvoy'),
        MATHS(),
        lesson('English', 'F38', 'Mrs Roberts'),
        lesson('Religious Studies', 'F23', 'Mr Thurston')
      ];
      w.tue.lessons = [
        lesson('Music', 'F67', 'Mr Corfield'),
        lesson('Spanish', 'F27', 'Mrs Mcvoy'),
        lesson('English', 'F38', 'Mrs Roberts'),
        lesson('PE', 'G69', 'Mr Lambert'),
        lesson('History', 'S43', 'Mr Crawford')
      ];
      w.tue.note = 'PE straight after lunch';
      w.tue.extras = PE_KIT.slice();
      w.wed.lessons = [
        lesson('Science', 'G18', 'Mr Stephen'),
        lesson('Religious Studies', 'F23', 'Mr Thurston'),
        lesson('English', 'F38', 'Mrs Roberts'),
        lesson('PSHE', 'G13', 'Mrs Power'),
        lesson('History', 'S43', 'Mr Crawford')
      ];
      w.thu.lessons = [
        lesson('Science', 'G14', 'Mr Wilkinson'),
        lesson('Science', 'G18', 'Mr Stephen'),
        MATHS(),
        lesson('English', 'F38', 'Mrs Roberts'),
        lesson('Art', 'F23', 'Mr Thurston')
      ];
      w.fri.lessons = [
        lesson('Food', 'G32', 'Miss Luter'),
        lesson('Food', 'G32', 'Miss Luter'),
        MATHS(),
        lesson('PE', 'G69', 'Mr Wilkinson'),
        lesson('Performing Arts', 'F41', 'Mr Dilley')
      ];
      w.fri.note = 'Food tech first thing (double), then PE after lunch';
      w.fri.extras = ['Food ingredients', 'A container to bring it home'].concat(PE_KIT);
      return w;
    })(),

    w2: (function () {
      var w = blankWeek();
      w.mon.lessons = [
        MATHS(),
        lesson('History', 'S43', 'Mr Crawford'),
        MATHS(),
        lesson('PE', 'G69', 'Mr Lambert'),
        lesson('English', 'F38', 'Mrs Roberts')
      ];
      w.mon.note = 'PE straight after lunch';
      w.mon.extras = PE_KIT.slice();
      w.tue.lessons = [
        lesson('Geography', 'S40', 'Mr Mundy'),
        lesson('Spanish', 'F27', 'Mrs Mcvoy'),
        MATHS(),
        lesson('English', 'F38', 'Mrs Roberts'),
        MATHS()
      ];
      w.wed.lessons = [
        lesson('PE', 'G69', 'Mr Wilkinson'),
        lesson('Spanish', 'F27', 'Mrs Mcvoy'),
        lesson('ICT', 'S58', 'Mr Dilley'),
        lesson('Geography', 'S40', 'Mr Mundy'),
        lesson('English', 'F38', 'Mrs Roberts')
      ];
      w.wed.note = 'PE is first thing — kit on before you leave if that is easier';
      w.wed.extras = PE_KIT.slice();
      w.thu.lessons = [
        lesson('Science', 'G18', 'Mr Stephen'),
        lesson('English', 'F38', 'Mrs Roberts'),
        MATHS(),
        lesson('History', 'S43', 'Mr Crawford'),
        lesson('Art', 'F23', 'Mr Thurston')
      ];
      w.fri.lessons = [
        lesson('Science', 'G14', 'Mr Wilkinson'),
        lesson('Music', 'F67', 'Mr Corfield'),
        MATHS(),
        lesson('Design Technology', 'G25', 'KRE'),
        MATHS()
      ];
      return w;
    })()
  };

  /* ---------- breathing patterns ---------- */

  var breathing = [
    { id: 'square', name: 'Square breathing', sub: 'In 4, hold 4, out 4, hold 4',
      steps: [['In', 4], ['Hold', 4], ['Out', 4], ['Hold', 4]], rounds: 6 },
    { id: 'long',   name: 'Long breath out', sub: 'In 4, out 6 — good for a racing heart',
      steps: [['In', 4], ['Out', 6]], rounds: 8 },
    { id: 'sleep',  name: 'Sleepy breathing', sub: 'In 4, hold 7, out 8',
      steps: [['In', 4], ['Hold', 7], ['Out', 8]], rounds: 5 },
    { id: 'quick',  name: 'Quick reset', sub: 'In 3, out 5 — under a minute',
      steps: [['In', 3], ['Out', 5]], rounds: 6 }
  ];

  /* ---------- grounding ---------- */

  var grounding = [
    { prompt: 'Find 5 things you can see.',   hint: 'Say them in your head or out loud. Boring things count.' },
    { prompt: 'Find 4 things you can touch.', hint: 'Your sleeve, the chair, your own hands.' },
    { prompt: 'Find 3 things you can hear.',  hint: 'Even the hum of the lights.' },
    { prompt: 'Find 2 things you can smell.', hint: 'Or two smells you like, if there is nothing.' },
    { prompt: 'Find 1 thing you can taste.',  hint: 'Or one thing you would like to taste later.' },
    { prompt: 'Now take one slow breath out.', hint: 'You are here. You are in the room. Nothing bad happened in the last minute.' }
  ];

  /* ---------- meditations ----------
     Each line: [text, seconds to rest on that line]. Written plainly and
     concretely on purpose. Nothing asks her to close her eyes without an
     opt-out, and nothing asks her to "empty her mind". */

  var meditations = [
    {
      id: 'morning', name: 'Before school', mins: 3, ico: '☀️',
      sub: 'For the wobbly bit before you leave.',
      lines: [
        ['Sit down somewhere. You can close your eyes or look at one spot on the floor. Both work.', 6],
        ['Put one hand on your tummy.', 5],
        ['Breathe in slowly, and feel your hand move out.', 7],
        ['Breathe out slowly, longer than you breathed in.', 8],
        ['Again. In…', 5],
        ['And out. Long and slow.', 8],
        ['Your body might feel jittery. That is only your body getting ready. It is not a warning.', 8],
        ['Today is one day. It has a start and it has an end, and you come back here at the end of it.', 9],
        ['Think of one thing today that is already sorted. Your bag is packed. That is one.', 8],
        ['Two more slow breaths, at your own speed.', 12],
        ['Now put your feet flat on the floor and press them down.', 7],
        ['You are ready enough. Ready enough is allowed.', 7]
      ]
    },
    {
      id: 'loud', name: 'It is too loud', mins: 2, ico: '🎧',
      sub: 'Corridors, the dining hall, too many people.',
      lines: [
        ['If you can, put your ear defenders on now, or your hood up.', 6],
        ['Look down at your hands. Only your hands.', 6],
        ['Breathe out slowly. Do not worry about breathing in — that happens on its own.', 8],
        ['Press your thumb into each fingertip, one at a time. One. Two. Three. Four.', 10],
        ['Now the other hand. One. Two. Three. Four.', 10],
        ['The noise is still there. You do not have to make it stop. You only have to get through the next minute.', 9],
        ['Breathe out slowly again.', 7],
        ['If you need to leave, you are allowed to leave. Show your card and go.', 8],
        ['You are not being dramatic. Your ears really are working harder than other people’s.', 8],
        ['One more slow breath out. Then take one step.', 8]
      ]
    },
    {
      id: 'worry', name: 'The worry cloud', mins: 4, ico: '☁️',
      sub: 'When the same thought keeps coming back.',
      lines: [
        ['Get comfortable. You do not have to sit up straight.', 6],
        ['Take one slow breath in, and a longer one out.', 9],
        ['Now think of the worry. Just once. Do not push it away.', 8],
        ['Say it in your head in a short way. Like a label. "Worried about lunch."', 9],
        ['Now picture that label written on a cloud, floating past the window.', 9],
        ['You are not the cloud. You are the person watching the sky.', 8],
        ['The cloud does not need chasing. It moves on by itself.', 8],
        ['Another thought will come. That is fine. Put it on a cloud too.', 9],
        ['Breathe out slowly.', 8],
        ['Worries are not warnings. Your brain is a very good smoke alarm that goes off when you make toast.', 10],
        ['The worry can stay. It just does not get to drive.', 8],
        ['Two more slow breaths, and then you can open your eyes.', 12],
        ['If it is still loud when you get home, write it down in the Worry Box and let the app hold it for a while.', 8]
      ]
    },
    {
      id: 'safe', name: 'My safe place', mins: 4, ico: '🏡',
      sub: 'Build a place in your head you can go to anywhere.',
      lines: [
        ['Think of a place where you feel completely fine. Real or made up. Your bed, a beach, a room in a game.', 10],
        ['You do not have to see it clearly. Knowing about it is enough.', 8],
        ['What is under your feet there? Carpet, sand, grass?', 9],
        ['What is the light like? Bright, or dim and cosy?', 9],
        ['Is there a sound there? Or is it quiet?', 9],
        ['Is there anything soft to hold or lean on?', 9],
        ['Add one more thing you would like to be there. Anything you want. It is your place.', 10],
        ['Nobody comes in here unless you say so.', 8],
        ['Breathe in slowly, and out slowly, while you stand in it.', 12],
        ['This place does not disappear when you stop thinking about it. It waits.', 8],
        ['You can come back at your desk, on the bus, in a corridor. Nobody can tell you are here.', 9],
        ['Take one more breath, then come back to the room slowly.', 10]
      ]
    },
    {
      id: 'sleep', name: 'Sleepy body scan', mins: 6, ico: '🌙',
      sub: 'For lying in bed when your brain will not stop.',
      lines: [
        ['Lie down however you are comfortable. Duvet on or off.', 8],
        ['You do not have to fall asleep. Resting counts. Take that job off yourself.', 9],
        ['Take one long breath out, like a sigh.', 9],
        ['Notice your feet. Not doing anything to them. Just noticing them.', 10],
        ['Let them be heavy.', 8],
        ['Now your legs. Heavy, sinking into the bed.', 10],
        ['Your tummy. Let it be soft. It does not have to be held in.', 10],
        ['Your back, held up by the bed. The bed is doing the work now, not you.', 10],
        ['Your hands. Let your fingers uncurl.', 10],
        ['Your arms, heavy at your sides.', 9],
        ['Your shoulders. Let them drop away from your ears.', 10],
        ['Your jaw. Let your teeth come apart a little.', 9],
        ['Your forehead. Let it be smooth.', 9],
        ['If your brain is still talking, that is alright. Let it talk in the background, like a telly in another room.', 11],
        ['Breathe out slowly.', 9],
        ['Today is finished. All of it. Even the bits that went wrong — they are finished too.', 10],
        ['Tomorrow is already packed and ready by the door.', 9],
        ['Nothing needs sorting out tonight.', 9],
        ['Heavy feet. Heavy legs. Heavy arms. Soft face.', 12],
        ['Stay here as long as you like. I will stop talking now.', 12]
      ]
    },
    {
      id: 'test', name: 'Before a test or reading out', mins: 2, ico: '✏️',
      sub: 'For when everyone is going to look at you.',
      lines: [
        ['Put both feet flat on the floor and press down.', 7],
        ['Breathe in for four. One, two, three, four.', 8],
        ['Out for six. One, two, three, four, five, six.', 10],
        ['Your heart is beating fast. That is the right thing for your body to do. It is helping.', 9],
        ['Shaky hands do not mean you do not know it.', 8],
        ['You only have to do the next bit. Not the whole thing. The next question. The next line.', 9],
        ['If you go blank, that is allowed. Breathe out, look at the page, start again.', 9],
        ['One more long breath out.', 9],
        ['Nobody is watching as closely as it feels. They are all thinking about themselves.', 9],
        ['Alright. Next bit only.', 7]
      ]
    },
    {
      id: 'badday', name: 'Today went wrong', mins: 3, ico: '🧡',
      sub: 'For after a hard day, when you feel awful about it.',
      lines: [
        ['Sit down. You do not have to talk to anyone yet.', 7],
        ['Breathe out slowly. Longer than you think.', 9],
        ['Something happened today and it felt terrible. That was real. You are not making a fuss.', 10],
        ['Put your hand on your chest, if you like that. Or hold something soft.', 9],
        ['Say this in your head: that was hard, and I got through it.', 9],
        ['Hard days do not mean you are bad at school. They mean the day was hard.', 9],
        ['You would not tell a friend they had ruined everything. Do not say it to yourself either.', 10],
        ['Tomorrow is a different day with different lessons and different people in a different mood.', 10],
        ['You are allowed to have needed help today.', 8],
        ['Two slow breaths, then go and find your person and tell them one sentence about it.', 12]
      ]
    }
  ];

  /* ---------- "what if" plans ----------
     Pre-decided answers to the school worries that actually come up, so she
     does not have to work them out while panicking. */

  var plans = [
    { id: 'lost', q: 'What if I get lost?', ico: '🗺️', steps: [
      'Stop walking. Stand to one side of the corridor so you are not in the way.',
      'Look at your timetable and find the room code.',
      'Ask any adult, or any student in older uniform: "Please can you point me to room ___?"',
      'If you cannot ask, go back to reception or the SRB room. They will walk you there.',
      'Being late because you got lost is not a punishment thing in the first weeks. Say "I got lost" and sit down.'
    ]},
    { id: 'loud', q: 'What if it gets too loud or too much?', ico: '🔊', steps: [
      'Ear defenders on, or hood up, or hands over ears. You are allowed.',
      'Show your time-out card and go to the agreed place.',
      'Your phone is pouched, so do it from memory: breathe out slowly, longer than you breathe in. Ten of those.',
      'Then press your thumb into each fingertip in turn. One, two, three, four. Other hand. Again.',
      'Stay until your body slows down. There is no time limit on this.',
      'You do not owe anyone an explanation while you are still overloaded.'
    ]},
    { id: 'lunch', q: 'What if I do not know where to sit at lunch?', ico: '🍎', steps: [
      'Find out on day one where the quiet lunch room or club is. Most schools have one.',
      'Sitting on the end of a table is completely normal. Nobody is scoring it.',
      'You can eat and then leave. You do not have to stay the whole time.',
      'If it is horrible, go to the library or the SRB room instead.',
      'Ask Mum to check with school where you can eat if the hall is too much.'
    ]},
    { id: 'thumb', q: 'What if my thumb does not work at lunch?', ico: '👍', steps: [
      'Your lunch money is on your fingerprint, so there is nothing to carry and nothing to lose.',
      'If the scanner will not read you, it is the scanner, not you. It happens to everyone.',
      'Say: "It is not scanning, please can you look me up?" They can find you by name.',
      'Dry your thumb on your jumper and try once more — wet or cold hands are usually the reason.',
      'You will not be turned away and made to go hungry. That is not a thing that happens.'
    ]},
    { id: 'forgot', q: 'What if I forget something?', ico: '🧳', steps: [
      'Tell the teacher at the start of the lesson, not when you get caught out.',
      'Say: "I have forgotten my ___, sorry." That is the whole sentence.',
      'Most of the time you will be lent one.',
      'It is a small thing. Adults forget things at work every single day.',
      'Add it to the bag list tonight so it does not happen twice.'
    ]},
    { id: 'late', q: 'What if I am late?', ico: '⏰', steps: [
      'Walk in anyway. Late and there beats not there.',
      'Say sorry once, quietly, and sit down.',
      'Do not explain the whole story in front of everyone. You can explain after.',
      'If it was because of anxiety, tell your form tutor or the SRB staff later.'
    ]},
    { id: 'toldoff', q: 'What if a teacher tells me off?', ico: '😐', steps: [
      'Say "sorry" and stop. Do not argue in the moment, even when you are right.',
      'It feels enormous. It usually is not — they say it and forget it.',
      'Write it in your planner if you want to sort it out later.',
      'Tell Mum or the SRB staff if it felt unfair. It can be sorted properly, later, calmly.',
      'One telling-off is not evidence that you are bad at school.'
    ]},
    { id: 'alone', q: 'What if nobody talks to me?', ico: '👥', steps: [
      'Week one, nearly everybody is scared and quiet. It is not about you.',
      'Friendships mostly start sideways — clubs, being next to someone, group work.',
      'One person is plenty. You do not need a group.',
      'Ask a low-stakes question: "What have we got next?" It works.',
      'Some days you will want to be on your own, and that is allowed too.'
    ]},
    { id: 'leave', q: 'What if I need to get out of the room?', ico: '🚪', steps: [
      'Use the time-out card. That is exactly what it is for.',
      'If you have no card, say: "I need to go to the SRB room, please."',
      'You do not have to explain it in front of the class.',
      'Go to the agreed place, not the toilets, so people know where you are.',
      'Come back when you are ready. Going back is easier than it feels.'
    ]},
    { id: 'change', q: 'What if the plan changes?', ico: '🔄', steps: [
      'Cover lessons, room swaps and cancelled clubs happen. It is not aimed at you.',
      'Breathe out. Then ask one question: "What are we doing instead?"',
      'Write the new plan down so your brain can let go of the old one.',
      'It is allowed to feel horrible about a change even when it is a small change.',
      'Give yourself the first ten minutes to feel rubbish. It usually settles after that.'
    ]},
    { id: 'cry', q: 'What if I start crying?', ico: '😢', steps: [
      'Crying is not a disaster and it is not something to be ashamed of.',
      'Show your card, or say "I need a minute", and step out.',
      'Cold water on your wrists, and a long breath out.',
      'It passes faster if you let it happen than if you fight it.',
      'Tell someone afterwards. Do not carry it around all day on your own.'
    ]}
  ];

  /* ---------- feelings check-in ---------- */

  var moods = [
    { id: 'good',  face: '🙂', name: 'Alright',   tip: 'Good. Nothing needed. Carry on.' },
    { id: 'meh',   face: '😐', name: 'Flat',      tip: 'Have a drink and a snack, and go outside for two minutes.' },
    { id: 'worry', face: '😟', name: 'Worried',   tip: 'Try the Worry Box, or "The worry cloud".' },
    { id: 'full',  face: '😵', name: 'Too much',  tip: 'Ear defenders on. Try "It is too loud", or square breathing.' },
    { id: 'sad',   face: '😢', name: 'Sad',       tip: 'Try "Today went wrong", and tell your person one sentence.' }
  ];

  return {
    DAY_KEYS: DAY_KEYS,
    DAY_NAMES: DAY_NAMES,
    morning: morning,
    afterSchool: afterSchool,
    bedtime: bedtime,
    bagBase: bagBase,
    firstDayExtras: firstDayExtras,
    timetable: timetable,
    DAY_SHAPE: DAY_SHAPE,
    breathing: breathing,
    grounding: grounding,
    meditations: meditations,
    plans: plans,
    moods: moods
  };
})();
