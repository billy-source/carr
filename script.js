(function () {
  'use strict';

  /* ---------- Data ---------- */
  var CARS = [
    { id: 'demio',   name: 'Mazda Demio',        type: 'hatchback', seats: 5, bags: 2, trans: 'Automatic', fuel: 'Petrol', price: 3800 },
    { id: 'vitz',    name: 'Toyota Vitz',        type: 'hatchback', seats: 5, bags: 2, trans: 'Automatic', fuel: 'Petrol', price: 3500 },
    { id: 'axio',    name: 'Toyota Axio',        type: 'sedan',     seats: 5, bags: 3, trans: 'Automatic', fuel: 'Petrol', price: 4500 },
    { id: 'rav4',    name: 'Toyota RAV4',        type: 'suv',       seats: 5, bags: 4, trans: 'Automatic', fuel: 'Petrol', price: 7500 },
    { id: 'forester',name: 'Subaru Forester',    type: 'suv',       seats: 5, bags: 4, trans: 'Automatic', fuel: 'Petrol', price: 8000 },
    { id: 'xtrail',  name: 'Nissan X-Trail',     type: 'suv',       seats: 7, bags: 4, trans: 'Automatic', fuel: 'Petrol', price: 8500 },
    { id: 'prado',   name: 'Toyota Land Cruiser Prado', type: 'suv', seats: 7, bags: 5, trans: 'Automatic', fuel: 'Diesel', price: 15000 },
    { id: 'hiace',   name: 'Toyota Hiace',       type: 'van',       seats: 14, bags: 8, trans: 'Manual',   fuel: 'Diesel', price: 12000 }
  ];
  var TYPES = { all: 'All cars', hatchback: 'Hatchbacks', sedan: 'Sedans', suv: 'SUVs', van: 'Vans' };
  var ADDONS = [
    { id: 'driver', label: 'Professional driver', price: 2500 },
    { id: 'seat',   label: 'Child seat',          price: 400 },
    { id: 'wifi',   label: 'Mobile Wi-Fi',        price: 300 }
  ];
  var LOCATIONS = ['Nairobi CBD', 'JKIA Airport', 'Wilson Airport', 'Westlands', 'Karen', 'Mombasa Road'];
  var STORE_KEY = 'savanna-drive-bookings';

  /* ---------- State ---------- */
  var state = { loc: LOCATIONS[0], from: '', to: '', type: 'all', sort: 'price-asc', car: null };

  /* ---------- Helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function money(n) { return 'KES ' + n.toLocaleString('en-KE'); }
  function iso(d) {
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }
  function addDays(d, n) { var c = new Date(d); c.setDate(c.getDate() + n); return c; }
  function parse(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function nice(s) { return parse(s).toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' }); }
  function dayCount() {
    var n = Math.round((parse(state.to) - parse(state.from)) / 86400000);
    return Math.max(1, n);
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function loadBookings() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch (e) { return []; }
  }
  function saveBookings(list) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); } catch (e) { /* storage unavailable */ }
  }
  var memoryBookings = null;
  function getBookings() { return memoryBookings || loadBookings(); }
  function setBookings(list) { memoryBookings = list; saveBookings(list); }

  /* ---------- Car drawing ---------- */
  var BODIES = {
    hatchback: 'M12 58 L20 44 Q24 38 36 36 L62 24 Q68 21 76 21 L112 21 Q122 21 128 28 L142 40 Q166 42 176 48 Q184 52 184 58 L184 62 L12 62 Z',
    sedan:     'M10 58 L18 46 Q24 41 38 39 L64 24 Q70 21 78 21 L112 21 Q120 21 126 27 L142 39 Q170 41 180 47 Q188 52 188 58 L188 62 L10 62 Z',
    suv:       'M12 58 L16 40 Q18 30 30 28 L56 22 Q62 20 70 20 L138 20 Q148 20 152 28 L162 38 Q180 40 184 48 L186 58 L186 62 L12 62 Z',
    van:       'M10 58 L10 24 Q10 16 20 16 L140 16 Q150 16 156 24 L172 40 Q184 42 188 50 L190 58 L190 62 L10 62 Z'
  };
  var WINDOWS = {
    hatchback: 'M42 38 L64 27 L78 27 L78 38 Z M86 27 L112 27 Q118 27 122 32 L130 38 L86 38 Z',
    sedan:     'M44 40 L66 27 L78 27 L78 40 Z M86 27 L112 27 Q116 27 120 31 L132 40 L86 40 Z',
    suv:       'M30 38 L36 31 L60 27 L76 27 L76 38 Z M84 27 L136 27 Q142 27 146 32 L154 38 L84 38 Z',
    van:       'M20 36 L20 24 L50 24 L50 36 Z M58 36 L58 24 L96 24 L96 36 Z M104 36 L104 24 L140 24 Q146 24 150 30 L156 36 Z'
  };
  function carSvg(type) {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 200 76');
    svg.setAttribute('aria-hidden', 'true');
    function path(d, fill) {
      var p = document.createElementNS(ns, 'path');
      p.setAttribute('d', d); p.setAttribute('fill', fill); svg.appendChild(p);
    }
    function wheel(cx) {
      var c = document.createElementNS(ns, 'circle');
      c.setAttribute('cx', cx); c.setAttribute('cy', 62); c.setAttribute('r', 11);
      c.setAttribute('fill', 'var(--ink)'); svg.appendChild(c);
      var h = document.createElementNS(ns, 'circle');
      h.setAttribute('cx', cx); h.setAttribute('cy', 62); h.setAttribute('r', 4);
      h.setAttribute('fill', 'var(--alt)'); svg.appendChild(h);
    }
    path(BODIES[type], 'currentColor');
    path(WINDOWS[type], 'var(--alt)');
    wheel(48); wheel(152);
    return svg;
  }

  /* ---------- Search form ---------- */
  function initSearch() {
    var sel = $('pickupLoc');
    LOCATIONS.forEach(function (l) { var o = el('option', '', l); o.value = l; sel.appendChild(o); });
    var today = new Date();
    var min = iso(today);
    state.from = iso(addDays(today, 1));
    state.to = iso(addDays(today, 4));
    $('dateFrom').min = min; $('dateTo').min = min;
    $('dateFrom').value = state.from; $('dateTo').value = state.to;

    $('dateFrom').addEventListener('change', function () {
      if ($('dateTo').value <= this.value) $('dateTo').value = iso(addDays(parse(this.value), 1));
    });

    $('searchForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var from = $('dateFrom').value, to = $('dateTo').value, err = $('searchError');
      if (!from || !to) { err.textContent = 'Choose both a pickup and a return date.'; err.hidden = false; return; }
      if (from < min) { err.textContent = 'Pickup date cannot be in the past.'; err.hidden = false; return; }
      if (to <= from) { err.textContent = 'Return date must be after the pickup date.'; err.hidden = false; return; }
      err.hidden = true;
      state.loc = sel.value; state.from = from; state.to = to;
      renderFleet();
      $('fleet').scrollIntoView();
    });
  }

  /* ---------- Fleet ---------- */
  function initFilters() {
    var box = $('typeChips');
    Object.keys(TYPES).forEach(function (k) {
      var b = el('button', 'chip', TYPES[k]);
      b.type = 'button'; b.dataset.type = k;
      b.setAttribute('aria-pressed', k === state.type ? 'true' : 'false');
      b.addEventListener('click', function () {
        state.type = k;
        Array.prototype.forEach.call(box.children, function (c) {
          c.setAttribute('aria-pressed', c.dataset.type === k ? 'true' : 'false');
        });
        renderFleet();
      });
      box.appendChild(b);
    });
    $('sortBy').addEventListener('change', function () { state.sort = this.value; renderFleet(); });
  }

  function renderFleet() {
    var days = dayCount();
    $('tripSummary').textContent = state.loc + ', ' + nice(state.from) + ' to ' + nice(state.to) +
      ' (' + days + (days === 1 ? ' day' : ' days') + ')';

    var list = CARS.filter(function (c) { return state.type === 'all' || c.type === state.type; });
    list.sort(function (a, b) {
      if (state.sort === 'price-desc') return b.price - a.price;
      if (state.sort === 'seats-desc') return b.seats - a.seats || a.price - b.price;
      return a.price - b.price;
    });

    var grid = $('carGrid');
    grid.textContent = '';
    if (!list.length) { grid.appendChild(el('p', 'empty', 'No cars match this filter.')); return; }

    list.forEach(function (c) {
      var card = el('article', 'car');
      var art = el('div', 'car-art'); art.appendChild(carSvg(c.type));
      var body = el('div', 'car-body');
      body.appendChild(el('span', 'car-type', TYPES[c.type].replace(/s$/, '')));
      body.appendChild(el('h3', '', c.name));
      var specs = el('ul', 'specs');
      [c.seats + ' seats', c.bags + ' bags', c.trans, c.fuel].forEach(function (s) { specs.appendChild(el('li', '', s)); });
      body.appendChild(specs);

      var row = el('div', 'price-row');
      var left = el('div');
      var price = el('div', 'price', money(c.price).replace('KES ', 'KES '));
      price.appendChild(el('small', '', ' / day'));
      left.appendChild(price);
      left.appendChild(el('div', 'total', money(c.price * days) + ' for ' + days + (days === 1 ? ' day' : ' days')));
      var btn = el('button', 'btn primary', 'Reserve');
      btn.type = 'button';
      btn.addEventListener('click', function () { openModal(c); });
      row.appendChild(left); row.appendChild(btn);
      body.appendChild(row);

      card.appendChild(art); card.appendChild(body);
      grid.appendChild(card);
    });
  }

  /* ---------- Terms add-on list ---------- */
  function renderAddonList() {
    var ul = $('addonList');
    ADDONS.forEach(function (a) {
      var li = el('li');
      li.appendChild(el('span', '', a.label));
      li.appendChild(el('span', '', money(a.price)));
      ul.appendChild(li);
    });
  }

  /* ---------- Modal ---------- */
  var lastFocus = null;

  function openModal(car) {
    state.car = car;
    lastFocus = document.activeElement;
    $('modalTitle').textContent = 'Reserve the ' + car.name;
    $('modalTrip').textContent = state.loc + ', ' + nice(state.from) + ' to ' + nice(state.to) + ' (' + dayCount() + ' days)';
    $('bookForm').reset();
    ['errName', 'errPhone', 'errEmail'].forEach(function (id) { $(id).hidden = true; });

    var box = $('addonChecks');
    box.textContent = '';
    ADDONS.forEach(function (a) {
      var lab = el('label', 'check');
      var cb = document.createElement('input');
      cb.type = 'checkbox'; cb.value = a.id; cb.id = 'addon-' + a.id;
      cb.addEventListener('change', updateSummary);
      lab.appendChild(cb);
      lab.appendChild(el('span', '', a.label));
      lab.appendChild(el('span', '', money(a.price) + ' / day'));
      box.appendChild(lab);
    });
    $('bookView').hidden = false; $('doneView').hidden = true;
    updateSummary();
    $('overlay').hidden = false;
    document.body.style.overflow = 'hidden';
    $('fullName').focus();
  }

  function closeModal() {
    $('overlay').hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function selectedAddons() {
    return ADDONS.filter(function (a) { return $('addon-' + a.id) && $('addon-' + a.id).checked; });
  }

  function quote() {
    var days = dayCount();
    var lines = [{ label: state.car.name + ' x ' + days + (days === 1 ? ' day' : ' days'), amount: state.car.price * days }];
    selectedAddons().forEach(function (a) { lines.push({ label: a.label + ' x ' + days, amount: a.price * days }); });
    var total = lines.reduce(function (s, l) { return s + l.amount; }, 0);
    return { lines: lines, total: total };
  }

  function updateSummary() {
    var q = quote(), box = $('summary');
    box.textContent = '';
    q.lines.forEach(function (l) {
      var d = el('div'); d.appendChild(el('span', '', l.label)); d.appendChild(el('span', '', money(l.amount))); box.appendChild(d);
    });
    var g = el('div', 'grand'); g.appendChild(el('span', '', 'Total')); g.appendChild(el('span', '', money(q.total)));
    box.appendChild(g);
    var note = el('p', 'muted', 'Plus a refundable KES 10,000 deposit, paid at pickup.');
    note.style.fontSize = '0.8rem'; note.style.marginTop = '8px';
    box.appendChild(note);
  }

  function showErr(id, msg) { var e = $(id); e.textContent = msg; e.hidden = !msg; return !msg; }

  function submitBooking(e) {
    e.preventDefault();
    var name = $('fullName').value.trim();
    var phone = $('phone').value.replace(/[\s-]/g, '');
    var email = $('email').value.trim();
    var ok = true;
    ok = showErr('errName', name.length < 2 ? 'Enter your full name.' : '') && ok;
    ok = showErr('errPhone', /^(\+254|0)[17]\d{8}$/.test(phone) ? '' : 'Enter a Kenyan number such as 0712 345 678.') && ok;
    ok = showErr('errEmail', email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? 'Enter a valid email address.' : '') && ok;
    if (!ok) return;

    var q = quote();
    var ref = 'SD-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    var list = getBookings();
    list.unshift({ ref: ref, car: state.car.name, loc: state.loc, from: state.from, to: state.to, total: q.total, name: name });
    setBookings(list);
    renderBookings();

    $('doneRef').textContent = ref;
    $('doneText').textContent = name + ', your ' + state.car.name + ' is reserved at ' + state.loc + ' from ' +
      nice(state.from) + ' to ' + nice(state.to) + '. Total ' + money(q.total) +
      '. Bring your driving licence and ID, and pay at pickup.';
    $('bookView').hidden = true; $('doneView').hidden = false;
  }

  /* ---------- My bookings ---------- */
  function renderBookings() {
    var box = $('bookingList');
    box.textContent = '';
    var list = getBookings();
    if (!list.length) { box.appendChild(el('p', 'empty', 'No bookings yet. Reserve a car from the fleet above.')); return; }
    list.forEach(function (b) {
      var row = el('div', 'booking');
      var info = el('div');
      info.appendChild(el('strong', '', b.car + ' '));
      info.appendChild(el('span', 'ref-tag', b.ref));
      info.appendChild(el('div', 'meta', b.loc + ', ' + nice(b.from) + ' to ' + nice(b.to) + ', ' + money(b.total)));
      var cancel = el('button', 'btn', 'Cancel booking');
      cancel.type = 'button';
      cancel.addEventListener('click', function () {
        setBookings(getBookings().filter(function (x) { return x.ref !== b.ref; }));
        renderBookings();
      });
      row.appendChild(info); row.appendChild(cancel);
      box.appendChild(row);
    });
  }

  /* ---------- Theme ---------- */
  function initTheme() {
    var root = document.documentElement;
    try { var t = localStorage.getItem('savanna-theme'); if (t) root.setAttribute('data-theme', t); } catch (e) { /* ignore */ }
    $('themeToggle').addEventListener('click', function () {
      var current = root.getAttribute('data-theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      var next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('savanna-theme', next); } catch (e) { /* ignore */ }
    });
  }

  /* ---------- Start ---------- */
  initTheme();
  initSearch();
  initFilters();
  renderAddonList();
  renderFleet();
  renderBookings();

  $('bookForm').addEventListener('submit', submitBooking);
  $('closeModal').addEventListener('click', closeModal);
  $('doneBtn').addEventListener('click', closeModal);
  $('overlay').addEventListener('mousedown', function (e) { if (e.target === this) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('overlay').hidden) closeModal(); });
})();