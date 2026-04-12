$ErrorActionPreference = 'Stop'

Set-Location (Split-Path -Parent $PSScriptRoot)

$appDir = Join-Path $PWD 'app'
$fontsDir = Join-Path $appDir 'fonts'
$iconsDir = Join-Path $appDir 'icons'

New-Item -ItemType Directory -Force -Path $fontsDir, $iconsDir | Out-Null

$fontFiles = @(
  @{ Url = 'https://fonts.gstatic.com/s/cinzel/v26/8vIU7ww63mVu7gtR-kwKxNvkNOjw-tbnTYo.ttf'; OutFile = 'cinzel-400.ttf' },
  @{ Url = 'https://fonts.gstatic.com/s/cinzel/v26/8vIU7ww63mVu7gtR-kwKxNvkNOjw-gjgTYo.ttf'; OutFile = 'cinzel-600.ttf' },
  @{ Url = 'https://fonts.gstatic.com/s/cinzel/v26/8vIU7ww63mVu7gtR-kwKxNvkNOjw-jHgTYo.ttf'; OutFile = 'cinzel-700.ttf' },
  @{ Url = 'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuOKfMZg.ttf'; OutFile = 'inter-300.ttf' },
  @{ Url = 'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf'; OutFile = 'inter-400.ttf' },
  @{ Url = 'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fMZg.ttf'; OutFile = 'inter-500.ttf' },
  @{ Url = 'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYMZg.ttf'; OutFile = 'inter-600.ttf' }
)

foreach ($fontFile in $fontFiles) {
  $destination = Join-Path $fontsDir $fontFile.OutFile
  if (-not (Test-Path $destination)) {
    curl.exe -L $fontFile.Url -o $destination | Out-Null
  }
}

Add-Type -AssemblyName System.Drawing

function New-RollzIcon {
  param(
    [Parameter(Mandatory)] [string] $OutputPath,
    [Parameter(Mandatory)] [int] $Size,
    [Parameter()] [double] $RadiusRatio = 0.38,
    [Parameter()] [double] $StrokeRatio = 0.035,
    [Parameter()] [double] $TextRatio = 0.22
  )

  $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  $background = [System.Drawing.ColorTranslator]::FromHtml('#151321')
  $gold = [System.Drawing.ColorTranslator]::FromHtml('#f0b429')
  $goldLight = [System.Drawing.ColorTranslator]::FromHtml('#ffd166')
  $glow = [System.Drawing.Color]::FromArgb(90, $gold)

  $graphics.Clear($background)

  $center = [double]$Size / 2
  $radius = $Size * $RadiusRatio
  $points = New-Object 'System.Drawing.PointF[]' 6

  for ($index = 0; $index -lt 6; $index++) {
    $angle = ((60 * $index) - 90) * [Math]::PI / 180
    $x = [float]($center + [Math]::Cos($angle) * $radius)
    $y = [float]($center + [Math]::Sin($angle) * $radius)
    $points[$index] = New-Object System.Drawing.PointF($x, $y)
  }

  $strokeWidth = [float][Math]::Max(4, [Math]::Round($Size * $StrokeRatio))
  $edgePen = New-Object System.Drawing.Pen($goldLight, $strokeWidth)
  $innerPen = New-Object System.Drawing.Pen($glow, [float][Math]::Max(2, [Math]::Round($Size * 0.012)))
  $textFont = New-Object System.Drawing.Font('Arial', [float]($Size * $TextRatio), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $textBrush = New-Object System.Drawing.SolidBrush($gold)
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center

  $graphics.DrawPolygon($edgePen, $points)
  $graphics.DrawLine($innerPen, $points[0], $points[3])
  $graphics.DrawLine($innerPen, $points[1], $points[4])
  $graphics.DrawLine($innerPen, $points[2], $points[5])
  $graphics.DrawString('20', $textFont, $textBrush, [System.Drawing.RectangleF]::new(0, 0, $Size, $Size), $format)

  $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)

  $format.Dispose()
  $textBrush.Dispose()
  $textFont.Dispose()
  $innerPen.Dispose()
  $edgePen.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
}

New-RollzIcon -OutputPath (Join-Path $iconsDir 'icon-192.png') -Size 192
New-RollzIcon -OutputPath (Join-Path $iconsDir 'icon-512.png') -Size 512
New-RollzIcon -OutputPath (Join-Path $iconsDir 'apple-touch-icon.png') -Size 180
New-RollzIcon -OutputPath (Join-Path $iconsDir 'icon-512-maskable.png') -Size 512 -RadiusRatio 0.28 -StrokeRatio 0.03 -TextRatio 0.2

Get-ChildItem $fontsDir, $iconsDir | Select-Object Name, Length | Sort-Object Name | Format-Table -AutoSize
