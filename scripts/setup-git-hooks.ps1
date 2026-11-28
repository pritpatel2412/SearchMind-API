# Installs the pre-push hook to prevent direct pushes to main/master branches.
$ErrorActionPreference = "Stop"

$repoRoot = (git rev-parse --show-toplevel).Trim()
$hooksDir = Join-Path $repoRoot ".git/hooks"
$sourceHook = Join-Path $repoRoot "scripts/pre-push"
$targetHook = Join-Path $hooksDir "pre-push"

if (-not (Test-Path $hooksDir)) {
    New-Item -ItemType Directory -Path $hooksDir -Force | Out-Null
}

Copy-Item -Path $sourceHook -Destination $targetHook -Force
Write-Host "[SUCCESS] Pre-push branch protection hook installed into: $targetHook" -ForegroundColor Green
Write-Host "Direct pushes to 'main' or 'master' will now be blocked locally." -ForegroundColor Cyan
