/* ============================================================
 * 个人网站 · 后台
 * 通过 GitHub Contents API 读取/保存 data/profile.json
 * ============================================================ */
(function () {
  'use strict';

  var API = 'https://api.github.com';
  var PATH = 'data/profile.json';
  var LS = { token: 'ps-gh-token', repo: 'ps-gh-repo', branch: 'ps-gh-branch' };

  var $ = function (s) { return document.querySelector(s); };
  var state = { token: '', repo: '', branch: 'main', sha: null };

  /* ---------- 工具 ---------- */
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._t);
    t._t = setTimeout(function () { t.classList.remove('show'); }, 3000);
  }
  function setPill(text, cls) {
    var p = $('#statusPill');
    p.textContent = text;
    p.className = 'pill' + (cls ? ' ' + cls : '');
  }
  function setHint(t) { $('#saveHint').textContent = t; }
  function b64encodeUtf8(str) {
    var bytes = new TextEncoder().encode(str), bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  function b64decodeUtf8(b64) {
    var bin = atob(String(b64).replace(/\s/g, ''));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  function headers() {
    return {
      'Authorization': 'Bearer ' + state.token,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    };
  }
  function apiError(res, data) {
    if (res.status === 401) return 'Token 无效或已过期（401）';
    if (res.status === 404) return '仓库/分支/文件不存在，或 Token 没有该仓库权限（404）';
    if (res.status === 409) return '保存冲突，请点「重新加载」后再改（409）';
    if (res.status === 422) return '提交被拒绝，可能是分支或内容有问题（422）';
    return 'GitHub 返回 ' + res.status + (data && data.message ? '：' + data.message : '');
  }

  /* ---------- 动态行 ---------- */
  function row(inner, onDel) {
    var box = document.createElement('div');
    box.className = 'row';
    box.appendChild(inner);
    var del = document.createElement('button');
    del.className = 'del'; del.type = 'button'; del.textContent = '✕'; del.title = '删除';
    del.addEventListener('click', function () { box.remove(); onDel && onDel(); });
    box.appendChild(del);
    return box;
  }
  function field(labelText, value, placeholder) {
    var l = document.createElement('label');
    l.textContent = labelText;
    var i = document.createElement('input');
    i.type = 'text'; i.value = value || ''; if (placeholder) i.placeholder = placeholder;
    l.appendChild(i);
    return { wrap: l, input: i };
  }

  function addSocial(data) {
    data = data || {};
    var g = document.createElement('div');
    g.className = 'grid-2';
    var a = field('名称', data.label, 'GitHub / 邮箱 / 微信');
    var b = field('链接', data.url, 'https://... 或 mailto:...');
    g.appendChild(a.wrap); g.appendChild(b.wrap);
    var r = row(g);
    r._get = function () { return { label: a.input.value.trim(), url: b.input.value.trim() }; };
    $('#socialsList').appendChild(r);
  }
  function addProject(data) {
    data = data || {};
    var box = document.createElement('div');
    var g1 = document.createElement('div'); g1.className = 'grid-2';
    var a = field('项目名称', data.name);
    var b = field('链接（可选）', data.link, 'https://...');
    g1.appendChild(a.wrap); g1.appendChild(b.wrap);
    var c = field('项目描述', data.desc);
    var d = field('标签（逗号分隔）', (data.tags || []).join(', '), 'Android, SQLite');
    box.appendChild(g1); box.appendChild(c.wrap); box.appendChild(d.wrap);
    var r = row(box);
    r._get = function () {
      return {
        name: a.input.value.trim(),
        desc: c.input.value.trim(),
        link: b.input.value.trim(),
        tags: d.input.value.split(/[,，]/).map(function (s) { return s.trim(); }).filter(Boolean)
      };
    };
    $('#projectsList').appendChild(r);
  }
  function addExp(data) {
    data = data || {};
    var box = document.createElement('div');
    var g1 = document.createElement('div'); g1.className = 'grid-2';
    var a = field('时间', data.period, '2023 — 至今');
    var b = field('机构', data.org);
    g1.appendChild(a.wrap); g1.appendChild(b.wrap);
    var c = field('角色', data.role);
    var d = field('描述', data.desc);
    box.appendChild(g1); box.appendChild(c.wrap); box.appendChild(d.wrap);
    var r = row(box);
    r._get = function () {
      return { period: a.input.value.trim(), org: b.input.value.trim(), role: c.input.value.trim(), desc: d.input.value.trim() };
    };
    $('#experienceList').appendChild(r);
  }

  /* ---------- 表单 <-> 数据 ---------- */
  function fillForm(p) {
    $('#f_name').value = p.name || '';
    $('#f_title').value = p.title || '';
    $('#f_tagline').value = p.tagline || '';
    $('#f_bio').value = p.bio || '';
    $('#f_avatar').value = p.avatar || '';
    $('#f_location').value = p.location || '';
    $('#f_email').value = p.email || '';
    $('#f_skills').value = (p.skills || []).join(', ');

    $('#socialsList').innerHTML = '';
    (p.socials || []).forEach(addSocial);
    $('#projectsList').innerHTML = '';
    (p.projects || []).forEach(addProject);
    $('#experienceList').innerHTML = '';
    (p.experience || []).forEach(addExp);
  }

  function collect() {
    var g = function (id) { return document.getElementById(id).value.trim(); };
    return {
      name: g('f_name'),
      title: g('f_title'),
      tagline: g('f_tagline'),
      bio: g('f_bio'),
      avatar: g('f_avatar'),
      location: g('f_location'),
      email: g('f_email'),
      skills: g('f_skills').split(/[,，]/).map(function (s) { return s.trim(); }).filter(Boolean),
      socials: Array.prototype.map.call(document.querySelectorAll('#socialsList .row'), function (r) { return r._get(); })
        .filter(function (x) { return x.label || x.url; }),
      projects: Array.prototype.map.call(document.querySelectorAll('#projectsList .row'), function (r) { return r._get(); })
        .filter(function (x) { return x.name; }),
      experience: Array.prototype.map.call(document.querySelectorAll('#experienceList .row'), function (r) { return r._get(); })
        .filter(function (x) { return x.period || x.org || x.role; }),
      updatedAt: new Date().toISOString().slice(0, 10)
    };
  }

  /* ---------- GitHub API ---------- */
  function load() {
    var url = API + '/repos/' + state.repo + '/contents/' + PATH + '?ref=' + encodeURIComponent(state.branch);
    setPill('连接中…');
    fetch(url, { headers: headers(), cache: 'no-store' })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error(apiError(res, data));
          return data;
        });
      })
      .then(function (data) {
        if (!data.content) throw new Error('仓库里还没有 ' + PATH + '，请先上传一份初始文件');
        state.sha = data.sha;
        var p = JSON.parse(b64decodeUtf8(data.content));
        fillForm(p);
        $('#editorCard').classList.remove('hidden');
        $('#savebar').classList.remove('hidden');
        setPill('已连接', 'ok');
        setHint('已加载 ' + state.repo + ' / ' + PATH);
        toast('加载成功，可以开始编辑');
      })
      .catch(function (e) {
        setPill('连接失败', 'err');
        setHint(e.message);
        toast(e.message);
      });
  }

  function save() {
    if (!state.token || !state.repo) { toast('请先连接仓库'); return; }
    var profile = collect();
    if (!profile.name) { toast('姓名不能为空'); return; }

    var body = {
      message: 'chore: 更新个人信息（' + new Date().toLocaleString('zh-CN') + '）',
      content: b64encodeUtf8(JSON.stringify(profile, null, 2) + '\n'),
      branch: state.branch
    };
    if (state.sha) body.sha = state.sha;

    var btn = $('#saveBtn');
    btn.disabled = true;
    setHint('正在提交到 GitHub…');
    setPill('保存中…');

    fetch(API + '/repos/' + state.repo + '/contents/' + PATH, {
      method: 'PUT', headers: headers(), body: JSON.stringify(body)
    })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error(apiError(res, data));
          return data;
        });
      })
      .then(function (data) {
        state.sha = data.content && data.content.sha ? data.content.sha : state.sha;
        setPill('已保存', 'ok');
        setHint('已提交到 ' + state.branch + ' 分支，等待平台自动重新部署（约 30～60 秒）');
        toast('保存成功，稍等片刻刷新主页即可看到更新');
        if (data.commit && data.commit.html_url) console.log('commit:', data.commit.html_url);
      })
      .catch(function (e) {
        setPill('保存失败', 'err');
        setHint(e.message);
        toast(e.message);
      })
      .then(function () { btn.disabled = false; });
  }

  function exportJson() {
    var p = collect();
    var blob = new Blob([JSON.stringify(p, null, 2) + '\n'], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'profile.json';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    toast('已导出 profile.json，可手动上传到 data/ 目录');
  }

  /* ---------- 初始化 ---------- */
  function init() {
    var t = localStorage.getItem(LS.token) || '';
    var r = localStorage.getItem(LS.repo) || '';
    var b = localStorage.getItem(LS.branch) || 'main';
    $('#token').value = t;
    $('#repo').value = r;
    $('#branch').value = b;

    if (t && r) {
      state.token = t; state.repo = r; state.branch = b;
      load();
    }

    $('#connectBtn').addEventListener('click', function () {
      state.token = $('#token').value.trim();
      state.repo = $('#repo').value.trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '');
      state.branch = $('#branch').value.trim() || 'main';
      if (!state.token || !state.repo) { toast('请填写 Token 和仓库（用户名/仓库名）'); return; }
      localStorage.setItem(LS.token, state.token);
      localStorage.setItem(LS.repo, state.repo);
      localStorage.setItem(LS.branch, state.branch);
      load();
    });

    $('#clearTokenBtn').addEventListener('click', function () {
      [LS.token, LS.repo, LS.branch].forEach(function (k) { localStorage.removeItem(k); });
      $('#token').value = ''; $('#repo').value = ''; $('#branch').value = 'main';
      $('#editorCard').classList.add('hidden');
      $('#savebar').classList.add('hidden');
      setPill('未连接');
      setHint('已清除本机保存的 Token');
      toast('已清除');
    });

    $('#addSocial').addEventListener('click', function () { addSocial(); });
    $('#addProject').addEventListener('click', function () { addProject(); });
    $('#addExp').addEventListener('click', function () { addExp(); });
    $('#saveBtn').addEventListener('click', save);
    $('#reloadBtn').addEventListener('click', load);
    $('#exportBtn').addEventListener('click', exportJson);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
