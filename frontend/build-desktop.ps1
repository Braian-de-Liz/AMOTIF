param()

$ErrorActionPreference = "Continue"
$frontendDir = $PSScriptRoot
$rootDir = Resolve-Path (Join-Path $frontendDir "..")
$desktopDir = Join-Path $rootDir "desktop"

Write-Host "=== AMOTIF Desktop Build ===" -ForegroundColor Cyan

# Step 1: Build Vite app
Write-Host "[1/5] Building frontend with Vite..." -ForegroundColor Yellow
Push-Location $frontendDir
bun run build
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    throw "Vite build failed with exit code $LASTEXITCODE"
}
Pop-Location

# Step 2: Compile via Deno
Write-Host "[2/5] Compiling desktop app with Deno..." -ForegroundColor Yellow
$outputExe = Join-Path $desktopDir "AMOTIF.exe"
Push-Location $frontendDir
deno compile --allow-all --no-check -o $outputExe desktop.ts
$denoExit = $LASTEXITCODE
Pop-Location
if ($denoExit -ne 0) {
    Write-Host "Warning: Deno exited with code $denoExit (may still have produced output)" -ForegroundColor DarkYellow
}

# Step 3: Clean old artifacts from ../desktop/ (keep AMOTIF.exe and dist/)
Write-Host "[3/5] Cleaning old artifacts from desktop/..." -ForegroundColor Yellow
if (Test-Path $desktopDir) {
    Get-ChildItem -Path $desktopDir -Force -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -ne "AMOTIF.exe" -and $_.Name -ne "dist" -and $_.Name -ne "installer.iss" -and $_.Name -ne "logo.ico" -and $_.Name -ne "WebView2Loader.dll" } |
        Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Old artifacts removed." -ForegroundColor Green
}

# Step 4: Copy dist/ to ../desktop/dist
Write-Host "[4/5] Copying dist to desktop/dist..." -ForegroundColor Yellow
$targetDist = Join-Path $desktopDir "dist"
if (-not (Test-Path $desktopDir)) {
    New-Item -ItemType Directory -Path $desktopDir -Force | Out-Null
}
if (Test-Path (Join-Path $frontendDir "dist")) {
    if (Test-Path $targetDist) {
        Remove-Item -Path $targetDist -Recurse -Force
    }
    Copy-Item -Path (Join-Path $frontendDir "dist") -Destination $targetDist -Recurse -Force
} else {
    Write-Host "Warning: frontend/dist not found, skipping copy" -ForegroundColor DarkYellow
}

# Step 5: Cleanup temp desktop folder
Write-Host "[5/5] Cleaning up temp desktop folder..." -ForegroundColor Yellow
$tempDesktop = Join-Path $frontendDir "desktop"
if (Test-Path $tempDesktop) {
    Remove-Item -Path $tempDesktop -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Cleaned up temp folder: frontend/desktop/" -ForegroundColor Green
}

# Verify output
if (Test-Path $outputExe) {
    Write-Host ""
    Write-Host "=== Build concluido com sucesso! ===" -ForegroundColor Green
    Write-Host "Saida: $desktopDir" -ForegroundColor Cyan
    Write-Host "Executavel: $outputExe" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "=== Build finalizado com avisos ===" -ForegroundColor DarkYellow
    Write-Host "AMOTIF.exe nao encontrado no local esperado. Verifique a saida do Deno acima." -ForegroundColor DarkYellow
}
