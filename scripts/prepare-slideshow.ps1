$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$projectRoot = Split-Path -Parent $PSScriptRoot
$sourceDirectory = Join-Path $projectRoot 'public/templates'
$outputDirectory = Join-Path $projectRoot 'public/slideshow'
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
$names = @('hero-cover.png') + @(Get-ChildItem -LiteralPath $sourceDirectory -File |
  Where-Object { $_.Name -match '^IMG[_-]' -and $_.Extension.ToLowerInvariant() -in @('.jpg', '.jpeg', '.png') } |
  Sort-Object Name | Select-Object -ExpandProperty Name)
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq 'image/jpeg'
foreach ($name in $names) {
  $source = [System.Drawing.Image]::FromFile((Join-Path $sourceDirectory $name))
  try {
    if ($source.PropertyIdList -contains 274) {
      $orientation = [BitConverter]::ToUInt16($source.GetPropertyItem(274).Value, 0)
      $rotation = switch ($orientation) {
        2 { 'RotateNoneFlipX' }; 3 { 'Rotate180FlipNone' }; 4 { 'Rotate180FlipX' }
        5 { 'Rotate90FlipX' }; 6 { 'Rotate90FlipNone' }; 7 { 'Rotate270FlipX' }; 8 { 'Rotate270FlipNone' }
        default { 'RotateNoneFlipNone' }
      }
      $source.RotateFlip([System.Drawing.RotateFlipType]::$rotation)
    }
    $scale = [Math]::Min([double]1, [Math]::Min([double]1800 / $source.Width, [double]1400 / $source.Height))
    $width = [Math]::Max(1, [int]($source.Width * $scale))
    $height = [Math]::Max(1, [int]($source.Height * $scale))
    $bitmap = New-Object System.Drawing.Bitmap($width, $height)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $settings = New-Object System.Drawing.Imaging.EncoderParameters(1)
    try {
      $graphics.Clear([System.Drawing.Color]::White)
      $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $graphics.DrawImage($source, 0, 0, $width, $height)
      $settings.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]85)
      $destination = Join-Path $outputDirectory ([System.IO.Path]::GetFileNameWithoutExtension($name) + '.jpg')
      $bitmap.Save($destination, $codec, $settings)
      Write-Output ([System.IO.Path]::GetFileName($destination))
    } finally { $graphics.Dispose(); $bitmap.Dispose(); $settings.Dispose() }
  } finally { $source.Dispose() }
}
$manifestDirectory = Join-Path $projectRoot 'src/data'
New-Item -ItemType Directory -Force -Path $manifestDirectory | Out-Null
$imageNames = @($names | ForEach-Object { [System.IO.Path]::GetFileNameWithoutExtension($_) + '.jpg' })
$manifest = 'export const slideshowImages = ' + (ConvertTo-Json -InputObject $imageNames -Compress) + " as const;`n"
[System.IO.File]::WriteAllText((Join-Path $manifestDirectory 'slideshow.ts'), $manifest, (New-Object System.Text.UTF8Encoding($false)))
