$ErrorActionPreference = "Stop"

$pythonCommand = Get-Command python -ErrorAction SilentlyContinue
$pythonArguments = @()

if (-not $pythonCommand) {
  $pythonCommand = Get-Command py -ErrorAction SilentlyContinue
  $pythonArguments = @("-3")
}

if (-not $pythonCommand) {
  $codexPython = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
  if (Test-Path -LiteralPath $codexPython) {
    $pythonCommand = $codexPython
    $pythonArguments = @()
  }
}

if (-not $pythonCommand) {
  throw "Python 3 with ReportLab is required to regenerate the CV. Install Python and run: python -m pip install reportlab"
}

$pythonExecutable = if ($pythonCommand -is [System.Management.Automation.CommandInfo]) {
  $pythonCommand.Source
} else {
  $pythonCommand
}

& $pythonExecutable @pythonArguments "scripts/generate-cv.py"
exit $LASTEXITCODE
