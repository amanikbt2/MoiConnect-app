Add-Type -AssemblyName System.Drawing

$srcPath = "c:\Users\USER\Desktop\MyCodes\Projects\Moi App\frontend\assets\mc-logo.png"
if (-not (Test-Path $srcPath)) {
    Write-Error "Source file mc-logo.png not found at $srcPath"
    exit 1
}

$srcImg = [System.Drawing.Image]::FromFile($srcPath)

function Save-ResizedImage {
    param(
        [System.Drawing.Image]$source,
        [int]$width,
        [int]$height,
        [string]$destPath
    )

    $rect = New-Object System.Drawing.Rectangle(0, 0, $width, $height)
    $bmp = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $bmp.SetResolution($source.HorizontalResolution, $source.VerticalResolution)

    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Draw source
    $g.DrawImage($source, $rect, 0, 0, $source.Width, $source.Height, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    # Ensure parent directory exists
    $dir = [System.IO.Path]::GetDirectoryName($destPath)
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    if ($destPath.EndsWith(".ico")) {
        $icon = [System.Drawing.Icon]::FromHandle($bmp.GetHicon())
        $fs = New-Object System.IO.FileStream($destPath, [System.IO.FileMode]::Create)
        $icon.Save($fs)
        $fs.Close()
        $icon.Dispose()
    } else {
        $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    }

    $bmp.Dispose()
    Write-Host "Generated: $destPath ($width x $height)"
}

# Destinations to update
Save-ResizedImage -source $srcImg -width 512 -height 512 -destPath "c:\Users\USER\Desktop\MyCodes\Projects\Moi App\frontend\assets\favicon.png"
Save-ResizedImage -source $srcImg -width 512 -height 512 -destPath "c:\Users\USER\Desktop\MyCodes\Projects\Moi App\frontend\assets\images\favicon.png"
Save-ResizedImage -source $srcImg -width 192 -height 192 -destPath "c:\Users\USER\Desktop\MyCodes\Projects\Moi App\frontend\public\favicon.png"
Save-ResizedImage -source $srcImg -width 64 -height 64 -destPath "c:\Users\USER\Desktop\MyCodes\Projects\Moi App\frontend\public\favicon.ico"
Save-ResizedImage -source $srcImg -width 192 -height 192 -destPath "c:\Users\USER\Desktop\MyCodes\Projects\Moi App\backend\public\favicon.png"
Save-ResizedImage -source $srcImg -width 64 -height 64 -destPath "c:\Users\USER\Desktop\MyCodes\Projects\Moi App\backend\public\favicon.ico"

$srcImg.Dispose()
Write-Host "Favicon update complete successfully."
