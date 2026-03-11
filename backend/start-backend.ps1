param(
  [int]$Port = 3000
)

$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot

$nodeCommand = Get-Command node -ErrorAction Stop
$npmCommand = Get-Command npm -ErrorAction SilentlyContinue

$env:NPM_CONFIG_PREFIX = Split-Path -Parent $nodeCommand.Source
$env:PORT = $Port
$apiUrl = "http://localhost:$Port/api"

try {
  $response = Invoke-WebRequest -UseBasicParsing $apiUrl -TimeoutSec 2
  if ($response.StatusCode -eq 200) {
    Write-Host "Backend ya esta ejecutandose en $apiUrl"
    exit 0
  }
} catch {
  # Si no responde, continuamos con el arranque normal.
}

if ($npmCommand) {
  npm start
} else {
  node server.js
}
