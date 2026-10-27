# v2 슬라이드를 1920x1080으로 찍어 디자인 점검용 묶음 이미지를 만든다 (headless Edge)
# 사용법: powershell -File tools\capture-v2.ps1 boy [시작번호] [끝번호]
# 결과: C:\Users\Public\v2shots\<성별>-<번호>.png, art\v2\review\<성별>-<묶음>.png
param([string]$Gender = 'boy', [int]$From = 0, [int]$To = 32)
$edge = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
$out = 'C:\Users\Public\v2shots'   # Edge가 한글 경로에 저장하지 못하는 경우가 있어 영문 경로를 쓴다
$ud = "$out\profile-$Gender"
New-Item -ItemType Directory -Force $out | Out-Null
for ($i = $From; $i -le $To; $i++) {
  $png = "$out\$Gender-$i.png"
  $args = @('--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', "--user-data-dir=$ud", '--window-size=1920,1080',
    '--virtual-time-budget=6000', "--screenshot=$png", "http://localhost:3000/v2/gallery?g=$Gender&still=1&i=$i")
  Start-Process -FilePath $edge -ArgumentList $args -Wait -WindowStyle Hidden
}
& "$env:USERPROFILE\.claude\skills\sprite-gen\.venv\Scripts\python.exe" -c @"
from pathlib import Path
from PIL import Image, ImageDraw
src = Path(r'$out'); dst = Path(r'$PSScriptRoot').parent / 'art' / 'v2' / 'review'; dst.mkdir(parents=True, exist_ok=True)
ids = [i for i in range($From, $To + 1) if (src / f'$Gender-{i}.png').exists()]
for k in range(0, len(ids), 6):
    group = ids[k:k + 6]; w, h = 800, 450
    sheet = Image.new('RGB', (w * 2, h * 3), (20, 26, 46)); d = ImageDraw.Draw(sheet)
    for j, i in enumerate(group):
        im = Image.open(src / f'$Gender-{i}.png').convert('RGB').resize((w - 6, h - 6))
        sheet.paste(im, ((j % 2) * w + 3, (j // 2) * h + 3)); d.rectangle([(j % 2) * w + 3, (j // 2) * h + 3, (j % 2) * w + 40, (j // 2) * h + 24], fill='black'); d.text(((j % 2) * w + 8, (j // 2) * h + 6), str(i), fill='yellow')
    sheet.save(dst / f'$Gender-{group[0]:02d}.png')
print('sheets:', sorted(p.name for p in dst.glob('$Gender-*.png')))
"@
