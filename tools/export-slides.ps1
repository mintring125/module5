# PPT 파일을 슬라이드 PNG로 다시 내보내기 (PowerPoint 설치 필요)
# 사용법: powershell -ExecutionPolicy Bypass -File tools\export-slides.ps1 "C:\경로\강의.pptx"
param([Parameter(Mandatory = $true)][string]$Pptx)

$ErrorActionPreference = 'Stop'
$dest = Join-Path $PSScriptRoot '..\public\slides' | Resolve-Path
# PowerPoint는 한글 경로로 내보낼 때 실패하는 경우가 있어 영문 임시 폴더를 거친다
$work = 'C:\Users\Public\pixel-lecture-export'
Remove-Item -Recurse -Force $work -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force $work | Out-Null
Copy-Item -LiteralPath $Pptx -Destination "$work\deck.pptx"

$app = New-Object -ComObject PowerPoint.Application
try {
  $pres = $app.Presentations.Open("$work\deck.pptx", $true, $false, $false)
  $i = 0
  foreach ($s in $pres.Slides) { $i++; $s.Export("$work\$i.png", 'PNG', 1920, 1080) }
  $pres.Close()
} finally {
  $app.Quit()
}

Remove-Item "$dest\*.png"
Copy-Item "$work\*.png" $dest
Remove-Item -Recurse -Force $work
Write-Host "슬라이드 $i 장을 public\slides 로 내보냈습니다. 서버를 다시 시작하세요."

