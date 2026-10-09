# sprite-gen(Grok 영상)으로 캐릭터 걷기·대기 루프 생성
# 사용법: powershell -File art\gen-videos.ps1 <teacher|student> 0 1 2
# 입력: art\<theme>\bases\<id>.png   결과: art\<theme>\video\<id>\side-<state>\loop\*.strip.png
param(
  [Parameter(Mandatory = $true, Position = 0)][ValidateSet('teacher', 'student')][string]$Theme,
  [Parameter(ValueFromRemainingArguments = $true)][int[]]$Ids
)
$env:PYTHONIOENCODING = 'utf-8'
# winget으로 새로 깔린 ffmpeg·img2webp가 보이도록 PATH를 다시 읽고 libwebp 경로를 앞에 둔다
$env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
$webp = Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Google.Libwebp*\*\bin\img2webp.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($webp) { $env:Path = "$($webp.DirectoryName);$env:Path" }

$sg = "$env:USERPROFILE\.claude\skills\sprite-gen\.venv\Scripts\sprite-gen.exe"
$bases = Join-Path $PSScriptRoot "$Theme\bases"
$out = Join-Path $PSScriptRoot "$Theme\video"

$who = @{
  teacher = @{
    0 = 'The stylish PE teacher in a black track jacket'
    1 = 'The stylish science teacher in a white lab coat'
    2 = 'The stylish art teacher in a camel overcoat'
    3 = 'The distinguished principal in a navy suit'
    4 = 'The refined literature teacher in a modern charcoal hanbok'
    5 = 'The elegant music teacher in an emerald dress'
    6 = 'The chic homeroom teacher in a beige trench coat'
    7 = 'The trendy AI teacher in a black blazer'
    8 = 'The outdoorsy geography teacher in an olive utility jacket'
    9 = 'The polished head teacher in a camel blazer'
  }
  student = @{
    0 = 'The middle school boy in a navy uniform blazer with a backpack'
    1 = 'The sporty middle school boy in a green PE tracksuit'
    2 = 'The middle school boy in an oversized gray hoodie'
    3 = 'The studious middle school boy in a white summer uniform shirt'
    4 = 'The middle school boy in a long black puffer coat'
    5 = 'The middle school girl in a navy uniform blazer and plaid skirt'
    6 = 'The sporty middle school girl with a ponytail in a green PE tracksuit'
    7 = 'The bookish middle school girl in a cream cardigan with a pink backpack'
    8 = 'The cheerful middle school girl with braided pigtails in a summer uniform'
    9 = 'The trendy middle school girl in an oversized navy windbreaker'
  }
}

foreach ($id in $Ids) {
  $dir = "$out\$id"
  New-Item -ItemType Directory -Force $dir | Out-Null
  & $sg video-set --base "side=$bases\$id.png" --facing right --states idle,walk `
    --character $who[$Theme][$id] --body-height 200 --out-dir $dir *> "$dir\run.log"
  "$Theme $id exit=$LASTEXITCODE"
}
