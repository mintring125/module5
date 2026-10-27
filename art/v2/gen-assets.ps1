# 라이브 프레젠테이션 v2 에셋 생성 (sprite-gen gen, GPT/codex)
# 사용법: powershell -File art\v2\gen-assets.ps1 pose:boy:wave pose:girl:think bg:bg-title icons
# 결과: art\v2\raw\<이름>.png  (pose-*·icons 는 투명 배경)
param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Items)
$env:PYTHONIOENCODING = 'utf-8'
$sg = "$env:USERPROFILE\.claude\skills\sprite-gen\.venv\Scripts\sprite-gen.exe"
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$raw = Join-Path $PSScriptRoot 'raw'
New-Item -ItemType Directory -Force $raw | Out-Null
$spec = Get-Content (Join-Path $PSScriptRoot 'assets.json') -Raw -Encoding UTF8 | ConvertFrom-Json

foreach ($item in $Items) {
  $parts = $item -split ':'
  switch ($parts[0]) {
    'pose' {
      $sex = $parts[1]; $pose = $parts[2]
      $out = "$raw\pose-$sex-$pose.png"
      $ref = Join-Path $root $spec.pose_ref.$sex
      $prompt = "$($spec.pose_base) $($spec.poses.$pose)"
      & $sg gen --provider codex --ref $ref --prompt $prompt --transparent --trim-alpha --decontam auto --out $out --report "$out.json" *> "$out.log"
    }
    'bg' {
      $name = $parts[1]
      $out = "$raw\$name.png"
      & $sg gen --provider codex --prompt $spec.backgrounds.$name --out $out --report "$out.json" *> "$out.log"
    }
    'bg2' {
      # 여학생 템플릿용 부드러운 파스텔 배경
      $name = $parts[1]
      $out = "$raw\girl-$name.png"
      & $sg gen --provider codex --prompt $spec.backgrounds_girl.$name --out $out --report "$out.json" *> "$out.log"
    }
    'icons' {
      $out = "$raw\icons.png"
      & $sg gen --provider codex --prompt $spec.icon_sheet.prompt --transparent --out $out --report "$out.json" *> "$out.log"
    }
    default { Write-Host "알 수 없는 항목: $item"; continue }
  }
  "$item exit=$LASTEXITCODE"
}
