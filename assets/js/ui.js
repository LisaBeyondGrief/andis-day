/* ui.js — small DOM helpers. No framework, no build step: this file has to be
   openable by double-clicking index.html on any machine, forever. */

window.AndiUI = (function () {
  'use strict';

  function el(tag, attrs, kids) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'html') node.innerHTML = v;
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') node.addEventListener(k.slice(2), v);
        else if (v === true) node.setAttribute(k, '');
        else node.setAttribute(k, v);
      });
    }
    (kids || []).forEach(function (kid) {
      if (kid === null || kid === undefined || kid === false) return;
      node.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid);
    });
    return node;
  }

  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  function mount(node, kids) {
    clear(node);
    (Array.isArray(kids) ? kids : [kids]).forEach(function (k) {
      if (k) node.appendChild(k);
    });
    return node;
  }

  /* ---- toast ---- */
  var toastTimer = null;
  function toast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 2600);
  }

  /* ---- overlay ---- */
  var overlayCleanup = null;
  var lastFocus = null;

  function openOverlay(title, bodyNodes, onClose) {
    var ov = document.getElementById('overlay');
    lastFocus = document.activeElement;
    document.getElementById('overlayTitle').textContent = title;
    mount(document.getElementById('overlayBody'), bodyNodes);
    ov.hidden = false;
    document.body.style.overflow = 'hidden';
    overlayCleanup = onClose || null;
    document.getElementById('overlayClose').focus();
  }

  function closeOverlay() {
    var ov = document.getElementById('overlay');
    if (ov.hidden) return;
    ov.hidden = true;
    document.body.style.overflow = '';
    clear(document.getElementById('overlayBody'));
    if (overlayCleanup) { var fn = overlayCleanup; overlayCleanup = null; fn(); }
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ---- checklist ---- */

  /* items: [{id,label,note,time,link}]
     opts:  { listName, isDone(item), onToggle(item, nowDone), onLink(item) } */
  function checklist(items, opts) {
    var ul = el('ul', { class: 'checklist' });
    items.forEach(function (item) {
      var done = opts.isDone(item);
      var row = el('button', {
        type: 'button',
        class: 'check',
        'aria-pressed': done ? 'true' : 'false'
      }, [
        el('span', { class: 'check-box', 'aria-hidden': 'true', text: '✓' }),
        el('span', { class: 'check-text' }, [
          el('span', { class: 'check-label', text: item.label }),
          item.note ? el('span', { class: 'check-note', text: item.note }) : null
        ]),
        item.time ? el('span', { class: 'check-time', text: item.time }) : null
      ]);

      row.addEventListener('click', function (ev) {
        // Tapping the note text of a linked step jumps to the tool instead of ticking.
        if (item.link && ev.target.classList.contains('check-note')) {
          if (opts.onLink) opts.onLink(item);
          return;
        }
        var nowDone = row.getAttribute('aria-pressed') !== 'true';
        row.setAttribute('aria-pressed', nowDone ? 'true' : 'false');
        if (opts.onToggle) opts.onToggle(item, nowDone);
      });

      ul.appendChild(row);
    });
    return ul;
  }

  function progressBar(done, total, wording) {
    var pct = total ? Math.round((done / total) * 100) : 0;
    var wrap = el('div', { class: 'progress' }, [
      el('div', {
        class: 'progress-track', role: 'progressbar',
        'aria-valuenow': String(done), 'aria-valuemin': '0', 'aria-valuemax': String(total),
        'aria-label': wording || 'Progress'
      }, [
        el('div', { class: 'progress-fill' })
      ]),
      el('p', { class: 'progress-text', text: done + ' of ' + total + ' done' })
    ]);
    // set width after insertion so the transition runs
    setTimeout(function () {
      var fill = wrap.querySelector('.progress-fill');
      if (fill) fill.style.width = pct + '%';
    }, 20);
    return wrap;
  }

  function card(titleText, kids, opts) {
    opts = opts || {};
    return el('div', { class: 'card' }, [
      titleText ? el('h2', { class: 'card-title' }, [
        opts.ico ? el('span', { 'aria-hidden': 'true', text: opts.ico }) : null,
        el('span', { text: titleText })
      ]) : null,
      opts.sub ? el('p', { class: 'card-sub', text: opts.sub }) : null
    ].concat(Array.isArray(kids) ? kids : [kids]));
  }

  function label(text) { return el('p', { class: 'section-label', text: text }); }

  function btn(text, opts) {
    opts = opts || {};
    return el('button', {
      type: 'button',
      class: 'btn ' + (opts.variant ? 'btn-' + opts.variant + ' ' : '') + (opts.block ? 'btn-block ' : '') + (opts.small ? 'btn-small ' : '') + (opts.extra || ''),
      onclick: opts.onClick
    }, [text]);
  }

  /* Friendly date, e.g. "Wednesday 3 September" */
  function niceDate(d) {
    try {
      return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    } catch (e) {
      return d.toDateString();
    }
  }

  function nowMins() {
    var d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  }

  return {
    el: el, clear: clear, mount: mount, toast: toast,
    openOverlay: openOverlay, closeOverlay: closeOverlay,
    checklist: checklist, progressBar: progressBar, card: card,
    label: label, btn: btn, niceDate: niceDate, nowMins: nowMins
  };
})();
