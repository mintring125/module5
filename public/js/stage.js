// 슬라이드 + 바닥 무대 + 걸어다니는 픽셀 캐릭터 (학생/강사 화면 공통)
(function () {
  const GROUND = 0.075; // 바닥 높이 = 보드 너비의 7.5%
  const BOARD_RATIO = 9 / 16 + GROUND;
  const STEP_MS = 140;
  const rand = (a, b) => a + Math.random() * (b - a);

  function fitBoard(board, area) {
    const w = Math.max(200, Math.min(area.clientWidth, area.clientHeight / BOARD_RATIO));
    board.style.width = `${w}px`;
    board.style.height = `${w * BOARD_RATIO}px`;
    board.style.setProperty('--u', `${w / 100}px`);
  }

  class Stage {
    constructor({ board, area, slideImg, meUid = null }) {
      this.board = board;
      this.area = area;
      this.slideImg = slideImg;
      this.meUid = meUid;
      this.actors = new Map();
      this.layer = board.querySelector('.actors');
      this.slide = 0;
      this.total = 0;
      this.last = performance.now();

      const fit = () => {
        fitBoard(board, area);
        this.layoutBubbles();
      };
      new ResizeObserver(fit).observe(area);
      fit();
      requestAnimationFrame((t) => this.tick(t));
    }

    showSlide(n, total) {
      if (total) this.total = total;
      if (n === this.slide) return;
      this.slide = n;
      const src = `/slides/${n}.png`;
      const img = new Image();
      img.onload = () => {
        if (this.slide === n) this.slideImg.src = src;
      };
      img.src = src;
      [n + 1, n + 2, n - 1].forEach((k) => {
        if (k >= 1 && k <= this.total) new Image().src = `/slides/${k}.png`;
      });
    }

    setUsers(list) {
      const keep = new Set(list.map((u) => u.uid));
      [...this.actors.keys()].forEach((uid) => keep.has(uid) || this.remove(uid));
      list.forEach((u) => this.upsert(u));
    }

    upsert(u) {
      let a = this.actors.get(u.uid);
      if (!a) {
        const el = document.createElement('div');
        el.className = 'actor entering';
        el.innerHTML = '<div class="bubble"></div><div class="me-mark">나</div><canvas class="sprite"></canvas><div class="art"></div><div class="tag"></div>';
        const canvas = el.querySelector('canvas');
        canvas.width = PixelChars.W;
        canvas.height = PixelChars.H;
        a = {
          uid: u.uid, el, canvas, ctx: canvas.getContext('2d'), artEl: el.querySelector('.art'), seed: rand(0, 5000),
          bubble: el.querySelector('.bubble'), tag: el.querySelector('.tag'),
          x: rand(6, 94), lane: Math.random(), dir: Math.random() < 0.5 ? -1 : 1,
          speed: rand(2.2, 4.2), walking: false, until: 0, phase: 0, phaseAt: 0,
          blinkAt: performance.now() + rand(1500, 5000), talkUntil: 0, bubbleUntil: 0, frameKey: '',
        };
        if (u.uid === this.meUid) el.classList.add('me');
        el.style.zIndex = String(100 + Math.round((1 - a.lane) * 100));
        setTimeout(() => el.classList.remove('entering'), 600);
        this.layer.appendChild(el);
        this.actors.set(u.uid, a);
      }
      a.type = u.type;
      a.name = u.name;
      a.tag.textContent = u.name;
      a.frameKey = '';
      return a;
    }

    remove(uid) {
      const a = this.actors.get(uid);
      if (!a) return;
      this.actors.delete(uid);
      a.el.classList.add('leaving');
      setTimeout(() => a.el.remove(), 400);
    }

    say(uid, text) {
      const a = this.actors.get(uid);
      if (!a) return;
      const now = performance.now();
      const dur = Math.min(14000, 4500 + text.length * 130);
      a.bubble.replaceChildren(
        Object.assign(document.createElement('span'), { className: 'who', textContent: a.name }),
        document.createTextNode(text),
      );
      a.bubble.classList.remove('show');
      void a.bubble.offsetWidth; // 팝 애니메이션 재시작
      a.bubble.classList.add('show');
      a.el.classList.add('speaking');
      a.bubbleAt = now;
      a.bubbleUntil = now + dur;
      a.talkUntil = now + Math.min(dur, 2000 + text.length * 90); // 이 동안 입을 움직이고(도트) 정면을 본다(그림)
      a.walking = false;
      a.until = a.bubbleUntil; // 말하는 동안은 멈춰 선다
      this.layer.appendChild(a.el); // 같은 z-index 안에서 맨 앞으로
      this.step(a, now, 0);
      this.layoutBubbles();
    }

    // 말풍선끼리 겹치면 나중에 말한 쪽을 위로 쌓는다 (말하는 캐릭터는 멈춰 있으므로 말할 때만 계산)
    layoutBubbles() {
      const bw = this.board.clientWidth;
      const placed = [];
      [...this.actors.values()]
        .filter((a) => a.bubbleUntil)
        .sort((p, q) => p.bubbleAt - q.bubbleAt)
        .forEach((a) => {
          a.bubble.classList.remove('lifted');
          let w = a.bubble.offsetWidth;
          let h = a.bubble.offsetHeight;
          const cx = (a.x / 100) * bw;
          const leftOf = () => {
            if (a.x < 14) return cx - a.el.offsetWidth / 2 - 0.1 * w;
            if (a.x > 86) return cx + a.el.offsetWidth / 2 - 0.9 * w;
            return cx - w / 2;
          };
          const bottom0 = a.el.offsetTop - 6;
          let lift = 0;
          for (let guard = 0; guard < 20; guard++) {
            const l = leftOf();
            const r = { l, r: l + w, b: bottom0 - lift, t: bottom0 - lift - h };
            const hit = placed.find((p) => r.l < p.r && r.r > p.l && r.t < p.b + 4 && r.b > p.t - 4);
            if (!hit) { placed.push(r); break; }
            if (!lift) {
              // 위로 띄운 말풍선에는 누가 말했는지 이름을 붙이므로 크기를 다시 잰다
              a.bubble.classList.add('lifted');
              w = a.bubble.offsetWidth;
              h = a.bubble.offsetHeight;
            }
            lift = bottom0 - hit.t + 6;
          }
          a.bubble.style.setProperty('--lift', `${lift}px`);
        });
    }

    tick(now) {
      const dt = Math.min(0.1, (now - this.last) / 1000);
      this.last = now;
      for (const a of this.actors.values()) this.step(a, now, dt);
      requestAnimationFrame((t) => this.tick(t));
    }

    step(a, now, dt) {
      if (now > a.until) {
        a.walking = !a.walking && Math.random() < 0.75;
        a.until = now + (a.walking ? rand(1800, 6000) : rand(900, 4500));
        if (a.walking && Math.random() < 0.45) a.dir *= -1;
      }
      if (a.walking) {
        a.x += a.dir * a.speed * dt;
        if (a.x < 4) { a.x = 4; a.dir = 1; }
        if (a.x > 96) { a.x = 96; a.dir = -1; }
        if (now - a.phaseAt > STEP_MS) { a.phase = (a.phase + 1) % 4; a.phaseAt = now; }
      } else {
        a.phase = 0;
      }

      if (a.bubbleUntil && now > a.bubbleUntil) {
        a.bubbleUntil = 0;
        a.bubble.classList.remove('show');
        a.el.classList.remove('speaking');
        this.layoutBubbles();
      }
      if (now > a.blinkAt + 140) a.blinkAt = now + rand(2200, 6000);
      const blink = now > a.blinkAt;
      const talk = now < a.talkUntil && Math.floor(now / 170) % 2 === 0;

      const art = PixelChars.artOf(a.type);
      a.el.classList.toggle('has-art', !!art);
      a.el.classList.toggle('talking', now < a.talkUntil);
      if (art) {
        // sprite-gen 스트립: 오른쪽을 보는 그림이 기본, 칸을 시간에 맞춰 넘긴다. 말하는 동안에는 잠시 정면을 본다
        const facing = now < a.talkUntil && art.front;
        const name = facing ? 'front' : a.walking && art.walk ? 'walk' : art.idle ? 'idle' : 'walk';
        const s = art[name];
        const idx = a.walking || name === 'idle' ? Math.floor((now + a.seed) / s.delay_ms) % s.frames : 0;
        const strip = `art|${PixelChars.theme}|${a.type}|${name}|`;
        const key = `${strip}${idx}|${a.dir}`;
        if (key !== a.frameKey) {
          const st = a.artEl.style;
          if (!a.frameKey.startsWith(strip)) {
            st.backgroundImage = `url("${s.src}")`;
            st.backgroundSize = `${s.frames * 100}% 100%`;
            st.setProperty('--art-ratio', (s.h / s.body_h).toFixed(4));
            st.aspectRatio = `${s.w} / ${s.h}`;
          }
          a.frameKey = key;
          st.backgroundPosition = `${s.frames > 1 ? (idx / (s.frames - 1)) * 100 : 0}% 0`;
          st.transform = a.dir < 0 && !facing ? 'scaleX(-1)' : '';
        }
      } else if (`${a.type}|${a.phase}|${blink}|${talk}|${a.dir}` !== a.frameKey) {
        const key = `${a.type}|${a.phase}|${blink}|${talk}|${a.dir}`;
        a.frameKey = key;
        a.ctx.clearRect(0, 0, PixelChars.W, PixelChars.H);
        a.ctx.drawImage(PixelChars.frame(a.type, a.phase, { blink, talk }), 0, 0);
        a.canvas.style.transform = a.dir < 0 ? 'scaleX(-1)' : '';
      }
      a.el.style.left = `${a.x}%`;
      a.el.style.bottom = `calc(var(--u) * ${(GROUND * 100 * (0.08 + a.lane * 0.5)).toFixed(2)})`;
      a.el.classList.toggle('edge-l', a.x < 14);
      a.el.classList.toggle('edge-r', a.x > 86);
    }
  }

  window.PixelStage = { Stage, fitBoard };
})();
