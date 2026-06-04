# SearchMind API — PowerShell search test (avoids curl JSON quoting issues on Windows)
param(
    [string]$ApiKey = $env:SEARCHMIND_API_KEY,
    [string]$Query = "Python FastAPI",
    [int]$NumResults = 3,
    [string]$BaseUrl = "http://localhost:8000"
)

if (-not $ApiKey) {
    Write-Host "ERROR: Set your API key first:" -ForegroundColor Red
    Write-Host '  $env:SEARCHMIND_API_KEY = "sm_live_..."' -ForegroundColor Yellow
    Write-Host "  Or: .\scripts\test-search.ps1 -ApiKey 'sm_live_...'" -ForegroundColor Yellow
    exit 1
}

$body = @{
    query          = $Query
    num_results    = $NumResults
    search_depth   = "basic"
    include_answer = $true
} | ConvertTo-Json -Compress

Write-Host "POST $BaseUrl/v1/search ..." -ForegroundColor Cyan

try {
    $result = Invoke-RestMethod `
        -Uri "$BaseUrl/v1/search" `
        -Method POST `
        -Headers @{ "X-API-Key" = $ApiKey } `
        -ContentType "application/json; charset=utf-8" `
        -Body $body

    $result | ConvertTo-Json -Depth 6
    Write-Host "`nOK: $($result.result_count) results (cached=$($result.cached))" -ForegroundColor Green
}
catch {
    Write-Host "Request failed:" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        Write-Host $reader.ReadToEnd()
    }
    else {
        Write-Host $_.Exception.Message
    }
    exit 1
}
