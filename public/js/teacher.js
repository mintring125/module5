(function () {
  const $ = (id) => document.getElementById(id);
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* 저장 불가 환경 무시 */ } },
  };

  const stage = new PixelStage.Stage({ board: $('board'), area: $('area'), slideImg: $('slideImg') });
  let rt = null;
  let total = 0;
  let authed = false;
  let key = store.get('pxl_tkey');
  // 모두에게 보내는 상태. rev는 캐릭터 버전을 바꿀 때마다 올리고, assign에 그때 뽑은 캐릭터를 담는다
  let state = { slide: 1, theme: 'teacher', rev: 0, assign: {} };
  let gotState = false;

  const updatePeople = () => { $('people').textContent = `${stage.actors.size}명`; };
  const showSlide = (n) => {
    stage.showSlide(n, total);
    $('slideNum').textContent = `${n} / ${total}`;
  };
  const publish = () => rt?.publishState(state);
  const go = (n) => {
    if (!authed) return;
    n = Math.max(1, Math.min(total, n));
    if (n === state.slide) return;
    state = { ...state, slide: n };
    showSlide(n);
    publish();
  };

  // 참여자 목록: 아직 새 캐릭터를 반영하지 않은 사람은 뽑아 준 캐릭터로 보여 준다
  const effectiveUsers = () => (rt ? rt.users() : [])
    .map((u) => (u.rev < state.rev && state.assign[u.uid] != null ? { ...u, type: state.assign[u.uid] } : u));
  function renderUsers() {
    stage.setUsers(effectiveUsers());
    updatePeople();
  }

  // ── 캐릭터 버전 (픽셀 / 세련된 선생님 / 중학생) ──
  const THEME_ORDER = ['pixel', 'teacher', 'student'];
  let toastTimer = null;
  function showToast(text) {
    $('toast').textContent = text;
    $('toast').hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { $('toast').hidden = true; }, 3000);
  }
  function applyTheme(name) {
    PixelChars.setTheme(name);
    document.querySelectorAll('#themeSeg button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.theme === name)));
  }
  // 버전을 바꾸면 모두에게 성별에 맞는 캐릭터를 새로 뽑아 준다. 덜 쓰인 캐릭터부터 골라 고루 섞이게 한다.
  function reshuffle() {
    const used = new Map();
    const assign = {};
    for (const u of effectiveUsers().sort(() => Math.random() - 0.5)) {
      const range = Realtime.typeRange(u.gender);
      const least = Math.min(...range.map((t) => used.get(t) || 0));
      const pool = range.filter((t) => (used.get(t) || 0) === least);
      assign[u.uid] = pool[Math.floor(Math.random() * pool.length)];
      used.set(assign[u.uid], (used.get(assign[u.uid]) || 0) + 1);
    }
    return assign;
  }
  function switchTheme(name) {
    if (!authed || name === state.theme) return;
    state = { ...state, theme: name, rev: state.rev + 1, assign: reshuffle() };
    applyTheme(name);
    renderUsers();
    publish();
    showToast(`캐릭터 버전: ${PixelChars.THEMES[name].name} — 모두의 캐릭터를 성별에 맞게 새로 뽑았어요`);
  }
  document.querySelectorAll('#themeSeg button').forEach((b) => b.addEventListener('click', () => switchTheme(b.dataset.theme)));

  // 들어올 때 받은 마지막 상태(다른 강사 탭에서 바꾼 것 포함)를 따른다
  function onState(s) {
    gotState = true;
    state = { slide: Number(s.slide) || 1, theme: s.theme || state.theme, rev: Number(s.rev) || 0, assign: s.assign || {} };
    showSlide(state.slide);
    applyTheme(state.theme);
    renderUsers();
  }

  async function login(k) {
    const res = await Realtime.checkTeacherKey(k).catch((err) => ({ ok: false, error: err.message }));
    if (!res.ok) {
      authed = false;
      $('authModal').hidden = false;
      $('authErr').textContent = k ? (res.status === 403 ? '강사 키가 올바르지 않습니다.' : res.error) : '';
      $('keyInput').focus();
      return;
    }
    authed = true;
    key = k;
    store.set('pxl_tkey', k);
    $('authModal').hidden = true;
    document.activeElement?.blur(); // 입력칸 포커스가 남아 방향키가 막히지 않도록

    rt = await Realtime.connect({ role: 'teacher', teacherKey: k });
    rt.on('connection', (c) => $('dot').classList.toggle('off', c.current !== 'connected'));
    rt.on('state', onState);
    rt.on('users', renderUsers);
    rt.on('chat', (m) => {
      stage.say(m.uid, m.text);
      const u = effectiveUsers().find((x) => x.uid === m.uid);
      addQuestion({ ...m, name: u?.name || '참여자', type: u?.type ?? 0 }, true);
    });
    // 처음 여는 강의실이면(받은 상태가 없으면) 지금 상태를 올려 둔다
    setTimeout(() => { if (!gotState) publish(); }, 2500);
    // Ably는 메시지를 2분만 보관하므로, 늦게 들어온 학생이 1번 슬라이드에서 시작하지 않도록
    // 누가 들어올 때마다 현재 상태를 다시 보낸다 (여럿이 한꺼번에 들어와도 한 번만)
    let resendTimer = null;
    rt.on('who', () => {
      clearTimeout(resendTimer);
      resendTimer = setTimeout(publish, 800);
    });
  }

  $('authForm').addEventListener('submit', (e) => {
    e.preventDefault();
    login($('keyInput').value.trim());
  });

  // ── 질문 목록 (이 브라우저에 저장되어 새로고침해도 남는다) ──
  const QLOG = 'pxl_qlog';
  let qlog = [];
  try { qlog = JSON.parse(store.get(QLOG)) || []; } catch { qlog = []; }
  function addQuestion(m, save) {
    const list = $('qlist');
    list.querySelector('.empty')?.remove();
    const li = document.createElement('li');
    const img = new Image();
    img.src = PixelChars.dataURL(m.type, 2);
    img.alt = '';
    const body = document.createElement('div');
    const meta = document.createElement('div');
    meta.className = 'meta';
    const who = Object.assign(document.createElement('span'), { className: 'who', textContent: m.name });
    const time = new Date(m.ts).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    meta.append(who, ` · 슬라이드 ${m.slide} · ${time}`);
    body.append(meta, Object.assign(document.createElement('div'), { textContent: m.text }));
    li.append(img, body);
    list.prepend(li);
    $('qCount').textContent = String(list.children.length);
    if (save) {
      qlog = [...qlog, { name: m.name, type: m.type, text: m.text, slide: m.slide, ts: m.ts }].slice(-500);
      store.set(QLOG, JSON.stringify(qlog));
    }
  }
  function clearQuestions() {
    qlog = [];
    store.set(QLOG, '[]');
    $('qlist').innerHTML = '<li class="empty">아직 질문이 없습니다.</li>';
    $('qCount').textContent = '0';
  }
  $('qClear').addEventListener('click', () => { if (confirm('질문 기록을 모두 지울까요?')) clearQuestions(); });

  async function start() {
    const cfg = await Realtime.loadConfig();
    total = cfg.totalSlides;
    state.theme = cfg.theme;
    showSlide(1);
    applyTheme(cfg.theme);
    qlog.forEach((m) => addQuestion(m, false));
    if (key) login(key);
    else $('keyInput').focus();
  }
  start();
  const togglePanel = (open) => $('qpanel').classList.toggle('open', open);
  $('qBtn').addEventListener('click', () => togglePanel());
  $('qClose').addEventListener('click', () => togglePanel(false));

  // ── 접속 QR ──
  function toggleJoin(open = $('joinModal').hidden) {
    if (open && !$('qr').hasChildNodes()) {
      const url = location.origin + '/';
      $('joinUrl').textContent = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const qr = qrcode(0, 'M');
      qr.addData(url);
      qr.make();
      $('qr').innerHTML = qr.createImgTag(8, 2);
    }
    $('joinModal').hidden = !open;
  }
  $('joinBtn').addEventListener('click', () => toggleJoin());
  $('joinModal').addEventListener('click', () => toggleJoin(false));

  // ── 조작 ──
  const toggleFs = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => {});
  $('prevBtn').addEventListener('click', () => go(state.slide - 1));
  $('nextBtn').addEventListener('click', () => go(state.slide + 1));
  $('fsBtn').addEventListener('click', toggleFs);

  let digits = '';
  let digitTimer = null;
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea') || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    if (/^[0-9]$/.test(k)) {
      digits += k;
      clearTimeout(digitTimer);
      digitTimer = setTimeout(() => (digits = ''), 1500);
      $('slideNum').textContent = `→ ${digits}`;
      return;
    }
    if (k === 'Enter' && digits) { go(Number(digits)); digits = ''; return; }
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter', 'n', 'N'].includes(k)) go(state.slide + 1);
    else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace', 'p', 'P'].includes(k)) go(state.slide - 1);
    else if (k === 'Home') go(1);
    else if (k === 'End') go(total);
    else if (k === 'f' || k === 'F') toggleFs();
    else if (k === 'q' || k === 'Q') togglePanel();
    else if (k === 'j' || k === 'J') toggleJoin();
    else if (k === 't' || k === 'T') switchTheme(THEME_ORDER[(THEME_ORDER.indexOf(PixelChars.theme) + 1) % THEME_ORDER.length]);
    else if (k === 'Escape') { toggleJoin(false); togglePanel(false); }
    else return;
    e.preventDefault();
  });

  // 마우스가 멈추면 조작 바 숨기기
  let idleTimer = null;
  const wake = () => {
    $('controls').classList.remove('idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => $('controls').classList.add('idle'), 2500);
  };
  document.addEventListener('mousemove', wake);
  wake();
})();
