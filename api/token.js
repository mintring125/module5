// Vercel 함수: Ably 접속 토큰 발급
//  - 학생: room 채널(질문·참여자 알림)에 보내기, control 채널(슬라이드/버전)은 듣기만
//  - 강사: x-teacher-key 가 맞을 때만 슬라이드/버전 채널에 보낼 수 있음
// 환경변수: ABLY_API_KEY(필수), TEACHER_KEY(배포 시 필수), ROOM(선택, 기본 aiedap-m5)
const Ably = require('ably');

const ROOM = process.env.ROOM || 'aiedap-m5';
const TOKEN_TTL_MS = 6 * 60 * 60 * 1000;

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ABLY_API_KEY 환경변수가 설정되지 않았습니다.' });

  const teacherKey = process.env.TEACHER_KEY || (process.env.VERCEL ? '' : 'aiedap2026');
  const control = `${ROOM}:control`; // 슬라이드·캐릭터 버전 (강사만 보냄)
  const room = `${ROOM}:room`; // 질문·참여자 알림(hello/who/bye)

  let clientId;
  let capability;
  if (req.query.role === 'teacher') {
    if (!teacherKey) return res.status(500).json({ error: 'TEACHER_KEY 환경변수가 설정되지 않았습니다.' });
    if (req.headers['x-teacher-key'] !== teacherKey) return res.status(403).json({ error: '강사 키가 올바르지 않습니다.' });
    clientId = 'teacher';
    capability = { [control]: ['publish', 'subscribe', 'history'], [room]: ['publish', 'subscribe', 'history'] };
  } else {
    clientId = String(req.query.uid || '');
    if (!/^[a-z0-9]{6,40}$/i.test(clientId) || clientId === 'teacher') return res.status(400).json({ error: 'uid가 올바르지 않습니다.' });
    capability = { [control]: ['subscribe', 'history'], [room]: ['publish', 'subscribe', 'history'] };
  }

  try {
    const tokenRequest = await new Ably.Rest({ key: apiKey }).auth.createTokenRequest({
      clientId,
      capability: JSON.stringify(capability),
      ttl: TOKEN_TTL_MS,
    });
    res.status(200).json(tokenRequest);
  } catch (err) {
    res.status(500).json({ error: `토큰 발급 실패: ${err.message}` });
  }
};
