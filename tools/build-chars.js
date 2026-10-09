// sprite-gen 결과를 웹용으로 옮기고 public/chars/<theme>/manifest.json 을 만든다.
//   걷기·대기: art/<theme>/video/<id>/side-<state>/loop/*.strip.png (+ .strip.json)
//   정면(말할 때): art/<theme>/front/<id>.png (투명 배경, 발끝까지 잘린 그림)
// libwebp의 cwebp가 있으면 WebP로 줄여 담는다(PNG의 약 1/3).
// 사용법: node tools/build-chars.js [teacher student]
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const themes = process.argv.slice(2).length ? process.argv.slice(2) : ['teacher', 'student'];
const FRONT_HEIGHT = 220; // 정면 그림 높이(px). 걷기 스트립의 서 있는 키(200)와 비슷하게

function findCwebp() {
  try {
    execFileSync('cwebp', ['-version'], { stdio: 'ignore' });
    return 'cwebp';
  } catch {
    const pkgs = path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Packages');
    if (!fs.existsSync(pkgs)) return null;
    for (const d of fs.readdirSync(pkgs).filter((n) => n.startsWith('Google.Libwebp'))) {
      for (const sub of fs.readdirSync(path.join(pkgs, d))) {
        const exe = path.join(pkgs, d, sub, 'bin', 'cwebp.exe');
        if (fs.existsSync(exe)) return exe;
      }
    }
    return null;
  }
}
const cwebp = findCwebp();

const pngSize = (file) => {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
};

// src(PNG)를 outBase.webp(가능하면) 또는 outBase.png 로 저장하고 파일 이름을 돌려준다
function publish(src, outDir, base, resizeH) {
  if (cwebp) {
    // cwebp는 한글 경로를 못 읽는 경우가 있어 영문 임시 폴더를 거친다
    const tmpIn = path.join(os.tmpdir(), `chars-${process.pid}.png`);
    const tmpOut = path.join(os.tmpdir(), `chars-${process.pid}.webp`);
    fs.copyFileSync(src, tmpIn);
    const args = ['-quiet', '-q', '88', '-alpha_q', '100', '-m', '6'];
    if (resizeH) args.push('-resize', '0', String(resizeH));
    execFileSync(cwebp, [...args, tmpIn, '-o', tmpOut]);
    fs.copyFileSync(tmpOut, path.join(outDir, `${base}.webp`));
    fs.rmSync(tmpIn);
    fs.rmSync(tmpOut);
    return `${base}.webp`;
  }
  fs.copyFileSync(src, path.join(outDir, `${base}.png`));
  return `${base}.png`;
}

for (const theme of themes) {
  const artDir = path.join(root, 'art', theme);
  const outDir = path.join(root, 'public', 'chars', theme);
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const manifest = {};
  const videoDir = path.join(artDir, 'video');
  for (const id of fs.existsSync(videoDir) ? fs.readdirSync(videoDir) : []) {
    if (!/^\d+$/.test(id)) continue;
    for (const state of ['idle', 'walk']) {
      const dir = path.join(videoDir, id, `side-${state}`, 'loop');
      if (!fs.existsSync(dir)) continue;
      const metaFile = fs.readdirSync(dir).find((f) => f.endsWith('.strip.json'));
      if (!metaFile) continue;
      const meta = JSON.parse(fs.readFileSync(path.join(dir, metaFile), 'utf8'));
      const file = publish(path.join(dir, metaFile.replace(/\.json$/, '.png')), outDir, `${id}-${state}`);
      manifest[id] ??= {};
      manifest[id][state] = {
        src: `/chars/${theme}/${file}`,
        frames: meta.frames,
        w: meta.w,
        h: meta.h,
        body_h: meta.body_h,
        delay_ms: meta.delay_ms,
      };
    }
  }

  const frontDir = path.join(artDir, 'front');
  for (const f of fs.existsSync(frontDir) ? fs.readdirSync(frontDir) : []) {
    const m = /^(\d+)\.png$/.exec(f);
    if (!m || !manifest[m[1]]) continue;
    const { w, h } = pngSize(path.join(frontDir, f));
    const file = publish(path.join(frontDir, f), outDir, `${m[1]}-front`, cwebp ? FRONT_HEIGHT : 0);
    const outH = cwebp ? FRONT_HEIGHT : h;
    const outW = cwebp ? Math.round((w * FRONT_HEIGHT) / h) : w;
    manifest[m[1]].front = { src: `/chars/${theme}/${file}`, frames: 1, w: outW, h: outH, body_h: outH, delay_ms: 1000 };
  }

  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  const mb = fs.readdirSync(outDir).reduce((s, f) => s + fs.statSync(path.join(outDir, f)).size, 0) / 1048576;
  console.log(`[${theme}] ${Object.keys(manifest).length}명, ${mb.toFixed(1)} MB${cwebp ? ' (WebP)' : ''}`);
  for (const [id, s] of Object.entries(manifest)) {
    console.log(' ', id, Object.entries(s).map(([k, v]) => `${k}: ${v.frames}f ${v.w}x${v.h}`).join(' | '));
  }
}
