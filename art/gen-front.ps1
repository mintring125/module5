# 말할 때 쓰는 정면 그림: 옆모습 기본 그림을 참고로 같은 캐릭터를 정면으로 다시 그린다 (투명 배경)
# 사용법: powershell -File art\gen-front.ps1 <teacher|student> 0 1 2
# 결과: art\<theme>\front\<id>.png
param(
  [Parameter(Mandatory = $true, Position = 0)][ValidateSet('teacher', 'student')][string]$Theme,
  [Parameter(ValueFromRemainingArguments = $true)][int[]]$Ids
)
$env:PYTHONIOENCODING = 'utf-8'
$sg = "$env:USERPROFILE\.claude\skills\sprite-gen\.venv\Scripts\sprite-gen.exe"
$bases = Join-Path $PSScriptRoot "$Theme\bases"
$out = Join-Path $PSScriptRoot "$Theme\front"
New-Item -ItemType Directory -Force $out | Out-Null

$prompt = 'The exact same character as the reference image, same outfit, hairstyle, colors, proportions and pixel art style, now turned to face the viewer in a front view, standing upright with a warm friendly smile and mouth slightly open as if talking, arms relaxed at the sides with empty hands, whole body including feet visible, crisp hard-edged pixels with a clean dark 1-pixel outline, no anti-aliasing, no ground, no shadow, no text.'

foreach ($id in $Ids) {
  & $sg gen --provider codex --ref "$bases\$id.png" --prompt $prompt --direction front --transparent --trim-alpha `
    --out "$out\$id.png" --report "$out\$id.report.json" *> "$out\$id.log"
  "$Theme front $id exit=$LASTEXITCODE"
}
