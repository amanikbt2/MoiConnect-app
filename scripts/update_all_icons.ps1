Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\USER\.gemini\antigravity\brain\c541d68c-4c5e-4c8f-9a86-a4d5057718b9\.user_uploaded\media_1790237353601.jpg"
if (-not (Test-Path $srcPath)) {
    Write-Error "Source file not found at $srcPath"
    exit 1
}

$img = [System.Drawing.Image]::FromFile($srcPath)

function Save-ResizedImage($w, $h, $destPath, $format) {
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($img, 0, 0, $w, $h)
    $g.Dispose()
    $bmp.Save($destPath, $format)
    $bmp.Dispose()
    Write-Host "Updated: $destPath ($w x $h)"
}

$pngFormat = [System.Drawing.Imaging.ImageFormat]::Png
$jpgFormat = [System.Drawing.Imaging.ImageFormat]::Jpeg

$assetsDir = "c:\Users\USER\Desktop\MyCodes\Projects\Moi App\frontend\assets"

Save-ResizedImage 1024 1024 "$assetsDir\icon.png" $pngFormat
Save-ResizedImage 1024 1024 "$assetsDir\adaptive-icon.png" $pngFormat
Save-ResizedImage 1024 1024 "$assetsDir\android-icon-foreground.png" $pngFormat
Save-ResizedImage 1024 1024 "$assetsDir\mc-logo.png" $pngFormat
Save-ResizedImage 1024 1024 "$assetsDir\mc-logo-transparent.png" $pngFormat
Save-ResizedImage 512 512 "$assetsDir\favicon.png" $pngFormat

$playstoreDir = "$assetsDir\playstore_assets"
if (-not (Test-Path $playstoreDir)) {
    New-Item -ItemType Directory -Path $playstoreDir -Force | Out-Null
}
Save-ResizedImage 512 512 "$playstoreDir\icon.png" $pngFormat
Save-ResizedImage 512 512 "$playstoreDir\icon.jpg" $jpgFormat

$img.Dispose()
Write-Host "All app icons, Android home screen icons, favicons, and Play Store icons updated successfully!"
