// 픽셀 캐릭터 스프라이트 (10종: 남 5, 여 5)
// 16x22 도트 템플릿을 1px 외곽선 여백을 둔 18x24 캔버스에 그린다. 오른쪽을 보는 방향이 기본.
(function () {
  const W = 18;
  const H = 24;
  const OUTLINE = '#231f2e';

  const BASE = [
    '................',
    '................',
    '................',
    '....SSSSSSSS....',
    '....SSSSSSSS....',
    '....SSSSSSSS....',
    '...SSSSESSESS...',
    '...SSSBSSSSBS...',
    '....SSSSMMSS....',
    '.....SSSSSS.....',
    '....CCCCCCCC....',
    '...cCCCCCCCCc...',
    '...cCCCCCCCCc...',
    '...cCCCCCCCCc...',
    '...cCCCCCCCCc...',
    '...SCCCCCCCCS...',
  ];
  const PANTS_TOP = ['....PPPPPPPP....', '....PPPPPPPP....'];
  const SKIRT_TOP = ['....KKKKKKKK....', '...KKKKKKKKKK...'];
  // 다리 4프레임: 서기 / 뒷발 들기 / 서기 / 앞발 들기
  const LEGS = [
    ['.....XX..XX.....', '.....XX..XX.....', '.....XX..XX.....', '.....FFF.FFF....'],
    ['.....XX..XX.....', '....XX...XX.....', '...FFF...XX.....', '.........FFF....'],
    ['.....XX..XX.....', '.....XX..XX.....', '.....XX..XX.....', '.....FFF.FFF....'],
    ['.....XX..XX.....', '.....XX...XX....', '.....XX...FFF...', '.....FFF........'],
  ];

  const HAIR_FRONT = {
    short: [
      '................',
      '....HHHHHHHH....',
      '...HHHHHHHHHH...',
      '...HHHHHHHHHH...',
      '...HHhHHHHHHH...',
      '...HH......HH...',
    ],
    side: [
      '................',
      '....HHHHHHHH....',
      '...HHHHHHHHHH...',
      '...HHHHHHHHHH...',
      '...HHH.HHHHHH...',
      '...H.......HH...',
    ],
    cap: [
      '....KKKKKKKK....',
      '...KKKKKKKKKK...',
      '...KKKKKWKKKK...',
      '...KKKKKKKKKKKKK',
      '...HH......HH...',
    ],
    curly: [
      '.....H.HH.H.....',
      '...HHHHHHHHHH...',
      '..HHHhHHHhHHHH..',
      '..HHHHHHHHHHHH..',
      '..HhHHhHHhHHhH..',
      '..HH........HH..',
      '..H..........H..',
    ],
    beard: [
      '................',
      '................',
      '....HHHHHHHH....',
      '...HHHHHHHHHH...',
      '...HH.....HHH...',
      '...H.......HH...',
      '................',
      '................',
      '....HHHHMMHH....',
      '.....HHHHHH.....',
    ],
    long: [
      '................',
      '.....HHHHHH.....',
      '....HHHHHHHH....',
      '...HHHHHHHHHH...',
      '...HHHHHHHHHH...',
      '...HH......HHH..',
      '...H........HH..',
      '...H........HH..',
      '...H........HH..',
      '...HH......HHH..',
    ],
    ponytail: [
      '................',
      '....HHHHHHHH....',
      '...HHHHHHHHHH...',
      '.RRHHHHHHHHHH...',
      '.HHHHHHHHHHHH...',
      '.HH.H......H....',
      '..HH............',
      '..HH............',
      '..H.............',
    ],
    bob: [
      '................',
      '.....HHHHHH.....',
      '....HHHHHHHH....',
      '...HHHHHHHHHH...',
      '...HhHHHHHHHH...',
      '...HH.......HH..',
      '...HH.......HH..',
      '...HH.......HH..',
      '...HHH.....HHH..',
    ],
    bun: [
      '......HHH.......',
      '.....HHHHHR.....',
      '....HHHHHHHH....',
      '...HHHHHHHHHH...',
      '...HHHhHHHHHH...',
      '...H........H...',
    ],
    wavy: [
      '................',
      '.....HHHHHH.....',
      '....RRRRRRRR....',
      '...HHHHHHHHHH...',
      '...HHHHHHHHHHH..',
      '..HHH......HHH..',
      '..HH........HH..',
      '..HHH.......HH..',
      '..HH........HHH.',
      '..HHH......HHH..',
    ],
  };

  const backRows = (from, to, rowFn) => {
    const rows = [];
    for (let r = 0; r <= to; r++) rows.push(r < from ? '................' : rowFn(r));
    return rows;
  };
  const HAIR_BACK = {
    long: backRows(3, 14, (r) => (r === 14 ? '..H..........H..' : '..HHHHHHHHHHHH..')),
    wavy: backRows(3, 15, (r) => (r === 15 ? '.HH..........HH.' : r >= 9 && r % 3 === 0 ? '.HHHHHHHHHHHHHH.' : '..HHHHHHHHHHHH..')),
  };

  const EXTRA = {
    glasses: ['', '', '', '', '', '', '.....GG.GG.G....'],
    tie: ['', '', '', '', '', '', '', '', '', '', '......WTTW......', '.......TT.......', '.......TT.......', '........T.......'],
    cardigan: ['', '', '', '', '', '', '', '', '', '', '.......II.......', '.......II.......', '.......II.......', '.......II.......', '.......II.......'],
    hoodie: ['', '', '', '', '', '', '', '', '', '', '....cCCCCCCc....', '......W..W......', '......W..W......', '.....cccccc.....', '.....c....c.....'],
    collar: ['', '', '', '', '', '', '', '', '', '', '......WWWW......'],
  };

  const TYPES = [
    { id: 0, gender: 'm', label: '단정한 모범생', skin: '#f6cba4', hair: '#2b2233', style: 'short', shirt: '#3b7dd8', pants: '#2f3a56', shoes: '#3a2a20' },
    { id: 1, gender: 'm', label: '안경 쓴 연구자', skin: '#f2c49c', hair: '#5a3a22', style: 'side', shirt: '#4f9a5a', inner: '#f4f1e8', pants: '#4a4038', shoes: '#2a2420', extras: ['cardigan', 'glasses'], glasses: '#20202a' },
    { id: 2, gender: 'm', label: '모자 쓴 활동가', skin: '#e9b48a', hair: '#2b2233', style: 'cap', accent: '#e04848', shirt: '#f2f2f2', pants: '#3a5a8c', shoes: '#d84040' },
    { id: 3, gender: 'm', label: '곱슬머리 개발자', skin: '#dca277', hair: '#7a4a2a', style: 'curly', shirt: '#f08a3c', pants: '#3a3a48', shoes: '#f2f2f2', extras: ['hoodie'] },
    { id: 4, gender: 'm', label: '수염 교장선생님', skin: '#f2c8a6', hair: '#a7a7b3', style: 'beard', shirt: '#2c3a66', tie: '#c83a3a', pants: '#2c3a66', shoes: '#1e1e24', extras: ['tie'] },
    { id: 5, gender: 'f', label: '긴 생머리 선생님', skin: '#f8d2b0', hair: '#2b2233', style: 'long', shirt: '#f29bb8', pants: '#3b4a7a', shoes: '#5a3040', extras: ['collar'] },
    { id: 6, gender: 'f', label: '포니테일 러너', skin: '#f2c49c', hair: '#8a5a32', style: 'ponytail', ribbon: '#e04870', shirt: '#f6d04a', accent: '#3b6fc4', skirt: true, shoes: '#e04870' },
    { id: 7, gender: 'f', label: '단발 안경 분석가', skin: '#f6cba4', hair: '#3a2a28', style: 'bob', shirt: '#9a6ad6', pants: '#4a4a5a', shoes: '#2a2430', extras: ['glasses'], glasses: '#c0306a' },
    { id: 8, gender: 'f', label: '똥머리 디자이너', skin: '#e9b48a', hair: '#5a3424', style: 'bun', ribbon: '#ffd34a', shirt: '#4cc4a8', accent: '#2f5a6a', skirt: true, shoes: '#2f2a30' },
    { id: 9, gender: 'f', label: '웨이브 머리띠', skin: '#f8d2b0', hair: '#a8642e', style: 'wavy', ribbon: '#e05050', shirt: '#e86060', accent: '#e86060', skirt: true, shoes: '#7a2a2a', extras: ['collar'] },
  ];

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => Math.max(0, Math.min(255, Math.round(v * (1 - amt))));
    const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }

  function palette(t) {
    return {
      S: t.skin, s: shade(t.skin, 0.18), L: t.skin,
      E: '#1d1a26', B: '#f19a92', M: '#a8443c',
      C: t.shirt, c: shade(t.shirt, 0.2),
      P: t.pants || '#333', F: t.shoes || '#2a2420',
      H: t.hair, h: shade(t.hair, 0.25),
      K: t.accent || '#888', R: t.ribbon || '#e04870',
      W: '#ffffff', G: t.glasses || '#20202a', T: t.tie || '#c83a3a', I: t.inner || '#ffffff',
    };
  }

  const cache = new Map();

  // phase: 걷기 0~3, opts.blink: 눈 감기, opts.talk: 입 벌리기
  function frame(typeId, phase = 0, opts = {}) {
    const key = `${typeId}|${phase}|${opts.blink ? 1 : 0}|${opts.talk ? 1 : 0}`;
    if (cache.has(key)) return cache.get(key);

    const t = TYPES[typeId] || TYPES[0];
    const pal = palette(t);
    const grid = Array.from({ length: H }, () => Array(W).fill(null));
    const put = (rows, map = {}) => {
      rows.forEach((row, r) => {
        for (let c = 0; c < row.length; c++) {
          const ch = map[row[c]] || row[c];
          if (ch !== '.' && pal[ch]) grid[r + 1][c + 1] = pal[ch];
        }
      });
    };

    if (HAIR_BACK[t.style]) put(HAIR_BACK[t.style]);
    const legs = LEGS[phase % 4].map((row) => row.replace(/X/g, t.skirt ? 'L' : 'P'));
    put([...BASE, ...(t.skirt ? SKIRT_TOP : PANTS_TOP), ...legs]);
    (t.extras || []).filter((e) => e !== 'glasses').forEach((e) => put(EXTRA[e].map((r) => r || '')));
    put(HAIR_FRONT[t.style]);
    if ((t.extras || []).includes('glasses')) put(EXTRA.glasses);

    if (opts.blink) {
      grid[7][8] = pal.s;
      grid[7][11] = pal.s;
    }
    if (opts.talk) {
      grid[10][9] = pal.M;
      grid[10][10] = pal.M;
    }

    const cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext('2d');
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        let color = grid[y][x];
        if (!color) {
          const near = (yy, xx) => yy >= 0 && yy < H && xx >= 0 && xx < W && grid[yy][xx];
          if (near(y - 1, x) || near(y + 1, x) || near(y, x - 1) || near(y, x + 1)) color = OUTLINE;
        }
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    cache.set(key, cv);
    return cv;
  }

  // ── 캐릭터 버전: pixel(코드로 그린 도트) / teacher·student(sprite-gen 그림, /chars/<버전>/manifest.json) ──
  // manifest: { "<typeId>": { "idle": {src, frames, w, h, body_h, delay_ms}, "walk": {...} } }
  // 0-4는 남자, 5-9는 여자 캐릭터 자리. 그림이 없는 자리는 도트 캐릭터로 보인다.
  const THEMES = {
    pixel: { name: '픽셀 캐릭터', labels: TYPES.map((t) => t.label) },
    teacher: {
      name: '세련된 선생님',
      labels: ['체육 선생님', '과학 선생님', '미술 선생님', '교장 선생님', '국어 선생님 (한복)',
        '음악 선생님', '담임 선생님', 'AI·정보 선생님', '지리 선생님', '학년부장 선생님'],
    },
    student: {
      name: '중학생',
      labels: ['교복 모범생', '체육복 운동파', '후드티 자유파', '하복 공부파', '롱패딩 쿨가이',
        '교복 단정파', '체육복 포니테일', '가디건 책벌레', '하복 땋은머리', '바람막이 힙스터'],
    },
  };
  let theme = 'pixel';
  const art = new Map(); // `${theme}:${id}` -> { idle, walk }
  const loading = new Map(); // theme -> Promise

  function loadTheme(name) {
    if (name === 'pixel') return Promise.resolve();
    if (!loading.has(name)) {
      loading.set(name, fetch(`/chars/${name}/manifest.json`, { cache: 'no-cache' })
        .then((r) => (r.ok ? r.json() : {}))
        .then((m) => Promise.all(Object.entries(m).map(([id, states]) => Promise.all(
          Object.entries(states).map(([state, s]) => new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve([state, { ...s, img }]);
            img.onerror = () => resolve(null);
            img.src = s.src;
          })),
        ).then((list) => {
          const ok = Object.fromEntries(list.filter(Boolean));
          if (ok.walk || ok.idle) art.set(`${name}:${id}`, ok);
        }))))
        .catch(() => {}));
    }
    return loading.get(name);
  }

  const setTheme = (name) => {
    theme = THEMES[name] ? name : 'pixel';
    return loadTheme(theme);
  };
  const artOf = (typeId) => (theme === 'pixel' ? null : art.get(`${theme}:${typeId}`) || null);
  const label = (typeId) => THEMES[theme].labels[typeId] || TYPES[typeId]?.label || '';

  // 스트립의 한 칸을 발끝 기준으로 캔버스에 그린다 (미리보기·질문 목록 아바타용)
  function drawArt(ctx, typeId, state, idx) {
    const a = artOf(typeId);
    const s = a && (a[state] || a.walk || a.idle);
    if (!s) return false;
    const { width: cw, height: ch } = ctx.canvas;
    const scale = Math.min(cw / s.w, (ch * 0.95) / s.h);
    const dw = s.w * scale;
    const dh = s.h * scale;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(s.img, (idx % s.frames) * s.w, 0, s.w, s.h, (cw - dw) / 2, ch - dh, dw, dh);
    return true;
  }

  function dataURL(typeId, scale = 4) {
    const cv = document.createElement('canvas');
    cv.width = W * scale;
    cv.height = H * scale;
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    if (!drawArt(ctx, typeId, 'idle', 0)) ctx.drawImage(frame(typeId, 0), 0, 0, cv.width, cv.height);
    return cv.toDataURL();
  }

  window.PixelChars = {
    TYPES, THEMES, W, H, frame, dataURL, artOf, drawArt, label, setTheme,
    get theme() { return theme; },
    ready: () => loadTheme(theme),
  };
})();