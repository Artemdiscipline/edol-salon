/* =====================================================================
   EDOL · main.js
   Поведение страницы на чистом JS, без библиотек.
   Данные для заглушек берутся из content.js (window.EDOL_CONTENT).
   Всё, что двигается, отключается при prefers-reduced-motion.
   ===================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var data = window.EDOL_CONTENT || {};
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function formatPrice(value) {
    return 'от ' + new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
  }

  /* ---------------------------------------------------------------
     1. Цены из content.js -> карточки услуг (по data-key)
     --------------------------------------------------------------- */
  function renderPrices() {
    var prices = data.prices || {};
    document.querySelectorAll('.svc[data-key]').forEach(function (card) {
      var key = card.getAttribute('data-key');
      if (!(key in prices)) return;
      var slot = card.querySelector('[data-price]');
      var value = prices[key];
      if (typeof value === 'number' && value > 0) {
        slot.textContent = formatPrice(value);
        slot.classList.remove('is-empty');
      } else {
        slot.textContent = 'заполнить';
        slot.classList.add('is-empty');
      }
    });
  }

  /* ---------------------------------------------------------------
     2. Мастера
     --------------------------------------------------------------- */
  function renderMasters() {
    var box = document.querySelector('[data-masters]');
    if (!box || !Array.isArray(data.masters)) return;

    box.innerHTML = data.masters.map(function (m, i) {
      var photo = m.photo
        ? '<img src="' + esc(m.photo) + '" alt="' + esc(m.alt || m.name || 'Мастер салона EDOL') + '" loading="lazy" decoding="async" width="900" height="1200">'
        : '<svg class="master__mark" aria-hidden="true"><use href="#logo"/></svg><span class="tag">фото · заполнить</span>';
      var name = m.name
        ? esc(m.name)
        : 'Имя мастера<span class="tag tag--inline">заполнить</span>';
      return '<li class="master reveal" style="--d:' + (i % 4) * 90 + 'ms">' +
        '<figure>' +
          '<div class="master__photo">' + photo + '</div>' +
          '<figcaption><p class="master__name">' + name + '</p>' +
          '<p class="master__role">' + esc(m.role) + '</p></figcaption>' +
        '</figure></li>';
    }).join('');
  }

  /* ---------------------------------------------------------------
     3. Галерея работ
     --------------------------------------------------------------- */
  var NAIL_WORDS = /маникюр|педикюр|ногт|наращ/i;

  // Линейный мотив для заглушки: ногти — «миндаль», волосы — пряди
  function tileArt(category, index) {
    if (NAIL_WORDS.test(category) && !/волос/i.test(category)) {
      return '<svg class="tile__art" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
        '<path d="M70 52c12 0 15 18 15 36 0 13-7 22-15 22s-15-9-15-22c0-18 3-36 15-36z"/>' +
        '<path d="M100 40c12 0 15 18 15 36 0 13-7 22-15 22s-15-9-15-22c0-18 3-36 15-36z"/>' +
        '<path d="M130 52c12 0 15 18 15 36 0 13-7 22-15 22s-15-9-15-22c0-18 3-36 15-36z"/>' +
        '<circle cx="100" cy="100" r="' + (70 + (index % 3) * 8) + '"/>' +
        '</svg>';
    }
    var shift = (index % 3) * 10;
    return '<svg class="tile__art" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<path d="M-10 ' + (50 + shift) + 'C50 ' + (20 + shift) + ' 90 ' + (110 + shift) + ' 210 ' + (70 + shift) + '"/>' +
      '<path d="M-10 ' + (70 + shift) + 'C50 ' + (40 + shift) + ' 90 ' + (130 + shift) + ' 210 ' + (90 + shift) + '"/>' +
      '<path d="M-10 ' + (90 + shift) + 'C50 ' + (60 + shift) + ' 90 ' + (150 + shift) + ' 210 ' + (110 + shift) + '"/>' +
      '<path d="M-10 ' + (110 + shift) + 'C50 ' + (80 + shift) + ' 90 ' + (170 + shift) + ' 210 ' + (130 + shift) + '"/>' +
      '</svg>';
  }

  function renderGallery() {
    var box = document.querySelector('[data-gallery]');
    if (!box || !Array.isArray(data.gallery)) return;

    box.innerHTML = data.gallery.map(function (g, i) {
      var tone = /^[a-z]+$/.test(g.tone || '') ? g.tone : 'latte';
      var classes = 'tile reveal tone-' + tone + (g.tall ? ' is-tall' : '') + (g.image ? ' has-photo' : '');
      var media = g.image
        ? '<img src="' + esc(g.image) + '" alt="' + esc(g.alt || g.category) + '" loading="lazy" decoding="async">'
        : tileArt(g.category || '', i);
      var todo = g.image ? '' : '<span class="tile__todo">фото · заполнить</span>';
      return '<li class="' + classes + '" style="--d:' + (i % 4) * 70 + 'ms">' + media +
        '<p class="tile__cap"><span class="tile__cat">' + esc(g.category) + '</span>' + todo + '</p></li>';
    }).join('');
  }

  renderPrices();
  renderMasters();
  renderGallery();

  /* ---------------------------------------------------------------
     4. Появление блоков при прокрутке
     --------------------------------------------------------------- */
  var revealItems = document.querySelectorAll('.reveal');
  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    revealItems.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealItems.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------------------------------------------------------------
     5. Вход hero: ждём шрифты (не дольше 1,2 с), чтобы буквы
        съезжались уже в Jost, а не в запасном шрифте
     --------------------------------------------------------------- */
  var hero = document.querySelector('.hero');
  function startHero() { if (hero) hero.classList.add('is-go'); }
  if (reduceMotion.matches) {
    startHero();
  } else {
    var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.race([fontsReady, new Promise(function (r) { setTimeout(r, 1200); })])
      .then(function () { requestAnimationFrame(startHero); });
  }

  /* ---------------------------------------------------------------
     6. Прокрутка: шапка, нижняя панель, параллакс фона hero
        Один обработчик + requestAnimationFrame = без лишних перерисовок
     --------------------------------------------------------------- */
  var header = document.querySelector('[data-header]');
  var mbar = document.querySelector('[data-mbar]');
  var layers = Array.prototype.slice.call(document.querySelectorAll('[data-depth]'));
  var heroVisible = true;
  var ticking = false;

  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      heroVisible = entries[0].isIntersecting;
    }).observe(hero);
  }

  function onFrame() {
    ticking = false;
    var y = window.scrollY || window.pageYOffset;

    header.classList.toggle('is-scrolled', y > 12);

    if (mbar) {
      var show = hero ? y > hero.offsetHeight * 0.6 : y > 400;
      if (show !== mbar.classList.contains('is-on')) {
        mbar.classList.toggle('is-on', show);
        mbar.inert = !show;
      }
    }

    if (heroVisible && !reduceMotion.matches) {
      for (var i = 0; i < layers.length; i++) {
        var depth = parseFloat(layers[i].getAttribute('data-depth')) || 0;
        layers[i].style.transform = 'translate3d(0,' + (y * depth).toFixed(1) + 'px,0)';
      }
    }
  }
  function requestFrame() {
    if (!ticking) { ticking = true; requestAnimationFrame(onFrame); }
  }
  window.addEventListener('scroll', requestFrame, { passive: true });
  window.addEventListener('resize', requestFrame, { passive: true });
  onFrame();

  /* ---------------------------------------------------------------
     7. Мобильное меню
     --------------------------------------------------------------- */
  var menuBtn = document.querySelector('[data-menu-btn]');
  var menu = document.querySelector('[data-menu]');

  function setMenu(open) {
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    menu.classList.toggle('is-open', open);
    menu.inert = !open;
    root.classList.toggle('menu-open', open);
    if (open) {
      var first = menu.querySelector('a');
      if (first) first.focus({ preventScroll: true });
    }
  }
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function () {
      setMenu(menuBtn.getAttribute('aria-expanded') !== 'true');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) {
        setMenu(false);
        menuBtn.focus();
      }
    });
    window.matchMedia('(min-width: 960px)').addEventListener('change', function (e) {
      if (e.matches) setMenu(false);
    });
  }

  /* ---------------------------------------------------------------
     8. Счётчик рейтинга: 0.0 -> 4.9 при появлении на экране
     --------------------------------------------------------------- */
  var counter = document.querySelector('[data-count]');
  var stars = document.querySelector('[data-stars]');
  if (counter && !reduceMotion.matches && 'IntersectionObserver' in window) {
    var target = parseFloat(counter.getAttribute('data-count')) || 0;
    var finalWidth = stars ? stars.style.getPropertyValue('--w') || '98%' : '';
    counter.textContent = '0.0';
    if (stars) stars.style.setProperty('--w', '0%');

    var countObserver = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      countObserver.disconnect();
      var start = null;
      var duration = 1600;
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 4);
        counter.textContent = (target * eased).toFixed(1);
        if (stars) stars.style.setProperty('--w', (parseFloat(finalWidth) * eased).toFixed(1) + '%');
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }, { threshold: 0.6 });
    countObserver.observe(counter);
  }

  /* ---------------------------------------------------------------
     9. Подсветка карточек за курсором (только мышь)
     --------------------------------------------------------------- */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.addEventListener('pointermove', function (e) {
      var card = e.target.closest && e.target.closest('.svc, .tile');
      if (!card) return;
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
  }

  /* ---------------------------------------------------------------
     10. Мелочи
     --------------------------------------------------------------- */
  var year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

})();
