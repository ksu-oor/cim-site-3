/* CIM · Living Billboard · spotlight carousel controller
 *
 * Each `.spotlight` region owns one carousel. Auto-advance every 8s with
 * staggered starts so the three carousels never transition in unison.
 * Character-roll on the slide label (Space Mono) on every activation.
 */
(function () {
  'use strict';

  var INTERVAL_MS = 8000;
  var STAGGER_MS = { research: 0, showcase: 3000, touchpoint: 5000 };
  var ROLL_CYCLES_MIN = 3;
  var ROLL_CYCLES_MAX = 5;
  var ROLL_TICK_MS = 45;
  var ROLL_CHAR_STAGGER_MS = 25;
  var ARIA_POLITE_CLEAR_MS = 1200;

  var mqReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mqMobile = window.matchMedia('(max-width: 768px)');

  function reduced() { return mqReduceMotion.matches; }
  function mobile()  { return mqMobile.matches; }

  /* ---------- Character roll ---------- */

  // Build a pool of glyphs drawn from the source string itself, plus a couple
  // of common display chars — so random intermediate glyphs never flash a
  // character that doesn't belong to the final text.
  function buildPool(source) {
    var base = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·→';
    var pool = {};
    for (var i = 0; i < base.length; i++) pool[base[i]] = true;
    for (var j = 0; j < source.length; j++) {
      var c = source[j];
      if (c !== ' ' && c !== '\n') pool[c] = true;
    }
    return Object.keys(pool).join('');
  }

  function rollText(el, text) {
    // Clear any previously-running roll timers attached to this element
    if (el.__rollTimers) {
      el.__rollTimers.forEach(function (t) { clearTimeout(t); });
    }
    el.__rollTimers = [];

    if (reduced()) {
      el.textContent = text;
      return;
    }

    var pool = buildPool(text);
    var chars = text.split('');
    el.textContent = '';

    var spans = chars.map(function (ch) {
      var s = document.createElement('span');
      s.className = 'flip-char';
      s.textContent = ch;
      el.appendChild(s);
      return s;
    });

    spans.forEach(function (span, i) {
      var finalCh = chars[i];
      if (finalCh === ' ') { span.textContent = ' '; return; }

      var cycles = ROLL_CYCLES_MIN + Math.floor(Math.random() * (ROLL_CYCLES_MAX - ROLL_CYCLES_MIN + 1));
      var startDelay = i * ROLL_CHAR_STAGGER_MS;

      el.__rollTimers.push(setTimeout(function tick(n) {
        if (n >= cycles) {
          span.textContent = finalCh;
          return;
        }
        span.textContent = pool[Math.floor(Math.random() * pool.length)];
        el.__rollTimers.push(setTimeout(function () { tick(n + 1); }, ROLL_TICK_MS));
      }, startDelay, 0));
    });
  }

  /* ---------- Single spotlight controller ---------- */

  function initSpotlight(spotlightEl) {
    var name = spotlightEl.dataset.spotlight;
    var stage = spotlightEl.querySelector('.spotlight__stage');
    var slides = Array.prototype.slice.call(spotlightEl.querySelectorAll('.slide'));
    var dots = Array.prototype.slice.call(spotlightEl.querySelectorAll('.spot-dot'));
    var btnPrev = spotlightEl.querySelector('.spot-btn--prev');
    var btnNext = spotlightEl.querySelector('.spot-btn--next');

    if (!slides.length || !stage) return;

    var idx = 0;
    var timer = null;
    var ariaLiveTimer = null;

    // Cache the original label text so we never re-read it after it's been
    // mutated with flip-char spans.
    slides.forEach(function (slide) {
      var lbl = slide.querySelector('.slide__label');
      if (lbl) lbl.dataset.text = (lbl.textContent || '').trim();
    });

    function setActiveSlide(newIdx, viaAuto) {
      if (newIdx === idx) return;
      slides[idx].removeAttribute('data-active');
      if (dots[idx]) dots[idx].setAttribute('aria-selected', 'false');

      idx = (newIdx + slides.length) % slides.length;

      slides[idx].setAttribute('data-active', '');
      if (dots[idx]) dots[idx].setAttribute('aria-selected', 'true');

      // aria-live: announce only auto-advances
      clearTimeout(ariaLiveTimer);
      stage.setAttribute('aria-live', viaAuto ? 'polite' : 'off');
      if (viaAuto) {
        ariaLiveTimer = setTimeout(function () {
          stage.setAttribute('aria-live', 'off');
        }, ARIA_POLITE_CLEAR_MS);
      }

      // Character-roll on the label
      var label = slides[idx].querySelector('.slide__label');
      if (label && label.dataset.text) rollText(label, label.dataset.text);
    }

    function canAutoAdvance() {
      return !mobile() && !reduced();
    }

    function startTimer() {
      clearInterval(timer);
      if (!canAutoAdvance()) return;
      timer = setInterval(function () {
        setActiveSlide(idx + 1, true);
      }, INTERVAL_MS);
    }

    function stopTimer() {
      clearInterval(timer);
      timer = null;
    }

    /* ---- Controls ---- */

    if (btnPrev) btnPrev.addEventListener('click', function () {
      setActiveSlide(idx - 1, false);
      startTimer();
    });

    if (btnNext) btnNext.addEventListener('click', function () {
      setActiveSlide(idx + 1, false);
      startTimer();
    });

    dots.forEach(function (d, i) {
      d.addEventListener('click', function () {
        setActiveSlide(i, false);
        startTimer();
      });
    });

    /* ---- Pause on hover / focus ---- */

    spotlightEl.addEventListener('mouseenter', stopTimer);
    spotlightEl.addEventListener('mouseleave', startTimer);
    spotlightEl.addEventListener('focusin', stopTimer);
    spotlightEl.addEventListener('focusout', function (e) {
      if (spotlightEl.contains(e.relatedTarget)) return;
      startTimer();
    });

    /* ---- Keyboard ---- */

    spotlightEl.addEventListener('keydown', function (e) {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          setActiveSlide(idx - 1, false);
          startTimer();
          break;
        case 'ArrowRight':
          e.preventDefault();
          setActiveSlide(idx + 1, false);
          startTimer();
          break;
        case 'Home':
          e.preventDefault();
          setActiveSlide(0, false);
          startTimer();
          break;
        case 'End':
          e.preventDefault();
          setActiveSlide(slides.length - 1, false);
          startTimer();
          break;
      }
    });

    /* ---- Initial label roll + staggered start ---- */

    // Do a character-roll on the initial active label so the effect is seen
    // immediately without waiting 8 s.
    var initialLabel = slides[idx].querySelector('.slide__label');
    if (initialLabel && initialLabel.dataset.text) {
      // Wait a tick so CSS transitions & fonts settle first
      setTimeout(function () { rollText(initialLabel, initialLabel.dataset.text); }, 200);
    }

    var offset = STAGGER_MS[name] || 0;
    setTimeout(startTimer, offset);

    /* ---- React to media-query changes ---- */

    function onMediaChange() {
      if (canAutoAdvance()) startTimer();
      else stopTimer();
    }
    // Safari < 14 doesn't have addEventListener on MediaQueryList
    if (mqMobile.addEventListener) mqMobile.addEventListener('change', onMediaChange);
    else if (mqMobile.addListener) mqMobile.addListener(onMediaChange);
    if (mqReduceMotion.addEventListener) mqReduceMotion.addEventListener('change', onMediaChange);
    else if (mqReduceMotion.addListener) mqReduceMotion.addListener(onMediaChange);
  }

  /* ---------- Boot ---------- */

  function boot() {
    var spotlights = document.querySelectorAll('.spotlight');
    spotlights.forEach(initSpotlight);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
