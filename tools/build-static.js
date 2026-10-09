// 정적 배포(Vercel)용 준비: node_modules의 브라우저 파일·글꼴을 public/ 아래로 복사하고
// public/config.json(슬라이드 장수, 채널 이름, 기본 캐릭터 버전)을 만든다.
// Vercel 빌드 명령과 로컬 `npm run dev` 가 이 스크립트를 먼저 실행한다.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const pub = path.join(root, 'public');
const copy = (from, to) => {
  fs.mkdirSync(path.dirname(path.join(pub, to)), { recursive: true });
  fs.copyFileSync(path.join(root, from), path.join(pub, to));
};

copy('node_modules/ably/build/ably.min.js', 'vendor/ably.min.js');
copy('node_modules/qrcode-generator/qrcode.js', 'vendor/qrcode.js');
copy('node_modules/galmuri/dist/Galmuri11.woff2', 'fonts/Galmuri11.woff2');
copy('node_modules/galmuri/dist/Galmuri11-Bold.woff2', 'fonts/Galmuri11-Bold.woff2');

const THEMES = ['pixel', 'teacher', 'student'];
const config = {
  totalSlides: fs.readdirSync(path.join(pub, 'slides')).filter((f) => /^\d+\.png$/i.test(f)).length,
  room: process.env.ROOM || 'aiedap-m5',
  theme: THEMES.includes(process.env.THEME) ? process.env.THEME : 'teacher',
};
fs.writeFileSync(path.join(pub, 'config.json'), JSON.stringify(config, null, 2));
console.log('정적 파일 준비 완료:', config);
