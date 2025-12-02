# Remove all dark mode CSS classes from the codebase
$files = Get-ChildItem -Path "staff\src" -Recurse -Include *.tsx,*.ts,*.jsx,*.js,*.css

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Remove dark: classes - match pattern like dark:class-name
    $newContent = $content -replace '\s+dark:[a-zA-Z0-9\-\[\]\:\/]+', ''
    
    if ($content -ne $newContent) {
        Write-Host "Removing dark classes from: $($file.FullName)"
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
    }
}

Write-Host "`nDone! All dark mode classes removed."
