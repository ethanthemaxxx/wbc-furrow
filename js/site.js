/* Furrow concept site — interactions and scroll sequences. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var isPhone = function () { return window.innerWidth < 810; };
  /* Short windows (200% zoom, landscape phones) get the static story, like reduced motion */
  var SHORT = '(max-height: 560px)';
  var isShort = function () { return window.matchMedia(SHORT).matches; };

  /* ---------- Viewport height (ignores absurd heights from full-page capture tools) ---------- */
  function setVh() {
    var h = window.innerHeight;
    if (h <= 1400) doc.style.setProperty('--vh', Math.max(h, 320) + 'px');
  }
  setVh();

  /* ---------- Toast + live region ---------- */
  var toastEl = $('#toast'), toastT;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove('is-on'); }, 3200);
  }
  function announce(msg) { var l = $('#live'); if (l) { l.textContent = ''; setTimeout(function () { l.textContent = msg; }, 30); } }
  try {
    var pending = sessionStorage.getItem('furrow-toast');
    if (pending) { sessionStorage.removeItem('furrow-toast'); setTimeout(function () { toast(pending); }, 600); }
  } catch (e) {}
  $$('[data-toast]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var msg = a.getAttribute('data-toast');
      if (!a.href) { toast(msg); announce(msg); return; }
      var url = new URL(a.href, location.href);
      if (url.pathname.replace(/index\.html$/, '') === location.pathname.replace(/index\.html$/, '')) {
        e.preventDefault();
        toast(msg);
      } else {
        try { sessionStorage.setItem('furrow-toast', msg); } catch (err) {}
      }
    });
  });

  /* ---------- Copy to clipboard ---------- */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (res, rej) {
      var t = document.createElement('textarea'), ok = false;
      t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select();
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(t);
      if (ok) res(); else rej(new Error('copy failed'));
    });
  }
  $$('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var text = b.getAttribute('data-copy');
      var done = function () {
        var msg = b.getAttribute('data-copied-text') || 'Copied';
        announce(msg);
        if (b.classList.contains('copy')) {
          b.classList.add('is-copied');
          setTimeout(function () { b.classList.remove('is-copied'); }, 1200);
        } else {
          var s = b.querySelector('span');
          if (s) { var old = s.textContent; s.textContent = msg; setTimeout(function () { s.textContent = old; }, 1200); }
        }
      };
      var failed = function () {
        var msg = 'Copy failed. The address is ' + text + '.';
        announce(msg);
        if (b.classList.contains('copy')) {
          b.classList.add('is-failed');
          setTimeout(function () { b.classList.remove('is-failed'); }, 2400);
        }
        toast(msg);
      };
      copyText(text).then(done, failed);
    });
  });

  /* ---------- Legal: Privacy policy and Terms point at the fictional-brand notice ---------- */
  $$('[data-legal]').forEach(function (b) {
    b.addEventListener('click', function () {
      var n = $('#legal-notice'); if (!n) return;
      n.classList.add('is-on'); n.focus();
      clearTimeout(n._t);
      n._t = setTimeout(function () { n.classList.remove('is-on'); }, 2400);
    });
  });

  /* ---------- Logo ticker: pause control (WCAG 2.2.2) ---------- */
  $$('.ticker__toggle').forEach(function (b) {
    var t = document.getElementById(b.getAttribute('aria-controls'));
    if (!t) return;
    b.addEventListener('click', function () {
      var paused = !t.classList.contains('is-paused');
      t.classList.toggle('is-paused', paused);
      b.setAttribute('aria-pressed', String(paused));
      b.setAttribute('aria-label', paused ? 'Play logo ticker' : 'Pause logo ticker');
    });
  });

  /* ---------- Navigation ---------- */
  var nav = $('#nav');
  if (nav) {
    var links = $('.nav__links', nav), sel = $('.nav__sel', nav);
    if (links && sel) {
      var hot = null;
      var move = function (a) {
        if (hot) hot.classList.remove('is-hot');
        hot = a; a.classList.add('is-hot');
        sel.style.left = a.offsetLeft + 'px';
        links.classList.add('is-hover');
      };
      var leave = function () { links.classList.remove('is-hover'); if (hot) hot.classList.remove('is-hot'); hot = null; };
      $$('a', links).forEach(function (a) {
        a.addEventListener('pointerenter', function () { move(a); });
        a.addEventListener('focus', function () { if (a.matches(':focus-visible')) move(a); });
        a.addEventListener('blur', leave);
      });
      links.addEventListener('pointerleave', leave);
    }
    var toggle = $('.nav__toggle', nav), scrim = $('#nav-scrim');
    var setOpen = function (open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      if (scrim) scrim.classList.toggle('is-on', open);
    };
    if (toggle) {
      toggle.addEventListener('click', function () { setOpen(!nav.classList.contains('is-open')); });
      if (scrim) scrim.addEventListener('click', function () { setOpen(false); });
      $$('.nav__panel a', nav).forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
      });
      window.addEventListener('resize', function () { if (!isPhone()) setOpen(false); });
      nav.addEventListener('focusout', function (e) {
        if (nav.classList.contains('is-open') && e.relatedTarget && !nav.contains(e.relatedTarget)) setOpen(false);
      });
    }
  }

  /* ---------- Dialogs ---------- */
  function openDialog(d, opener) {
    if (!d || typeof d.showModal !== 'function') return;
    d._opener = opener;
    d.showModal();
  }
  $$('dialog').forEach(function (d) {
    d.addEventListener('click', function (e) {
      if (e.target === d) d.close();
      var c = e.target.closest('[data-close]');
      if (c) { e.preventDefault(); d.close(); }
    });
    d.addEventListener('close', function () { if (d._opener) d._opener.focus(); });
  });
  var video = $('#video');
  if (video) video.addEventListener('click', function () { openDialog($('#video-dialog'), video); });
  $$('[data-person]').forEach(function (b) {
    b.addEventListener('click', function () { openDialog($('#person-' + b.getAttribute('data-person')), b); });
  });

  /* ---------- Process phases (hover accordion) ---------- */
  var phaseList = $('#phases');
  if (phaseList) {
    var phases = $$('.phase', phaseList);
    var activate = function (p) {
      if (isPhone()) return;
      phases.forEach(function (x) {
        var on = x === p;
        x.classList.toggle('is-active', on);
        x.setAttribute('aria-current', on ? 'true' : 'false');
      });
    };
    phases.forEach(function (p) {
      p.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') activate(p); });
      p.addEventListener('focus', function () { activate(p); });
      p.addEventListener('click', function () { activate(p); });
    });
  }

  /* ---------- Testimonial accordion ---------- */
  var tacc = $('#tacc');
  if (tacc) {
    var cards = $$('.tcard', tacc);
    var openCard = function (c) {
      cards.forEach(function (x) {
        var on = x === c;
        x.classList.toggle('is-open', on);
        var b = x.querySelector('button'); if (b) b.setAttribute('aria-expanded', String(on));
      });
    };
    cards.forEach(function (c) {
      var b = c.querySelector('button');
      if (b) b.addEventListener('click', function () { openCard(c); });
      c.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse' && !isPhone()) openCard(c); });
    });
  }

  /* ---------- Pricing selector ---------- */
  var plansData = $('#plans-data');
  if (plansData) {
    var PL = JSON.parse(plansData.textContent);
    var panel = $('#plan-panel');
    var radios = $$('.plan');
    var checkIcon = panel.querySelector('ul svg') ? panel.querySelector('ul svg').outerHTML : '';
    var pick = function (r, focus) {
      var key = r.getAttribute('data-plan'), p = PL[key];
      radios.forEach(function (x) {
        var on = x === r;
        x.setAttribute('aria-checked', String(on));
        x.tabIndex = on ? 0 : -1;
      });
      if (focus) r.focus();
      panel.classList.add('is-swapping');
      setTimeout(function () {
        $('[data-k="from_"]', panel).textContent = p.from_;
        $('[data-k="big"]', panel).textContent = p.big;
        $('[data-k="per"]', panel).textContent = p.per;
        $('[data-k="desc"]', panel).textContent = p.desc;
        $('[data-k="items"]', panel).innerHTML = p.items.map(function (t) { return '<li>' + checkIcon + '<span>' + t + '</span></li>'; }).join('');
        panel.classList.toggle('is-accent', key === 'growth');
        panel.classList.remove('is-swapping');
      }, RM ? 0 : 180);
    };
    radios.forEach(function (r, i) {
      r.addEventListener('click', function () { pick(r); });
      r.addEventListener('keydown', function (e) {
        var d = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : (e.key === 'ArrowUp' || e.key === 'ArrowLeft') ? -1 : 0;
        if (d) { e.preventDefault(); pick(radios[(i + d + radios.length) % radios.length], true); }
      });
    });
  }

  /* ---------- FAQ tabs + accordion ---------- */
  $$('.faq').forEach(function (faq) {
    var tabs = $$('[role="tab"]', faq);
    var showTab = function (t, focus) {
      tabs.forEach(function (x) {
        var on = x === t;
        x.setAttribute('aria-selected', String(on));
        x.tabIndex = on ? 0 : -1;
        var p = document.getElementById(x.getAttribute('aria-controls'));
        if (p) p.hidden = !on;
      });
      if (focus) t.focus();
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { showTab(t); });
      t.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (e.key === 'Home') { e.preventDefault(); showTab(tabs[0], true); }
        if (e.key === 'End') { e.preventDefault(); showTab(tabs[tabs.length - 1], true); }
        if (d) { e.preventDefault(); showTab(tabs[(i + d + tabs.length) % tabs.length], true); }
      });
    });
    $$('.qa__q', faq).forEach(function (q) {
      q.addEventListener('click', function () {
        var item = q.closest('.qa__item'), group = item.parentElement;
        var willOpen = !item.classList.contains('is-open');
        $$('.qa__item', group).forEach(function (x) {
          x.classList.remove('is-open');
          x.querySelector('.qa__q').setAttribute('aria-expanded', 'false');
        });
        if (willOpen) { item.classList.add('is-open'); q.setAttribute('aria-expanded', 'true'); }
      });
    });
  });

  /* ---------- In-view helpers (counters, bars) ---------- */
  var io = ('IntersectionObserver' in window) ? function (els, cb, opts) {
    var o = new IntersectionObserver(function (entries) { entries.forEach(function (en) { cb(en, o); }); }, opts || { threshold: .3 });
    els.forEach(function (el) { o.observe(el); });
  } : function (els, cb) { els.forEach(function (el) { cb({ target: el, isIntersecting: true }, { unobserve: function () {} }); }); };

  /* Only animate what starts below the fold; anything already on screen keeps its final state */
  var below = function (el) { return el.getBoundingClientRect().top > window.innerHeight; };
  var counters = $$('[data-count]').filter(below);
  if (!RM) {
    counters.forEach(function (c) { c.textContent = '0'; });
    io(counters, function (en, o) {
      if (!en.isIntersecting) return;
      o.unobserve(en.target);
      var el = en.target, end = parseFloat(el.getAttribute('data-count')), t0 = null;
      var step = function (t) {
        if (!t0) t0 = t;
        var p = Math.min(1, (t - t0) / 1000), e = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(end * e));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      setTimeout(function () { el.textContent = String(end); }, 1600);
    }, { threshold: .5 });
  }

  var bars = $$('[data-bar]').filter(below);
  if (!RM && bars.length) {
    bars.forEach(function (b) { b.style.transform = 'scaleX(.03)'; });
    io(bars, function (en, o) {
      if (!en.isIntersecting) return;
      o.unobserve(en.target);
      en.target.style.transition = 'transform .9s cubic-bezier(.22,1,.36,1)';
      en.target.style.transform = 'scaleX(1)';
    }, { threshold: .2 });
  }

  /* ---------- Contact form ---------- */
  $$('form[data-form="contact"]').forEach(function (form) {
    var main = $('.cform__main', form), done = $('.cform__done', form);
    var summary = $('.cform__summary', form), banner = $('.banner', form);
    var submit = $('[data-submit]', form);
    var ta = form.elements.challenge, count = $('#cf-count', form);
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    var URL_RE = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/\S*)?$/i;
    var touched = {};
    var rules = {
      name: function () { return form.elements.name.value.trim() ? '' : 'Enter your name.'; },
      email: function () {
        var v = form.elements.email.value.trim();
        if (!v) return 'Enter your work email.';
        return EMAIL_RE.test(v) ? '' : 'That email looks incomplete. Check for a missing @ or domain.';
      },
      store: function () {
        var v = form.elements.store.value.trim();
        if (!v) return 'Enter your store address.';
        return URL_RE.test(v) ? '' : 'Use an address like yourbrand.com.';
      },
      services: function () { return $$('input[name="services"]:checked', form).length ? '' : 'Choose at least one service, or pick Not sure yet.'; },
      revenue: function () { return $('input[name="revenue"]:checked', form) ? '' : 'Select your revenue range.'; },
      challenge: function () { return ta.value.length > 500 ? 'Keep it under 500 characters. You can add more on the call.' : ''; },
      consent: function () { return form.elements.consent.checked ? '' : 'Tick the box so we can reply.'; }
    };
    var show = function (k) {
      var f = $('[data-field="' + k + '"]', form), msg = rules[k]();
      if (!f) return msg;
      f.classList.toggle('is-invalid', !!msg);
      $('.field__err', f).textContent = msg;
      $$('input, textarea', f).forEach(function (i) { if (msg) i.setAttribute('aria-invalid', 'true'); else i.removeAttribute('aria-invalid'); });
      return msg;
    };
    Object.keys(rules).forEach(function (k) {
      var f = $('[data-field="' + k + '"]', form);
      if (!f) return;
      f.addEventListener('focusout', function (e) {
        if (f.contains(e.relatedTarget)) return;
        touched[k] = true; show(k);
      });
      f.addEventListener('change', function () { if (touched[k]) show(k); });
    });
    var lastSaid = 0;
    if (ta && count) ta.addEventListener('input', function () {
      var len = ta.value.length;
      count.textContent = len + ' / 500';
      /* Announce the count only near the limit, and only once per 10 characters */
      if (len >= 450 && Math.abs(len - lastSaid) >= 10) { lastSaid = len; announce(len + ' of 500 characters'); }
      if (len < 450) lastSaid = 0;
      if (ta.value.length > 500 || touched.challenge) { touched.challenge = true; show('challenge'); }
    });
    var busy = false;
    var setLoading = function (on) {
      busy = on;
      if (on) submit.setAttribute('aria-disabled', 'true'); else submit.removeAttribute('aria-disabled');
      submit.classList.toggle('is-loading', on);
      $$('.btn__label > span', submit).forEach(function (s) { s.textContent = on ? 'Sending request…' : 'Book a growth call'; });
    };
    var send = function () {
      banner.hidden = true;
      setLoading(true);
      setTimeout(function () {
        setLoading(false);
        if (navigator.onLine === false) { banner.hidden = false; $('button', banner).focus(); return; }
        $('[data-name]', done).textContent = form.elements.name.value.trim().split(/\s+/)[0];
        main.hidden = true; done.hidden = false; done.focus();
      }, RM ? 300 : 1400);
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy) return;
      var bad = Object.keys(rules).filter(function (k) { touched[k] = true; return !!show(k); });
      if (bad.length) {
        summary.hidden = false;
        summary.textContent = 'Fix ' + bad.length + (bad.length === 1 ? ' field' : ' fields') + ' to continue.';
        var first = $('[data-field="' + bad[0] + '"] input, [data-field="' + bad[0] + '"] textarea', form);
        if (first) first.focus();
        return;
      }
      summary.hidden = true;
      send();
    });
    $('[data-retry]', form).addEventListener('click', function () { if (!busy) send(); });
    $('[data-again]', form).addEventListener('click', function () {
      form.reset(); touched = {};
      if (count) count.textContent = '0 / 500';
      $$('.field', form).forEach(function (f) { f.classList.remove('is-invalid'); var er = $('.field__err', f); if (er) er.textContent = ''; });
      done.hidden = true; main.hidden = false; form.elements.name.focus();
    });
  });

  /* ---------- Newsletter ---------- */
  $$('form[data-form="news"]').forEach(function (form) {
    var msg = $('.nform__msg', form), input = form.elements.email, b = $('[data-submit]', form);
    var say = function (t, cls) { msg.textContent = t; msg.className = 'nform__msg ' + (cls || ''); };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = input.value.trim();
      if (!v) { say('Enter your email to subscribe.', 'is-error'); input.setAttribute('aria-invalid', 'true'); input.focus(); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { say('That email looks incomplete. Check for a missing @ or domain.', 'is-error'); input.setAttribute('aria-invalid', 'true'); input.focus(); return; }
      input.removeAttribute('aria-invalid');
      var consent = form.elements.consent;
      if (consent && !consent.checked) { say('Tick the box to subscribe.', 'is-error'); consent.setAttribute('aria-invalid', 'true'); consent.focus(); return; }
      if (consent) consent.removeAttribute('aria-invalid');
      say('Subscribing…');
      b.disabled = true; b.classList.add('is-loading');
      setTimeout(function () {
        b.disabled = false; b.classList.remove('is-loading');
        if (navigator.onLine === false) { say('We couldn\u2019t subscribe you. Try again, or email hello@furrow.example.', 'is-error'); return; }
        say('You\u2019re on the list. First email arrives next month.', 'is-ok');
        form.reset();
      }, RM ? 200 : 1000);
    });
  });

  /* ---------- Insights filters ---------- */
  var igrid = $('#igrid');
  if (igrid) {
    var cardsI = $$('.icard', igrid), pills = $$('.pill'), search = $('#insight-search'), empty = $('#empty');
    var cat = 'All';
    var apply = function () {
      var q = (search.value || '').trim().toLowerCase(), n = 0;
      cardsI.forEach(function (c) {
        var ok = (cat === 'All' || c.getAttribute('data-cat') === cat) && (!q || c.textContent.toLowerCase().indexOf(q) > -1);
        c.hidden = !ok; if (ok) n++;
      });
      empty.hidden = n > 0;
    };
    pills.forEach(function (p) {
      p.addEventListener('click', function () {
        cat = p.getAttribute('data-filter');
        pills.forEach(function (x) { x.setAttribute('aria-pressed', String(x === p)); });
        apply();
      });
    });
    search.addEventListener('input', apply);
    $('#clear-filters').addEventListener('click', function () {
      search.value = ''; cat = 'All';
      pills.forEach(function (x) { x.setAttribute('aria-pressed', String(x.getAttribute('data-filter') === 'All')); });
      apply(); search.focus();
    });
  }

  /* ---------- Article: contents + share ---------- */
  var toc = $('#toc');
  if (toc) {
    var tocLinks = $$('a', toc);
    var heads = tocLinks.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); }).filter(Boolean);
    var setActive = function () {
      var y = window.scrollY + 160, cur = heads[0];
      heads.forEach(function (h) { if (h.getBoundingClientRect().top + window.scrollY <= y) cur = h; });
      tocLinks.forEach(function (a) {
        var on = cur && a.getAttribute('href') === '#' + cur.id;
        a.classList.toggle('is-active', on);
        if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
    };
    window.addEventListener('scroll', setActive, { passive: true });
    setActive();
  }
  $$('[data-share]').forEach(function (a) {
    var kind = a.getAttribute('data-share'), url = encodeURIComponent(location.href), title = encodeURIComponent(document.title);
    if (kind === 'linkedin') a.href = 'https://www.linkedin.com/sharing/share-offsite/?url=' + url;
    if (kind === 'x') a.href = 'https://x.com/intent/post?url=' + url + '&text=' + title;
  });
  $$('[data-copy-link]').forEach(function (b) {
    b.addEventListener('click', function () {
      var ok = function () { toast('Link copied'); announce('Link copied'); };
      copyText(location.href).then(ok, ok);
    });
  });

  /* ---------- Footer wordmark: fit to the card width ---------- */
  var marks = $$('.wordmark');
  function fitMarks() {
    marks.forEach(function (m) {
      var box = m.parentElement, cs = getComputedStyle(box);
      var w = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      m.style.fontSize = '100px';
      m.style.display = 'inline-block';
      var scale = (box.getBoundingClientRect().width / (box.offsetWidth || 1)) || 1;
      var natural = (m.getBoundingClientRect().width / scale) || 1;
      m.style.display = '';
      m.style.fontSize = Math.min(420, Math.floor(100 * w / natural * .78)) + 'px';
    });
  }
  if (marks.length) {
    fitMarks();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitMarks);
  }

  /* ---------- Hero sticky offset on phones ---------- */
  var hero = $('.hero');
  function heroTop() {
    if (!hero) return;
    if (doc.classList.contains('rm') || isShort()) { hero.style.position = ''; hero.style.top = ''; return; }
    if (isPhone()) {
      var vh = parseFloat(getComputedStyle(doc).getPropertyValue('--vh')) || window.innerHeight;
      hero.style.position = 'sticky';
      hero.style.top = Math.min(0, vh - hero.offsetHeight) + 'px';
    } else { hero.style.position = ''; hero.style.top = ''; }
  }
  heroTop();

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { setVh(); heroTop(); fitMarks(); if (window.ScrollTrigger) window.ScrollTrigger.refresh(); }, 150);
  });

  /* ---------- Split words ---------- */
  function splitWords(el) {
    if (!el || el._split) return el ? el._split : [];
    var words = [];
    var walk = function (node) {
      $$('*', node).length;
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = n.textContent.split(/(\s+)/), frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            var s = document.createElement('span'); s.className = 'word'; s.textContent = p;
            frag.appendChild(s); words.push(s);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') { walk(n); }
      });
    };
    walk(el);
    el._split = words;
    return words;
  }

  /* ---------- GSAP sequences ---------- */
  function initMotion() {
    var gsap = window.gsap, ST = window.ScrollTrigger;
    /* Without the motion library (offline, blocked CDN) fall back to the static layout */
    if (!gsap || !ST) { doc.classList.add('rm'); heroTop(); return; }
    if (RM) return;
    gsap.registerPlugin(ST);

    var story = $('#story');
    if (story) {
      /* Load: the frame opens from a small tile, the headline arrives word by word */
      var frame = $('#hero-frame'), img = $('#hero-img'), shade = $('#hero-shade');
      var h1Words = splitWords($('[data-words]'));
      var rise = $$('[data-rise]');
      var tl = gsap.timeline({ delay: .2 });
      if (!isPhone()) {
        tl.fromTo(frame, { scale: .3, borderRadius: 60 }, { scale: 1, borderRadius: 40, duration: .7, ease: 'back.out(1.15)' }, 0)
          .fromTo(img, { scale: 3 }, { scale: 1, duration: .7, ease: 'power3.out' }, 0);
      }
      tl.fromTo(shade, { opacity: 0 }, { opacity: 1, duration: .6 }, .15)
        .fromTo(h1Words, { opacity: 0, filter: 'blur(5px)', scale: .9, y: 2 }, { opacity: 1, filter: 'blur(0px)', scale: 1, y: 0, duration: .35, stagger: .045, ease: 'back.out(2)', clearProps: 'filter' }, .45)
        .fromTo(rise, { opacity: 0, scale: .94, y: 10 }, { opacity: 1, scale: 1, y: 0, duration: .5, stagger: .05, ease: 'back.out(1.6)', clearProps: 'transform' }, .85);
      /* If frames are throttled (background tab, capture tools), land on the final state anyway */
      setTimeout(function () { if (tl.progress() < 1) tl.progress(1); }, 2600);

      var mm = gsap.matchMedia();
      mm.add('(min-width: 810px) and (min-height: 561px)', function () {
        /* Scroll: content (and the booking pill) leaves fast, the frame grows and frosts over */
        gsap.to(['#hero-content', '.book'], { y: -1575, ease: 'none', scrollTrigger: { trigger: story, start: 'top top', end: '+=900', scrub: true } });
        gsap.fromTo(frame, { scale: 1 }, { scale: 1.4, ease: 'none', immediateRender: false, scrollTrigger: { trigger: story, start: 'top -400', end: 'top -900', scrub: true } });
        gsap.fromTo('#hero-frost', { opacity: 0 }, { opacity: 1, ease: 'none', scrollTrigger: { trigger: story, start: 'top -400', end: 'top -800', scrub: true } });

        /* Comparison: the headline parts like soil, Before rises, After springs out beside it */
        var cmp = $('#compare'), before = $('#cmp-before'), after = $('#cmp-after');
        gsap.set(before, { opacity: 0, scale: .7 });
        gsap.set(after, { opacity: 0, scale: .8 });
        gsap.fromTo('#compare-h', { opacity: .3, scale: 1.1, y: -140 }, { opacity: 1, scale: 1, y: 0, ease: 'none', scrollTrigger: { trigger: cmp, start: 'top 400', end: 'top -200', scrub: true } });
        var split = gsap.timeline({ scrollTrigger: { trigger: cmp, start: 'top -100', end: 'top -1000', scrub: true } });
        split.to('#cmp-l1', { xPercent: -95, skewX: 12, opacity: 0, filter: 'blur(6px)', ease: 'power1.in' }, 0)
             .to('#cmp-l2', { xPercent: 95, skewX: -12, opacity: 0, filter: 'blur(6px)', ease: 'power1.in' }, 0)
             .to(before, { opacity: 1, scale: 1, ease: 'none' }, 0);
        var w = function () { return ($('.compare__cards').offsetWidth - before.offsetWidth) / 2; };
        ST.create({
          trigger: cmp, start: 'top -1500',
          onEnter: function () {
            cmp.classList.add('is-split');
            gsap.to(before, { x: function () { return -w(); }, duration: .7, ease: 'back.out(1.5)', overwrite: 'auto' });
            gsap.to(after, { x: function () { return w(); }, scale: 1, opacity: 1, duration: .75, ease: 'back.out(1.7)', overwrite: 'auto' });
          },
          onLeaveBack: function () {
            cmp.classList.remove('is-split');
            gsap.to(before, { x: 0, duration: .5, ease: 'power3.out', overwrite: 'auto' });
            gsap.to(after, { x: 0, scale: .8, opacity: 0, duration: .45, ease: 'power3.out', overwrite: 'auto' });
          }
        });

        /* Chart dims as the first service card covers it */
        var chart = $('#chart');
        if (chart) gsap.to(chart, { opacity: 0, scale: .9, ease: 'none', scrollTrigger: { trigger: '.svc-list', start: 'top 70%', end: 'top 5%', scrub: true } });

        return function () { gsap.set([before, after, '#compare-h', '#cmp-l1', '#cmp-l2', '#hero-content', '.book', frame, '#hero-frost', chart].filter(Boolean), { clearProps: 'all' }); };
      });
      mm.add('(max-width: 809px) and (min-height: 561px)', function () {
        gsap.to('#hero-content', { y: -380, ease: 'none', scrollTrigger: { trigger: story, start: 'top top', end: '+=500', scrub: true } });
        gsap.fromTo(frame, { scale: 1 }, { scale: 1.2, ease: 'none', immediateRender: false, scrollTrigger: { trigger: story, start: 'top -400', end: 'top -1050', scrub: true } });
        gsap.fromTo('#hero-frost', { opacity: 0 }, { opacity: 1, ease: 'none', scrollTrigger: { trigger: story, start: 'top -600', end: 'top -1050', scrub: true } });
        return function () { gsap.set(['#hero-content', frame, '#hero-frost'], { clearProps: 'all' }); };
      });

      /* The problem statement writes itself as you scroll */
      var stWords = splitWords($('[data-scrub-words]'));
      var statement = $('.statement');
      if (stWords.length && statement) mm.add('(min-height: 561px)', function () {
        var paint = function (sy) {
          var sp = $('.statement__space');
          var base = (sp ? sp.offsetTop - statement.offsetHeight : statement.offsetTop) - 400;
          stWords.forEach(function (wd, i) {
            var s = base + 60 * i, p = Math.max(0, Math.min(1, (sy - s) / 300));
            wd.style.opacity = p;
            wd.style.filter = p >= 1 ? 'none' : 'blur(' + (5 * (1 - p)).toFixed(2) + 'px)';
            wd.style.transform = p >= 1 ? 'none' : 'translateY(' + (2 * (1 - p)).toFixed(2) + 'px) scale(' + (.9 + .1 * p).toFixed(3) + ')';
          });
        };
        paint(window.scrollY);
        ST.create({ trigger: statement, start: 'top bottom', end: 'bottom top', onUpdate: function () { paint(window.scrollY); }, onRefresh: function () { paint(window.scrollY); } });
        return function () { stWords.forEach(function (wd) { wd.style.opacity = ''; wd.style.filter = ''; wd.style.transform = ''; }); };
      });
    }

    /* Closing: a furrow of cobalt opens from the middle, the last block sinks, the footer rises */
    var closing = $('.closing');
    if (closing) {
      var mmc = gsap.matchMedia();
      mmc.add('(min-width: 810px) and (min-height: 561px)', function () {
        var band = $('.closing__band > div', closing), line = $('.closing__line', closing);
        var sink = $('.closing__sink', closing), card = $('.footer__card', closing);
        if (!band) return;
        var N = 24, open = { p: 0 };
        /* Two parallel wavy edges, like the lines in the logo: no area at p = 0, full screen at p = 1 */
        var furrow = function (p) {
          var top = [], bot = [];
          for (var i = 0; i <= N; i++) {
            var x = (100 * i / N).toFixed(2), w = 3 * Math.sin(i / N * Math.PI * 6);
            top.push(x + '% ' + (50 - 54 * p + w).toFixed(2) + '%');
            bot.unshift(x + '% ' + (50 + 54 * p + w).toFixed(2) + '%');
          }
          return 'polygon(' + top.concat(bot).join(', ') + ')';
        };
        band.style.clipPath = furrow(0);
        var ctl = gsap.timeline({ scrollTrigger: { trigger: '#footer', start: 'top 85%', end: 'top 15%', scrub: true } });
        if (sink) ctl.fromTo(sink, { scale: 1, y: 0 }, { scale: .8, y: 500, ease: 'none', duration: 1 }, 0);
        ctl.to(open, { p: 1, ease: 'power2.inOut', duration: .55, onUpdate: function () { band.style.clipPath = furrow(open.p); } }, 0);
        if (line) ctl.fromTo(line, { opacity: 0, y: 30 }, { opacity: 1, y: 0, ease: 'power2.out', duration: .2 }, .38);
        if (card) ctl.fromTo(card, { scale: .85 }, { scale: 1, ease: 'none', duration: 1 }, 0);
        return function () { gsap.set([sink, line, card].filter(Boolean), { clearProps: 'all' }); band.style.clipPath = ''; };
      });
    }

    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
    window.addEventListener('load', function () { ST.refresh(); });
  }

  if (window.gsap) initMotion();
  else window.addEventListener('load', initMotion);
})();
