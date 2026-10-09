// 로컬 실행용 서버 (배포는 Vercel: public/ 정적 파일 + api/token.js 함수)
// 실시간 동기화는 Ably가 맡고, 이 서버는 정적 파일과 /api/token 만 제공한다.
// .env / .env.local 파일(ABLY_API_KEY=..., TEACHER_KEY=...)이 있으면 읽는다.
const fs = require('fs');
const path = require('path');
const express = require('express');

for (const name of ['.env.local', '.env']) {
  const envFile = path.join(__dirname, name);
  if (!fs.existsSync(envFile)) continue;
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

require('./tools/build-static'); // vendor·글꼴 복사, config.json 생성

const PORT = process.env.PORT || 3000;
const app = express();
app.get('/api/token', require('./api/token'));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

app.listen(PORT, () => {
  console.log(`픽셀 강의실 실행 중: http://localhost:${PORT}   강사 화면: http://localhost:${PORT}/teacher`);
  if (!process.env.ABLY_API_KEY) console.log('※ ABLY_API_KEY가 없습니다. .env 파일에 넣어야 실시간 동기화가 됩니다.');
  if (!process.env.TEACHER_KEY) console.log('※ TEACHER_KEY가 없어 로컬 기본값(aiedap2026)을 씁니다.');
});
