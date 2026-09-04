# Ship source from a Windows dev box to the Ubuntu server without git.
#
#   .\upload.ps1 -Server ubuntu@203.0.113.10
#   .\upload.ps1 -Server ubuntu@203.0.113.10 -Target web
#
# Then on the server:  cd /opt/journey/deploy ; sh deploy.sh
#
# The server's .env is never touched - it does not live in the source tree.
# ASCII only on purpose: Windows PowerShell 5.1 mis-decodes UTF-8 scripts
# that have no BOM.

param(
    [Parameter(Mandatory = $true)]
    [string]$Server,

    [ValidateSet("api", "web", "all")]
    [string]$Target = "all",

    [string]$RemotePath = "/opt/journey"
)

$ErrorActionPreference = "Stop"

# deploy/ lives inside journey-api, so two levels up holds both repos
$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$ApiDir = "journey-api"
$WebDir = "jourey-web-admin"

$ApiTar = Join-Path $env:TEMP "journey-api.tar.gz"
$WebTar = Join-Path $env:TEMP "jourey-web-admin.tar.gz"

Push-Location $Root
try {
    $uploads = @()

    if ($Target -eq "api" -or $Target -eq "all") {
        Write-Host "==> packing $ApiDir" -ForegroundColor Cyan
        tar -czf $ApiTar --exclude="$ApiDir/node_modules" --exclude="$ApiDir/dist" --exclude="$ApiDir/.git" --exclude="$ApiDir/storage" $ApiDir
        if ($LASTEXITCODE -ne 0) { throw "tar failed for $ApiDir" }
        $uploads += $ApiTar
    }

    if ($Target -eq "web" -or $Target -eq "all") {
        Write-Host "==> packing $WebDir" -ForegroundColor Cyan
        tar -czf $WebTar --exclude="$WebDir/node_modules" --exclude="$WebDir/.next" --exclude="$WebDir/.git" --exclude="$WebDir/storybook-static" --exclude="$WebDir/test-results" $WebDir
        if ($LASTEXITCODE -ne 0) { throw "tar failed for $WebDir" }
        $uploads += $WebTar
    }

    Write-Host "==> uploading to $Server" -ForegroundColor Cyan
    scp $uploads "${Server}:/tmp/"
    if ($LASTEXITCODE -ne 0) { throw "scp failed" }

    # Replace the old source, then refresh deploy/ (compose, scripts).
    # Sent as a single ssh argument rather than piped to stdin: PowerShell
    # terminates piped input with CRLF, and the stray \r breaks the last command.
    $remote = @(
        'set -eu'
        "mkdir -p '$RemotePath'"
        "cd '$RemotePath'"
        "if [ -f /tmp/journey-api.tar.gz ]; then rm -rf '$ApiDir'; tar -xzf /tmp/journey-api.tar.gz; rm -f /tmp/journey-api.tar.gz; fi"
        "if [ -f /tmp/jourey-web-admin.tar.gz ]; then rm -rf '$WebDir'; tar -xzf /tmp/jourey-web-admin.tar.gz; rm -f /tmp/jourey-web-admin.tar.gz; fi"
        "if [ -d '$ApiDir/deploy' ]; then mkdir -p deploy; cp -r '$ApiDir/deploy/.' deploy/; fi"
        'echo extracted:'
        'ls -1'
    ) -join '; '

    Write-Host "==> extracting on server" -ForegroundColor Cyan
    ssh $Server $remote
    if ($LASTEXITCODE -ne 0) { throw "remote extract failed" }

    Write-Host ""
    Write-Host "Done. Next, on the server:" -ForegroundColor Green
    Write-Host "  ssh $Server"
    Write-Host "  cd $RemotePath/deploy ; sh deploy.sh $Target"
}
finally {
    Pop-Location
    Remove-Item $ApiTar, $WebTar -ErrorAction SilentlyContinue
}
