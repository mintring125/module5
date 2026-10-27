// 라이브 프레젠테이션 v2 — 슬라이드 내용과 그리기
// 원본 PPT(마스터교원의 지속적 전문성 개발, 34장)의 흐름·핵심 내용을 유지해 다시 쓴 덱이다.
// 슬라이드는 강의 내용을 담고, 캐릭터의 성장과 반응은 화면의 펫이 담당한다.
// 슬라이드 = { id, sec, kind, ... }  /  Deck.render(slide, ctx) → HTML,  Deck.mount(el, ctx) → 애니메이션 시작
(function () {
  const A = '/v2/assets';
  const SECTIONS = [
    { no: 1, title: '전문성 개발이 필요한 이유', bg: 'bg-s1', grow: [1, 2] },
    { no: 2, title: '지속적 전문성 개발의 방향', bg: 'bg-s2', grow: [2, 3] },
    { no: 3, title: '지속적 전문성 개발 지원체계', bg: 'bg-s3', grow: [3, 4] },
    { no: 4, title: '전문성 개발 계획 탐색하기', bg: 'bg-s4', grow: [4, 5] },
  ];
  const LEVELS = [
    { no: 1, name: '입문가', en: 'Newcomer', desc: 'AI·디지털의 교육적 잠재력을 인식하지만 실제 활용은 아직 익숙하지 않아, 지원과 연수가 필요합니다.' },
    { no: 2, name: '탐색가', en: 'Explorer', desc: '수업에 도입하려 노력하지만 체계적 접근이 부족해, 지속적 학습과 전문가 협력이 필요합니다.' },
    { no: 3, name: '실천가', en: 'Practitioner', desc: '교육에 효과적으로 활용하려 노력하며, 최적의 적용 방법을 찾기 위해 지속적 전문성 개발이 필요합니다.' },
    { no: 4, name: '전문가', en: 'Expert', desc: '창의적·비판적으로 활용해 교육 혁신을 주도하고, 동료를 지원하며 조직 변화를 이끕니다.' },
    { no: 5, name: '선도자', en: 'Leader', desc: '교육적 활용 비전으로 조직 변화를 주도하고, 동료 멘토링과 정책 수립으로 교육 혁신을 이끕니다.' },
    { no: 6, name: '개척자', en: 'Pioneer', desc: '새로운 도구와 방법론을 개발하고 정책에 영향을 미치며, 미래 교육을 선도하는 롤모델입니다.' },
  ];
  const COMPETENCIES = [
    { id: 'A', name: 'AI·디지털 기반 교육 이해', short: '교육 이해' },
    { id: 'B', name: '윤리적 실천', short: '윤리적 실천' },
    { id: 'C', name: '수업 및 학습자 분석', short: '수업·학습자 분석' },
    { id: 'D', name: '교수·학습 및 평가 설계', short: '교수·학습·평가 설계' },
    { id: 'E', name: '교수·학습 실행', short: '교수·학습 실행' },
    { id: 'F', name: '평가 실행', short: '평가 실행' },
    { id: 'G', name: 'AI·디지털 기반 교사 전문성 개발', short: '교사 전문성 개발' },
  ];
  const G_AREAS = [
    { id: 'G1', icon: 4, title: '전문성 영역 이해', items: ['교사 전문성 영역 이해', '교수·학습 혁신 영역 이해', '디지털 생산자와 윤리적 활용'] },
    { id: 'G2', icon: 10, title: '전문성 계획 수립', items: ['역량체계 기반 자기 진단', '맞춤형 전문성 개발 경로', 'AI 학습 자원 확보'] },
    { id: 'G3', icon: 12, title: '실천 기반 성찰 및 협력적 성장', items: ['학습공동체 공동 실천', '콘텐츠 제작과 공유·확산', '실천 기록 기반 성찰과 환류'] },
  ];

  // ── 슬라이드 목록 ──
  const SLIDES = [
    { id: 'title', kind: 'title' },
    { id: 'journey', kind: 'journey' },
    { id: 'goals', kind: 'goals' },

    { id: 'd1', kind: 'divider', sec: 1 },
    { id: 'q-why', kind: 'ask', sec: 1, widget: 'cloud', q: 'AX(AI Transformation) 시대,<br>교사에게 <em>전문성 개발</em>이 필요한 이유는?', hint: '떠오르는 낱말을 짧게 적어 주세요 (최대 3개)' },
    { id: 'quote', kind: 'quote', sec: 1 },
    { id: 'values', kind: 'values', sec: 1 },
    { id: 'g-map', kind: 'gmap', sec: 1 },
    { id: 'big-q', kind: 'bigq', sec: 1 },

    { id: 'd2', kind: 'divider', sec: 2 },
    { id: 'cpd', kind: 'cycle', sec: 2 },
    { id: 'levels', kind: 'levels', sec: 2 },
    { id: 'roadmap', kind: 'roadmap', sec: 2 },
    { id: 'now', kind: 'now', sec: 2 },

    { id: 'd3', kind: 'divider', sec: 3 },
    { id: 'g23', kind: 'g23', sec: 3, focus: 'G2' },
    { id: 'platform', kind: 'platform', sec: 3 },
    { id: 'shot-home', kind: 'shot', sec: 3, shot: 18, title: 'AI 융합 통합 지원 플랫폼 <em>aiedap.or.kr</em>', points: ['연수·활동·자료를 한곳에서', '나의 역량 수준과 성장 경로 확인', '마스터교원 활동 이력 관리'], pose: 'tablet' },
    { id: 'shot-dash', kind: 'shot', sec: 3, shot: 19, title: '나의 역량분석 대시보드 — <em>역량 수준 확인</em>', points: ['역량 진단 결과를 레벨로 확인', '영역별 강점·보완점을 한눈에'], pose: 'tablet' },
    { id: 'shot-rec', kind: 'shot', sec: 3, shot: 20, title: '대시보드의 <em>맞춤형 연수·활동 추천</em>', points: ['진단 결과에 맞춘 연수 추천', '다음 레벨로 가는 활동 안내'], pose: 'explain' },
    { id: 'shot-port', kind: 'shot', sec: 3, shot: 21, title: '마스터교원 <em>e-Portfolio</em> 활동 이력 관리', points: ['연수·수업 실천·강의 기록 축적', '활동 인증과 디지털 배지로 연결'], pose: 'explain' },
    { id: 'q-level', kind: 'ask', sec: 3, widget: 'level', field: 'cur', q: '나의 역량 수준은 <em>Lv. 몇</em>인가요?', hint: '지금의 나에 가까운 레벨을 골라 주세요' },
    { id: 'q-strong', kind: 'ask', sec: 3, widget: 'multi', q: '나의 <em>강점 역량</em>과 <em>보완이 필요한 역량</em>은?', hint: '각각 최대 2개까지 골라 주세요' },
    { id: 'step1', kind: 'shot', sec: 3, shot: 24, step: '역량개발 1단계', title: '역량체계 기반 자기 진단 — <em>현재 역량 수준 확인하기</em>', points: ['A~F 역량별 현재 수준 확인', '강점과 개선 영역 파악'], pose: 'tablet' },
    { id: 'step2', kind: 'shot', sec: 3, shot: 25, step: '역량개발 2단계', title: '맞춤형 전문성 개발 경로 — <em>연수·활동 검색해 보기</em>', points: ['필요 역량에 맞는 연수 찾기', '연간 성장 목표와 경로 설계'], pose: 'explain' },
    { id: 'step3', kind: 'shot', sec: 3, shot: 26, step: '역량개발 3단계', title: 'AI 학습 자원 확보 — <em>우수 AI 융합 수업 사례</em>', points: ['우수 수업 사례 콘텐츠 탐색', '나만의 학습 자원 네트워크 만들기'], pose: 'tablet' },

    { id: 'd4', kind: 'divider', sec: 4 },
    { id: 'g3', kind: 'g23', sec: 4, focus: 'G3' },
    { id: 'q-target', kind: 'ask', sec: 4, widget: 'level', field: 'tgt', q: '목표하는 레벨은 <em>몇 레벨</em>인가요?', hint: '다음 성장 목표로 삼고 싶은 레벨을 골라 주세요' },
    { id: 'q-short', kind: 'ask', sec: 4, widget: 'wall', q: '<em>단기</em> 역량 개발 계획 <span class="q-sub">6개월 이내</span>', hint: '예: 권역 내 AI·디지털 융합 수업 선도교사 활동, AI 융합 연구모임', pose: 'write' },
    { id: 'q-long', kind: 'ask', sec: 4, widget: 'wall', q: '<em>장기</em> 역량 개발 계획 <span class="q-sub">1년 이상</span>', hint: '예: 마스터교원 연수 강사 활동, AI 융합수업 모형 개발', pose: 'write' },
    { id: 'q-blank', kind: 'ask', sec: 4, widget: 'cloud', blank: true, q: 'AX 시대의 교사 전문성은 <span class="blank">&nbsp;</span> 이다.', hint: '빈칸에 들어갈 말을 적어 주세요 (최대 3개)' },
    { id: 'post', kind: 'post', sec: 4 },
    { id: 'end', kind: 'end' },
  ];
  // 슬라이드 오른쪽 아래 동반 캐릭터의 반응: [상태, 한마디]  (상태: wave·explain·think·write·tablet·cheer)
  // 구역 표지(divider)는 성장 모션과 함께 pet.js가 레벨 이름으로 말한다
  const PET_LINES = {
    title: ['wave', '반가워요! 오늘 함께 성장 여정을 떠나요.'],
    journey: ['explain', '네 구역을 지날 때마다 저도 한 단계씩 자라요!'],
    goals: ['explain', '끝날 때 이 세 가지를 꼭 확인해 봐요.'],
    'q-why': ['think', '한 낱말이면 충분해요. 떠오르는 대로 보내 주세요!'],
    quote: ['think', '기술보다 먼저 바뀌어야 할 것은 무엇일까요?'],
    values: ['explain', '오늘의 주인공은 세 번째, 교사 전문성이에요.'],
    'g-map': ['explain', 'G역량은 A~F를 이어 주는 내비게이터예요.'],
    'big-q': ['think', '수립 · 실천 · 성찰, 이 순서로 따라가요.'],
    cpd: ['explain', '연수는 시작일 뿐, 실천과 공유로 이어져요.'],
    levels: ['think', '나는 지금 어느 레벨에 가까울까요?'],
    roadmap: ['explain', '레벨이 오를수록 실천 → 확산 → 혁신으로 넓어져요.'],
    now: ['cheer', '지금 우리는 집합 연수 단계! 거의 다 왔어요.'],
    g23: ['tablet', '먼저 진단하고, 경로를 찾고, 자원을 모아요.'],
    platform: ['tablet', '진단부터 배지까지 한 플랫폼에서 이어져요.'],
    'shot-home': ['tablet', 'aiedap.or.kr에서 모두 시작돼요.'],
    'shot-dash': ['tablet', '대시보드에서 내 레벨부터 확인해요.'],
    'shot-rec': ['tablet', '진단 결과에 꼭 맞는 연수를 추천해 줘요.'],
    'shot-port': ['write', '활동 기록이 쌓이면 배지로 이어져요.'],
    'q-level': ['think', '지금의 나에 가장 가까운 레벨을 골라 주세요.'],
    'q-strong': ['think', '잘하는 것과 키우고 싶은 것을 2개씩!'],
    step1: ['tablet', '1단계: 역량 진단으로 출발점을 찾아요.'],
    step2: ['tablet', '2단계: 필요한 연수와 활동을 찾아요.'],
    step3: ['tablet', '3단계: 좋은 수업 사례를 모아 두어요.'],
    g3: ['write', '이제 계획을 실천하고 함께 나눌 차례예요.'],
    'q-target': ['think', '한 단계 위를 목표로 잡아 볼까요?'],
    'q-short': ['write', '6개월 안에 할 수 있는 작은 실천부터!'],
    'q-long': ['write', '1년 뒤의 나를 그려 보며 적어 봐요.'],
    'q-blank': ['think', '빈칸에 들어갈 나만의 한마디는?'],
    post: ['tablet', '연수 전후로 얼마나 자랐는지 확인해요.'],
    end: ['cheer', '개척자까지! 여러분의 성장을 응원해요.'],
  };
  SLIDES.forEach((s, i) => { s.index = i; s.pet ??= PET_LINES[s.id]; });

  // ── 조각 ──
  const charImg = (gender, stage) => `${A}/char/${gender}-${stage}.webp`;
  const head = (s, ctx) => {
    const sec = SECTIONS[(s.sec || 1) - 1];
    return `<div class="s-head">${s.sec ? `<span class="chip"><b>${sec.no}</b>${sec.title}</span>` : ''}<span class="grow"></span><span class="brand">AIEDAP 마스터교원 연수</span><span class="s-num">${s.index + 1} / ${SLIDES.length}</span></div>`;
  };
  const icon = (n, cls = 'ic') => `<img class="${cls}" src="${A}/icon/${n}.webp" alt="">`;

  // ── 종류별 그리기 ──
  const R = {
    title: (s, ctx) => `
      <img class="bg" src="${A}/bg/${ctx.gender}/bg-title.webp" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
      <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(247,251,255,.96) 0,rgba(247,251,255,.85) 45%,rgba(247,251,255,0) 72%)"></div>
      <div style="position:absolute;left:120px;top:150px;font-size:32px;font-weight:800;color:var(--blue);letter-spacing:.08em">AIEDAP 마스터교원 신규 연수 · 공통 모듈 5</div>
      <h1 style="position:absolute;left:120px;top:230px;width:1100px;margin:0;font-size:116px;line-height:1.1;font-weight:900;color:var(--navy);letter-spacing:-.03em">마스터교원의<br><span style="color:var(--blue)">지속적</span> 전문성 개발</h1>
      <p style="position:absolute;left:124px;top:560px;margin:0;font-size:38px;line-height:1.5;color:var(--muted);font-weight:600">입문가에서 개척자까지, 나의 성장 여정을 함께 설계해요</p>
      <div style="position:absolute;left:124px;bottom:120px;font-size:32px;color:var(--navy);font-weight:700">강사 <b style="font-weight:900">${ctx.presenter || 'OOO'}</b> <span style="color:var(--muted);font-weight:600">· ${ctx.org || 'OO권역 OOO'}</span></div>
      `,

    journey: (s, ctx) => `
      ${head(s, ctx)}
      <h2 class="s-title">오늘의 <em>성장 여정</em></h2>
      <div class="s-body" style="top:330px;bottom:150px;display:flex;flex-direction:column;justify-content:center">
        <div style="position:absolute;left:60px;right:60px;top:calc(50% - 150px);height:10px;border-radius:5px;background:repeating-linear-gradient(90deg,var(--sky) 0 26px,transparent 26px 44px)"></div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:28px;position:relative">
          ${SECTIONS.map((sec) => `
            <div style="display:flex;flex-direction:column;align-items:flex-start;gap:22px">
              <div style="display:grid;place-items:center;width:220px;height:220px;border-radius:50%;background:var(--ice);border:8px solid #fff;box-shadow:0 10px 0 var(--line),0 20px 40px rgba(19,40,107,.1);font-size:100px;font-weight:900;color:var(--blue)">
                ${String(sec.no).padStart(2, '0')}
              </div>
              <div style="font-size:26px;font-weight:800;color:var(--blue)">STEP ${sec.no} · Lv.${sec.grow[0]}→${sec.grow[1]}</div>
              <div style="font-size:42px;font-weight:800;color:var(--navy);line-height:1.3">${sec.title}</div>
            </div>`).join('')}
        </div>
      </div>
      `,

    goals: (s, ctx) => `
      ${head(s, ctx)}
      <h2 class="s-title">학습 <em>목표</em></h2>
      <div class="s-body" style="top:290px;bottom:150px;display:flex;flex-direction:column;justify-content:center;gap:34px">
        ${['교원으로서 <b>전문성 개발이 필요한 이유</b>를 설명할 수 있다.', '<b>전문성 개발 방향과 지원체계</b>에 대해 설명할 수 있다.', '<b>지속적 전문성 개발 계획</b>을 수립할 수 있다.'].map((t, i) => `
          <div class="card" style="flex-direction:row;align-items:center;gap:34px;padding:44px 48px">
            <span class="num" style="width:76px;height:76px;font-size:40px">${i + 1}</span><p style="font-size:44px;line-height:1.4;color:var(--ink)">${t}</p>
          </div>`).join('')}
      </div>
      `,

    divider: (s, ctx) => {
      const sec = SECTIONS[s.sec - 1];
      return `<div class="divider" style="position:absolute;inset:0">
        <img class="bg" src="${A}/bg/${ctx.gender}/${sec.bg}.webp" alt="">
        <div class="veil"></div>
        <div class="no">STEP ${sec.no}</div>
        <h2>${sec.title}</h2>
        <div class="lv"><span>Lv.${sec.grow[0]} ${LEVELS[sec.grow[0] - 1].name}</span><span class="arrow">➜</span><span>Lv.${sec.grow[1]} ${LEVELS[sec.grow[1] - 1].name}</span></div>
      </div>`;
    },

    ask: (s, ctx) => `
      ${head(s, ctx)}
      <div style="position:absolute;left:96px;top:128px"><span class="ask-badge">● 실시간 참여</span></div>
      <h2 class="ask-q" style="top:184px">${s.q}</h2>
      <div class="result" style="top:${s.widget === 'level' ? 360 : 380}px" data-result="${s.id}"></div>
      <div class="join-hint">${s.hint ? `<span>${s.hint}</span>` : ''}<span class="count-pill" data-count="${s.id}">0명 참여</span></div>`,

    quote: (s, ctx) => `
      ${head(s, ctx)}
      <div class="quote-mark" style="font-family:Georgia,'Times New Roman',serif;top:170px">“</div>
      <h2 class="big-q" style="top:330px;width:1300px;font-size:104px">AI 시대의 교육혁신은<br><em>교사의 역량</em>에 달려 있다</h2>
      <p style="position:absolute;left:124px;top:680px;width:1180px;margin:0;font-size:38px;line-height:1.6;color:var(--muted);font-weight:500">국가 인공지능 행동계획은 AI 시대 교육혁신의 핵심 과제로 <b style="color:var(--navy)">교사의 AI 역량 강화</b>를 제시합니다. 기술이 아무리 발전해도 수업을 바꾸는 것은 결국 교사입니다.</p>
      <div class="s-foot">출처: 「대한민국 인공지능 행동계획」 (2026.2.25, 국가인공지능전략위원회)</div>
      `,

    values: (s, ctx) => `
      ${head(s, ctx)}
      <h2 class="s-title">교원 AI·디지털 교육역량체계의 <em>3대 핵심가치</em></h2>
      <div class="s-body" style="top:300px"><div class="cards" style="grid-template-columns:repeat(3,1fr)">
        ${[
          { ic: 1, t: '인간의 존엄성을 위한 교육', p: '교육의 중심은 인간이며, 기술은 학생의 성장을 돕는 도구입니다.', tags: ['Ⓐ 교육 이해', 'Ⓑ 윤리적 실천'] },
          { ic: 2, t: '모든 학생의 성장', p: '학생 개개인의 특성을 파악해 맞춤형 교수·학습·평가를 지원합니다.', tags: ['Ⓒ 분석', 'Ⓓ 설계', 'Ⓔ 실행', 'Ⓕ 평가'] },
          { ic: 3, t: '교사 전문성', p: '기술은 교사를 대체하지 않고 전문성을 지원·확장합니다. 스스로 진단하고, 계획하고, 동료와 함께 성장합니다.', tags: ['Ⓖ 교사 전문성 개발'], focus: true },
        ].map((c) => `<div class="card ${c.focus ? 'focus' : ''}">${icon(c.ic)}<h3>${c.t}</h3><p>${c.p}</p><div class="tags">${c.tags.map((t) => `<span class="tag ${c.focus ? 'hot' : ''}">${t}</span>`).join('')}</div></div>`).join('')}
      </div></div>
      <div class="s-foot">출처: 한국교육학술정보원 (2026). 교원 AI·디지털 교육 역량체계</div>`,

    gmap: (s, ctx) => `
      ${head(s, ctx)}
      <h2 class="s-title"><em>G역량</em> · AI·디지털 기반 교사 전문성 개발</h2>
      <p class="s-sub" style="top:228px;right:96px">전문성 영역을 이해하고, 자기 진단에 따라 맞춤형 성장 경로를 설계하며, 학습공동체와 함께 성장하는 역량</p>
      <div class="s-body" style="top:350px;bottom:200px"><div class="cards" style="grid-template-columns:repeat(3,1fr)">
        ${G_AREAS.map((g) => `<div class="card">
          <div style="display:flex;align-items:center;gap:20px">${icon(g.icon, 'ic" style="width:92px;height:92px')}<div><div style="font-size:28px;font-weight:900;color:var(--blue)">${g.id}</div><h3>${g.title}</h3></div></div>
          ${g.items.map((it, i) => `<p style="display:flex;gap:14px;align-items:baseline"><b style="color:var(--orange);font-size:28px">${i + 1}</b>${it}</p>`).join('')}
        </div>`).join('')}
      </div></div>
      <div style="position:absolute;left:96px;right:380px;bottom:96px;padding:24px 34px;border-radius:24px;background:var(--navy);color:#fff;font-size:32px;font-weight:700">🧭 G역량은 A~F 역량을 통합·조율하는 <span style="color:#ffd29f">메타 역량</span>이자 <span style="color:#ffd29f">내비게이터</span>입니다.</div>
      <div class="s-foot" style="bottom:30px">출처: 한국교육학술정보원 (2026). 교원 AI·디지털 교육 역량체계</div>`,

    bigq: (s, ctx) => `
      ${head(s, ctx)}
      <h2 class="big-q" style="top:260px">전문성 개발 계획을<br>어떻게 <em>수립</em>하고, <em>실천</em>하고,<br><em>성찰</em>할 것인가?</h2>
      <p style="position:absolute;left:124px;top:700px;margin:0;font-size:36px;color:var(--muted);font-weight:600">이 질문의 답을 오늘 함께 찾아가요.</p>
      `,

    cycle: (s, ctx) => {
      const nodes = [
        { ic: 4, t: '연수' }, { ic: 5, t: '수업 실천' }, { ic: 6, t: '성찰과 공유' }, { ic: 7, t: '학교·지역 확산' }, { ic: 8, t: '교육혁신 기여' },
      ];
      return `
      ${head(s, ctx)}
      <h2 class="s-title">지속적 전문성 개발 <em>CPD</em></h2>
      <p class="s-sub">Continuous Professional Development — 연수에서 끝나지 않고 이어지는 성장 과정</p>
      <div class="s-body" style="top:360px;bottom:250px;display:flex;align-items:center;gap:18px">
        ${nodes.map((n, i) => `
          <div class="card" style="flex:1;align-items:center;text-align:center;padding:30px 18px;gap:14px">
            ${icon(n.ic, 'ic" style="width:130px;height:130px')}
            <div style="font-size:24px;font-weight:900;color:var(--blue)">0${i + 1}</div>
            <h3 style="font-size:36px">${n.t}</h3>
          </div>${i < nodes.length - 1 ? '<div style="font-size:52px;color:var(--orange);font-weight:900">›</div>' : ''}`).join('')}
      </div>
      <div style="position:absolute;left:96px;bottom:110px;display:flex;align-items:center;gap:24px;font-size:36px;font-weight:800;color:var(--navy)">
        <span style="padding:18px 28px;border-radius:22px;background:var(--ice)">실천가 <span style="color:var(--blue)">Lv.3</span></span>
        <span style="color:var(--orange);font-size:48px">➜</span>
        <span style="padding:18px 28px;border-radius:22px;background:var(--ice)">개척자 <span style="color:var(--blue)">Lv.6</span></span>
        <span style="font-size:30px;color:var(--muted);font-weight:600;margin-left:12px">로의 성장을 지원합니다</span>
      </div>
      <div class="s-foot" style="bottom:36px">출처: 「미래교육과 인공지능 교육의 필요성」 (중앙교육연수원 AIEDAP 원격연수 1차시)</div>`;
    },

    levels: (s, ctx) => `
      ${head(s, ctx)}
      <h2 class="s-title">AIEDAP 교사 전문성 <em>수준 정의</em></h2>
      <div class="s-body" style="top:290px;bottom:110px;display:grid;grid-template-columns:repeat(6,1fr);gap:18px;align-items:end">
        ${LEVELS.map((l) => `
          <div class="card ${l.no === 3 ? 'focus' : ''}" style="padding:28px 22px;gap:16px;height:650px">
            <div style="display:grid;place-items:center;width:120px;height:120px;border-radius:32px;background:${l.no === 3 ? 'var(--orange)' : 'var(--blue)'};color:#fff;font-size:64px;font-weight:900;margin-bottom:12px;flex-shrink:0">${l.no}</div>
            <div style="font-size:24px;font-weight:900;color:var(--blue)">Lv.${l.no} · ${l.en}</div>
            <h3 style="font-size:42px">${l.name}</h3>
            <p style="font-size:25px;line-height:1.45">${l.desc}</p>
          </div>`).join('')}
      </div>
      <div class="s-foot">출처: 교육부 (2026.03). AI디지털 기반 교육혁신을 지원하기 위한 2026년 AIEDAP 사업 기본계획</div>`,

    roadmap: (s, ctx) => {
      const phases = [
        { t: '교육실천', lv: 'Lv.1 ~ Lv.4', y: 0, groups: [['원격·현직교원 연수', '중앙교육연수원 AI융합수업 기초 · 현직교원/관리자 연수'], ['신규 연수', '역량 측정 → 사전 학습 → 원격 연수 → 수업 실천 → 집합 연수 → 역량 측정'], ['전문성 강화 연수', 'AI 융합수업 설계모형 심화 · 교과중심 · 지역문제 기반 · AI 윤리']] },
        { t: '교육확산', lv: 'Lv.4 ~ Lv.5', y: 1, groups: [['사례 확산 · 전문 강사', '사례 발표·공모전 · 현직교원/시도교육청 연수 강사'], ['개발·컨설팅 · 선도 강사', '연수 프로그램 개발 · 콘텐츠 고도화 · 신규/권역 특화 연수 강사']] },
        { t: '교육혁신', lv: 'Lv.6', y: 2, groups: [['연구·혁신 활동', '글로벌 거버넌스 · 학술 연구 · AI 융합수업 설계모형 개발 · AIEDAP 연구개발']] },
      ];
      return `
      ${head(s, ctx)}
      <h2 class="s-title">레벨에 따라 이어지는 <em>성장 로드맵</em></h2>
      <div class="s-body" style="top:290px;bottom:110px;display:grid;grid-template-columns:1.25fr 1fr .85fr;gap:26px;align-items:end">
        ${phases.map((p) => `
          <div class="card" style="gap:18px;margin-bottom:${p.y * 80}px">
            <div><div style="font-size:24px;font-weight:900;color:var(--blue)">${p.lv}</div><h3>${p.t}</h3></div>
            ${p.groups.map(([h, d]) => `<div style="padding:18px 22px;border-radius:18px;background:var(--ice)"><div style="font-size:30px;font-weight:800;color:var(--navy)">${h}</div><div style="font-size:26px;line-height:1.45;color:#33426a;margin-top:6px">${d}</div></div>`).join('')}
          </div>`).join('')}
      </div>
      <div class="s-foot">출처: aiedap.or.kr/training/cpd</div>`;
    },

    now: (s, ctx) => {
      const steps = ['역량 측정', '사전 학습', '원격 연수', '수업 실천', '집합 연수', '역량 측정'];
      return `
      ${head(s, ctx)}
      <h2 class="s-title">우리는 지금 <em>신규 연수</em>의 이 자리에</h2>
      <p class="s-sub">실천가(Lv.3)로 출발하는 마스터교원의 첫 과정</p>
      <div class="s-body" style="top:360px;bottom:440px;right:96px;display:flex;align-items:stretch;gap:0">
        ${steps.map((t, i) => `
          <div style="flex:1;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;margin-right:-24px;padding:0 30px;
            clip-path:polygon(0 0,calc(100% - 34px) 0,100% 50%,calc(100% - 34px) 100%,0 100%,34px 50%);
            background:${i === 4 ? 'var(--orange)' : i < 4 ? 'var(--navy-2)' : 'var(--sky-2)'};color:${i <= 4 ? '#fff' : 'var(--navy)'}">
            <div style="font-size:24px;font-weight:800;opacity:.85">0${i + 1}</div>
            <div style="font-size:36px;font-weight:900">${t}</div>
          </div>`).join('')}
      </div>
      <div style="position:absolute;left:${96 + 4 * 292 + 70}px;top:650px;display:flex;flex-direction:column;align-items:center;gap:6px">
        <div style="font-size:56px;color:var(--orange);line-height:1">▲</div>
        <div style="padding:12px 26px;border-radius:999px;background:var(--orange);color:#fff;font-size:32px;font-weight:900">지금 여기!</div>
      </div>
      `;
    },

    g23: (s, ctx) => `
      ${head(s, ctx)}
      <h2 class="s-title">${s.focus === 'G2' ? '먼저, <em>G2 · 전문성 계획 수립</em>을 지원하는 체계' : '이제, <em>G3 · 실천과 협력적 성장</em>으로'}</h2>
      <div class="s-body" style="top:320px"><div class="cards" style="grid-template-columns:1fr 1fr">
        ${G_AREAS.slice(1).map((g) => `<div class="card ${g.id === s.focus ? 'focus' : 'dim'}">
          <div style="display:flex;align-items:center;gap:20px">${icon(g.icon, 'ic" style="width:100px;height:100px')}<div><div style="font-size:28px;font-weight:900;color:var(--blue)">${g.id}</div><h3>${g.title}</h3></div></div>
          ${g.items.map((it, i) => `<p style="display:flex;gap:14px;align-items:baseline"><b style="color:var(--orange);font-size:28px">${i + 1}</b>${it}</p>`).join('')}
        </div>`).join('')}
      </div></div>
      `,

    platform: (s, ctx) => {
      const box = (title, items, color) => `<div class="card" style="padding:26px 28px;gap:10px;border-top:10px solid ${color}"><h3 style="font-size:32px">${title}</h3>${items.map((t) => `<p style="font-size:24px">· ${t}</p>`).join('')}</div>`;
      return `
      ${head(s, ctx)}
      <h2 class="s-title">전문성 개발 <em>통합 플랫폼</em>과 e-Portfolio 인증</h2>
      <div class="s-body" style="top:290px;bottom:110px;display:grid;grid-template-columns:1.15fr 70px 1fr;gap:18px;align-items:center">
        <div style="display:grid;gap:18px">
          <div style="font-size:26px;font-weight:900;color:var(--blue)">통합 플랫폼 (Core Platform)</div>
          ${box('① 역량 진단 · 성장 경로', ['AI·디지털 역량 진단', '성장 단계(Lv.3~6) 분석', '개인 맞춤 성장 로드맵'], 'var(--blue)')}
          ${box('② 연수 · 활동 관리', ['연수 이수 관리', 'AI 융합 수업 실행 기록'], 'var(--orange)')}
          ${box('③ 대시보드 전문성 분석', ['성장 수준 시각화', '맞춤형 피드백 및 추천'], 'var(--sky)')}
        </div>
        <div style="text-align:center;font-size:24px;font-weight:800;color:var(--muted);line-height:1.4"><div style="font-size:56px;color:var(--orange)">➜</div>활동<br>데이터</div>
        <div style="display:grid;gap:18px">
          ${box('e-Portfolio 활동 인증', ['활동 기록·수업 사례 업로드', '증빙 관리 · 성장 기록 축적'], 'var(--navy)')}
          <div style="text-align:center;font-size:44px;color:var(--orange);line-height:1">⬇</div>
          ${box('디지털 배지 발급', ['역량 수준별 배지 발급', '성과 공유 · 피드백으로 순환'], 'var(--orange)')}
        </div>
      </div>
      `;
    },

    shot: (s, ctx) => `
      ${head(s, ctx)}
      ${s.step ? `<div style="position:absolute;left:96px;top:124px"><span class="ask-badge" style="background:var(--blue)">${s.step}</span></div>` : ''}
      <h2 class="s-title" style="top:${s.step ? 180 : 136}px;font-size:60px">${s.title}</h2>
      <div style="position:absolute;left:96px;top:${s.step ? 300 : 270}px;bottom:110px;width:1180px;border-radius:28px;background:#fff;box-shadow:0 12px 0 var(--line),0 30px 60px rgba(19,40,107,.12);overflow:hidden">
        <div style="height:46px;background:var(--ice);display:flex;align-items:center;gap:10px;padding:0 20px"><i style="width:14px;height:14px;border-radius:50%;background:#ff8a80"></i><i style="width:14px;height:14px;border-radius:50%;background:#ffd180"></i><i style="width:14px;height:14px;border-radius:50%;background:#b9f6ca"></i><span style="margin-left:18px;font-size:20px;color:var(--muted);font-weight:600">aiedap.or.kr</span></div>
        <img src="${A}/shot/${s.shot}.webp" alt="" style="width:100%;height:calc(100% - 46px);object-fit:contain;background:#fff">
      </div>
      <div style="position:absolute;left:1320px;right:96px;top:${s.step ? 330 : 300}px;display:flex;flex-direction:column;gap:20px">
        ${s.points.map((p, i) => `<div style="display:flex;gap:16px;align-items:flex-start;font-size:32px;line-height:1.45;font-weight:700;color:var(--navy)"><span class="num" style="width:50px;height:50px;font-size:26px;border-radius:14px">${i + 1}</span>${p}</div>`).join('')}
      </div>
      `,

    post: (s, ctx) => `
      ${head(s, ctx)}
      <h2 class="s-title">마무리 · <em>사후 역량 측정</em>하기</h2>
      <div class="s-body" style="top:300px;display:flex;flex-direction:column;gap:30px">
        <div class="card" style="gap:14px"><p style="font-size:32px">aiedap.or.kr에 접속해 역량 측정에 참여해 주세요.</p>
          <div style="display:flex;align-items:baseline;gap:24px;margin-top:10px"><span style="font-size:32px;font-weight:800;color:var(--muted)">역량코드</span><span style="font-size:96px;font-weight:900;letter-spacing:.06em;color:var(--navy)">${ctx.postCode || 'XQ4130IF'}</span></div>
          <p style="font-size:24px;color:#a14b00;font-weight:700">※ 역량코드는 연수별로 다릅니다. 연수 전 강사가 확인합니다.</p>
        </div>
        <img src="${A}/shot/33.webp" alt="" style="width:100%;max-height:320px;object-fit:contain;border-radius:22px;background:#fff;box-shadow:0 10px 0 var(--line)">
      </div>
      `,

    end: (s, ctx) => `
      <img src="${A}/bg/${ctx.gender}/bg-title.webp" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
      <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(247,251,255,.92) 0,rgba(247,251,255,.7) 55%,rgba(247,251,255,.2) 100%)"></div>
      <h2 style="position:absolute;left:0;right:0;top:120px;margin:0;text-align:center;font-size:120px;font-weight:900;color:var(--navy);letter-spacing:-.03em">감사합니다</h2>
      <p style="position:absolute;left:0;right:0;top:290px;margin:0;text-align:center;font-size:40px;color:var(--muted);font-weight:600">입문가에서 개척자까지, 여러분의 성장을 응원합니다</p>
      <div style="position:absolute;left:340px;right:340px;top:460px;padding:52px 64px;border-radius:36px;background:rgba(255,255,255,.92);box-shadow:0 18px 50px rgba(19,40,107,.12);text-align:center">
        <div style="font-size:28px;font-weight:800;color:var(--blue);letter-spacing:.08em">다음 성장을 위한 첫걸음</div>
        <p style="margin:24px 0 0;font-size:52px;line-height:1.4;font-weight:800;color:var(--navy)">오늘 세운 계획을 수업에서 실천하고,<br>배운 것을 동료와 함께 나누어 주세요.</p>
        <div style="margin-top:30px;font-size:32px;font-weight:700;color:var(--muted)">진단 → 계획 → 실천 → 성찰 → 함께 성장</div>
      </div>`,
  };

  function render(slide, ctx) {
    return R[slide.kind](slide, ctx);
  }

  // ── 성장 애니메이션 (public/achieve 의 획득 모션 시트를 이어서 재생) ──
  let manifestP = null;
  const images = new Map();
  const loadManifest = () => (manifestP ??= fetch('/achieve/manifest.json').then((r) => r.json()).catch(() => ({})));
  const loadImg = (src) => {
    if (!images.has(src)) images.set(src, new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }));
    return images.get(src);
  };
  const clipName = (g, to) => (to === 1 ? `${g}-1` : `${g}-${to - 1}to${to}`);

  // from 단계에서 to 단계까지 클립을 차례로 재생하고 마지막 자세에서 멈춘다. 반환값: 멈추는 함수
  function playGrowth(canvas, gender, from, to, opt = {}) {
    let stopped = false;
    let timer = null;
    let finishClip = null;
    (async () => {
      const m = await loadManifest();
      const ctx = canvas.getContext('2d');
      if (!ctx || stopped) return;
      const list = [];
      for (let s = Math.max(1, from + (from === to ? 0 : 1)); s <= to; s++) list.push(clipName(gender, s));
      if (from === to) list.splice(0, list.length, clipName(gender, to));
      for (const name of list) {
        const e = m[name];
        if (!e || stopped) continue;
        const img = await loadImg(e.strip);
        if (!img || stopped) continue;
        canvas.width = e.w;
        canvas.height = e.h;
        const draw = (i) => {
          ctx.clearRect(0, 0, e.w, e.h);
          ctx.drawImage(img, (i % e.cols) * e.w, Math.floor(i / e.cols) * e.h, e.w, e.h, 0, 0, e.w, e.h);
        };
        draw(opt.still ? e.frames - 1 : 0);
        opt.onReady?.();
        if (opt.still) { draw(e.frames - 1); continue; }
        await new Promise((done) => {
          finishClip = done;
          let i = 1;
          timer = setInterval(() => {
            if (stopped) { clearInterval(timer); return done(); }
            draw(i);
            if (++i >= e.frames) { clearInterval(timer); done(); }
          }, 1000 / e.fps);
        });
        finishClip = null;
      }
      if (!stopped) opt.onComplete?.();
    })();
    return () => { stopped = true; clearInterval(timer); finishClip?.(); };
  }

  // 슬라이드를 붙인 뒤: 성장 캔버스 재생 시작 (반환: 정리 함수)
  function mount(el, ctx) {
    const stops = [...el.querySelectorAll('canvas[data-growth]')].map((cv) => {
      const [g, from, to] = cv.dataset.growth.split(':');
      return playGrowth(cv, g, Number(from), Number(to), { still: ctx.still });
    });
    return () => stops.forEach((s) => s());
  }

  window.Deck = { SLIDES, SECTIONS, LEVELS, COMPETENCIES, render, mount, playGrowth, charImg, A };
})();
