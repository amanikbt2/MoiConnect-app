Add-Type -AssemblyName System.Drawing
$src = "C:\Users\USER\.gemini\antigravity\brain\c541d68c-4c5e-4c8f-9a86-a4d5057718b9\playstore_app_icon_1790055270295.jpg"
$png = "c:\Users\USER\Desktop\MyCodes\Projects\Moi App\frontend\assets\playstore_assets\icon.png"
$jpg = "c:\Users\USER\Desktop\MyCodes\Projects\Moi App\frontend\assets\playstore_assets\icon.jpg"

$img = [System.Drawing.Image]::FromFile($src)
$bmp = New-Object System.Drawing.Bitmap 512, 512
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($img, 0, 0, 512, 512)
$g.Dispose()
$img.Dispose()

$bmp.Save($png, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Save($jpg, [System.Drawing.Imaging.ImageFormat]::Jpeg)
$bmp.Dispose()
Write-Output "Successfully saved 512x512 PNG and JPEG images."
