param()

$ErrorActionPreference = "Continue"
$frontendDir = $PSScriptRoot
$rootDir = Resolve-Path (Join-Path $frontendDir "..")
$desktopDir = Join-Path $rootDir "desktop"

Write-Host "=== AMOTIF Desktop Build ===" -ForegroundColor Cyan

# Step 1: Build Vite app
Write-Host "[1/4] Building frontend with Vite..." -ForegroundColor Yellow
Push-Location $frontendDir
bun run build
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    throw "Vite build failed with exit code $LASTEXITCODE"
}
Pop-Location

# Step 2: Compile via Deno
Write-Host "[2/4] Compiling desktop app with Deno..." -ForegroundColor Yellow
$outputExe = Join-Path $desktopDir "AMOTIF.exe"
Push-Location $frontendDir
deno desktop --no-check desktop.ts -o $outputExe
$denoExit = $LASTEXITCODE
Pop-Location
if ($denoExit -ne 0) {
    Write-Host "Warning: Deno exited with code $denoExit (may still have produced output)" -ForegroundColor DarkYellow
}

# Step 3: Copy dist/ to ../desktop/dist
Write-Host "[3/4] Copying dist to desktop/dist..." -ForegroundColor Yellow
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

# Step 4: Move temp desktop folder contents + cleanup
Write-Host "[4/4] Consolidating desktop files and cleaning up..." -ForegroundColor Yellow
$tempDesktop = Join-Path $frontendDir "desktop"
if (Test-Path $tempDesktop) {
    Copy-Item -Path "$tempDesktop\*" -Destination $desktopDir -Recurse -Force
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
