# Andi's Day

A small, private app to help Andi through the school day: what to take, what to
do next, and something to reach for when the anxiety gets loud.

Built for a phone or tablet. No account, no sign-up, no internet needed after
the first load, and **nothing she writes ever leaves the device**.

---

## Getting it onto her phone

**Option 1 — the live link (this is the one she uses)**

The app is published with GitHub Pages at:

    https://lisabeyondgrief.github.io/andis-day/

Open that on her phone, then in the browser menu tap **Add to Home Screen**. It
opens like a normal app after that — full screen, own icon, no address bar.

To set Pages up (only needed once): repository → **Settings** → **Pages** →
under *Build and deployment* set Source to **Deploy from a branch**, pick
`main`, folder `/ (root)`, and Save. Give it a minute to build.

**Option 2 — one file, no setup**

Run `node build-single-file.js` to bundle the whole app into a single
self-contained `.html` file you can email to yourself or keep as a backup.
Everything works except the offline caching.

**Option 3 — no internet at all**

Copy this whole folder onto the device and open `index.html`. Everything works
except the offline caching (which it doesn't need, as the files are already
local).

---

## What's in it

**Today** — the home screen. It works out from the clock what she should be
doing and shows only that one thing, plus how far through each list she is. It
counts down to the first day, and on the first day itself it swaps to a card
written for that morning.

**Morning** — the wake-up-to-front-door list with times on it. All the times are
worked out from the wake-up time, so changing that one setting shifts the whole
morning.

**Bag** — what to take, built from the everyday list plus whatever that weekday
needs (PE kit and so on). It flips to "packing for tomorrow" after 2pm, and
anything ticked the night before is still ticked in the morning, so she can see
it's already done.

**Evening** — after-school decompression, homework, and the bedtime list.

**Calm** — the part that matters most:

- **Breathing** — four patterns with a circle that grows and shrinks to breathe
  along with. Square breathing, a long breath out for a racing heart, a sleepy
  one, and a quick reset.
- **5, 4, 3, 2, 1** — grounding, stepped through one sense at a time.
- **Seven meditations**, written plainly for an autistic 11-year-old, not
  adapted from adult scripts: *Before school*, *It is too loud*, *The worry
  cloud*, *My safe place*, *Sleepy body scan*, *Before a test or reading out*,
  and *Today went wrong*. They can be read aloud by the phone's own voice, and
  every one can be stopped at any point without it counting as a failure.
- **Worry box** — she writes the worry down, rates how big it feels, and the app
  holds it so her head doesn't have to. She can flag individual worries to show
  you; the ones she doesn't flag stay private to her.
- **What if…** — ten pre-decided plans for the things that actually go wrong in
  a new secondary school: getting lost, corridors being too loud, nowhere to sit
  at lunch, forgetting something, being late, being told off, nobody talking to
  her, needing to leave the room, the plan changing, starting to cry. Worked out
  in advance so she doesn't have to work them out while panicking.
- **Feelings check-in** — five faces, each suggesting a tool that fits.

**Set up** — for you. Real timetable, real times, and every list is editable.

---

## Set it up before the 3rd

Worth doing in this order:

1. **Set up → Times.** Put in the real wake-up time. The whole morning list
   moves with it.
2. **Set up → The week.** Once the timetable arrives, put in which days need PE
   kit, an instrument, swimming stuff. These appear automatically on the bag
   list on the right day.
3. **Set up → Bag list.** Delete what she doesn't have, add what she does. If
   she gets a time-out card or a lanyard from the SRB, add it.
4. **Set up → Morning routine.** Change the wording to whatever she actually
   calls things. Delete the medication step if it doesn't apply.
5. Sit down with her and go through the **What if…** plans together *before* the
   first day. Change any answer that isn't right for her school — especially the
   ones about the time-out card and where she goes when she needs to leave a
   room, which should match what the SRB has actually agreed.
6. **Set up → Backup** and save the file somewhere once you've got it right.

## A few honest limits

- **It cannot wake her up.** A web app can't set alarms that fire when it's
  closed. Use the phone's own clock app for the actual alarms — this app is for
  what happens *after* the alarm.
- **The data lives in the browser on that one device.** Clearing browsing data
  wipes it. Take a backup once the lists are set up, and again after any big
  change. There's no sync between devices, which is also why nothing she writes
  can end up anywhere else.
- **The read-aloud voice** is the phone's own text-to-speech — there is no
  recorded audio in the app, and nothing to download. That means the words can
  be reworded any time without re-recording, and it works offline. It also
  means it depends on the device: if no voice is installed, or the phone is on
  silent, the meditation shows the words but says nothing. Use **Set up → Test
  the voice** to check it on the actual device before she needs it at bedtime.
  If it can't speak, the meditation now says so on screen rather than just
  going quiet. It's a bit robotic on some Androids; turn it off in Set up and
  the meditations just show the words instead.
- **The meditations are not therapy.** They're coping tools for the day-to-day
  wobbles. Nothing in here replaces the SRB team or CAMHS.

## For anyone editing the code

Plain HTML, CSS and JavaScript. No build step, no dependencies, no framework —
deliberately, so it still opens and works in ten years' time.

```
  index.html              app shell, one <section> per screen
  manifest.webmanifest    makes it installable
  sw.js                   offline cache
  assets/css/app.css      all styling, light + dark
  assets/js/data.js       default routines, lists, meditation scripts, plans
  assets/js/store.js      localStorage state, dates, streaks
  assets/js/ui.js         DOM helpers, checklists, overlay, toast
  assets/js/routines.js   Morning / Bag / Evening screens
  assets/js/calm.js       breathing, grounding, meditations, worry box
  assets/js/settings.js   the Set up screen
  assets/js/app.js        router + Today screen
  assets/icons/make-icons.js  crops the photo into all three icon sizes
  build-single-file.js    bundles the above into one .html file
```

The app icon is a photo of Bartholomew, cropped to his head. The photo itself
is kept at `assets/icons/bartholomew-source.jpg` so the icons can be
regenerated rather than re-cut by hand: `node assets/icons/make-icons.js`
rewrites all three sizes. To use a different photo, replace that file and
adjust the `CROP` values at the top of the script. It leans on Playwright's
Chromium for the canvas work, so if that isn't installed, just replace the
three `icon-*.png` files directly instead.

Editing the wording of a meditation or a "what if" plan means editing
`assets/js/data.js` — everything user-facing is in there in one place. Note
that changes there only affect a fresh install; anything already saved on the
device keeps her edited version.

To run it locally: `npx http-server . -p 8099` and open
`http://127.0.0.1:8099`.

This repository is deliberately separate from anything else, and public only so
that GitHub Pages will serve it. It holds the app itself — no personal data.
Everything Andi enters (her timetable, her ticks, her worries) is stored in the
browser on her own device and never reaches this repository or any server.
