[CmdletBinding()]
param(
    [int]$Port = 2077,
    [string]$HostAddress = "127.0.0.1",
    [int]$WaitSeconds = 30,
    [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$runPy = Join-Path $root "run.py"
$homeUrl = "http://$HostAddress`:$Port/"
$healthUrl = "http://$HostAddress`:$Port/healthz"

if (-not (Test-Path -LiteralPath $runPy -PathType Leaf)) {
    throw "找不到启动入口：$runPy"
}

function Test-ServiceReady {
    param([string]$Uri)
    try {
        $response = Invoke-WebRequest -Uri $Uri -UseBasicParsing -TimeoutSec 2
        return ($response.StatusCode -eq 200)
    }
    catch {
        return $false
    }
}

# 已有服务直接复用，避免重复启动；只有健康检查通过才打开首页。
if (Test-ServiceReady -Uri $healthUrl) {
    if (-not $NoBrowser) {
        Start-Process $homeUrl | Out-Null
    }
    Write-Host "Gods-Workbench 已在运行：$homeUrl"
    exit 0
}

$portOwner = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($null -ne $portOwner) {
    throw "端口 $Port 已被其他进程占用，且不是可复用的 Gods-Workbench 服务。"
}

$pyLauncher = Get-Command "py.exe" -ErrorAction SilentlyContinue
$python = Get-Command "python.exe" -ErrorAction SilentlyContinue
if ($null -ne $pyLauncher) {
    $pythonExe = $pyLauncher.Source
    $pythonArgs = @("-3", "run.py")
}
elseif ($null -ne $python) {
    $pythonExe = $python.Source
    $pythonArgs = @("run.py")
}
else {
    throw "未找到 Python 3。请先安装 Python 3.11 并确保 py.exe 或 python.exe 在 PATH 中。"
}

$logDir = Join-Path $root "logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$stdoutLog = Join-Path $logDir "gods-workbench-$stamp.out.log"
$stderrLog = Join-Path $logDir "gods-workbench-$stamp.err.log"

$env:GW_HOST = $HostAddress
$env:GW_PORT = [string]$Port
# 一键启动使用单进程模式，避免 uvicorn reload 子进程导致重复窗口或重复监听。
$env:GW_RELOAD = "false"

$server = Start-Process `
    -FilePath $pythonExe `
    -ArgumentList $pythonArgs `
    -WorkingDirectory $root `
    -WindowStyle Hidden `
    -RedirectStandardOutput $stdoutLog `
    -RedirectStandardError $stderrLog `
    -PassThru

$deadline = (Get-Date).AddSeconds($WaitSeconds)
$ready = $false
while ((Get-Date) -lt $deadline) {
    if ($server.HasExited) {
        throw "服务进程已退出（ExitCode=$($server.ExitCode)）。请查看日志：$stderrLog"
    }
    if (Test-ServiceReady -Uri $healthUrl) {
        $ready = $true
        break
    }
    Start-Sleep -Milliseconds 500
}

if (-not $ready) {
    throw "服务在 $WaitSeconds 秒内未通过健康检查：$healthUrl。请查看日志：$stderrLog"
}

if (-not $NoBrowser) {
    Start-Process $homeUrl | Out-Null
}
Write-Host "Gods-Workbench 已启动：$homeUrl"
Write-Host "日志：$stdoutLog"
