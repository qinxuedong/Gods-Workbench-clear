[CmdletBinding()]
param(
    [int]$Port = 2077,
    [string]$HostAddress = "127.0.0.1",
    [int]$WaitSeconds = 30,
    [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"
$script = Join-Path $PSScriptRoot "tools\start_gods_workbench.ps1"
if (-not (Test-Path -LiteralPath $script -PathType Leaf)) {
    throw "找不到启动脚本：$script"
}

& $script `
    -Port $Port `
    -HostAddress $HostAddress `
    -WaitSeconds $WaitSeconds `
    -NoBrowser:$NoBrowser

exit $LASTEXITCODE
