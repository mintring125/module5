# AIEDAP 픽셀 강의실 (모듈5)

강사가 넘기는 슬라이드가 학생 화면에 실시간으로 따라가고, 학생이 질문을 입력하면
슬라이드 아래를 걸어다니는 **내 픽셀 캐릭터가 말풍선으로** 말합니다.

| 화면 | 주소 | 용도 |
|---|---|---|
| 학생 | `/` | 이름·성별·캐릭터(10종) 선택 후 입장, 질문 입력 |
| 강사 | `/teacher` | 강사 키로 로그인, 슬라이드 넘김(전체 동기화), 질문 목록, 접속 QR |

## 강사 화면 단축키

| 키 | 동작 |
|---|---|
| `→` `Space` `PageDown` (포인터/리모컨) | 다음 슬라이드 |
| `←` `PageUp` | 이전 슬라이드 |
| 숫자 + `Enter` | 해당 번호로 이동 (예: `1` `2` `Enter`) |
| `Home` / `End` | 처음 / 마지막 |
| `F` | 전체화면 |
| `Q` | 학생 질문 목록 (이름·슬라이드 번호·시각) |
| `J` | 학생 접속 안내 QR 코드 |
| `T` | 캐릭터 버전 바꾸기 (픽셀 → 세련된 선생님 → 중학생) |

마우스를 움직이면 아래쪽에 조작 바가 나타나고, 2.5초 뒤 자동으로 숨겨집니다.

## 캐릭터 버전

강사 화면 조작 바의 **픽셀 / 선생님 / 중학생** 버튼(또는 `T`)으로 모든 화면의 캐릭터를 한 번에 바꿉니다.
강의 도중에 바꾸면 참여자 모두의 캐릭터를 **성별에 맞게 새로 뽑아**(덜 쓰인 캐릭터부터 고루) 배정하고,
학생 화면에는 "나는 ○○○" 알림이 뜹니다.

| 버전 | 캐릭터 | 만든 방법 |
|---|---|---|
| 픽셀 | 코드로 찍은 도트 캐릭터 10종 | `public/js/sprites.js` |
| 세련된 선생님 (기본) | 체육·과학·미술·교장·국어(한복) / 음악·담임·AI·지리·학년부장 | sprite-gen (GPT 기본 그림 + Grok 걷기·대기 영상) |
| 중학생 | 교복·체육복·후드티·하복·롱패딩 / 교복·체육복·가디건·하복·바람막이 | sprite-gen |

그림 캐릭터는 말하는 동안 잠시 정면을 봅니다. 강의실을 처음 열 때의 버전은 빌드 환경변수 `THEME` (`pixel`·`teacher`·`student`, 기본 `teacher`)로 정합니다.

## 구성

- **Vercel**: 화면(`public/`)과 토큰 함수(`api/token.js`)
- **Ably**: 실시간 동기화. 슬라이드·캐릭터 버전(강사만 보냄), 참여자 목록, 질문 말풍선
- 강사 키는 토큰 함수에서 확인하므로, 키가 없으면 슬라이드·버전을 바꿀 수 없습니다.

## 배포 주소

- 학생: https://aiedap-pixel-lecture.vercel.app
- 강사: https://aiedap-pixel-lecture.vercel.app/teacher

## 처음 한 번: 키 설정

1. https://ably.com 가입(무료: 동시 접속 200명, 월 600만 메시지) → 앱 만들기 → **API Keys**의 Root 키 복사
2. 이 폴더에서 Vercel 환경변수 등록 (값은 직접 붙여 넣기):

   ```bash
   vercel env add ABLY_API_KEY production
   vercel env add TEACHER_KEY production
   ```

3. 다시 배포: `vercel deploy --prod`

## 다시 배포하기

```bash
vercel deploy --prod
```

`art/`(sprite-gen 작업 폴더)와 `.env`는 업로드되지 않습니다(`.vercelignore`).

## 내 컴퓨터에서 실행

`.env.example`을 `.env`로 복사해 `ABLY_API_KEY`(와 `TEACHER_KEY`)를 채운 뒤:

```bash
npm install
npm run dev
```

- 학생: http://localhost:3000 / 강사: http://localhost:3000/teacher (TEACHER_KEY가 없으면 로컬에서만 `aiedap2026`)
- 로컬과 배포 사이트가 같은 Ably 앱을 쓰면 서로 동기화됩니다. 따로 쓰려면 `.env`에 `ROOM=test`처럼 방 이름을 다르게 주세요.
## 슬라이드 바꾸기

PPT를 수정했다면 (PowerPoint 설치된 Windows에서):

```powershell
powershell -ExecutionPolicy Bypass -File tools\export-slides.ps1 "C:\경로\강의.pptx"
```

`public/slides/1.png ~ N.png` 가 새로 만들어지고, 서버를 다시 시작하면 장수가 자동 반영됩니다.
PPT 애니메이션·동영상은 이미지로 변환되므로 재생되지 않습니다.

## 구조

```
api/token.js           Vercel 함수: Ably 토큰 발급(학생/강사 권한 분리, 강사 키 확인)
server.js              로컬 실행용 서버 (정적 파일 + /api/token)
tools/build-static.js  배포 준비: 브라우저 라이브러리·글꼴 복사, config.json 생성
public/js/realtime.js  Ably 연결 (상태·참여자·질문)
public/index.html      학생 화면
public/teacher.html    강사 화면
public/js/sprites.js   캐릭터 버전 관리 + 픽셀 캐릭터 10종 (코드로 도트 생성)
public/chars/<버전>/   sprite-gen 그림 (걷기·대기 스트립, 정면 그림, manifest.json)
public/js/stage.js     무대: 걷기 AI, 말풍선, 말풍선 겹침 방지
public/slides/         PPT에서 내보낸 슬라이드 이미지
art/                   sprite-gen 작업 폴더 (기본 그림·정면 그림, 영상은 git 제외)
```

## 캐릭터 그림 다시 만들기 (sprite-gen)

[sprite-gen](https://github.com/aldegad/sprite-gen) 스킬(`~/.claude/skills/sprite-gen`), Codex 로그인(GPT 이미지), `grok login`(Grok 영상), ffmpeg·libwebp가 필요합니다.

```powershell
powershell -File art\gen-bases.ps1  student 0 1 2   # 옆모습 기본 그림 (GPT)
powershell -File art\gen-videos.ps1 student 0 1 2   # 걷기·대기 루프 (Grok 영상)
powershell -File art\gen-front.ps1  student 0 1 2   # 말할 때 정면 그림 (GPT)
node tools\build-chars.js student                   # public\chars\student 로 WebP 변환·manifest 생성
```

캐릭터 설명은 각 스크립트 안의 표에서 바꿉니다. 0-4는 남자, 5-9는 여자 자리입니다.

- 질문은 80자, 1초에 1번으로 제한됩니다. 강사 화면의 질문 목록은 그 브라우저에 저장되며 `지우기`로 비웁니다.
- 새로고침해도 같은 캐릭터로 다시 들어옵니다(브라우저에 저장). `캐릭터 바꾸기`로 변경 가능.
- 픽셀 글꼴: [Galmuri](https://github.com/quiple/galmuri) (SIL OFL 1.1)
