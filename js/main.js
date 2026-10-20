/* ============================================================
 * 个人网站 —— 数据渲染与交互
 * 数据来源：data/profile.json（后台编辑后会提交到 GitHub）
 * ============================================================ */
(function () {
  'use strict';

  // 兜底数据：直接双击 index.html（file://）无法 fetch 时使用
  var DEFAULT = {
    name: '李欣言',
    title: '软件工程 · 本科生',
    tagline: '热爱产品与工程，喜欢把想法做成可用的东西。',
    bio: '我是一名软件工程专业本科生，关注移动端开发、数据设计与产品体验。',
    avatar: 'assets/avatar.svg',
    location: '大连 · 中国',
    email: 'lixinyan@example.com',
    skills: ['Java', 'Android', 'SQLite', 'JavaScript', 'HTML / CSS', '产品设计'],
    socials: [{ label: 'GitHub', url: 'https://github.com/lixinyan-git' }],
    projects: [{ name: '墨禾书城 App', desc: '多端图书商城。', tags: ['Android', 'SQLite'], link: '' }],
    experience: [{ period: '2023 — 至今', org: '大连海事大学', role: '软件工程 本科', desc: '主修软件工程。' }]
  };

  function $(s) { return document.querySelector(s); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function renderSocials(box, list) {
    box.innerHTML = '';
    (list || []).forEach(function (s) {
      var a = el('a', 'social', s.label);
      a.href = s.url;
      if (/^https?:/i.test(s.url)) { a.target = '_blank'; a.rel = 'noopener'; }
      box.appendChild(a);
    });
  }

  function render(p) {
    document.title = (p.name || '个人主页') + ' · 个人主页';
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', (p.name || '') + ' — ' + (p.title || '') + '。' + (p.tagline || ''));

    $('#brandName').textContent = p.name || '';
    $('#footerName').textContent = p.name || '';
    $('#name').textContent = p.name || '';
    $('#title').textContent = p.title || '';
    $('#tagline').textContent = p.tagline || '';
    $('#bio').textContent = p.bio || '';
    $('#location').textContent = p.location || '—';

    var emailA = $('#email');
    emailA.textContent = p.email || '—';
    emailA.href = 'mailto:' + (p.email || '');

    var mailBtn = $('#mailBtn');
    mailBtn.href = 'mailto:' + (p.email || '');
    mailBtn.textContent = '发邮件';

    if (p.avatar) $('#avatar').src = p.avatar;

    // 技能
    var skillsBox = $('#skillsList');
    skillsBox.innerHTML = '';
    (p.skills || []).forEach(function (s) { skillsBox.appendChild(el('span', 'chip', s)); });

    // 项目
    var projectsBox = $('#projectsList');
    projectsBox.innerHTML = '';
    (p.projects || []).forEach(function (pr) {
      var card = el('article', 'card');
      card.appendChild(el('h3', null, pr.name));
      card.appendChild(el('p', null, pr.desc));
      var tags = el('div', 'tags');
      (pr.tags || []).forEach(function (t) { tags.appendChild(el('span', 'tag', t)); });
      card.appendChild(tags);
      if (pr.link) {
        var a = el('a', 'card-link', '查看项目 →');
        a.href = pr.link; a.target = '_blank'; a.rel = 'noopener';
        card.appendChild(a);
      }
      projectsBox.appendChild(card);
    });

    // 经历
    var expBox = $('#experienceList');
    expBox.innerHTML = '';
    (p.experience || []).forEach(function (x) {
      var item = el('div', 'tl-item');
      item.appendChild(el('div', 'tl-period', x.period));
      item.appendChild(el('div', 'tl-role', x.role));
      item.appendChild(el('div', 'tl-org', x.org));
      if (x.desc) item.appendChild(el('div', 'tl-desc', x.desc));
      expBox.appendChild(item);
    });

    renderSocials($('#socials'), p.socials);
    renderSocials($('#contactSocials'), p.socials);

    // 复制邮箱
    var copyBtn = $('#copyBtn');
    copyBtn.onclick = function () {
      var text = p.email || '';
      if (!text) return;
      var done = function () { toast('邮箱已复制：' + text); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () { fallbackCopy(text, done); });
      } else { fallbackCopy(text, done); }
    };
  }

  function fallbackCopy(text, cb) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); cb(); } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
  }

  var toastTimer = null;
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }

  /* ---------- 主题 ---------- */
  function initTheme() {
    var saved = localStorage.getItem('ps-theme');
    var dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    $('#themeToggle').textContent = dark ? '☀️' : '🌙';
    $('#themeToggle').addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme') === 'dark';
      var next = cur ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('ps-theme', next);
      $('#themeToggle').textContent = next === 'dark' ? '☀️' : '🌙';
    });
  }

  /* ---------- 移动端菜单 ---------- */
  function initMenu() {
    var btn = $('#menuToggle'), links = $('#navLinks');
    btn.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        links.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- 滚动：导航阴影 + 当前区块高亮 ---------- */
  function initScroll() {
    var header = $('#header');
    var sections = ['about', 'skills', 'projects', 'experience', 'contact'];
    var links = Array.prototype.slice.call(document.querySelectorAll('#navLinks a[href^="#"]'));
    function onScroll() {
      header.classList.toggle('scrolled', window.scrollY > 8);
      var pos = window.scrollY + 120, current = '';
      sections.forEach(function (id) {
        var s = document.getElementById(id);
        if (s && s.offsetTop <= pos) current = id;
      });
      links.forEach(function (a) {
        a.classList.toggle('active', a.getAttribute('href') === '#' + current);
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  }

  /* ---------- 启动 ---------- */
  initTheme();
  initMenu();
  initScroll();
  $('#year').textContent = new Date().getFullYear();

  fetch('data/profile.json', { cache: 'no-store' })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(render)
    .catch(function () { render(DEFAULT); });
})();
