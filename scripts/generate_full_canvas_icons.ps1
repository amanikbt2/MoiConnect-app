Add-Type -AssemblyName System.Drawing

$mcLogoPath = "c:\Users\USER\Desktop\MyCodes\Projects\Moi App\frontend\assets\mc-logo.png"
$mcLogoTransPath = "c:\Users\USER\Desktop\MyCodes\Projects\Moi App\frontend\assets\mc-logo-transparent.png"

if (-not (Test-Path $mcLogoPath)) {
    Write-Error "mc-logo.png not found"
    exit 1
}

$sourceImg = [System.Drawing.Image]::FromFile($mcLogoPath)
$sourceTrans = if (Test-Path $mcLogoTransPath) { [System.Drawing.Image]::FromFile($mcLogoTransPath) } else { $sourceImg }

function Generate-Icon {
    param(
        [System.Drawing.Image]$source,
        [int]$canvasSize,
        [double]$scaleFactor, # e.g. 0.85 - 0.95 for maximum canvas coverage
        [string]$destPath,
        [bool]$hasBackground = $false,
        [System.Drawing.Color]$bgColor = [System.Drawing.Color]::Transparent
    )

    $bmp = New-Object System.Drawing.Bitmap($canvasSize, $canvasSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    if ($hasBackground) {
        $brush = New-Object System.Drawing.SolidBrush($bgColor)
        $g.FillRectangle($brush, 0, 0, $canvasSize, $canvasSize)
        $brush.Dispose()
    } else {
        $g.Clear([System.Drawing.Color]::Transparent)
    }

    $targetW = [int]($canvasSize * $scaleFactor)
    $targetH = [int]($canvasSize * $scaleFactor)
    $offsetX = [int](($canvasSize - $targetW) / 2)
    $offsetY = [int](($canvasSize - $targetH) / 2)

    $destRect = New-Object System.Drawing.Rectangle($offsetX, $offsetY, $targetW, $targetH)
    $g.DrawImage($source, $destRect, 0, 0, $source.Width, $source.Height, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    # Ensure output directory exists
    $dir = [System.IO.Path]::GetDirectoryName($destPath)
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Generated: $destPath ($canvasSize x $canvasSize, scale: $scaleFactor)"
}

# 1. Main Icon (1024x1024) - full canvas 100% no padding
Generate-Icon -source $sourceImg -canvasSize 1024 -scaleFactor 1.0 -destPath "c:\Users\USER\Desktop\MyCodes\Projects\Moi App\frontend\assets\icon.png"
Generate-Icon -source $sourceImg -canvasSize 1024 -scaleFactor 1.0 -destPath "c:\Users\USER\Desktop\MyCodes\Projects\Moi App\frontend\assets\images\icon.png"
Generate-Icon -source $sourceImg -canvasSize 512 -scaleFactor 1.0 -destPath "c:\Users\USER\Desktop\MyCodes\Projects\Moi App\frontend\assets\playstore_assets\icon.png"

# 2. Android Adaptive Foreground (1024x1024) - scale factor 0.88 (maximum full canvas coverage within Android adaptive safe zone)
Generate-Icon -source $sourceTrans -canvasSize 1024 -scaleFactor 0.88 -destPath "c:\Users\USER\Desktop\MyCodes\Projects\Moi App\frontend\assets\android-icon-foreground.png"
Generate-Icon -source $sourceTrans -canvasSize 1024 -scaleFactor 0.88 -destPath "c:\Users\USER\Desktop\MyCodes\Projects\Moi App\frontend\assets\images\android-icon-foreground.png"
Generate-Icon -source $sourceTrans -canvasSize 1024 -scaleFactor 0.88 -destPath "c:\Users\USER\Desktop\MyCodes\Projects\Moi App\frontend\assets\adaptive-icon.png"

# 3. Splash Icon (1024x1024)
Generate-Icon -source $sourceTrans -canvasSize 1024 -scaleFactor 0.75 -destPath "c:\Users\USER\Desktop\MyCodes\Projects\Moi App\frontend\assets\splash-icon.png"

$sourceImg.Dispose()
if (Test-Path $mcLogoTransPath) { $sourceTrans.Dispose() }

Write-Host "Full canvas Android logo generation complete."
