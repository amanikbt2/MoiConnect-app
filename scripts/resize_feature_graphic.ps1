Add-Type -AssemblyName System.Drawing
$src = "C:\Users\USER\.gemini\antigravity\brain\c541d68c-4c5e-4c8f-9a86-a4d5057718b9\playstore_feature_banner_1790058724330.jpg"
$png = "c:\Users\USER\Desktop\MyCodes\Projects\Moi App\frontend\assets\playstore_assets\feature_graphic.png"
$jpg = "c:\Users\USER\Desktop\MyCodes\Projects\Moi App\frontend\assets\playstore_assets\feature_graphic.jpg"

$img = [System.Drawing.Image]::FromFile($src)
$bmp = New-Object System.Drawing.Bitmap 1024, 500
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($img, 0, 0, 1024, 500)
$g.Dispose()
$img.Dispose()

$bmp.Save($png, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Save($jpg, [System.Drawing.Imaging.ImageFormat]::Jpeg)
$bmp.Dispose()
Write-Output "Successfully saved 1024x500 PNG and JPEG feature graphics."
