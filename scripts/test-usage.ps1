param(
    [string]$ApiKey = $env:SEARCHMIND_API_KEY,
    [string]$BaseUrl = "http://localhost:8000"
)

if (-not $ApiKey) {
    Write-Host "Set SEARCHMIND_API_KEY or pass -ApiKey" -ForegroundColor Red
    exit 1
}

Invoke-RestMethod -Uri "$BaseUrl/v1/usage" -Headers @{ "X-API-Key" = $ApiKey } | ConvertTo-Json
