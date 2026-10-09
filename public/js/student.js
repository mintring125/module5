(function () {
  const $ = (id) => document.getElementById(id);
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* 저장 불가 환경 무시 */ } },
  };

  let uid = store.get('pxl_uid');
  if (!uid) {
    uid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    store.set('pxl_uid', uid);
  }
  let profile = store.get('pxl_profile'); // { name, gender, type, rev }
  let total = 0;
  // 강사가 보낸 마지막 상태. rev는 캐릭터 버전을 바꿀 때마다 올라가고, assign은 그때 새로 뽑은 캐릭터
  let state = { slide: 1, theme: null, rev: 0, assign: {} };
  let rt = null;
  let joined = false;

  const stage = new PixelStage.Stage({ board: $('board'), area: $('area'), slideImg: $('slideImg'), meUid: uid });

  const updatePeople = () => { $('people').textContent = `${stage.actors.size}명 참여`; };
  const updateSlide = (n) => {
    stage.showSlide(n, total);
    $('slideNum').textContent = `${n} / ${total}`;
  };
  const setChatEnabled = (on) => {
    $('msg').disabled = !on;
    $('sendBtn').disabled = !on;
    document.querySelectorAll('#quick button').forEach((b) => { b.disabled = !on; });
  };
  const setConn = (ok, text) => {
    $('dot').classList.toggle('off', !ok);
    $('conn').textContent = text;
  };

  let toastTimer = null;
  function showToast(text) {
    $('toast').textContent = text;
    $('toast').hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { $('toast').hidden = true; }, 4000);
  }

  function applyTheme(name) {
    return PixelChars.setTheme(name).then(() => {
      if (!$('joinModal').hidden) renderChars();
    });
  }

  // 참여자 목록: 버전이 바뀐 뒤 아직 새 캐릭터를 반영하지 않은 사람은 강사가 뽑아 준 캐릭터로 보여 준다
  function renderUsers() {
    const list = rt.users().map((u) => (u.rev < state.rev && state.assign[u.uid] != null ? { ...u, type: state.assign[u.uid] } : u));
    stage.setUsers(list);
    updatePeople();
  }

  async function join() {
    profile = { ...profile, rev: state.rev };
    store.set('pxl_profile', profile);
    await rt.setProfile(profile);
    joined = true;
    setChatEnabled(true);
    $('changeBtn').hidden = false;
  }

  function onState(s) {
    const prevTheme = state.theme;
    state = { slide: Number(s.slide) || 1, theme: s.theme || state.theme, rev: Number(s.rev) || 0, assign: s.assign || {} };
    updateSlide(state.slide);
    if (state.theme !== prevTheme) applyTheme(state.theme);
    // 강사가 캐릭터 버전을 바꾸면 성별에 맞게 뽑아 준 새 캐릭터로 갈아입는다
    const mine = state.assign[uid];
    if (profile && (profile.rev || 0) < state.rev && mine != null) {
      profile = { ...profile, type: mine, rev: state.rev };
      store.set('pxl_profile', profile);
      if (joined) rt.setProfile(profile);
      if (prevTheme) showToast(`캐릭터가 '${PixelChars.THEMES[state.theme].name}' 버전으로 바뀌었어요! 나는 ${PixelChars.label(profile.type)}`);
    }
    renderUsers();
  }

  async function start() {
    const cfg = await Realtime.loadConfig();
    total = cfg.totalSlides;
    state.theme = cfg.theme;
    applyTheme(cfg.theme);
    updateSlide(1);
    rt = await Realtime.connect({ role: 'student', uid });
    rt.on('connection', (c) => {
      if (c.current === 'connected') setConn(true, '연결됨');
      else if (c.current === 'failed') setConn(false, '연결 실패 — 새로고침해 주세요');
      else if (c.current !== 'closed') setConn(false, '재연결 중…');
      setChatEnabled(c.current === 'connected' && joined);
    });
    rt.on('state', onState);
    rt.on('users', renderUsers);
    rt.on('chat', (m) => stage.say(m.uid, m.text));
    if (profile) join();
    else if ($('joinModal').hidden) openJoin();
  }

  // ── 채팅 ──
  let coolUntil = 0;
  function send(text) {
    text = text.trim();
    if (!text || !profile || Date.now() < coolUntil) return;
    coolUntil = Date.now() + 1100;
    rt.chat(text, state.slide);
  }
  $('chatForm').addEventListener('submit', (e) => {
    e.preventDefault();
    send($('msg').value);
    $('msg').value = '';
    $('count').textContent = '0/80';
  });
  $('msg').addEventListener('input', () => { $('count').textContent = `${$('msg').value.length}/80`; });
  document.querySelectorAll('#quick button').forEach((b) => b.addEventListener('click', () => send(b.dataset.say)));

  // ── 입장 / 캐릭터 선택 ──
  let pick = { gender: null, type: null };
  let previewTimer = null;

  function renderChars() {
    const box = $('chars');
    box.innerHTML = '';
    clearInterval(previewTimer);
    if (!pick.gender) {
      box.innerHTML = '<p class="sub" style="grid-column:1/-1;margin:0">성별을 먼저 선택하세요.</p>';
      return;
    }
    const types = PixelChars.TYPES.filter((t) => t.gender === pick.gender);
    if (!types.some((t) => t.id === pick.type)) pick.type = types[0].id;
    const canvases = [];
    types.forEach((t) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'char-opt';
      b.setAttribute('aria-pressed', String(t.id === pick.type));
      const cv = document.createElement('canvas');
      cv.width = PixelChars.W;
      cv.height = PixelChars.H;
      b.append(cv, Object.assign(document.createElement('span'), { textContent: PixelChars.label(t.id) }));
      b.addEventListener('click', () => {
        pick.type = t.id;
        box.querySelectorAll('.char-opt').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      });
      box.appendChild(b);
      canvases.push([cv, t.id]);
    });
    let phase = 0;
    const draw = () => {
      phase = Math.floor(performance.now() / 160) % 4;
      canvases.forEach(([cv, id]) => {
        const art = PixelChars.artOf(id);
        if (art) {
          if (cv.width !== 108) { cv.width = 108; cv.height = 144; }
          const s = (id === pick.type && art.walk) || art.idle || art.walk;
          const idx = Math.floor(performance.now() / s.delay_ms) % s.frames;
          PixelChars.drawArt(cv.getContext('2d'), id, s === art.walk ? 'walk' : 'idle', idx);
          return;
        }
        const ctx = cv.getContext('2d');
        ctx.clearRect(0, 0, cv.width, cv.height);
        ctx.drawImage(PixelChars.frame(id, id === pick.type ? phase : 0), 0, 0);
      });
    };
    draw();
    previewTimer = setInterval(draw, 80);
    PixelChars.ready().then(draw);
  }

  function setGender(g) {
    pick.gender = g;
    document.querySelectorAll('#genderSeg button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.g === g)));
    renderChars();
  }

  function openJoin() {
    $('nameInput').value = profile?.name || '';
    pick = { gender: profile?.gender || null, type: profile?.type ?? null };
    setGender(pick.gender);
    $('joinErr').textContent = '';
    $('joinModal').hidden = false;
    setTimeout(() => $('nameInput').focus(), 50);
  }

  document.querySelectorAll('#genderSeg button').forEach((b) => b.addEventListener('click', () => setGender(b.dataset.g)));
  $('changeBtn').addEventListener('click', openJoin);
  $('joinForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('nameInput').value.trim();
    if (!name) return ($('joinErr').textContent = '이름을 입력해 주세요.');
    if (!pick.gender) return ($('joinErr').textContent = '성별을 선택해 주세요.');
    profile = { name, gender: pick.gender, type: pick.type };
    store.set('pxl_profile', profile);
    clearInterval(previewTimer);
    $('joinModal').hidden = true;
    join();
    $('msg').focus();
  });

  start().catch((err) => setConn(false, `연결 실패: ${err.message}`));
})();
