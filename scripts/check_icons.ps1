Add-Type -AssemblyName System.Drawing

$files = Get-ChildItem "c:\Users\USER\Desktop\MyCodes\Projects\Moi App\frontend\assets" -Recurse -Include "*icon*.png","*logo*.png"

foreach ($f in $files) {
    try {
        $img = [System.Drawing.Image]::FromFile($f.FullName)
        Write-Host "$($f.Name) :: $($img.Width) x $($img.Height) :: $($f.FullName)"
        $img.Dispose()
    } catch {
        Write-Host "Error reading $($f.Name)"
    }
}
