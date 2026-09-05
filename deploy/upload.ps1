# Ship source from a Windows dev box to the Ubuntu server without git.
#
#   .\upload.ps1 -Server ubuntu@203.0.113.10
#   .\upload.ps1 -Server ubuntu@203.0.113.10 -Target web
#   .\upload.ps1 -Server ubuntu@203.0.113.10 -Target web-admin
#
# Then on the server:  cd /opt/journey/deploy ; sh deploy.sh
#
# The server's .env is never touched - it does not live in the source tree.
# ASCII only on purpose: Windows PowerShell 5.1 mis-decodes UTF-8 scripts
# that have no BOM.

param(
    [Parameter(Mandatory = $true)]
    [string]$Server,

    [ValidateSet("api", "web", "web-admin", "all")]
    [string]$Target = "all",

    [string]$RemotePath = "/opt/journey"
)

$ErrorActionPreference = "Stop"

# deploy/ lives inside journey-api, so two levels up holds both repos
$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$ApiDir = "journey-api"
$SiteDir = "journey-web"
$AdminDir = "jourey-web-admin"

$ApiTar = Join-Path $env:TEMP "journey-api.tar.gz"
$SiteTar = Join-Path $env:TEMP "journey-web.tar.gz"
$AdminTar = Join-Path $env:TEMP "jourey-web-admin.tar.gz"

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
        Write-Host "==> packing $SiteDir" -ForegroundColor Cyan
        tar -czf $SiteTar --exclude="$SiteDir/node_modules" --exclude="$SiteDir/.next" --exclude="$SiteDir/.git" $SiteDir
        if ($LASTEXITCODE -ne 0) { throw "tar failed for $SiteDir" }
        $uploads += $SiteTar
    }

    if ($Target -eq "web-admin" -or $Target -eq "all") {
        Write-Host "==> packing $AdminDir" -ForegroundColor Cyan
        tar -czf $AdminTar --exclude="$AdminDir/node_modules" --exclude="$AdminDir/.next" --exclude="$AdminDir/.git" --exclude="$AdminDir/storybook-static" --exclude="$AdminDir/test-results" $AdminDir
        if ($LASTEXITCODE -ne 0) { throw "tar failed for $AdminDir" }
        $uploads += $AdminTar
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
        "if [ -f /tmp/journey-web.tar.gz ]; then rm -rf '$SiteDir'; tar -xzf /tmp/journey-web.tar.gz; rm -f /tmp/journey-web.tar.gz; fi"
        "if [ -f /tmp/jourey-web-admin.tar.gz ]; then rm -rf '$AdminDir'; tar -xzf /tmp/jourey-web-admin.tar.gz; rm -f /tmp/jourey-web-admin.tar.gz; fi"
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
    Remove-Item $ApiTar, $SiteTar, $AdminTar -ErrorAction SilentlyContinue
}
