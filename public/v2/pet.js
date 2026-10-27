// 슬라이드 바깥에서 한 마리만 유지되는 강의 동반자.
(function () {
  function mount({ gender = 'boy', still = false } = {}) {
    const root = document.createElement('aside');
    root.className = `lecture-pet t-${gender}`;
    root.setAttribute('aria-label', '성장 여정 펫');
    root.innerHTML = `<div class="pet-bubble" role="status" aria-live="polite"></div>
      <span class="pet-spark" aria-hidden="true">✦</span>
      <button class="pet-body" type="button" aria-label="펫 쓰다듬기">
        <img class="pet-image" alt="" draggable="false"><canvas class="pet-growth" hidden aria-hidden="true"></canvas>
      </button><div class="pet-caption"><span class="pet-dot"></span><span class="pet-status"></span>
        <button class="pet-replay" type="button" aria-label="성장 모션 다시 보기" title="현재 레벨의 성장 모션 다시 보기">↻</button></div>`;
    document.body.appendChild(root);
    const button = root.querySelector('button');
    const img = root.querySelector('img');
    const canvas = root.querySelector('canvas');
    const bubble = root.querySelector('.pet-bubble');
    const status = root.querySelector('.pet-status');
    const replayButton = root.querySelector('.pet-replay');
    const spark = root.querySelector('.pet-spark');
    const icons = { wave: '👋', explain: '💡', think: '❓', write: '✏️', tablet: '📱', cheer: '🎉', sleepy: '💤' };
    const counts = new Map();
    let slide = null;
    let idleTimer, bubbleTimer, reactionTimer, stopGrowth;
    let level = 1;
    const levelImage = () => `/achieve/pet/${gender}-${level}.webp`;
    const labels = { wave: '반가워요', explain: '함께 배우는 중', think: '생각하는 중', write: '계획하는 중', tablet: '살펴보는 중', cheer: '응원하는 중', sleepy: '잠깐 쉬는 중' };

    function stopAnimation() {
      stopGrowth?.();
      stopGrowth = null;
      root.classList.remove('growing');
      replayButton.disabled = still;
      canvas.hidden = true;
      img.hidden = false;
    }

    function react(state, message) {
      const growing = root.classList.contains('growing');
      clearTimeout(bubbleTimer);
      root.dataset.state = state;
      spark.textContent = icons[state] || '';
      // 반응 자세 때문에 레벨별 외모가 바뀌지 않도록 현재 단계 그림을 유지한다.
      if (!growing) img.src = levelImage();
      root.dataset.level = level;
      button.setAttribute('aria-label', `Lv.${level} ${Deck.LEVELS[level - 1].name} 펫 쓰다듬기`);
      if (!growing) status.textContent = `Lv.${level} ${Deck.LEVELS[level - 1].name} · ${labels[state]}`;
      status.title = status.textContent;
      bubble.textContent = message;
      root.classList.add('speaking');
      bubbleTimer = setTimeout(() => root.classList.remove('speaking'), 5000);
    }

    function context() {
      if (!slide) return;
      if (slide.kind === 'divider') {
        const to = Deck.SECTIONS[slide.sec - 1].grow[1];
        return react('cheer', `STEP ${slide.sec} 시작! ${Deck.LEVELS[to - 1].name}로 한 단계 자랐어요.`);
      }
      if (slide.pet) return react(slide.pet[0], slide.pet[1]);
      if (slide.kind === 'title') return react('wave', '반가워요! 오늘의 성장 여정을 함께해요.');
      if (slide.kind === 'end') return react('cheer', '오늘도 한 걸음 성장했어요. 수고하셨습니다!');
      if (slide.kind === 'divider') return react('cheer', `STEP ${slide.sec}, 함께 다음 단계로 가요!`);
      if (slide.widget === 'wall') return react('write', '작게 시작해도 좋아요. 실천할 계획을 적어 볼까요?');
      if (slide.widget === 'level') return react('think', slide.field === 'tgt' ? '다음에 도전할 목표 레벨을 생각해 봐요.' : '지금의 나와 가장 가까운 레벨은 무엇일까요?');
      if (slide.widget) return react('think', '여러분의 생각을 들려주세요. 함께 답을 찾아봐요.');
      if (slide.kind === 'bigq' || slide.kind === 'quote') return react('think', '잠깐 생각해 볼까요? 수업 속 경험을 떠올려 봐요.');
      if (slide.kind === 'shot' || slide.kind === 'platform' || slide.kind === 'post') return react('tablet', '화면을 살펴보며 나에게 필요한 것을 찾아봐요.');
      react('explain', '한 걸음씩, 함께 배우고 성장해요.');
    }

    function wake() {
      clearTimeout(idleTimer);
      if (root.dataset.state === 'sleepy') context();
      if (!still) idleTimer = setTimeout(() => react('sleepy', '천천히 살펴보세요. 여기서 기다릴게요.'), 45000);
    }

    function setSlide(next) {
      if (!next || next.id === slide?.id) return;
      clearTimeout(reactionTimer);
      const previousLevel = slide ? level : null;
      stopAnimation();
      slide = next;
      level = next.kind === 'end' ? 6 : next.sec ? Deck.SECTIONS[next.sec - 1].grow[1] : 1;
      root.dataset.slide = next.id;
      context();
      wake();
      const sectionFrom = next.kind === 'divider' ? Deck.SECTIONS[next.sec - 1].grow[0] : next.kind === 'end' ? 5 : null;
      const from = sectionFrom === null ? previousLevel ?? level : Math.min(previousLevel ?? sectionFrom, sectionFrom);
      const entering = previousLevel === null && next.kind === 'title';
      if (level > from || entering) playMotion(from);
    }

    function playMotion(from = Math.max(1, level - 1)) {
      // 1회 성장 전환은 재생하고, 동작 줄이기는 CSS의 반복 장식에만 적용한다.
      if (!slide || still) return;
      clearTimeout(reactionTimer);
      stopAnimation();
      replayButton.disabled = true;
      // 생략한 레벨도 순서대로 재생하고 실제 재생 완료 뒤 그 단계 모습을 유지한다.
      img.src = `/achieve/pet/${gender}-${from}.webp`;
      root.classList.add('growing');
      status.textContent = from === level ? '성장 여정 시작 · Lv.1' : `성장하는 중 · Lv.${from} → Lv.${level}`;
      status.title = status.textContent;
      stopGrowth = Deck.playGrowth(canvas, gender, from, level, {
        onReady: () => { canvas.hidden = false; img.hidden = true; },
        onComplete: () => { stopGrowth = null; stopAnimation(); context(); },
      });
    }

    function onResponses(event) {
      const { slideId, count } = event.detail;
      const previous = counts.get(slideId);
      counts.set(slideId, count);
      if (previous === undefined || slide?.id !== slideId || count <= previous) return;
      clearTimeout(reactionTimer);
      react('cheer', `${count}명이 생각을 나눴어요! 함께하니 더 든든해요.`);
      wake();
      reactionTimer = setTimeout(context, 4500);
    }
    function pat() {
      clearTimeout(reactionTimer);
      react('cheer', '고마워요! 여러분의 성장을 응원할게요 ♥');
      wake();
      reactionTimer = setTimeout(context, 4500);
    }
    img.addEventListener('error', () => {
      const fallback = Deck.charImg(gender, level);
      if (img.getAttribute('src') !== fallback) img.src = fallback;
    });
    button.addEventListener('click', pat);
    replayButton.addEventListener('click', () => { playMotion(); wake(); });
    document.addEventListener('v2:responses', onResponses);
    document.addEventListener('pointerdown', wake, { passive: true });
    document.addEventListener('pointermove', wake, { passive: true });
    document.addEventListener('keydown', wake);
    document.addEventListener('scroll', wake, { passive: true });
    if (still) { root.classList.add('still'); replayButton.disabled = true; }
    // 슬라이드를 담은 상자 안으로 옮겨, 슬라이드(1920x1080 좌표)의 오른쪽 아래에 붙인다
    const PET = { w: 230, h: 305, right: 26, bottom: 46 };
    function anchor(host) {
      host.appendChild(root);
      root.classList.add('anchored');
    }
    function place({ left, top, scale }) {
      root.style.setProperty('--s', scale);
      root.style.left = `${left + (1920 - PET.w - PET.right) * scale}px`;
      root.style.top = `${top + (1080 - PET.h - PET.bottom) * scale}px`;
    }
    return { setSlide, anchor, place, destroy() {
      stopAnimation();
      [idleTimer, bubbleTimer, reactionTimer].forEach(clearTimeout);
      document.removeEventListener('v2:responses', onResponses);
      document.removeEventListener('pointerdown', wake);
      document.removeEventListener('pointermove', wake);
      document.removeEventListener('keydown', wake);
      document.removeEventListener('scroll', wake);
      root.remove();
    } };
  }
  window.LecturePet = { mount };
})();
