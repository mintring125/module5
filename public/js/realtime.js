// Ably 실시간 연결 (학생·강사 화면 공통)
//  control 채널: 강사가 보내는 상태 { slide, theme, rev, assign } — rewind로 새로 들어온 사람도 마지막 상태를 받는다
//  room 채널:    질문(chat) + 참여자 알림(hello/who/bye: { name, gender, type, rev })
(function () {
  let configPromise = null;
  const loadConfig = () => (configPromise ??= fetch('/config.json', { cache: 'no-cache' }).then((r) => r.json()));

  const MAX_NAME = 10;
  const MAX_TEXT = 80;
  const clip = (s, n) => String(s ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, n);
  const typeRange = (gender) => (gender === 'f' ? [5, 6, 7, 8, 9] : [0, 1, 2, 3, 4]);

  // 참여자 알림은 다른 사람이 보낸 값이므로 모양을 다시 맞춘다
  function cleanUser(p) {
    const d = p.data || {};
    const gender = d.gender === 'f' ? 'f' : 'm';
    return {
      uid: p.clientId,
      name: clip(d.name, MAX_NAME) || '참여자',
      gender,
      type: typeRange(gender).includes(d.type) ? d.type : typeRange(gender)[0],
      rev: Number.isInteger(d.rev) ? d.rev : 0,
    };
  }

  // 강사 키 확인 (Ably에 붙기 전에 토큰 함수로 먼저 물어본다)
  async function checkTeacherKey(teacherKey) {
    const r = await fetch('/api/token?role=teacher', { headers: { 'x-teacher-key': teacherKey }, cache: 'no-store' });
    if (r.ok) return { ok: true };
    const body = await r.json().catch(() => ({}));
    return { ok: false, status: r.status, error: body.error || `오류 ${r.status}` };
  }

  async function connect({ role, uid, teacherKey }) {
    const cfg = await loadConfig();
    const client = new Ably.Realtime({
      authUrl: '/api/token',
      authParams: role === 'teacher' ? { role: 'teacher' } : { role: 'student', uid },
      authHeaders: role === 'teacher' ? { 'x-teacher-key': teacherKey } : {},
      clientId: role === 'teacher' ? 'teacher' : uid,
    });
    const control = client.channels.get(`${cfg.room}:control`, { params: { rewind: '1' } });
    const room = client.channels.get(`${cfg.room}:room`);

    const handlers = { state: [], users: [], chat: [], connection: [] };
    const emit = (name, v) => handlers[name].forEach((fn) => fn(v));


    // 참여자 목록: Ably presence 대신 일반 메시지로 관리한다 (presence 권한이 없는 키에서도 동작하도록)
    //   hello: 내 프로필 알림(들어올 때·바뀔 때·45초마다), who: 새로 온 사람이 목록을 요청, bye: 나감
    //   보낸 사람(clientId)은 Ably가 토큰으로 확인한 값이라 남을 사칭할 수 없다
    const PING_MS = 45000;
    const STALE_MS = 120000;
    const people = new Map(); // uid -> { user, seen }
    let myData = null;
    let users = [];
    const emitUsers = () => {
      users = [...people.values()].map((p) => p.user);
      emit('users', users);
    };
    const sendHello = () => myData && room.publish('hello', myData).catch(() => {});

    client.connection.on((change) => emit('connection', change));
    control.subscribe('state', (m) => emit('state', m.data || {}));
    room.subscribe('chat', (m) => {
      const text = clip(m.data?.text, MAX_TEXT);
      if (text) emit('chat', { uid: m.clientId, text, slide: Number(m.data?.slide) || 0, ts: m.timestamp || Date.now() });
    });
    room.subscribe('hello', (m) => {
      if (m.clientId === 'teacher') return;
      people.set(m.clientId, { user: cleanUser(m), seen: Date.now() });
      emitUsers();
    });
    room.subscribe('bye', (m) => {
      if (people.delete(m.clientId)) emitUsers();
    });
    room.subscribe('who', () => setTimeout(sendHello, Math.random() * 1500)); // 한꺼번에 몰리지 않게 흩어서 답한다
    room.whenState('attached').then(() => room.publish('who', {}).catch(() => {}));
    client.connection.on('connected', () => room.publish('who', {}).catch(() => {})); // 재연결 뒤 목록 다시 받기

    setInterval(() => {
      const now = Date.now();
      let changed = false;
      for (const [uid, p] of people) if (now - p.seen > STALE_MS) { people.delete(uid); changed = true; }
      if (changed) emitUsers();
      sendHello();
    }, PING_MS);
    window.addEventListener('pagehide', () => { if (myData) room.publish('bye', {}).catch(() => {}); });

    return {
      config: cfg,
      on(name, fn) { handlers[name].push(fn); },
      users: () => users,
      async setProfile(profile) {
        myData = { name: clip(profile.name, MAX_NAME), gender: profile.gender, type: profile.type, rev: profile.rev || 0 };
        await room.publish('hello', myData);
      },
      chat: (text, slide) => room.publish('chat', { text: clip(text, MAX_TEXT), slide }),
      publishState: (state) => control.publish('state', state),
      close: () => client.close(),
    };
  }

  window.Realtime = { connect, checkTeacherKey, loadConfig, typeRange };
})();
