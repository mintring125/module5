# sprite-gen(GPT/codex)으로 캐릭터 기본 그림 생성
# 사용법: powershell -File art\gen-bases.ps1 <teacher|student> 0 1 2
# 결과: art\<theme>\bases\<id>.png   (0-4 남자, 5-9 여자)
param(
  [Parameter(Mandatory = $true, Position = 0)][ValidateSet('teacher', 'student')][string]$Theme,
  [Parameter(ValueFromRemainingArguments = $true)][int[]]$Ids
)
$env:PYTHONIOENCODING = 'utf-8'
$sg = "$env:USERPROFILE\.claude\skills\sprite-gen\.venv\Scripts\sprite-gen.exe"
$out = Join-Path $PSScriptRoot "$Theme\bases"
New-Item -ItemType Directory -Force $out | Out-Null

# 배경 크로마키는 옷 색과 겹치지 않게 고른다
$themes = @{
  teacher = @{
    subject = 'a sophisticated, fashionable modern teacher'
    face    = 'attractive refined adult face with mature features (not a child)'
    chars   = @{
      0 = @('green',   'a fit, stylish Korean male PE teacher in his late 20s with a clean short undercut hairstyle, a sleek black premium track jacket with thin white piping zipped halfway over a white crew-neck tee, slim tapered black jogger pants, minimalist white leather sneakers, a black smartwatch')
      1 = @('green',   'a sharp Korean male science teacher in his 30s with a neat textured crop haircut and thin black rectangular glasses, a crisp tailored white lab coat open over a fitted black turtleneck, slim charcoal trousers, black chelsea boots')
      2 = @('green',   'a fashionable Korean male art teacher in his 30s with soft wavy middle-parted dark hair, a long camel wool overcoat over a black turtleneck, wide-leg cream trousers, brown leather loafers')
      3 = @('green',   'a distinguished Korean male principal in his late 50s with silver hair neatly combed back, tortoiseshell glasses, a perfectly tailored navy double-breasted suit with a white pocket square and a deep burgundy silk tie, polished brown oxford shoes')
      4 = @('green',   'a refined Korean male Korean-literature teacher in his 40s with a neat two-block haircut, wearing a modern minimalist hanbok-inspired outfit: a long charcoal jeogori-style wrap jacket with a white high-collar shirt, wide black trousers, sleek black loafers')
      5 = @('magenta', 'an elegant Korean female music teacher in her 30s with long sleek glossy black hair, small gold hoop earrings, a deep emerald satin wrap midi dress with long sleeves and a thin belt, nude pointed low heels')
      6 = @('green',   'a chic Korean female homeroom teacher in her 20s with a short soft wavy bob and a gold hairpin, a beige belted trench coat open over a navy and white striped shirt, straight-leg light blue jeans, black ballet flats')
      7 = @('green',   'a trendy Korean female AI and computer teacher in her late 20s with a sleek lavender-tinted straight bob, white wireless earbuds, a cropped black tailored blazer over a white tee, wide-leg gray slacks, chunky white sneakers')
      8 = @('magenta', 'a stylish outdoorsy Korean female geography teacher in her 30s with a long high brown ponytail under a cream bucket hat, an olive green lightweight utility jacket over a cream knit top, black slim cargo pants, gray trail sneakers')
      9 = @('green',   'a polished Korean female head teacher in her early 50s with a sleek chin-length bob with silver highlights, pearl stud earrings, a camel tailored blazer with a patterned silk scarf at the neck over a white blouse, black wide trousers, low black block heels')
    }
  }
  student = @{
    subject = 'a stylish, likeable Korean middle school student (about 14 years old)'
    face    = 'bright youthful teenage face (not a small child, not an adult)'
    chars   = @{
      0 = @('green',   'a neat Korean middle school boy with short tidy black hair, a navy school uniform blazer with a small gold school emblem, a white shirt with a navy and silver striped tie, gray uniform slacks, black loafers, a navy backpack')
      1 = @('magenta', 'a sporty Korean middle school boy with a short buzz-cut, a green school PE tracksuit jacket with white stripes zipped up and matching green track pants, white running sneakers')
      2 = @('green',   'a laid-back Korean middle school boy with fluffy permed brown hair, an oversized light gray hoodie over a white uniform shirt collar, black uniform slacks, chunky white sneakers, black headphones around the neck, a black backpack')
      3 = @('green',   'a studious Korean middle school boy with a side-parted black haircut and round black glasses, a short-sleeve white summer uniform shirt with a navy tie, gray uniform slacks, white sneakers, a blue crossbody school bag')
      4 = @('green',   'a cool Korean middle school boy with a two-block haircut, a long black padded winter puffer coat open over the navy school uniform, gray slacks, white sneakers, a black beanie')
      5 = @('green',   'a neat Korean middle school girl with long straight black hair and a small pearl hairpin, a navy school uniform blazer with a gold emblem, a white blouse with a red ribbon tie, a navy and burgundy plaid pleated skirt, navy knee socks, black loafers')
      6 = @('magenta', 'a sporty Korean middle school girl with a high brown ponytail and a white headband, a green school PE tracksuit jacket with white stripes and matching green track pants, white sneakers')
      7 = @('green',   'a cute bookish Korean middle school girl with a short bob with straight bangs and round tortoiseshell glasses, a cream knit cardigan over a white uniform blouse with a navy ribbon, a gray plaid pleated skirt, white socks, brown loafers, a pastel pink backpack')
      8 = @('green',   'a cheerful Korean middle school girl with two low braided pigtails tied with yellow ribbons, a short-sleeve white summer uniform blouse with a navy ribbon, a navy pleated skirt, white socks, white sneakers')
      9 = @('green',   'a trendy Korean middle school girl with half-up long wavy brown hair, white wired earphones, an oversized navy windbreaker jacket over the white uniform blouse, wide navy uniform slacks, chunky white sneakers')
    }
  }
}

$t = $themes[$Theme]
foreach ($id in $Ids) {
  $key, $desc = $t.chars[[int]$id]
  $hex = if ($key -eq 'magenta') { '#FF00FF' } else { '#00FF00' }
  $style = "High quality pixel art game character sprite of $($t.subject) in a stylish chibi style. One single full-body character with chibi proportions about 3 heads tall (large head, small body), $($t.face), confident natural posture, polished well-fitted trendy outfit with tasteful details clearly readable at small size, crisp hard-edged pixels with a clean dark 1-pixel outline, rich but limited palette with subtle shading, no anti-aliasing, no dithering noise, standing relaxed idle pose with arms down and empty hands, whole body including feet visible, centered, on a flat solid pure $key $hex background with no gradient, no ground, no shadow, no text."
  & $sg gen --provider codex --prompt "$style Character: $desc." --direction side --facing right --layout-guide `
    --out "$out\$id.png" --report "$out\$id.report.json" *> "$out\$id.log"
  "$Theme $id exit=$LASTEXITCODE"
}
