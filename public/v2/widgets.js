// 라이브 프레젠테이션 v2 — 실시간 참여 도구 (멘티미터 같은 의견 모으기)
//   cloud : 낱말 구름 (한 사람 최대 3개)        level : 레벨별 참여 인원
//   multi : 강점/보완 역량 고르기 (각 최대 2개)  wall  : 포스트잇 벽 (한 사람 여러 장)
// 응답 묶음 entries = [{ uid, name, gender, value }]  (value 모양은 도구마다 다르다)
(function () {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MAX_WORDS = 3;
  const MAX_PICK = 2;

  // ── 결과 (발표 화면·학생 화면 공통) ──
  function cloud(el, entries) {
    const freq = new Map();
    entries.forEach((e) => (e.value || []).forEach((w) => {
      const k = String(w).trim().replace(/\s+/g, ' ');
      if (k) freq.set(k, (freq.get(k) || 0) + 1);
    }));
    const words = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40);
    if (!words.length) return (el.innerHTML = '<div class="empty">휴대폰에서 답을 보내면<br>여기에 낱말 구름이 생겨요</div>');
    const max = words[0][1];
    const colors = ['var(--navy)', 'var(--blue)', 'var(--orange)', 'var(--navy-2)', 'var(--sky)'];
    // 큰 낱말이 가운데 오도록 크기순으로 가운데부터 좌우로 번갈아 놓는다
    const order = [];
    words.forEach((w, i) => (i % 2 ? order.push(w) : order.unshift(w)));
    el.innerHTML = `<div class="cloud">${order.map(([w, n], i) => {
      const size = Math.round(34 + (n / max) ** 0.8 * 92);
      return `<span style="font-size:${size}px;color:${colors[i % colors.length]};animation-delay:${i * 25}ms">${esc(w)}</span>`;
    }).join('')}</div>`;
  }

  function level(el, entries, ctx) {
    const by = [[], [], [], [], [], []];
    entries.forEach((e) => { if (e.value >= 1 && e.value <= 6) by[e.value - 1].push(e); });
    el.innerHTML = `<div class="lv-board">${Deck.LEVELS.map((l, i) => `
      <div class="lv-col ${ctx.myValue === l.no ? 'mine' : ''}">
        <span class="lv-no">Lv.${l.no}</span>
        <div class="lv-total"><b>${by[i].length}</b><span>명 참여</span></div>
        <div class="lv-meter" aria-hidden="true"><span style="height:${entries.length ? by[i].length / entries.length * 100 : 0}%"></span></div>
        <div class="lv-name">${l.name}</div><div class="lv-en">${l.en}</div>
      </div>`).join('')}</div>`;
  }

  function multi(el, entries) {
    const count = (key) => {
      const c = new Map(Deck.COMPETENCIES.map((x) => [x.id, 0]));
      entries.forEach((e) => (e.value?.[key] || []).forEach((id) => c.has(id) && c.set(id, c.get(id) + 1)));
      return c;
    };
    const total = Math.max(1, entries.length);
    const group = (title, key, cls) => {
      const c = count(key);
      return `<div><div style="font-size:34px;font-weight:900;color:var(--navy);margin-bottom:18px">${title}</div><div class="bars">${Deck.COMPETENCIES.map((x) => `
        <div class="bar ${cls}" style="grid-template-columns:330px 1fr 70px"><span style="font-size:28px">${x.id} · ${x.short}</span><div class="track"><div class="fill" style="width:${(c.get(x.id) / total) * 100}%"></div></div><span class="n">${c.get(x.id)}</span></div>`).join('')}</div></div>`;
    };
    el.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:60px">${group('💪 강점 역량', 'strong', '')}${group('🌱 보완이 필요한 역량', 'weak', 'orange')}</div>`;
  }

  function wall(el, entries) {
    const notes = [];
    entries.forEach((e) => (e.value || []).forEach((t) => notes.push({ t, e })));
    if (!notes.length) return (el.innerHTML = '<div class="empty">휴대폰에서 계획을 적어 보내면<br>여기에 포스트잇으로 붙어요</div>');
    el.innerHTML = `<div class="wall">${notes.slice(-40).reverse().map((n, i) => `
      <div class="note c${i % 4}" style="animation-delay:${i * 30}ms">${esc(n.t)}
        <div class="by">${esc(n.e.name)}</div></div>`).join('')}</div>`;
  }

  const RESULT = { cloud, level, multi, wall };
  function responseCount(slide, entries = []) {
    return entries.filter(({ value }) => {
      if (slide.widget === 'multi') return Boolean(value?.strong?.length || value?.weak?.length);
      if (slide.widget === 'level') return Number.isInteger(value) && value >= 1 && value <= 6;
      return Array.isArray(value) && value.some((text) => String(text).trim());
    }).length;
  }
  function renderResult(slide, el, entries, ctx = {}) {
    RESULT[slide.widget](el, entries || [], ctx);
    const count = responseCount(slide, entries || []);
    el.dispatchEvent(new CustomEvent('v2:responses', { bubbles: true, detail: { slideId: slide.id, count } }));
  }

  // ── 학생 휴대폰 입력 ──
  // mine: 내가 이미 보낸 값, submit(value): 보내기
  function renderInput(slide, el, mine, submit, ctx) {
    const w = slide.widget;
    if (w === 'cloud' || w === 'wall') {
      const list = Array.isArray(mine) ? mine : [];
      const max = w === 'cloud' ? MAX_WORDS : 5;
      const len = w === 'cloud' ? 15 : 80;
      el.innerHTML = `
        <form class="in-form">
          ${w === 'cloud' ? `<input class="in-text" maxlength="${len}" placeholder="짧은 낱말이나 구절 (${len}자)">` : `<textarea class="in-text" maxlength="${len}" rows="3" placeholder="나의 계획을 적어 주세요 (${len}자)"></textarea>`}
          <button class="in-send">보내기</button>
        </form>
        <div class="in-mine">${list.map((t, i) => `<span class="in-chip">${esc(t)} <button data-del="${i}" aria-label="지우기">×</button></span>`).join('')}</div>
        <p class="in-help">${list.length >= max ? `최대 ${max}개까지 보낼 수 있어요. 지우고 다시 쓸 수 있어요.` : `${list.length}/${max}개 보냄`}</p>`;
      const input = el.querySelector('.in-text');
      el.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        const v = input.value.trim();
        if (!v || list.length >= max) return;
        submit([...list, v]);
      });
      el.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => submit(list.filter((_, i) => i !== Number(b.dataset.del)))));
      return;
    }
    if (w === 'level') {
      el.innerHTML = `<div class="in-levels">${Deck.LEVELS.map((l) => `
        <button class="in-lv ${mine === l.no ? 'on' : ''}" data-lv="${l.no}" ${ctx.min && l.no < ctx.min ? 'disabled' : ''}>
          <b>Lv.${l.no}</b><span>${l.name}</span></button>`).join('')}</div>
        ${ctx.min ? `<p class="in-help">지금 레벨(Lv.${ctx.min}) 이상에서 골라 주세요</p>` : ''}`;
      el.querySelectorAll('[data-lv]').forEach((b) => b.addEventListener('click', () => submit(Number(b.dataset.lv))));
      return;
    }
    if (w === 'multi') {
      const v = mine || { strong: [], weak: [] };
      const group = (key, title) => `<div class="in-group"><div class="in-gt">${title} <small>${v[key].length}/${MAX_PICK}</small></div>${Deck.COMPETENCIES.map((x) => `
        <button class="in-opt ${v[key].includes(x.id) ? 'on' : ''}" data-k="${key}" data-id="${x.id}"><b>${x.id}</b>${x.name}</button>`).join('')}</div>`;
      el.innerHTML = group('strong', '💪 강점 역량') + group('weak', '🌱 보완이 필요한 역량');
      el.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => {
        const k = b.dataset.k;
        const id = b.dataset.id;
        const cur = v[k].includes(id) ? v[k].filter((x) => x !== id) : [...v[k], id].slice(-MAX_PICK);
        submit({ ...v, [k]: cur });
      }));
    }
  }

  // ── 디자인 점검용 예시 응답 ──
  function demo(slide) {
    const names = ['김하늘', '이바다', '박고래', '최파도', '정물결', '강모래', '윤등대', '임별빛', '한구름', '오솔길', '서새벽', '문노을', '배물보라', '조섬', '신나침반', '유돛', '노해오름', '하윤슬'];
    const pick = (arr, i) => arr[i % arr.length];
    return names.map((name, i) => {
      const gender = i % 3 ? 'girl' : 'boy';
      const uid = `demo${i}`;
      let value;
      if (slide.widget === 'cloud') value = slide.blank
        ? [pick(['평생학습', '공동 성장', '나침반', '학생 이해', '설계 역량', '끊임없는 질문', '협력', '성찰'], i), pick(['연결', '실천', '공유'], i + 1)]
        : [pick(['학생 맞춤', '변화 적응', '윤리', 'AI 리터러시', '수업 혁신', '평생학습', '데이터 활용', '협력'], i), pick(['신뢰', '성장', '질문하는 힘'], i * 2)];
      if (slide.widget === 'level') value = slide.field === 'tgt' ? pick([4, 5, 4, 6, 5, 4], i) : pick([3, 2, 3, 4, 3, 2, 3, 1], i);
      if (slide.widget === 'multi') value = { strong: [pick(['E', 'D', 'A', 'C'], i), pick(['B', 'E', 'D'], i + 1)], weak: [pick(['C', 'F', 'G', 'F'], i), pick(['G', 'C'], i)] };
      if (slide.widget === 'wall') value = i < 9 ? [pick(slide.id === 'q-short'
        ? ['권역 AI 융합 수업 공개 1회', '학년 협의회에서 AI 도구 사례 나누기', 'AI 융합 연구모임 참여', '수업 실천 기록 e-포트폴리오에 정리', '동료와 AI 평가 루브릭 만들기']
        : ['마스터교원 연수 강사 도전', 'AI 융합수업 모형 개발', '지역 문제 기반 융합 수업 자료 공유', '전문적 학습공동체 운영', '시도교육청 연수 강사 활동'], i)] : [];
      return { uid, name, gender, value };
    });
  }

  window.Widgets = { renderResult, renderInput, responseCount, demo, esc };
})();
