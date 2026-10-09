# 성장 단계 획득 영상 (sprite-gen video = Grok Imagine, 첫/끝 프레임 고정)
#   <성별>-1     : 1단계 획득 — 아기가 앉은 채 빙글 돌고 기뻐한 뒤 처음 자세로 (첫 = 끝 = 1단계)
#   <성별>-N to M : N단계 → M단계 변신 — 빙글 돌며 자라나 다음 단계로 바뀐 뒤 그 단계의 기쁨 동작, 끝 프레임 = 다음 단계
# 사용법: powershell -File art\achieve\gen-clips.ps1 boy-1 boy-1to2 girl-3to4 ...
# 결과: art\achieve\clips\<이름>\clip.mp4, frames\keyed\*.png
# 반투명 물보라 효과가 초록 배경과 섞이므로 --spill full --decontam palette 로 초록 기운을 캐릭터 색으로 되돌린다
param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Names)
$env:PYTHONIOENCODING = 'utf-8'
$env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
$sg = "$env:USERPROFILE\.claude\skills\sprite-gen\.venv\Scripts\sprite-gen.exe"
$stills = Join-Path $PSScriptRoot 'stills'
$clips = Join-Path $PSScriptRoot 'clips'

$celebrate = @{
  2 = 'wave hello cheerfully with one hand and do a small happy hop'
  3 = 'jump up with both arms raised high in joy, then land softly'
  4 = 'pump a fist in the air with a proud, excited grin'
  5 = 'give a confident thumbs-up and a playful wink'
  6 = 'raise the tablet high triumphantly while the long coat sways'
}
$common = 'Keep the exact art style, colors and character identity of the frames. Fixed camera with no zoom or pan; the character stays centered with feet on the same floor line and fully inside the frame at all times. The background stays a plain flat solid green the whole time. No text, no extra characters, no ground shadow.'

foreach ($name in $Names) {
  if ($name -match '^(boy|girl)-1$') {
    $sex = $Matches[1]; $from = 1; $to = 1
    $prompt = "Cute anime game character reward animation. The baby sitting on the floor and hugging a whale plush happily spins around once in place while staying seated, a few light-blue water sparkles twinkle, then giggles, lifts the whale plush up high in joy, hugs it tightly and settles back exactly into the starting pose. $common"
  } elseif ($name -match '^(boy|girl)-(\d)to(\d)$') {
    $sex = $Matches[1]; $from = [int]$Matches[2]; $to = [int]$Matches[3]
    $prompt = "Cute anime game character level-up evolution animation. The character from the first frame spins around in place in one full 360-degree turn; during the spin a quick swirl of light-blue water sparkles wraps around them and they grow up and transform into the older, more advanced version shown in the final frame, with its new outfit and hairstyle. Right after the transformation they $($celebrate[$to]), then settle exactly into the final frame's pose. $common"
  } else {
    Write-Host "알 수 없는 이름: $name"; continue
  }
  $dir = Join-Path $clips $name
  New-Item -ItemType Directory -Force $dir | Out-Null
  if (-not (Test-Path "$dir\clip.mp4")) {
    & $sg video --image "$stills\$sex-$from.png" --last-frame "$stills\$sex-$to.png" --prompt $prompt --duration 6 --resolution 720p `
      --out "$dir\clip.mp4" --report "$dir\clip.report.json" *> "$dir\clip.log"
  }
  & $sg video-frames --clip "$dir\clip.mp4" --out-dir "$dir\frames" --key green --allow-subject-edge-contact --spill full --decontam palette --report "$dir\frames.report.json" *> "$dir\frames.log"
  "$name video=$((Test-Path "$dir\clip.mp4")) frames exit=$LASTEXITCODE"
}
