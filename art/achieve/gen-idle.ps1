# 성장 단계별 대기(idle) 루프 (sprite-gen: Grok 영상 → 프레임 키잉 → video-loop --cycle pinned)
#   첫/끝 프레임을 같은 단계 그림으로 고정 → 숨쉬기·눈 깜빡임·옷자락 흔들림 정도의 작은 움직임만 넣는다
# 사용법: powershell -File art\achieve\gen-idle.ps1 boy-1 boy-2 ... girl-6
# 결과: art\achieve\idle\<이름>\clip.mp4, frames\keyed\*.png, loop\cycle\*.png
param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Names)
$env:PYTHONIOENCODING = 'utf-8'
$env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
$webp = Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Google.Libwebp*\*\bin\img2webp.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($webp) { $env:Path = "$($webp.DirectoryName);$env:Path" }
$sg = "$env:USERPROFILE\.claude\skills\sprite-gen\.venv\Scripts\sprite-gen.exe"
$stills = Join-Path $PSScriptRoot 'stills'
$root = Join-Path $PSScriptRoot 'idle'

# 단계마다 자세에 맞는 아주 작은 동작 하나
$touch = @{
  1 = 'sits holding the whale plush, gently squeezing it and rocking very slightly'
  2 = 'keeps the raised hand up and gives a tiny, slow wave'
  3 = 'keeps the arms slightly open, swaying them very gently'
  4 = 'keeps the hands on the hips, chest rising and falling with each breath'
  5 = 'keeps the arms crossed and gives one tiny confident nod'
  6 = 'keeps the extended hand relaxed while the long coat tails sway softly'
}

foreach ($name in $Names) {
  if ($name -notmatch '^(boy|girl)-([1-6])$') { Write-Host "알 수 없는 이름: $name"; continue }
  $stage = [int]$Matches[2]
  $prompt = "Very subtle seamless idle loop of a cute anime game character. The character holds the same pose the whole time and $($touch[$stage]); breathing softly, blinking naturally once or twice, hair and clothes moving only a little. No walking, no turning, no jumping, no big gestures, no effects or sparkles. Keep the exact art style, colors and character identity. Fixed camera with no zoom or pan; the character stays in exactly the same place. The background stays a plain flat solid green the whole time. No text."
  $dir = Join-Path $root $name
  New-Item -ItemType Directory -Force $dir | Out-Null
  if (-not (Test-Path "$dir\clip.mp4")) {
    & $sg video --image "$stills\$name.png" --last-frame "$stills\$name.png" --prompt $prompt --duration 4 --resolution 720p `
      --out "$dir\clip.mp4" --report "$dir\clip.report.json" *> "$dir\clip.log"
  }
  & $sg video-frames --clip "$dir\clip.mp4" --out-dir "$dir\frames" --key green --allow-subject-edge-contact --decontam auto --report "$dir\frames.report.json" *> "$dir\frames.log"
  & $sg video-loop --frames-dir "$dir\frames\keyed" --out-dir "$dir\loop" --state idle --cycle pinned --name $name --report "$dir\loop.report.json" *> "$dir\loop.log"
  "$name video=$((Test-Path "$dir\clip.mp4")) loop exit=$LASTEXITCODE"
}
